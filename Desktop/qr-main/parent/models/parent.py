from django.db import models
from django.contrib.auth import get_user_model
from student_qr.models.student import Student

CustomUser = get_user_model()


class RelationshipType(models.TextChoices):
    FATHER = 'Father', 'Father'
    MOTHER = 'Mother', 'Mother'
    GUARDIAN = 'Guardian', 'Guardian'
    OTHER = 'Other', 'Other'


class Parent(models.Model):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    adresse = models.CharField(max_length=255, blank=True, null=True)
    mail = models.EmailField(unique=True)
    numero = models.CharField(max_length=15)
    admin = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='parents')
    user_account = models.OneToOneField(CustomUser, on_delete=models.CASCADE, null=True, blank=True, related_name='parent')
    profession = models.CharField(max_length=100, blank=True, null=True)
    relationship = models.CharField(max_length=20, choices=RelationshipType.choices, default=RelationshipType.GUARDIAN)
    is_emergency_contact = models.BooleanField(default=True)
    students = models.ManyToManyField(Student, related_name='parents', blank=True)
    is_account_created = models.BooleanField(default=False)
    status = models.CharField(max_length=20, default="Inactive")
    temporary_password = models.CharField(max_length=128, blank=True, null=True)  # New field for raw password

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['mail', 'admin'], name='unique_parent_email_per_admin')
        ]

    def __str__(self):
        return f"{self.prenom} {self.nom}"