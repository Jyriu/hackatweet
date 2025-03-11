from django.urls import path
from .views import analyze_images

urlpatterns = [
    path('analyze/', analyze_images, name='analyze-images'),
]
