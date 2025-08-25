# student_qr/management/commands/mark_absent.py
from django.core.management.base import BaseCommand
from student_qr.models import Student, Schedules_st, Attendance
from django.utils import timezone
from datetime import datetime, timedelta
import pytz

class Command(BaseCommand):
    help = 'Marks students absent if they didn’t scan within 20 minutes of schedule start'

    def handle(self, *args, **options):
        tunis_tz = pytz.timezone('Africa/Tunis')
        now = timezone.now().astimezone(tunis_tz)
        current_day = now.strftime('%a').upper()[:3]
        current_date = now.date()

        # Get all schedules for today
        schedules = Schedules_st.objects.filter(day=current_day)
        if not schedules.exists():
            self.stdout.write(self.style.WARNING('No schedules found for today'))
            return

        updated = 0
        for schedule in schedules:
            start_time = tunis_tz.localize(datetime.combine(current_date, schedule.start_time))
            late_period_end = start_time + timedelta(minutes=20)

            # Only process if current time is past the 20-minute window
            if now <= late_period_end:
                self.stdout.write(self.style.WARNING(
                    f"Skipping schedule {schedule.id}: 20-minute window not yet closed ({late_period_end})"
                ))
                continue

            # Get students for this level
            students = Student.objects.filter(level=schedule.level)
            if not students.exists():
                self.stdout.write(self.style.WARNING(f"No students found for level {schedule.level}"))
                continue

            # Check attendance for each student
            for student in students:
                attendance_exists = Attendance.objects.filter(
                    student=student,
                    schedule=schedule,
                    date=current_date
                ).exists()

                if not attendance_exists:
                    # No attendance record, mark as absent
                    Attendance.objects.create(
                        student=student,
                        schedule=schedule,
                        date=current_date,
                        status="absent",
                        admin=student.admin
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f"Marked {student.prenom} {student.nom} absent for schedule {schedule.id}"
                    ))
                    updated += 1

        if updated == 0:
            self.stdout.write(self.style.SUCCESS('No new absences to mark'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Marked {updated} students absent'))