import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import student_qr.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'QRcode.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            student_qr.routing.websocket_urlpatterns
        )
    ),
})