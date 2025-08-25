from django.db import models
from users.models import CustomUser

class Classe(models.Model):
    admin = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='classes')
    name = models.CharField(max_length=100, unique=True)
    capacity = models.PositiveBigIntegerField(default=30)

    def __str__(self):
        return f"{self.name} {self.capacity}"