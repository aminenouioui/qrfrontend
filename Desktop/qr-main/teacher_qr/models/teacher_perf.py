from django.db import models

from student_qr.models.level import Level
from .teacher import Teacher
class Teacher_perf(models.Model):
    teacher=models.ForeignKey(Teacher, on_delete=models.CASCADE)
    feedback=models.CharField(max_length=100)
    score = models.DecimalField(max_digits=5, decimal_places=2)  # DECIMAL(5, 2)
    date=models.DateTimeField(auto_now_add=True)
    levels = models.ManyToManyField(Level, related_name='teachers')
    def __str__(self):
        return f"Performance of {self.teacher} on {self.date} with score {self.score}"
    
    