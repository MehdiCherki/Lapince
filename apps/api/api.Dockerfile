# Un dockerfile est une "recette amélioré" d'une image de base (FROM) permettant de créer des conteneurs pré-configuré plus finement

# Définir l'image de base depuis laquelle on créé notre image
FROM node:22-slim AS builder

# Définir un espace de travail
# /app est très commun (convention) pour les applications Node
WORKDIR /app

# On copie le package.json dans le futur conteneur
COPY package*.json ./

# Docker était dépourvu d'OpenSSL et Prisma a émis un avertissement.
# De plus, la compilation a été effectuée avant l'installation d'OpenSSL.
RUN apt-get update -y && apt-get install -y openssl

# On installe les dépendances de Node
# RUN = commande que l'on lance à la construction de l'IMAGE
RUN npm install 

# Copier le reste du code
# On copie tout le code du dossier courant (local) dans le dossier courant du conteneur
# On le fait en deux fois la copie pour la mise en cache des étapes précédentes par Docker
COPY ./ ./



# Générer le client prisma capable de se connecter à la BDD
RUN npx prisma generate
RUN npm run build

# CMD npx prisma migrate deploy && npm run start

# # Créer le dossier dist contenant le code JS compilé que l'on exécutera
# RUN npm run build

# Gérer les variables d'environnement
# On ne veut PAS copier le .env local dans l'image, car on ne sait pas encore sur quel environnement on va créer un conteneur (local, pre-prod, prod, test)
# On va ignorer le .env de la commande COPY ---> .dockerignore
# Mais alors comment on les mets dans le conteneur final ? --> c'est au moment de la création du conteneur !
# Les variables d'environnement seront à préciser lorsqu'on lance `docker run IMAGE -e .....`

# Lancer les migrations (objectif : créer les tables)
# Pour lancer les migrations, j'ai besoin de la DATABASE_URL ==> cette étape doit être fait au moment de l'instanciation d'un conteneur
# On va rajouter un script NPM qui : lance les migrations puis lance l'application

# CMD = commande qui sera lancé lorsqu'on génère le CONTENEUR à partir de l'image
# Docker:start = lance les migrations (créé les tables) puis  lance l'app (node dist/index.js)
# Cette commande "npm run docker:start" sera lancée lorsqu'on lance `docker run IMAGE`
CMD ["npm", "run", "docker:start"]

