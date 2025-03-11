FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Exposer le port du front
EXPOSE 5173

CMD ["npm", "run", "dev"]
