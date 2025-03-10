from django.shortcuts import render

import io
from collections import Counter

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from PIL import Image
from transformers import pipeline

# Charger le modèle (la première utilisation peut être lente)
model = pipeline("image-classification", model="trpakov/vit-face-expression")

@csrf_exempt  # Désactive la protection CSRF pour simplifier le test
def analyze_images(request):
    if request.method == 'POST':
        screenshots = []
        # Vérifier que les trois fichiers sont présents
        for key in ['screenshot1', 'screenshot2', 'screenshot3']:
            if key not in request.FILES:
                return JsonResponse({"error": f"Le fichier '{key}' est manquant."}, status=400)
            file = request.FILES[key]
            try:
                image = Image.open(file)
                screenshots.append(image)
            except Exception as e:
                return JsonResponse({"error": f"Erreur lors du traitement de '{key}' : {str(e)}"}, status=400)
        
        # Appliquer le modèle sur chaque image
        predictions = []
        for img in screenshots:
            result = model(img)
            # Prendre l’émotion avec la meilleure confiance
            emotion = result[0]['label']
            predictions.append(emotion)
        
        # Calculer l’émotion majoritaire
        majority_emotion = Counter(predictions).most_common(1)[0][0]
        
        return JsonResponse({
            "majority_emotion": majority_emotion,
            "predictions": predictions
        })
    else:
        return JsonResponse({"error": "Seule la méthode POST est autorisée."}, status=405)
