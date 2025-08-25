# teacher_qr/models/attendance_t.py
from django.db import models
from users.models import CustomUser
from teacher_qr.models.teacher import Teacher
from teacher_qr.models.subject import Subject
from teacher_qr.models.schedule_t import Schedule_t  # Add import

class Attendance_t(models.Model):
    admin = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='teacher_attendances')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    schedule = models.ForeignKey(Schedule_t, on_delete=models.CASCADE, null=True, blank=True)  # Add schedule field
    status = models.CharField(
        max_length=10,
        choices=[
            ('present', 'Present'),
            ('absent', 'Absent'),
            ('retard', 'Retard'),
            ('att', 'En Attente'),
        ],
        default='att',
    )
    date = models.DateField()  # Already correct as DateField

    def __str__(self):
        return f"{self.teacher.nom} {self.teacher.prenom} - {self.date} - {self.status}"