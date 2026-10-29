# La Pince

Application web de gestion de finances personnelles.
Objectif du projet : permettre à l’utilisateur de suivre ses revenus, dépenses et catégories, avec une base technique propre, collaborative et déployable.

## Sommaire

- Présentation du projet
- Stack technique
- Prérequis
- Installation
- Configuration des variables d’environnement
- Lancement du projet
- Organisation du travail
- Conventions Git
- Règles de pull request
- Structure du projet
- Dépannage

---

## Présentation du projet

**La Pince** est une application web permettant de suivre ses finances personnelles de façon simple et intuitive.

Fonctionnalités prévues dans le MVP :
- Inscription et connexion.
- Consultation du profil utilisateur.
- Gestion des transactions.
- Gestion des catégories.
- Base prête pour les budgets, alertes et statistiques dans les évolutions futures.

---

## Stack technique

### Front-end
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Shadcn UI

### Back-end
- Node.js
- Express
- TypeScript
- Prisma
- Zod
- JWT
- Argon2

### Base de données
- PostgreSQL

### DevOps
- Docker
- Docker Compose

### Qualité et collaboration
- Git
- GitHub
- Pull Requests
- Peer review obligatoire

---

## Prérequis

Avant de commencer, installer :
- Node.js
- npm
- Docker
- Docker Compose
- Git

Vérifier les versions si besoin :
```bash
node -v
npm -v
git --version
docker -v
docker compose version
```

---

## Installation

### 1. Cloner le dépôt
```bash
git clone <URL_DU_DEPOT>
cd Lapince
```


### 2. Créer le .env à la racine du projet
Créer un fichier `.env` à partir de `.env.example` et ajouter les valeurs.


### Règles importantes pour le dev
- Le fichier `.env` ne doit jamais être commité.
- Le fichier `.env.example` doit rester dans le dépôt.
- Chaque membre doit utiliser les mêmes noms de variables.

---

## Lancement du projet

### Avec Docker
À la racine du projet :

```bash
docker compose up -d --build
docker compose watch   # optionnel : synchronise les fichiers modifiés dans les conteneurs
```

Au démarrage, l'API applique le schéma Prisma à la base (`prisma db push`) puis lance le seed des catégories : aucune migration à lancer à la main.

| Service | Adresse |
|---|---|
| Client (Vite) | http://localhost:8080 |
| API | http://localhost:3007 |
| Prisma Studio | http://localhost:5555 |

Les ports locaux se règlent dans `.env` (`CLIENT_LOCAL_PORT`, `API_LOCAL_PORT`, `POSTGRES_LOCAL_PORT`).

### Tests
```bash
docker compose exec api npm test -- run
docker compose exec client npm test
```


## Conventions Git

### Branches
- `main` : branche de production.
- `dev` : branche d’intégration.
- `feature/nom-fonctionnalite` : nouvelle fonctionnalité.
- `fix/nom-bug` : correction.
- `chore/nom-tache` : tâche technique.

> Utiliser `feature/` et non `feat/` : des branches `Feat/…` existent déjà, et sous Windows Git ne distingue pas `Feat` de `feat` (détails dans [docs/Conventions-branch.md](docs/Conventions-branch.md)).

### Règles
- Ne jamais travailler directement sur `main`.
- Toute modification passe par une Pull Request.
- Une PR doit être relue et approuvée par au moins 1 membre avant fusion.
- La branche `main` est protégée.

### Exemples
```bash
git checkout -b feature/auth-register
git checkout -b fix/navbar-responsive
git checkout -b chore/docker-setup
```

---

## Règles de pull request

Chaque Pull Request doit contenir :
- Un titre clair.
- Une description de ce qui a été fait.
- Le pourquoi de la modification.
- Les étapes pour tester.
- Les captures d’écran si nécessaire.

### Avant merge
- Code relu.
- 1 approve minimum.
- Tests passés.
- Aucun conflit non résolu.

---

## Structure du projet

```
Lapince/
├── apps/
│   ├── api/                  # API REST : Express, Prisma, Zod (TypeScript)
│   └── client/               # Front : React, Vite, Tailwind (TypeScript)
├── docs/                     # Conventions Git, commandes Docker, déploiement
├── docker-compose.yml        # Dev : db, api, client, studio (Prisma Studio)
├── docker-compose.prod.yml   # Prod : db, api, client, nginx-proxy, certbot
├── nginx-proxy.conf          # Reverse proxy HTTPS de la prod
├── .env.example              # Modèle du fichier .env (à copier)
└── CHANGELOG.md
```

Chaque application a son `package.json` et ses Dockerfiles (`*.dev.Dockerfile` pour le dev, l'autre pour la prod). Les commandes `npm` se lancent dans les conteneurs : `docker compose exec api …`, `docker compose exec client …`.

Déploiement : [docs/deploiement-serveur.md](docs/deploiement-serveur.md).

---

## Dépannage

### Problème de base de données
Vérifier que le conteneur PostgreSQL est bien lancé :
```bash
docker compose ps
```

### Schéma Prisma modifié
Le schéma est appliqué au démarrage de l'API. Pour l'appliquer sans redémarrer :
```bash
docker compose exec api npx prisma db push
```

### Problème de dépendances
Les dépendances sont installées dans l'image : après un changement de `package.json`, reconstruire le service.
```bash
docker compose up -d --build api      # ou client
```

### Problème de port déjà utilisé
Vérifier qu’aucune autre application n’utilise les ports locaux définis dans `.env` (par défaut `3007` pour l'API, `8080` pour le client).

---

## Bonnes pratiques

- Commiter souvent avec des messages clairs.
- Garder les PR petites et lisibles.
- Synchroniser le front et le back sur les formats d’API.
- Documenter toute décision technique importante.
- Mettre à jour ce README si une commande ou une structure change.