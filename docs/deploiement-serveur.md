# Déploiement — La Pince

Site : https://mehdicherki.fr
Serveur : VPS Linux, dépôt cloné dans `/opt/lapince`.
Dépôt : `MehdiCherki/Lapince` sur GitHub, branche `main`.

> Aucun secret dans ce fichier : mots de passe, clés et jetons restent dans le `.env` du serveur.

---

## 1. Architecture de la prod

```
Internet ──► nginx-proxy (:80, :443) ──► client (nginx, fichiers du build Vite)
                 │                          └── /api/ ──► api (:3007) ──► db (PostgreSQL)
                 └── /.well-known/acme-challenge/ ◄── certbot (renouvellement HTTPS)
```

| Service | Rôle |
|---|---|
| `db` | PostgreSQL 17, données dans le volume `postgres_data` |
| `api` | API compilée (`node dist/…`). Au démarrage : `prisma migrate deploy` (applique les migrations versionnées non encore jouées), puis seed des catégories |
| `client` | nginx qui sert le front et relaie `/api/` vers `api` |
| `nginx-proxy` | Seul service exposé (ports 80 et 443). HTTP → HTTPS, `www` → domaine nu. Recharge sa configuration toutes les 6 h pour servir un certificat renouvelé |
| `certbot` | Tente un renouvellement toutes les 12 h, en mode **webroot** |

Tous les services ont `restart: unless-stopped` : ils repartent seuls après un redémarrage du serveur.

Toutes les commandes ci-dessous se lancent depuis `/opt/lapince`, avec cet alias :

```bash
cd /opt/lapince
alias dc='docker compose -f docker-compose.prod.yml'
```

### Le `.env` du serveur

Copie de `.env.example`, avec ces valeurs propres à la prod :

```env
NODE_ENV=production
DATABASE_URL=postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@db:5432/<POSTGRES_DB>
FRONTEND_URL=https://mehdicherki.fr
ALLOWED_ORIGINS=https://mehdicherki.fr
VITE_API_BASE_URL=/api
```

Les ports locaux (`*_LOCAL_PORT`) ne servent pas en prod : seul `nginx-proxy` est exposé.

> Ce document décrit le serveur **existant**. L'installation complète d'un nouveau serveur (Docker, premier certificat) n'est pas décrite ici, car elle n'a pas été rejouée depuis la mise en place.

---

## 2. Mettre en production une nouvelle version

> **Une seule fois, au premier déploiement avec migrations (0.9.0)** : la base de prod existait avant les migrations versionnées. Avant de lancer la nouvelle version, il faut l'inscrire comme déjà conforme à la migration initiale, sinon `migrate deploy` refuse de démarrer (base non vide). Après `git pull`, et avant `dc up -d --build` :
> ```bash
> dc build api
> dc run --rm --entrypoint npx api prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code; echo $?   # doit afficher 0 (aucun écart)
> dc run --rm --entrypoint npx api prisma migrate resolve --applied 0_init
> ```

Procédure utilisée pour la 0.7.0 (28/10/2026). Prérequis : la version est mergée dans `main`.

### A — Vérifier et sauvegarder

```bash
git status --short          # doit être vide : rien de modifié à la main sur le serveur
git log --oneline -1        # NOTER ce commit : c'est le point de retour arrière
dc exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > ~/backup-lapince-$(date +%F).sql
ls -lh ~/backup-lapince-*.sql   # la sauvegarde du jour ne doit pas être vide
```

### B — Déployer

```bash
git pull --ff-only origin main
dc up -d --build
```

`--build` est indispensable : sans lui, Docker relance les anciennes images.

### C — Contrôler

```bash
dc ps                       # tous les services « Up », db « healthy »
dc logs api --tail 20       # « Server started », aucune erreur
curl -s -o /dev/null -w "%{http_code}\n" https://mehdicherki.fr/api/categories   # 401 (route protégée : l'API répond)
```

Puis dans le navigateur : connexion, ajout d'une transaction, tableau de bord.

### D — Retour arrière (si C échoue)

```bash
git checkout <commit noté en A>
dc up -d --build
```

Si le schéma de la base a changé entre les deux versions, restaurer aussi la sauvegarde de l'étape A.

---

## 3. Accès GitHub du serveur

Le serveur lit le dépôt avec une **deploy key** : une clé SSH dédiée, en **lecture seule**, ajoutée dans GitHub → Settings du dépôt → Deploy keys. Elle ne donne accès qu'à ce dépôt et ne permet pas de pousser.

Elle est déclarée dans `~/.ssh/config` sous l'alias `github-lapince`, et l'URL du dépôt (`git remote -v`) utilise cet alias à la place de `github.com`.

---

## 4. Certificats HTTPS

Let's Encrypt, certificat `mehdicherki.fr` (couvre aussi `www.mehdicherki.fr`), stocké dans `/etc/letsencrypt` sur le serveur.

**Renouvellement automatique** : `certbot` dépose un fichier de preuve dans le volume `certbot_webroot`, que `nginx-proxy` sert sur `/.well-known/acme-challenge/`. Pas besoin d'arrêter nginx.

> ⚠️ Le mode doit rester **webroot**. En août 2026, le certificat avait été obtenu en mode `standalone` : certbot voulait alors ouvrir lui-même le port 80, déjà occupé par nginx. Chaque renouvellement échouait en silence, et le site est devenu inaccessible à l'expiration (14/08/2026).

```bash
# État et date d'expiration
dc run --rm --entrypoint certbot certbot certificates

# Mode de renouvellement : doit afficher « authenticator = webroot »
grep authenticator /etc/letsencrypt/renewal/mehdicherki.fr.conf

# Simulation de renouvellement (ne change rien)
dc run --rm --entrypoint certbot certbot renew --dry-run

# Journal des tentatives de renouvellement
dc logs certbot --tail 30
```

---

## 5. Commandes utiles

```bash
dc ps                              # état des services
dc logs -f api                     # logs de l'API en continu
dc restart api                     # redémarrer un service (ne relit pas le .env)
dc up -d api                       # recréer un service (relit le .env)
dc exec api sh                     # shell dans l'API
dc exec api npx prisma db seed     # relancer le seed
dc down                            # tout arrêter (les données restent)
```

> ⚠️ **Jamais `dc down -v`** : `-v` supprime les volumes, donc la base de production.

---

## 6. En cas de problème

**Service qui redémarre en boucle** : `dc logs <service> --tail 50`.

**Erreur de connexion à la base** : dans `.env`, `DATABASE_URL` doit reprendre `POSTGRES_USER`, `POSTGRES_PASSWORD` et `POSTGRES_DB`, avec l'hôte `db`. Attendre que `db` soit `healthy` (`dc ps`).

**Site injoignable en HTTPS** : vérifier la date d'expiration du certificat (section 4), puis `dc logs nginx-proxy --tail 30`.

**Rebuild sans cache Docker** :
```bash
dc build --no-cache
dc up -d
```
