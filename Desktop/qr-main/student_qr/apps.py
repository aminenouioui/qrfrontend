from django.apps import AppConfig
from threading import Thread

class StudentQrConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'student_qr'
    mqtt_started = False  # Flag to ensure MQTT starts only once

    def ready(self):
        if not StudentQrConfig.mqtt_started:
            # Start MQTT in a background thread
            def start_mqtt_thread():
                # Import here to avoid loading models too early
                from .mqtt_client import start_mqtt
                start_mqtt()

            mqtt_thread = Thread(target=start_mqtt_thread, daemon=True)
            mqtt_thread.start()
            StudentQrConfig.mqtt_started = True
            print("🚀 MQTT client started in background thread")