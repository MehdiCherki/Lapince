FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY ./ ./

EXPOSE 5173

# --host expose le serveur Vite sur 0.0.0.0 (accessible depuis l'extérieur du conteneur)
CMD ["npm", "run", "dev", "--", "--host"]
