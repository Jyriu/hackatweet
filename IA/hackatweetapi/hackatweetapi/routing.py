from django.urls import path
from api.consumers import EmotionConsumer

websocket_urlpatterns = [
    path("ws/emotions/", EmotionConsumer.as_asgi()),
]
