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
- GitHub Actions (intégration continue)

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

Au démarrage, l'API applique les **migrations** de la base qui ne l'ont pas encore été (`prisma migrate deploy`, dossier `apps/api/prisma/migrations`), puis lance le seed des catégories.

| Service | Adresse |
|---|---|
| Client (Vite) | http://localhost:8080 |
| API | http://localhost:3007 |
| Prisma Studio | http://localhost:5555 |

Les ports locaux se règlent dans `.env` (`CLIENT_LOCAL_PORT`, `API_LOCAL_PORT`, `POSTGRES_LOCAL_PORT`).

### Tests
Stratégie, matrice fonctionnalités × tests, tests de sécurité et cahier de recette : [docs/tests.md](docs/tests.md).

```bash
docker compose exec api npm run test:unit          # API : tests unitaires (sans base)
docker compose exec api npm run test:integration   # API : tests d'intégration, sur la base lapince_test
docker compose exec api npm test -- run            # API : les deux
docker compose exec client npm test                # client
```

Les tests d'intégration n'utilisent jamais la base de dev : ils tournent sur `lapince_test` (`DATABASE_URL_TEST` dans `.env`) et refusent de démarrer sur une autre base. Mise en place, une seule fois :
```bash
echo "CREATE DATABASE lapince_test;" | docker compose exec -T db sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB'
docker compose exec api npm run test:db:setup  # migrations + catégories ; à relancer après chaque nouvelle migration
```

### Intégration continue
Chaque pull request est vérifiée par GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)), sur une machine neuve, à partir du dépôt seul :

| Job | Contrôles |
|---|---|
| Formatage | Prettier sur tout le dépôt (version figée) |
| API | `npm ci`, client Prisma, types, tests unitaires, migrations + seed sur une base PostgreSQL jetable, tests d'intégration, build |
| Client | `npm ci`, lint, tests, types et build |
| Images de production | construction des Dockerfiles de prod de l'API et du client |
| Script de déploiement | ShellCheck, puis tests du script avec des doubles de `git`, `docker` et `curl` |

Résultat d'une PR : onglet *Checks* sur GitHub, ou `gh pr checks <numéro>`.


## Conventions Git

### Branches
- `main` : branche de production.
- `dev` : branche d’intégration.
- `feature/nom-fonctionnalite` : nouvelle fonctionnalité.
- `fix/nom-bug` : correction.
- `chore/nom-tache` : tâche technique.

> Utiliser `feature/` et non `feat/` : des branches `Feat/…` existent déjà, et sous Windows Git ne distingue pas `Feat` de `feat` (détails dans [docs/Conventions-branch.md](docs/Conventions-branch.md)).

### Règles
- Ne jamais travailler directement sur `main` ni sur `dev`.
- Toute modification passe par une Pull Request.
- `main` et `dev` sont **protégées** sur GitHub : pas de push direct (PR obligatoire), merge refusé tant que tous les jobs de la CI ne sont pas verts, règle appliquée aussi aux administrateurs, ni force-push ni suppression de la branche.

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
- CI verte (sinon GitHub refuse le merge).
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

### Modifier la base de données (migrations)
Toute modification de `schema.prisma` passe par une **migration versionnée** : un fichier SQL daté, relu et commité avec le code.
```bash
docker compose exec api npx prisma migrate dev --name <description>   # crée et applique la migration en dev
```
Le nouveau dossier `apps/api/prisma/migrations/<date>_<description>/` doit être commité. En prod, l'API l'applique toute seule au démarrage (`prisma migrate deploy`).

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