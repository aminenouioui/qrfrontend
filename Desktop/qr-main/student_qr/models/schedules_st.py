from django.db import models
from users.models import CustomUser
from student_qr.models.level import Level
from teacher_qr.models.classe import Classe
from teacher_qr.models.subject import Subject
from teacher_qr.models.teacher import Teacher

class Schedules_st(models.Model):
    admin = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='student_schedules')
    DAYS_OF_WEEK = [
        ('MON', 'Monday'),
        ('TUE', 'Tuesday'),
        ('WED', 'Wednesday'),
        ('THU', 'Thursday'),
        ('FRI', 'Friday'),
        ('SAT', 'Saturday'),
        ('SUN', 'Sunday'),
    ]
    day = models.CharField(max_length=3, choices=DAYS_OF_WEEK, default='MON')
    Teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    start_time = models.TimeField()
    end_time = models.TimeField()
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.level.level} - {self.Teacher.nom} - {self.classe.num} - {self.subject.nom} on {self.day}"