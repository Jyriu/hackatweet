from django.urls import path, include

urlpatterns = [
    path('api/', include('api.urls')),  # inclusion des URLs de l'application "api"
]
