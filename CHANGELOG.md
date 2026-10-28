# Changelog

Toutes les modifications notables de ce projet sont documentées ici.

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)

---

## Comment mettre à jour ce fichier

> **Règle** : chaque PR mergée dans `main` ou `dev` doit ajouter une entrée ici avant le merge.

### 1. Ajouter une version

Copie ce bloc en haut de la section `## [Non publié]` et remplis-le :

```markdown
## [0.x.0] — AAAA-MM-JJ

### Ajouté
- Description courte de la fonctionnalité (branche `feature/xxx`)

### Modifié
- Ce qui a changé dans du code existant

### Corrigé
- Bug résolu + contexte court


### Supprimé
- Ce qui a été retiré
```

### 2. Catégories disponibles

| Catégorie | Usage |
|-----------|-------|
| `Ajouté` | Nouvelle fonctionnalité |
| `Modifié` | Changement dans du code existant |
| `Corrigé` | Correction de bug |
| `Supprimé` | Retrait de code ou de fichier |
| `Infra` | Docker, CI, config, scripts |

### 3. Bonnes pratiques

- Une entrée = une phrase, du point de vue **utilisateur/développeur** (pas du commit)
- Ne pas recopier les messages de commit verbatim — synthétise
- Mentionner la branche source entre parenthèses si utile
- Ne pas toucher aux versions déjà publiées (sauf typo)

---

## [Non publié]

### Ajouté
- Logs structurés avec pino : JSON en production, lisibles en couleur en développement, corps des requêtes masqué dans les logs d'erreur (branche `fix/logger-pino`)
- Tests d'intégration du rate limit de l'inscription et de l'isolation des budgets entre utilisateurs, tests unitaires du générateur d'alertes de budget ; l'envoi d'emails est simulé dans les tests, aucun vrai email ne part (branche `test/alert-generator`)
- Un seul budget par catégorie et par utilisateur : contrainte d'unicité en base, réponse `409` avec un message clair à la création ou au déplacement d'un budget, message affiché dans le formulaire. Règle imposée par le modèle : une alerte est rattachée à une catégorie, pas à un budget (branche `feature/one-budget-per-category`)

### Modifié
- Connexion multi-appareils : se connecter sur un nouvel appareil ne déconnecte plus les autres (une session par appareil, 5 maximum par utilisateur, refresh token renouvelé à chaque utilisation) ; la déconnexion ferme toujours toutes les sessions (branche `feat/multi-session`)
- CORS : l'API autorise la liste de domaines `ALLOWED_ORIGINS` au lieu d'une seule origine (`CORS_ORIGIN`, supprimée)
- Inscription avec un email déjà utilisé : la réponse `409` est conservée volontairement, l'énumération des comptes étant freinée par le rate limit de l'inscription
- `.env.example` à jour : ajout de `FRONTEND_URL`, `SMTP_USER` et `SMTP_PASS`, `JWT_SECRET` laissé vide au lieu d'un texte d'exemple utilisable tel quel

