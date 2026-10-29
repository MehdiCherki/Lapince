# Procédure de déploiement — La Pince (depuis zéro)

Serveur : `student@****nom****-server.eddi.cloud`  
Repo : `git@github.com:O-clock-Geneve/cda-la-pince.git`

---

## 1. Se connecter au serveur

```bash
ssh student@****Nom****-server.eddi.cloud
```

---

## 2. Vérifier que Docker est installé

```bash
docker --version
docker compose version
```

Si Docker n'est pas installé :

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

---

## 3. Cloner le dépôt

```bash
cd ~
git clone git@github.com:O-clock-Geneve/cda-la-pince.git
cd cda-la-pince
```

> Si la clé SSH n'est pas configurée sur le serveur, générer une clé et l'ajouter aux deploy keys GitHub :
> ```bash
> ssh-keygen -t ed25519 -C "eddi-server"
> cat ~/.ssh/id_ed25519.pub
> # Copier la clé → GitHub → Settings du repo → Deploy keys → Add
> ```

---

## 4. Créer le fichier `.env`

```bash
cp .env.example .env
nano .env
```

Remplir avec les valeurs de production :

```env
# Base de données
POSTGRES_USER=lapince
POSTGRES_PASSWORD=<mot_de_passe_fort>
POSTGRES_DB=lapince_db

# API
JWT_SECRET=<secret_très_long_et_aléatoire>
NODE_ENV=production
DATABASE_URL=postgresql://lapince:<mot_de_passe_fort>@db:5432/lapince_db
API_PORT=3007

# Emails de vérification (SMTP Brevo) — le lien envoyé pointe sur FRONTEND_URL
FRONTEND_URL=https://mehdicherki.fr
SMTP_USER=<identifiant_smtp_brevo>
SMTP_PASS=<clé_smtp_brevo>

# CORS — domaine du serveur
ALLOWED_ORIGINS=https://mehdicherki.fr

# URL de l'API vue par le frontend (proxy nginx /api/ → api:3007)
VITE_API_BASE_URL=/api
```

> Le mot de passe dans `DATABASE_URL` doit être identique à `POSTGRES_PASSWORD`.
>
> Pas de port client à configurer : c'est le reverse proxy Nginx qui expose `80` et `443` (cf. `docker-compose.prod.yml`).

---

## 5. Builder et démarrer les conteneurs

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Cette commande :
- Build l'image API (compile le TypeScript)
- Build l'image client (build Vite → Nginx)
- Démarre PostgreSQL, l'API et le client
- L'API exécute automatiquement `prisma db push` + `prisma db seed` au démarrage

---

## 6. Vérifier que tout tourne

```bash
# État des conteneurs
docker compose -f docker-compose.prod.yml ps

# Logs de l'API (vérifier "Server started" et "prisma db push" OK)
docker compose -f docker-compose.prod.yml logs api

# Logs du client (vérifier Nginx démarré)
docker compose -f docker-compose.prod.yml logs client
```

L'app est accessible sur : `http://mehdicherki-server.eddi.cloud`

---

## 7. Mettre à jour après un push git

```bash
cd ~/cda-la-pince
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

> `--build` force le rebuild des images pour prendre en compte les nouveaux fichiers.

---

## 8. Commandes utiles

```bash
# Arrêter les conteneurs
docker compose -f docker-compose.prod.yml down

# Arrêter ET supprimer les volumes (⚠ efface la base de données)
docker compose -f docker-compose.prod.yml down -v

# Redémarrer un seul service
docker compose -f docker-compose.prod.yml restart api

# Ouvrir un shell dans l'API (debug, prisma studio, etc.)
docker compose -f docker-compose.prod.yml exec api sh

# Voir les logs en temps réel
docker compose -f docker-compose.prod.yml logs -f

# Relancer uniquement le seed manuellement
docker compose -f docker-compose.prod.yml exec api npx prisma db seed
```

---

## 9. En cas de problème

**Conteneur qui redémarre en boucle :**
```bash
docker compose -f docker-compose.prod.yml logs api --tail=50
```

**Erreur de connexion DB :**
- Vérifier que `DATABASE_URL` dans `.env` correspond bien à `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`
- Attendre que le healthcheck de `db` passe (`docker compose -f docker-compose.prod.yml ps` → `healthy`)

**Rebuild propre (si cache Docker problématique) :**
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```
