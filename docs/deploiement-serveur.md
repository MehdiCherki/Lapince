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

> **Une seule fois, au premier déploiement avec migrations (0.9.0)** : la base de prod existait avant les migrations versionnées. Avant de lancer la nouvelle version, il faut l'inscrire comme déjà conforme à la migration initiale `0_init`, sinon `migrate deploy` refuse de démarrer (base non vide). La 0.9.0 apporte aussi une deuxième migration (nommage des tables et colonnes, montants en `DECIMAL(12, 2)`) : l'API l'applique elle-même au démarrage, à l'étape B.
>
> Après l'étape A et `git pull`, avant `dc up -d --build` :
> ```bash
> dc build api
> # 1. La base doit être identique à 0_init, c'est-à-dire au schéma du commit 673dcd2.
> #    Pas au schéma actuel : il contient déjà la migration suivante (le contrôle afficherait 2).
> git show 673dcd2:apps/api/prisma/schema.prisma | dc run --rm -T --entrypoint sh api -c 'cat > /tmp/0_init.prisma && npx prisma migrate diff --from-config-datasource --to-schema /tmp/0_init.prisma --exit-code'; echo $?   # doit afficher 0
> # 2. Aucun montant à plus de 2 décimales (DECIMAL(12, 2) l'arrondirait au centime)
> echo 'SELECT count(*) FROM transactions WHERE amount <> round(amount, 2) UNION ALL SELECT count(*) FROM budgets WHERE limit_amount::numeric <> round(limit_amount::numeric, 2) UNION ALL SELECT count(*) FROM alerts WHERE "exceededAmount" <> round("exceededAmount", 2);' | dc exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At'   # doit afficher 0 sur les 3 lignes
> # 3. Inscription
> dc run --rm --entrypoint npx api prisma migrate resolve --applied 0_init
> ```
> **Si le contrôle 1 n'affiche pas `0` : STOP.** La base diffère de `0_init` ; l'inscrire ferait croire à un historique faux. Afficher les différences (même commande sans `--exit-code`) et les comprendre avant d'aller plus loin.
> **Si le contrôle 2 n'affiche pas `0` partout : STOP.** Regarder les montants concernés avant de continuer : l'arrondi au centime doit être constaté, pas subi.
>
> Puis étape B. En C, ajouter le contrôle final (doit afficher `0`) :
> ```bash
> dc exec api npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code; echo $?
> ```
> **Retour arrière** : la 0.8.0 ne connaît pas les nouveaux noms de colonnes ; revenir au code précédent impose de restaurer aussi la sauvegarde de l'étape A (section 5).
>
> Procédure **répétée le 30/10/2026** sur une copie restaurée de la sauvegarde de prod (section 5) : sans inscription, `migrate deploy` refuse (erreur P3005, base non vide) ; avec la copie dans l'état de la prod actuelle, contrôle d'écart à `0`, inscription, `migrate deploy` (« No pending migrations »), seed, écart final à `0`, données intactes.
> Contrôle 1 vérifié le 30/10/2026 sur une base créée à l'état `0_init` : `0` avec le schéma de 673dcd2, `2` avec le schéma actuel ; puis inscription, migration de nommage appliquée par `migrate deploy`, écart final à `0`.

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

## 5. Sauvegarde et restauration de la base

### Sauvegarder

Avant chaque mise en production (étape A), et avant toute opération sur les données :
```bash
dc exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > ~/backup-lapince-$(date +%F).sql
ls -lh ~/backup-lapince-*.sql      # le fichier du jour ne doit pas être vide
```
Le fichier est un script SQL complet (structure + données), lisible et restaurable avec `psql`. Il contient des données personnelles : il reste sur le serveur ; une copie sortie pour un test est supprimée juste après.

### Vérifier qu'une sauvegarde se restaure (sans toucher à la base de prod)

On restaure dans une base **jetable**, puis on compare le nombre de lignes de chaque table avec celui du fichier :
```bash
F=~/backup-lapince-AAAA-MM-JJ.sql
echo "CREATE DATABASE lapince_restore_check;" | dc exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
dc exec -T db sh -c 'psql -U "$POSTGRES_USER" -d lapince_restore_check -v ON_ERROR_STOP=1 -q' < "$F"
# lignes attendues, d'après le fichier :
awk '/^COPY public\./{t=$2; n=0; on=1; next} on && /^\\\.$/{print t, n; on=0; next} on{n++}' "$F"
# lignes obtenues :
echo "SELECT 'users', count(*) FROM users UNION ALL SELECT 'transactions', count(*) FROM transactions UNION ALL SELECT 'budgets', count(*) FROM budgets UNION ALL SELECT 'alerts', count(*) FROM alerts;" | dc exec -T db sh -c 'psql -U "$POSTGRES_USER" -d lapince_restore_check -At'
echo "DROP DATABASE lapince_restore_check;" | dc exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```
`ON_ERROR_STOP=1` : la restauration s'arrête à la première erreur au lieu de continuer à moitié.

> **Restaurer sur une autre machine** (ex. le poste de développement) : si le rôle PostgreSQL n'a pas le même nom (`"Lapince"` en prod, `LaPince` en dev : les guillemets rendent la casse significative), les instructions `ALTER … OWNER TO` échouent. On les retire au passage, comme l'option `--no-owner` de `pg_restore` :
> `sed -E '/^ALTER .* OWNER TO /d' "$F" | psql …`

**Testé le 30/10/2026** : sauvegarde de prod du jour restaurée sur le poste de développement, sans erreur ; nombres de lignes identiques au fichier pour les 6 tables (5 utilisateurs, 6 transactions, 2 budgets, 0 alerte, 39 catégories, 3 sessions) ; copie et base jetable supprimées ensuite.

### Restaurer la base de prod (incident)

Les mêmes commandes, sur la vraie base, API arrêtée pour qu'aucune écriture ne se mêle à la restauration :
```bash
dc stop api
echo 'DROP DATABASE "Lapince"; CREATE DATABASE "Lapince";' | dc exec -T db sh -c 'psql -U "$POSTGRES_USER" -d postgres'
dc exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -q' < ~/backup-lapince-AAAA-MM-JJ.sql
dc start api                       # migrate deploy rejoue les migrations postérieures à la sauvegarde, s'il y en a
```
Avant de lancer cette restauration réelle, vérifier le fichier par la procédure précédente (base jetable). Cette restauration réelle n'a **pas** été exécutée en prod : seule la restauration de vérification l'a été (30/10/2026) ; les commandes sont les mêmes, appliquées à la base principale.

---

## 6. Commandes utiles

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

## 7. En cas de problème

**Service qui redémarre en boucle** : `dc logs <service> --tail 50`.

**Erreur de connexion à la base** : dans `.env`, `DATABASE_URL` doit reprendre `POSTGRES_USER`, `POSTGRES_PASSWORD` et `POSTGRES_DB`, avec l'hôte `db`. Attendre que `db` soit `healthy` (`dc ps`).

**Site injoignable en HTTPS** : vérifier la date d'expiration du certificat (section 4), puis `dc logs nginx-proxy --tail 30`.

**Rebuild sans cache Docker** :
```bash
dc build --no-cache
dc up -d
```
