from django.db import models
from users.models import CustomUser

class Subject(models.Model):
    admin = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='subjects')
    nom = models.CharField(max_length=100)
    description = models.CharField(max_length=150)

    def __str__(self):
        return f"{self.nom} {self.description}"