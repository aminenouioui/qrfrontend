import paho.mqtt.client as mqtt
from django.core.management.base import BaseCommand
from student_qr.models.student import Student  # Replace with your model

# MQTT settings
BROKER = "test.mosquitto.org"  # Public MQTT broker
PORT = 1883
MQTT_TOPIC = "qr_code_data"

class Command(BaseCommand):
    help = "Listens to MQTT messages and processes QR code data"

    def handle(self, *args, **kwargs):
        # Initialize MQTT client with the latest callback API version
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        client.on_connect = self.on_connect
        client.on_message = self.on_message

        try:
            # Connect to the MQTT broker
            client.connect(BROKER, PORT, 60)
            print(f"Connected to MQTT broker at {BROKER}:{PORT}")
        except Exception as e:
            print(f"Failed to connect to MQTT broker: {e}")
            return

        # Start the MQTT loop
        client.loop_forever()

    def on_connect(self, client, userdata, flags, rc, properties=None):
        """Callback when the client connects to the broker."""
        if rc == 0:
            print("Connected successfully!")
            client.subscribe(MQTT_TOPIC)
            print(f"Subscribed to topic: {MQTT_TOPIC}")
        else:
            print(f"Connection failed with result code {rc}")

    def on_message(self, client, userdata, msg):
        """Callback when a message is received."""
        try:
            qr_data = msg.payload.decode("utf-8")
            print(f"Received QR Code Data: {qr_data}")

            # Process the QR code data (e.g., save to database)
            self.save_qr_data(qr_data)
        except Exception as e:
            print(f"Error processing message: {e}")

    def save_qr_data(self, qr_data):
        """Save QR code data to the database."""
        try:
            # Parse the QR code data in the current format
            data_lines = qr_data.split("\n")  # Split by newlines
            name = data_lines[0].replace("Name: ", "").strip()  # Extract name
            scheme = data_lines[1].replace("Scheme: ", "").strip()  # Extract scheme
            student_class = data_lines[2].replace("Class: ", "").strip()  # Extract class

            # Save to the Student model
            Student.objects.create(name=name, scheme=scheme, student_class=student_class)
            print(f"Saved QR data: {qr_data}")
        except Exception as e:
            print(f"Error saving QR data: {e}")