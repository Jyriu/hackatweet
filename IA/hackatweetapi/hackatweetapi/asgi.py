import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from django.urls import path
from api.consumers import EmotionConsumer

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hackatweetapi.settings")
django.setup()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # Gestion des requêtes HTTP classiques
    "websocket": URLRouter([
        path("ws/emotions/", EmotionConsumer.as_asgi()),  # Gestion des connexions WebSocket
    ]),
})
