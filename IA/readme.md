HackatweetAPI
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

