# HackatweetAPI
Ceci est une API Django pour analyser les émotions à partir de captures d’écran, utilisant le modèle Hugging Face trpakov/vit-face-expression.

Prérequis
Python 3.8 ou supérieur

Créer et activer l'environnement virtuel :

```bash python -m venv venv ```

Sous Windows (PowerShell) : ```powershell .\venv\Scripts\Activate.ps1 ```

Installer les dépendances :

```bash pip install -r requirements.txt ```


Lancer l'application

```bash cd hackatweetapi ```

Démarrer le serveur de développement :

```bash python manage.py runserver ```

Tester l'API :

L'API est accessible à l'adresse : http://127.0.0.1:8000/api/analyze/


## Description de l'API
La route /api/analyze/ permet d'analyser trois captures d'écran pour détecter et quantifier les émotions présentes.

Méthode HTTP : POST
Type de données envoyé : multipart/form-data
Champs requis :
- screenshot1 : Fichier image
- screenshot2 : Fichier image
- screenshot3 : Fichier image
  
L'API utilise Deepface pour extraire les scores de plusieurs émotions pour chaque image et retourne :

- results : Une liste contenant pour chaque image :
- dominant_emotion : L'émotion dominante détectée.
- emotion_details : Un dictionnaire des émotions avec leur score associé.
- global_top_emotions : Une liste des trois émotions les plus marquantes globalement (agrégées sur toutes les images), avec leur score total.
  
Exemple d'appel avec Insomnia ou Postman
Méthode : POST
URL :
```ruby

http://127.0.0.1:8000/api/analyze/
Body (multipart/form-data) :
screenshot1 : Fichier image 1
screenshot2 : Fichier image 2
screenshot3 : Fichier image 3
```
Exemple de réponse attendue
```json
{
	"results": [
		{
			"dominant_emotion": "sad",
			"emotion_details": {
				"angry": 5.679525375366211,
				"disgust": 0.001358318142592907,
				"fear": 21.434139251708984,
				"happy": 15.296649932861328,
				"sad": 33.77027130126953,
				"surprise": 0.13484926521778107,
				"neutral": 23.683204650878906
			}
		},
		{
			"dominant_emotion": "happy",
			"emotion_details": {
				"angry": 5.6141099776141346e-05,
				"disgust": 1.360073440537235e-07,
				"fear": 0.03292059525847435,
				"happy": 98.86251831054688,
				"sad": 0.0011628953507170081,
				"surprise": 0.058923281729221344,
				"neutral": 1.04441499710083
			}
		},
		{
			"dominant_emotion": "happy",
			"emotion_details": {
				"angry": 1.1550667295523454e-05,
				"disgust": 5.622737518640175e-13,
				"fear": 4.6734717784602253e-07,
				"happy": 99.9405517578125,
				"sad": 9.038040502673539e-07,
				"surprise": 4.976908712706063e-06,
				"neutral": 0.059434015303850174
			}
		}
	],
	"global_top_emotions": [
		{
			"emotion": "happy",
			"score": 214.0997200012207
		},
		{
			"emotion": "sad",
			"score": 33.7714351004243
		},
		{
			"emotion": "neutral",
			"score": 24.787053663283587
		}
	]
}
```
### Interprétation du résultat
results :
Chaque objet de la liste correspond à une image analysée.

dominant_emotion indique l'émotion la plus marquée dans l'image.
emotion_details fournit un score pour chaque émotion (angry, disgust, fear, happy, sad, surprise, neutral). Ces scores représentent la proportion ou la confiance de la détection de chaque émotion sur l'image.
global_top_emotions :
Cette liste regroupe les scores cumulés de toutes les images. Les trois émotions avec le score total le plus élevé sont renvoyées, ce qui donne une vision globale de l'expression émotionnelle dominante sur l'ensemble des images analysées.