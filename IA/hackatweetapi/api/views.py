import cv2
import numpy as np
from collections import defaultdict

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from PIL import Image
from deepface import DeepFace

@csrf_exempt  # Pour faciliter le test (en production, gérer la sécurité CSRF)
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
                img_np = np.array(image)
                img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
                screenshots.append(img_bgr)
            except Exception as e:
                return JsonResponse({"error": f"Erreur lors du traitement de '{key}' : {str(e)}"}, status=400)
        
        results = []
        aggregated_emotions = defaultdict(float)
        for img in screenshots:
            try:
                result = DeepFace.analyze(img, actions=['emotion'])
                # Si le résultat est une liste (cas de plusieurs visages), prendre le premier
                if isinstance(result, list):
                    result = result[0]
                # Convertir les scores de chaque émotion en float natif
                emotion_details = {emotion: float(score) for emotion, score in result.get("emotion", {}).items()}
                results.append({
                    "dominant_emotion": result.get("dominant_emotion"),
                    "emotion_details": emotion_details
                })
                # Agréger les scores pour calculer les émotions globales
                for emotion, score in emotion_details.items():
                    aggregated_emotions[emotion] += score
            except Exception as e:
                return JsonResponse({"error": f"Erreur lors de l'analyse d'une image : {str(e)}"}, status=500)
        
        # Calculer les 3 émotions globales les plus marquantes avec leur score total
        top3_emotions = sorted(aggregated_emotions.items(), key=lambda x: x[1], reverse=True)[:3]
        top3_emotions = [{"emotion": emotion, "score": float(score)} for emotion, score in top3_emotions]
        
        return JsonResponse({
            "results": results,
            "global_top_emotions": top3_emotions
        })
    else:
        return JsonResponse({"error": "Seule la méthode POST est autorisée."}, status=405)
