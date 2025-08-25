from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import CustomUser
from student_qr.models.level import Level
from teacher_qr.models.subject import Subject
from student_qr.models.student import Student

class Grades(models.Model):
    admin = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='student_grades')
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    grade = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(20),
        ]
    )
    grade_type = models.CharField(
        max_length=10,
        choices=[('Test1', 'Test 1'), ('Test2', 'Test 2'), ('Test3', 'Test 3')],
        default='Test1'
    )
    date_g = models.DateTimeField(auto_now_add=True)
    level = models.ForeignKey(Level, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.student.nom} {self.student.prenom} {self.subject} {self.grade} {self.date_g}"