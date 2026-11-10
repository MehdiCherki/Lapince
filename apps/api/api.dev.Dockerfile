FROM node:26-slim

WORKDIR /app

COPY package*.json ./

# Prisma a besoin d'OpenSSL pour générer le client
RUN apt-get update -y && apt-get install -y openssl

RUN npm install

COPY ./ ./

# Génère le client Prisma (types + requêtes)
RUN npx prisma generate

# Migrations versionnées (prisma/migrations) : applique seulement celles qui ne l'ont pas encore été,
# puis le seed (rôle lapince_owner) ; lance ensuite le serveur en mode watch (rôle lapince_app) :
# tsx recompile à chaque modification de fichier
CMD ["sh", "docker-start.sh", "npm", "run", "dev"]
