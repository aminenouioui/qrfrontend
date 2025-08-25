from django.db import models
from users.models import CustomUser
from student_qr.models.schedules_st import Schedules_st
from student_qr.models.student import Student

class Attendance(models.Model):
    admin = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='student_attendances')
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.DateField()
    schedule = models.ForeignKey(Schedules_st, on_delete=models.CASCADE)
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

    class Meta:
        unique_together = ('student', 'schedule', 'date')

    def __str__(self):
        return f"{self.student.nom} {self.student.prenom} - {self.date} - {self.status}"