from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from .student import Student  # Correct import statement

class Admissions(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    application_date= models.DateTimeField(auto_now_add=True),
    status_ad = models.CharField(       
        max_length=10,
        choices=[
            ('acc','accepte'),
            ('ref','refuse'),
            ('att','en_attente'),

        ],
        default='en_attente',

    )
    def __str__(self):
        return f"{self.student.nom} {self.student.prenom}  {self.application_date}  {self.status_ad} "