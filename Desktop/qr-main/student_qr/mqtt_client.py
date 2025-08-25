import paho.mqtt.client as mqtt
import json
import time
from django.conf import settings
from teacher_qr.models.attendance_t import Attendance_t
from teacher_qr.models.schedule_t import Schedule_t
from teacher_qr.models.teacher import Teacher
from student_qr.models import Student, Attendance, Schedules_st
from django.shortcuts import get_object_or_404
from django.utils import timezone
import logging
from paho.mqtt.client import CallbackAPIVersion
from datetime import timedelta
from dateutil.parser import parse as parse_datetime
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MQTT Broker settings
BROKER = "broker.emqx.io"
PORT = 1883
STUDENT_TOPIC = "student/attendance"
TEACHER_TOPIC = "teacher/attendance"
CLIENT_ID = f"django-consumer-{int(time.time())}"

# Configurable grace periods (in minutes)
STUDENT_GRACE_PERIOD_PRESENT = 15
STUDENT_GRACE_PERIOD_LATE = 20
TEACHER_GRACE_PERIOD = 15

def find_best_schedule(schedules, scan_time, current_date):
    """Find the most appropriate schedule based on scan time."""
    for schedule in schedules:
        schedule_start = timezone.make_aware(
            timezone.datetime.combine(current_date, schedule.start_time),
            timezone.get_current_timezone()
        )
        schedule_end = timezone.make_aware(
            timezone.datetime.combine(current_date, schedule.end_time),
            timezone.get_current_timezone()
        )
        time_diff = (scan_time - schedule_start).total_seconds() / 60
        # Consider the schedule if scan is within start time to end time + grace period
        if 0 <= time_diff <= (schedule_end - schedule_start).total_seconds() / 60 + TEACHER_GRACE_PERIOD:
            return schedule, time_diff
    return None, None

def on_connect(client, userdata, flags, rc):
    logger.debug(f"Connected with result code {rc}")
    client.subscribe([(STUDENT_TOPIC, 0), (TEACHER_TOPIC, 0)])
    logger.debug(f"Subscribed to {STUDENT_TOPIC} and {TEACHER_TOPIC}")

