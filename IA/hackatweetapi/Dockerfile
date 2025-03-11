FROM python:3.9-slim

# Assurer un output non bufferisé
ENV PYTHONUNBUFFERED=1

# Définir le répertoire de travail à l'intérieur du conteneur
WORKDIR /usr/src/app

#Installer libGL
RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0


# Copier le fichier des dépendances et installer
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copier le reste du code de l'API Django
COPY . .

# Donner les droits d'exécution au script de démarrage
RUN chmod +x start.sh

# Exposer le port de l'API
EXPOSE 8000

# Lancer le script de démarrage qui démarrera Django et uvicorn
CMD ["./start.sh"]
