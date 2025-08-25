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

        schedules = Schedules_st.objects.filter(day=current_day)
        for schedule in schedules:
            start_time = tunis_tz.localize(datetime.combine(current_date, schedule.start_time))
            late_period_end = start_time + timedelta(minutes=20)

            if now > late_period_end:  # Past 20-minute window
                students = Student.objects.filter(level=schedule.level)
                for student in students:
                    # Check if attendance exists
                    attendance, created = Attendance.objects.get_or_create(
                        student=student,
                        schedule=schedule,
                        date=current_date,
                        defaults={"status": "absent", "admin": student.admin}
                    )
                    if created:
                        self.stdout.write(self.style.SUCCESS(
                            f"Marked {student.prenom} {student.nom} absent for schedule {schedule.id}"
                        ))

        self.stdout.write(self.style.SUCCESS('Absent marking complete'))