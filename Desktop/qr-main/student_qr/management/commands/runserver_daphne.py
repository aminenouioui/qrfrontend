# student_qr/management/commands/runserver_daphne.py
from django.core.management.base import BaseCommand
import paho.mqtt.publish as publish
import subprocess
import datetime

class Command(BaseCommand):
    help = 'Runs the Daphne server and publishes a startup message via MQTT'

    def handle(self, *args, **options):
        host = '0.0.0.0'
        port = 8000
        startup_message = f"{datetime.datetime.now()} INFO     Starting server at {host}:{port}"

        # Publish the startup message via MQTT
        try:
            publish.single(
                topic="server/status",
                payload=startup_message,
                hostname="localhost",
                port=1883
            )
            self.stdout.write(self.style.SUCCESS(f"Published server status to MQTT: {startup_message}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to publish to MQTT: {e}"))

        # Run Daphne
        daphne_command = f"daphne -b {host} -p {port} QRcode.asgi:application"
        subprocess.run(daphne_command, shell=True)