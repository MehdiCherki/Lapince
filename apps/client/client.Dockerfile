# ===== Premier step : construire le dossier dist ======

# Image de base
FROM node:22-alpine AS builder

# Définir l'espace de travail
WORKDIR /app

# Copier les métadonnées du projet
COPY package*.json ./

# Installe les dépendances
RUN npm install

# Copier le reste du code
# (penser au .dockerignore pour ne pas copier certains fichiers)
COPY ./ ./ 

# Problème : 
# - il faut rajouter la variable `VITE_API_BASE_URL` dans l'image avant de lancer le build, afin de définir l'adresse de l'API dans le dossier dist/
# - solution : on rajoutera au moment du build l'argument `docker build --build-arg VARIABLE=VALEUR`
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
# ARG = permet d'accepter l'argument --build-arg
# ENV = permet d'injecter la variable dans l'environnement lorsqu'on lance des commandes RUN
# On pourrait appeler l'ARG autrement, mais dans ce cas attention lorsqu'on le fourni avec --build-arg

# Build le code vers le dossier 'dist'
RUN npm run build



# ===== Deuxième step : conteneur NGinx qui sert le dist ======
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf   
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]