from django.db import models

from student_qr.models.student import Student
from teacher_qr.models.subject import Subject
from users.models import CustomUser

class Grade(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, null=True, blank=True)
    grade = models.DecimalField(max_digits=5, decimal_places=2)
    level = models.ForeignKey('Level', on_delete=models.CASCADE, null=False) 
    admin = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='teacher_grades')
    def __str__(self):
        return f"{self.student.name} - {self.subject}-{self.level}: {self.grade} "

