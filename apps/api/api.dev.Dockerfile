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
# Migrations versionnées (prisma/migrations) : applique seulement celles qui ne l'ont pas encore été
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm run dev"]
