from django.db import models
import qrcode
from io import BytesIO
from django.core.files import File
from PIL import Image

from student_qr.models.level import Level
from users.models import CustomUser


class AdmissionStatus(models.TextChoices):
    EN_ATTENTE = 'att', 'En Attente'
    ACCEPTE = 'acc', 'Accepté'
    REFUSE = 'ref', 'Refusé'


class Student(models.Model):
    admin = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='students')
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    date_naissance = models.DateField(null=True)
    level = models.ForeignKey('Level', on_delete=models.CASCADE)

    adresse = models.CharField(max_length=255, default="Unknown", blank=True, null=True)
    mail = models.EmailField(unique=True)
    numero = models.CharField(max_length=15)
    photo = models.ImageField(upload_to='student_photos/', blank=True, null=True)
    admission_s = models.CharField(
        max_length=12,
        choices=AdmissionStatus.choices,
        default=AdmissionStatus.EN_ATTENTE,
    )
    is_account_created = models.BooleanField(default=False)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    plain_password = models.CharField(max_length=128, blank=True, null=True)

    def __str__(self):
        return f"{self.prenom} {self.nom}"

    def generate_qr_code(self):
        data = (
            f"Nom: {self.nom}\n"
            f"Prenom: {self.prenom}\n"
            f"Adresse: {self.adresse}\n"
            f"Niveau: {self.level.level}\n"
            f"Email: {self.mail}\n"
            f"Numero: {self.numero}\n"
            f"Photo: {self.photo}\n"
            f"Admission Status: {self.get_admission_s_display()}\n"
        )

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill='black', back_color='white')
        buffer = BytesIO()
        img.save(buffer, format="PNG")

        filename = f'{self.prenom}_{self.nom}_qr.png'
        self.qr_code.save(filename, File(buffer), save=False)

    def save(self, *args, **kwargs):
        if not self.qr_code:
            self.generate_qr_code()
        super().save(*args, **kwargs)