### Corrigé
- Sécurité : la connexion vérifie le mot de passe avant le statut « email vérifié », on ne peut plus savoir qu'un compte non vérifié existe sans connaître son mot de passe
- Sécurité : rate limit sur l'inscription (5 par heure et par IP) et sur le rafraîchissement de session (30 par 15 min)
- Le build Docker de production échouait sur une erreur TypeScript dans la configuration du logger
- Le test d'inscription existant ne correspondait plus à la réponse de l'API depuis la vérification d'email
- Alertes de budget : l'alerte disparaît quand les dépenses repassent sous la limite (suppression ou modification d'une transaction, changement de catégorie) au lieu de rester affichée indéfiniment (PR #7, branche `fix/stale-budget-alert`)
- Alertes de budget : le montant d'une alerte non lue est mis à jour quand le dépassement change (PR #8, branche `fix/alert-unread-amount`)
- Alertes de budget : modifier la limite d'un budget, le déplacer vers une autre catégorie ou le supprimer recalcule l'alerte (elle apparaît, se met à jour ou disparaît) (PR #9, branche `fix/budget-alert-recalc`)

### Supprimé
- Variables d'environnement héritées du template O'Clock et jamais utilisées (`FILES_*`, `ADMINER_*`, `PROXY_*`, `LOGS_*`)

### Infra
- Nodemailer mis à jour en v9
- Doc de déploiement : variables SMTP et `FRONTEND_URL` ajoutées, `ALLOWED_ORIGINS` pointe sur `https://mehdicherki.fr`
- Docker (dev) : Prisma Studio tourne sur l'image de l'API au lieu d'installer ses dépendances dans le dossier du projet ; le watch synchronise aussi `services/`, `validators/` et `models/` (PR #6, branche `chore/docker-studio-api-image`)
- ⚠️ Déploiement : la contrainte d'unicité des budgets doit être appliquée à la main en prod (`prisma db push --accept-data-loss` après vérification des doublons), le `db push` du démarrage ne le fait pas

---

## [0.6.0] — 2026-05-17

Mise en production sur `mehdicherki.fr`.

### Ajouté
- Vérification de l'adresse email à l'inscription : un lien de confirmation est envoyé par email (Nodemailer, SMTP Brevo) et la connexion est refusée tant qu'il n'a pas été cliqué (PR #4, branche `Nodemailer`)
- Middleware d'erreurs centralisé : toutes les erreurs de l'API renvoient un JSON homogène (PR #2, branche `ErrorMiddlewareBugFixes`)
- Rate limit sur la connexion : 10 tentatives par 15 min et par IP
- Page 404
- `robots.txt`, titre de page et langue `fr`, nouveau favicon, police Afacad servie localement

### Modifié
- Après l'inscription, l'utilisateur n'est plus connecté automatiquement : il doit d'abord confirmer son email
- Les contrôleurs de l'API ne gèrent plus les erreurs un par un : elles remontent au middleware d'erreurs
- Améliorations UI/UX : mise en page, footer, page d'accueil, affichage des catégories

### Corrigé
- Alertes de budget : l'alerte est aussi vérifiée à la création d'un budget, pas seulement à l'ajout d'une transaction (PR #3, branche `AlertSystemFix`)
- Les emails de vérification ne partaient pas en production : variables SMTP et `FRONTEND_URL` absentes de `docker-compose.prod.yml`
- Derrière le reverse proxy, l'API voit la vraie IP des visiteurs (`trust proxy`), indispensable au rate limit par IP
- Le message de confirmation d'inscription disparaissait au bout de 3 s, trop vite pour être lu : il reste maintenant 10 s
- Erreur TypeScript (`fetchPriority`) qui bloquait le build

### Supprimé
- Route `GET /budgets/:id/status` et lien direct entre une transaction et un budget, remplacés par le calcul par catégorie du générateur d'alertes

### Infra
- Reverse proxy Nginx avec certificats SSL Let's Encrypt renouvelés automatiquement par Certbot, redirection HTTP → HTTPS et `www` → domaine principal, HSTS (essai de Caddy abandonné)
- Content Security Policy du client corrigée après la mise en ligne

---

## [0.5.0] — 2026-05-13

Fonctionnalités principales de l'application, développées en équipe.

### Ajouté
- Connexion : page de login, contexte d'authentification, routes privées, JWT en cookie httpOnly avec refresh token, déconnexion, route `/users/me`
- Catégories de dépenses et de revenus, avec icônes et catégories par défaut créées au démarrage
- Transactions : API complète (création, lecture, modification, suppression, validation Zod), cartes Dépenses / Revenus et liste des transactions avec filtre par catégorie et recherche
- Budgets par catégorie, créés depuis la carte Budget, et historique des budgets sur le dashboard
- Alertes de dépassement de budget : génération automatique, marquer comme lue, tout marquer comme lu, suppression
- Dashboard : statistiques et graphique mensuel
- Page Paramètres : profil et avatar
- Mentions légales, choix d'avatar, fond animé
- Document de déploiement serveur

### Corrigé
- Bouton « afficher le mot de passe » inutilisable sur mobile
- Rafraîchissement de session : plantage quand aucun cookie n'est envoyé, chemin du cookie de refresh incorrect derrière le proxy Nginx
- Création des catégories par défaut rendue idempotente (plus de doublons au redémarrage)
- Erreurs TypeScript qui bloquaient le build Docker ; fichiers de test exclus du build de production

### Infra
- Configuration de production (Dockerfiles et `docker-compose.prod.yml`)
- En-têtes de sécurité Nginx pour Mozilla Observatory : HSTS, CSP sans `unsafe-inline`, Permissions-Policy
- Au démarrage, l'API synchronise le schéma (`prisma db push`) et recrée les données de base (seed)

---

## [0.4.0] — 2026-04-27

### Infra
- Ajout de `api.dev.Dockerfile` et `client.dev.Dockerfile` : Dockerfiles dédiés au développement, qui lancent `tsx --watch` (API) et `vite --host` (client) au lieu de compiler pour la production
- Configuration de `develop.watch` dans `docker-compose.yml` : synchronisation automatique des fichiers source dans les conteneurs sans rebuild complet
- Ajout de `server.usePolling: true` dans `vite.config.ts` : correction du hot reload sur Windows (Docker ne propage pas les événements inotify natifs)
- Port du client en dev changé de `80` (nginx) à `5173` (Vite dev server)
- Ajout de commentaires détaillés dans `docker-compose.yml`

---

## [0.3.0] — 2026-04-27

### Ajouté
- Connexion complète front ↔ back sur la page d'inscription : le formulaire appelle `POST /auth/register` et redirige en cas de succès (branche `dev-connectBackFront`)
- Mise à jour de `.env.exemple` avec toutes les variables nécessaires

### Corrigé
- Correction de la configuration Docker après la connexion back/front

---

## [0.2.0] — 2026-04-24

### Ajouté
- Page d'inscription complète avec mise en page responsive mobile/desktop (images, couches couleur, logo, footer)
- Composant `RegisterForm.tsx` : champs prénom, nom, e-mail, mot de passe, confirmation — avec accessibilité (`aria-invalid`, `role="alert"`)
- Gestion de la photo de profil : input file caché + aperçu en temps réel
- Service `authApi.ts` : fonction `registerUser()` appelant `POST /auth/register`
- Utilitaire `cn()` (`clsx` + `tailwind-merge`) pour composer les classes Tailwind conditionnellement
- Typage `ImportMetaEnv` pour `VITE_API_BASE_URL` dans `vite-env.d.ts`
- Regex de validation mot de passe côté back (Zod) et côté front
- Spinner `Loader2` (lucide-react) pendant la soumission du formulaire

### Modifié
- `vite.config.ts` : ajout du plugin `@tailwindcss/vite`
- `index.css` : suppression des styles de démo Vite, reset minimal + imports Tailwind
- `nginx.conf` : ajout du bloc `location /api/` pour proxifier vers le service `api` (correction erreur 405 sur les requêtes POST)
- `RegisterPage.tsx` : intégration du composant `RegisterForm` avec props `isLoading` et `error`

### Corrigé
- Accolade manquante dans `RegisterPage` (commit `acbbb52`)
- Props `isLoading` et `error` absentes sur `RegisterForm` (commit `8be4250`)
- Erreur 405 sur `POST /api/auth/register` : proxy nginx manquant

### Supprimé
- `App.tsx` : boilerplate Vite de démo (compteur, liens React/Vite) — le routing est géré par `router/index.tsx`

---

## [0.1.0] — 2026-04-22 / 2026-04-23

### Ajouté
- Structure initiale du projet : API Express + client React/Vite + PostgreSQL via Docker Compose
- Schéma Prisma, migration et seeding de la base de données
- Route `POST /auth/register` : controller, validation Zod, hashage argon2, insertion en BDD
- Intégration de Prisma Studio dans `docker-compose.yml` (accessible sur `http://localhost:5555`)
- Modèle de Pull Request avec bonnes pratiques (template GitHub)
- README avec commandes d'installation

### Infra
- Refactorisation du `docker-compose.yml` : système de variables d'environnement via `.env`
- Port du client configurable via `CLIENT_LOCAL_PORT` dans `.env`
- Ajout d'OpenSSL dans `api.Dockerfile` (requis par Prisma)
- `.env` retiré du suivi git (`.gitignore`)
- `.env.exemple` ajouté comme référence

---

## [0.0.1] — 2026-04-21

### Ajouté
- Premier commit : setup Docker (API + client + Postgres), installation des dépendances, création du schéma Prisma
