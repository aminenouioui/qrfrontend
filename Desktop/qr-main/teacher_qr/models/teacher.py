from django.db import models
import qrcode
from io import BytesIO
from django.core.files import File
from PIL import Image
from users.models import CustomUser
from teacher_qr.models.subject import Subject
from student_qr.models.level import Level
from student_qr.models.student import Student

class Teacher(models.Model):
    admin = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='teachers')
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    date_naissance = models.DateField(null=True, blank=True)
    adresse = models.CharField(max_length=255, default="Unknown", blank=True, null=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, null=True, blank=True)
    mail = models.EmailField(max_length=100, unique=True)
    numero = models.CharField(max_length=15)
    photo = models.ImageField(upload_to='teacher_photo/', blank=True, null=True)
    qr_code = models.ImageField(upload_to='qr_teacher/', blank=True, null=True)
    levels = models.ManyToManyField(Level, blank=True)
    students = models.ManyToManyField('student_qr.Student', blank=True)
    is_account_created = models.BooleanField(default=False)
    plain_password = models.CharField(max_length=128, blank=True, null=True)  # Temporary, for display only
    username = models.CharField(max_length=100, unique=True, blank=True, null=True)
    status = models.CharField(max_length=10, choices=[("Active", "Active"), ("Inactive", "Inactive")], default="Active")

    def __str__(self):
        return f"{self.prenom} {self.nom}"

    def generate_qr_code(self):
        data = (
            f"Nom: {self.nom}\n"
            f"Prenom: {self.prenom}\n"
            f"Adresse: {self.adresse}\n"
            f"Email: {self.mail}\n"
            f"Numero: {self.numero}\n"
            f"Photo: {self.photo.url if self.photo else 'N/A'}\n"
        )
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill='black', back_color='white')
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        filename = f'{self.prenom}_{self.nom}_qr.png'
        self.qr_code.save(filename, File(buffer), save=False)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.qr_code:
            self.generate_qr_code()
            super().save(*args, **kwargs)