def on_message(client, userdata, msg):
    logger.debug(f"Message received on topic {msg.topic}: {msg.payload.decode('utf-8')}")
    try:
        payload = msg.payload.decode("utf-8")
        data = json.loads(payload)
        data_type = data.get("type")
        logger.debug(f"Parsed data: type={data_type}")

        channel_layer = get_channel_layer()

        if data_type == "student" and msg.topic == STUDENT_TOPIC:
            logger.debug("Processing student attendance")
            numero = data.get("numero")
            nom = data.get("nom")
            prenom = data.get("prenom")
            timestamp_str = data.get("timestamp")
            logger.info(f"Received student QR data: numero={numero}, nom={nom}, prenom={prenom}, timestamp={timestamp_str}")

            scan_time = parse_datetime(timestamp_str)
            scan_time = timezone.make_aware(scan_time, timezone.get_current_timezone())

            student = get_object_or_404(Student, numero=numero, nom=nom, prenom=prenom)
            logger.info(f"Found student: {student.id} - {student.nom} {student.prenom}")

            current_date = scan_time.date()
            schedules = Schedules_st.objects.filter(
                level=student.level,
                day=scan_time.strftime("%a").upper()[:3]
            )

            if not schedules.exists():
                logger.warning(f"No schedule found for student {student.id} on {current_date}")
                return

            schedule, time_diff = find_best_schedule(schedules, scan_time, current_date)
            if not schedule:
                logger.warning(f"No matching schedule found for student {student.id} on {current_date} at {scan_time}")
                return

            logger.debug(f"Selected schedule: {schedule.start_time} - {schedule.end_time}, Time difference: {time_diff} minutes")

            if 0 <= time_diff <= STUDENT_GRACE_PERIOD_PRESENT:
                status = "PRESENT"
            elif STUDENT_GRACE_PERIOD_PRESENT < time_diff <= STUDENT_GRACE_PERIOD_LATE:
                status = "RETARD"
            else:
                status = "ABSENT"

            attendance, created = Attendance.objects.get_or_create(
                student=student,
                schedule=schedule,
                date=current_date,
                admin=student.admin,
                defaults={"status": status}
            )
            if created:
                logger.info(f"Attendance logged for student {student.id} on {current_date} as {status}")
            else:
                attendance.status = status
                attendance.save()
                logger.info(f"Attendance updated for student {student.id} on {current_date} to {status}")

            # Broadcast attendance update to WebSocket clients
            async_to_sync(channel_layer.group_send)(
                "attendance_group",
                {
                    "type": "attendance_update",
                    "studentId": student.id,
                    "scheduleId": schedule.id,
                    "date": current_date.strftime("%Y-%m-%d"),
                    "status": status.lower(),
                }
            )

        elif data_type == "teacher" and msg.topic == TEACHER_TOPIC:
            logger.debug("Processing teacher attendance")
            nom = data.get("nom")
            prenom = data.get("prenom")
            email = data.get("email")
            numero = data.get("numero")
            timestamp_str = data.get("timestamp")
            logger.info(f"Received teacher QR data: email={email}, nom={nom}, prenom={prenom}, numero={numero}, timestamp={timestamp_str}")

            scan_time = parse_datetime(timestamp_str)
            scan_time = timezone.make_aware(scan_time, timezone.get_current_timezone())

            try:
                teacher = get_object_or_404(Teacher, mail=email)
                logger.info(f"Found teacher: {teacher.id} - {teacher.nom} {teacher.prenom}")
            except Teacher.DoesNotExist:
                logger.error(f"Teacher with mail={email} not found")
                return

            current_date = scan_time.date()
            current_day = scan_time.strftime("%a").upper()[:3]
            logger.debug(f"Looking for schedules on {current_day} for teacher {teacher.id}")
            schedules = Schedule_t.objects.filter(
                teacher=teacher,
                day=current_day
            )

            if not schedules.exists():
                logger.warning(f"No schedule found for teacher {teacher.id} on {current_date}")
                return

            schedule, time_diff = find_best_schedule(schedules, scan_time, current_date)
            if not schedule:
                logger.warning(f"No matching schedule found for teacher {teacher.id} on {current_date} at {scan_time}")
                return

            logger.debug(f"Selected schedule: {schedule.start_time} - {schedule.end_time}, Time difference: {time_diff} minutes")

            if 0 <= time_diff <= TEACHER_GRACE_PERIOD:
                status = "present"
            else:
                status = "absent"

            # Include schedule in get_or_create to ensure uniqueness
            attendance, created = Attendance_t.objects.get_or_create(
                teacher=teacher,
                date=current_date,
                schedule=schedule,
                admin=teacher.admin,
                defaults={"status": status, "subject": teacher.subject}
            )
            if created:
                logger.info(f"Attendance logged for teacher {teacher.id} on {current_date} as {status} for schedule {schedule.start_time}")
            else:
                attendance.status = status
                attendance.subject = teacher.subject
                attendance.save()
                logger.info(f"Attendance updated for teacher {teacher.id} on {current_date} to {status} for schedule {schedule.start_time}")

            # Broadcast attendance update to WebSocket clients
            async_to_sync(channel_layer.group_send)(
                "attendance_group",
                {
                    "type": "attendance_update",
                    "teacherId": teacher.id,
                    "subjectId": teacher.subject.id if teacher.subject else None,
                    "scheduleId": schedule.id,
                    "date": current_date.strftime("%Y-%m-%d"),
                    "status": status.lower(),
                }
            )

        else:
            logger.warning(f"Invalid data type or topic mismatch: type={data_type}, topic={msg.topic}")

    except Exception as e:
        logger.error(f"Error processing MQTT message: {e}", exc_info=True)

def start_mqtt():
    client = mqtt.Client(client_id=CLIENT_ID, callback_api_version=CallbackAPIVersion.VERSION1)
    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(BROKER, PORT, 60)
    except Exception as e:
        logger.error(f"Failed to connect to MQTT broker: {e}")
        return

    logger.info("Starting MQTT client...")
    client.loop_forever()

if __name__ == "__main__":
    start_mqtt()