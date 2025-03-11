FROM node:20

# Définir le répertoire de travail
WORKDIR /usr/src/app

# Copier les fichiers de configuration et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le reste du code
COPY . .

# Exposer le port utilisé par l'API
EXPOSE 5001

# Lancer l'application (assure-toi que "npm start" utilise bien le .env)
CMD ["npm", "start"]
