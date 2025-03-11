import json
import base64
import cv2
import numpy as np
from channels.generic.websocket import AsyncWebsocketConsumer
from deepface import DeepFace

class EmotionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            frame_data = data.get("frame")
            if not frame_data:
                await self.send(json.dumps({"error": "Aucune image reçue (clé 'frame' manquante)"}))
                return

            # Retirer le header de la chaîne base64 si présent
            if "," in frame_data:
                frame_data = frame_data.split(",")[1]
            # Décoder l'image encodée en base64 en bytes
            img_bytes = base64.b64decode(frame_data)
            # Convertir les bytes en tableau NumPy
            nparr = np.frombuffer(img_bytes, np.uint8)
            # Décoder l'image avec OpenCV (les couleurs en BGR)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Analyse de l'image pour obtenir l'émotion
            result = DeepFace.analyze(img, actions=["emotion"], enforce_detection=False)
            if isinstance(result, list):
                result = result[0]

            # Convertir les scores des émotions en float Python natif
            emotions = result.get("emotion", {})
            emotion_details = {key: float(value) for key, value in emotions.items()}

            response = {
                "dominant_emotion": result.get("dominant_emotion"),
                "emotion_details": emotion_details
            }
            await self.send(json.dumps(response))
        except Exception as e:
            await self.send(json.dumps({"error": str(e)}))
