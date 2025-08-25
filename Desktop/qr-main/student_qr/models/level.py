from django.db import models
from users.models import CustomUser

class Level(models.Model):
    admin = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='levels')
    level = models.CharField(max_length=100)

    def __str__(self):
        return self.level