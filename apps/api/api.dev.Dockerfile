FROM node:22-slim

WORKDIR /app

COPY package*.json ./

# Prisma a besoin d'OpenSSL pour générer le client
RUN apt-get update -y && apt-get install -y openssl

RUN npm install

COPY ./ ./

# Génère le client Prisma (types + requêtes)
RUN npx prisma generate

# Lance le serveur en mode watch : tsx recompile à chaque modification de fichier
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && npm run dev"]
