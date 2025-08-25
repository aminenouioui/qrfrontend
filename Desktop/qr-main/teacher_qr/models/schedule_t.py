from django.db import models
from django.core.exceptions import ValidationError
from users.models import CustomUser
from teacher_qr.models.teacher import Teacher
from teacher_qr.models.subject import Subject
from teacher_qr.models.classe import Classe

class Schedule_t(models.Model):
    admin = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='teacher_schedules')

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
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    start_time = models.TimeField()
    end_time = models.TimeField()
    notes = models.TextField(blank=True, null=True)
    def str(self):
        return f"{self.teacher.nom} - {self.classe.name} - {self.subject.nom} on {self.day}"

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("End time must be later than start time.")
        super().clean()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['teacher', 'classe', 'subject', 'day', 'start_time'],  # Added start_time
                name='unique_teacher_schedule'
            )
        ]
        ordering = ['day', 'start_time']
        verbose_name = "Teacher Schedule"
        verbose_name_plural = "Teacher Schedules"