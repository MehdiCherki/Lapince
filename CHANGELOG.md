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

---

## [0.9.1] — 2026-10-31

### Corrigé
- **Budgets calculés sur leur période** : un budget « mensuel » portait en réalité sur toutes les dépenses de la catégorie depuis l'inscription, et finissait dépassé en permanence. Le dépassement porte maintenant sur le **mois civil en cours** (ou la semaine, du lundi au dimanche), le jour courant étant celui de Paris. Au changement de mois, l'alerte du mois précédent disparaît : les alertes sont recalculées à la lecture, sans re-notifier une alerte déjà lue. Période « custom » refusée (400) : aucune date n'est enregistrée pour la calculer. Suivi des budgets (`GET /stats/budgets`) aligné, en centimes. Tests rouges d'abord (7 unitaires sur la période, 1 sur les stats, 4 d'intégration, dont un vrai changement de mois avec une date simulée) ; contre-épreuve sur la re-notification (branche `fix/budget-period`)

---

## [0.9.0] — 2026-10-31

### Ajouté
- Documentation **sauvegarde et restauration** de la base (`docs/deploiement-serveur.md`, §5) : sauvegarde, vérification d'une sauvegarde par restauration dans une base jetable (comptage des lignes comparé au fichier), restauration sur une autre machine (rôle PostgreSQL différent), restauration de prod en cas d'incident. **Testé le 30/10/2026** avec la sauvegarde de prod du jour : restauration sans erreur, nombres de lignes identiques au fichier pour les 6 tables. Inscription de la prod aux migrations **répétée** sur cette copie : sans inscription, `migrate deploy` refuse (P3005) ; avec la copie dans l'état de la prod actuelle, aucun écart, inscription, aucune migration en attente, données intactes. Règle ajoutée : si le contrôle d'écart n'est pas à 0, STOP (branche `docs/backup-restore`)
- **Tests de sécurité des dépenses** (`tests/integration/transactions/security.test.ts`) : 401 sur les 5 routes sans session et avec 5 jetons refusés (quelconque, signé avec un autre secret, expiré, non signé `alg: none`, jeton de rafraîchissement utilisé comme jeton d'accès) ; isolation entre utilisateurs (404 en lecture, modification et suppression de la dépense d'un autre, sans rien révéler de son existence ; liste filtrée ; `userId` glissé dans la requête ignoré) ; 400 sur les entrées invalides. **Contre-épreuve** : filtre par utilisateur et contrôle d'audience retirés volontairement → 4 tests rouges (branche `fix/expense-security`)
- **Documentation des tests** (`docs/tests.md`) : stratégie (unitaires, intégration sur une vraie base, client, recette ; test rouge d'abord, contre-épreuves, témoins), lancement en local et en CI, **matrice fonctionnalités × tests** (111 tests automatisés), tableau des tests de sécurité par menace, **cahier de recette** en 9 parcours (branche `chore/tests-doc`)

### Modifié
- **Migrations de base versionnées** (Prisma Migrate) à la place de `prisma db push` : le schéma évolue par fichiers SQL datés, relus et commités (`apps/api/prisma/migrations`) ; l'API applique au démarrage les migrations non encore jouées (`prisma migrate deploy`), sans jamais deviner une modification ni demander `--accept-data-loss` (cause de l'incident de la mise en production 0.8.0). Migration initiale `0_init` générée depuis le schéma : vérifiée identique aux bases existantes (aucun écart), et testée sur une base vide (schéma complet + seed des 39 catégories, aucun écart). Bases de dev et de test inscrites (`migrate resolve --applied 0_init`). Script `test:db:push` → `test:db:setup`. ⚠️ **Déploiement** : inscrire la base de prod une seule fois avant de démarrer la nouvelle version (procédure dans `docs/deploiement-serveur.md`) (branche `feature/prisma-migrations`)
- **Nommage de la base harmonisé et montants au centime** : tables au pluriel (`category` → `categories`), colonnes en snake_case, clés étrangères `<entité>_id` (`iduser`, `idcategory`, `userId`, `id_category`… → `user_id`, `category_id`), types énumérés en snake_case ; limite des budgets (jusqu'ici nombre à virgule flottante), montants des transactions et des alertes en `DECIMAL(12, 2)`. Noms côté code et API inchangés (`@map`). Migration écrite à la main, uniquement des renommages et des changements de type (Prisma, qui ne détecte pas les renommages, aurait supprimé puis recréé les colonnes, donc perdu les données) ; testée sur une base vide, sur une copie de la base de dev (aucune ligne perdue, sommes identiques) et sur une base à l'état `0_init` (inscription, migration, aucun écart). Alertes calculées en centimes entiers : 0,10 + 0,20 ne dépasse plus une limite de 0,30 (test rouge puis vert). Client : limite reçue en texte convertie en nombre une seule fois (`toBudget`, comme `toTransaction` et `toAlert`). Procédure de mise en production 0.9.0 corrigée : le contrôle avant inscription compare la base au schéma de `0_init` (commit 673dcd2) et non au schéma actuel, qui afficherait un écart à tort ; contrôle des montants à plus de 2 décimales ajouté, vérifié sur un témoin. **Répétée sur une copie de la sauvegarde de prod du jour** (6 utilisateurs, 6 transactions, 3 budgets, 1 alerte) : contrôles à 0, `deploy` sans inscription refusé (P3005), inscription, migration appliquée, empreinte du contenu de chaque table identique avant et après, sommes identiques, aucun écart final. Montants validés à l'entrée de l'API : au plus 2 décimales et moins de 10 milliards, sinon 400 avec le message sous le champ (avant : erreur 500 en base, ou arrondi sans prévenir) (branche `feature/db-naming-decimal`)
- **Lint du client à 0 problème** (2 erreurs `react-hooks/set-state-in-effect`, 1 avertissement) : vérification d'email, état d'erreur déduit dès le premier affichage quand le lien n'a pas de jeton (plus de mise à jour d'état dans l'effet), jeton encodé dans l'URL ; tableau de bord, état mis à jour dans le `.then` du chargement. Comportement figé avant la modification par 3 tests de la page de vérification (branche `chore/client-lint`)

### Corrigé
- Saisie des centimes impossible sur l'accueil (dépense, revenu, budget) : sans `step`, un champ numérique n'accepte que des entiers et le navigateur bloquait l'envoi ; champs montant en `step="0.01"` (branche `feature/db-naming-decimal`)
- **Dépenses, budgets et alertes toujours cohérents** : chaque écriture (dépense ou budget : création, modification, suppression) et le recalcul des alertes des catégories touchées se font dans **une seule transaction** (`prisma.$transaction`) : tout est enregistré, ou rien. Avant, une alerte en échec laissait la dépense enregistrée alors que l'utilisateur recevait une erreur. **Requêtes simultanées** : un verrou par utilisateur et par catégorie (`pg_advisory_xact_lock`, libéré à la fin de la transaction) les fait passer l'une après l'autre ; avant, 8 dépenses envoyées en même temps créaient 2 à 4 alertes pour une même catégorie, au lieu d'une. Catégories verrouillées par ordre croissant (pas d'interblocage). Vérification « un budget par catégorie » faite sous ce verrou. Modification d'une transaction filtrée aussi par utilisateur (`where: { id, userId }`). Recalcul des alertes déplacé des contrôleurs vers les services. 2 tests d'intégration rouges puis verts (atomicité sur un vrai débordement de montant, concurrence) (branche `feature/expense-alert-transaction`)
- Identifiants d'URL lus strictement (`parseId`, transactions, budgets, catégories) : `parseInt` devinait (`/budgets/12abc` → budget 12, `1.5` → 1) et un nombre trop grand pour un `INTEGER` faisait échouer la requête en base (500) ; maintenant 400. Catégorie inexistante à la création ou à la modification d'une dépense ou d'un budget : 400 « Catégorie introuvable » au lieu de 500 (erreur de clé étrangère) ; vérifiée après le contrôle de propriété (la dépense d'un autre reste un 404) (branche `fix/expense-security`)
- `package-lock.json` du client désynchronisé de `package.json` (`@fontsource/afacad` absent) : `npm ci` refusait l'installation, et les images Docker (`npm install`) installaient une version non figée. Lock régénéré sans rien installer (`npm install --package-lock-only`), seule cette police ajoutée ; trouvé par la répétition locale de la CI (branche `chore/ci`)

### Infra
- **Intégration continue GitHub Actions** (`.github/workflows/ci.yml`) sur chaque pull request : formatage (Prettier, version figée, tout le dépôt) ; API (`npm ci`, client Prisma, types, tests unitaires, migrations + seed sur une base PostgreSQL 17 jetable, tests d'intégration, build) ; client (`npm ci`, lint, tests, types et build) ; construction des images de production. Permissions en lecture seule, exécution précédente annulée à chaque nouveau push. **Répétée en local avant le premier push** (mêmes étapes dans des conteneurs jetables) : les 4 jobs verts. Fichiers `docker-compose*.yml` exclus de Prettier (commentaires alignés à la main) ; `eslint.config.js` et `index.html` formatés (branche `chore/ci`)
- **Dépôt rendu public, branches `dev` et `main` protégées** : PR obligatoire, merge refusé tant que tous les jobs de la CI ne sont pas verts (rattachés à GitHub Actions), règle appliquée aussi aux administrateurs, ni force-push ni suppression. Avant la publication : audit des secrets de tout l'historique (gitleaks sur les 68 branches + recherches ciblées) ; aucun secret de production n'a jamais été commité (vérifié par comparaison d'empreintes, sans afficher les valeurs). README corrigé : il annonçait une protection et une approbation obligatoires qui n'existaient pas (branche `chore/branch-protection-docs`)
- **Script de déploiement** (`deploy/deploy.sh`) : préconditions → sauvegarde vérifiée → `git pull --ff-only` → build → inscription aux migrations (une seule fois, avec les contrôles de la 0.9.0) → redémarrage (attente de « Server started ») → rechargement de nginx (incident 502 de la 0.8.0) → contrôles (services, schéma, site 200, API 401). Arrêt à la première erreur avec les commandes de retour arrière ; `--check` (sans rien modifier), `--redeploy` ; journal dans `~/deploy-logs/`. Lu en entier avant exécution (le `git pull` peut modifier le script en cours de route). **Testé sans serveur** (`deploy/deploy.test.sh`) : doubles de `git`, `docker` et `curl`, 17 scénarios, 57 vérifications ; contre-épreuve : 4 sabotages, tous détectés. Nouveau job de CI : ShellCheck + ces tests, ajouté aux contrôles obligatoires de `dev` et `main`. `docs/deploiement-serveur.md` §2 réécrite autour du script, procédure manuelle complétée (rechargement de nginx, contrôle du schéma, sauvegarde horodatée à la minute). `*.sh` en fins de ligne LF (branche `feature/deploy-script`)

---

## [0.8.0] — 2026-10-30

### Ajouté
- **Mot de passe oublié** : lien sur la page de connexion → `/forgot-password` (réponse identique que le compte existe ou non, pour ne pas révéler les emails inscrits) → email avec un lien `/reset-password` valable **30 minutes** et à **usage unique** → nouveau mot de passe (règles habituelles, œil, gestionnaires de mots de passe) → **toutes les sessions fermées**. Seul le **hash SHA-256** du jeton est stocké en base (`passwordResetTokenHash`, `passwordResetExpiresAt`) ; envois limités à 5 par heure. 5 tests d'intégration (email inconnu, hash en base, réinitialisation + sessions fermées + usage unique, lien expiré, mot de passe faible) (branche `feature/forgot-password`)

### Modifié
- Code formaté avec Prettier (réglages par défaut, fins de ligne `auto`), aucun changement de comportement ; le commit de formatage est ignoré par `git blame` via `.git-blame-ignore-revs` (branche `chore/prettier`)
- Arborescence : `src/` renommé en `apps/` (`apps/api`, `apps/client`), `Documents/` en `docs/` ; README avec la structure du projet, les bonnes commandes de lancement et les branches `dev` / `feature/` ; `docs/deploiement-serveur.md` réécrit pour le vrai serveur (`/opt/lapince`, deploy key en lecture seule, certificats en mode webroot, procédure de mise en prod et de retour arrière) ; `COMPOSE_PROJECT_NAME` ajouté à `.env.example`, car il fixe le nom du volume de la base (branche `chore/monorepo-layout`)
- API : tout le code dans `apps/api/src/` (fin du `src/…/src`), requêtes manuelles `.http` dans `apps/api/http/` ; `index.ts` découpé en `app.ts` (l'application, importée par les tests sans ouvrir de port) et `server.ts` (le démarrage) ; compilation de prod via `tsconfig.build.json`, sans les fichiers de test, point d'entrée `dist/server.js` ; `access.controller.middleware.ts` → `auth.middleware.ts`, `alert.generator.ts` → `alert.service.ts` ; imports relatifs en `.ts` partout (branche `chore/api-structure`)
- Tests de l'API : tests d'intégration rangés dans `apps/api/tests/integration/<domaine>/`, helpers et setup partagés (fin des copies dans chaque fichier : −347 lignes), projets Vitest `unit` et `integration` lançables séparément (`npm run test:unit`, `npm run test:integration`). Les tests d'intégration tournent sur une base dédiée `lapince_test` (`DATABASE_URL_TEST`), avec un garde-fou qui refuse toute autre base ; le mock du mailer et le garde-fou ont chacun un test témoin (branche `chore/api-tests`)
- Client : alias `@/` pour les imports (plus de `../../`) ; pages rangées une par dossier avec leurs propres composants (`pages/Accueil/components/`, `pages/Dashboard/components/`…), composants partagés dans `components/layout`, `components/ui`, `components/alerts` ; noms de fichiers cohérents (`LoginPage.tsx`, `LandingPage.tsx`, `Footer.tsx`, `userApi.ts`) ; `useAuth` dans `hooks/useAuth.ts` et contexte dans `context/auth.ts` (le rechargement à chaud de Vite fonctionne à nouveau sur `AuthContext.tsx`) ; setup et données de test dans `src/test/` ; les tests sont maintenant vérifiés par `tsc`, y compris au build de prod (branche `chore/client-structure`)
- Types : plus aucun `any` dans le code (API et client) ; API : types d'entrée déduits des schémas Zod, types partagés dans `src/types/`, modèles importés uniquement depuis `@prisma/client` ; client : un seul endroit par type (`src/types/`, dont `api.ts` pour `ApiError` et `Paginated<T>`), les services n'exportent plus de types, unions `CategoryType` / `BudgetPeriod` définies une fois ; `Category` aligné sur le JSON de l'API (`createdAt` / `updatedAt`) ; code mort supprimé (`ForbidenError`, `fetchBudgetStatus` qui appelait une route inexistante, `fetchCategoryById`, `markAllAlertsAsRead`, `load` de `useTransactions`, `global.d.ts`). Seul effet observable : un `PATCH /transactions/:id` contenant `budgetId` (champ que le client n'envoie jamais et qui n'existe pas sur une transaction) répondait 500, il est maintenant ignoré (branche `chore/types`)

### Corrigé
- Interface : le **logo est cliquable** sur toutes les pages (retour à l'accueil connecté, ou à l'accueil public) — composant `Logo` partagé au lieu de 18 images recopiées ; page de connexion sur écran moyen : l'accroche ne passe plus sous la carte (affichée à partir de 1280 px, comme sur l'inscription) ; `/verify-email` avec un lien invalide : le texte oriente vers la connexion ou « Mot de passe oublié » (qui active aussi le compte) au lieu de « Inscrivez-vous à nouveau », impossible avec un email déjà pris. 2 tests (branche `fix/ux-polish`, anomalies R10, R12, R3)
- Intitulé des transactions **facultatif partout** (décision du 30/10) : avant, obligatoire à la création mais effaçable à la modification, et affiché comme une ligne vide sur l'accueil ou « Transaction » sur le tableau de bord. Un intitulé absent, vide ou fait d'espaces est enregistré `null`, et la transaction s'affiche sous le **nom de sa catégorie**, sur les deux pages (`transactionLabel`). Test d'intégration rouge avant (`'   '` enregistré tel quel) + 2 tests unitaires (branche `fix/optional-description`, anomalie R6)
- Ordre des transactions stable : celles d'un même jour (saisie au jour, donc même date) changeaient de place après une modification, et la pagination pouvait en répéter ou en sauter une. L'API et la liste de l'accueil départagent maintenant par id décroissant (même cause que l'ordre des catégories). Test d'intégration rouge avant (`[35, 36, 34]` au lieu de `[36, 35, 34]`) + 2 tests unitaires du tri (branche `fix/transaction-order`, anomalie R5)
- Messages d'erreur explicites : l'API répondait « Données invalides » à toute erreur de validation (8 endroits) ; elle renvoie maintenant le **message de la règle** (ex. « Le mot de passe doit contenir au moins une lettre majuscule ») et le **champ en cause**, affiché sous ce champ ; messages par défaut de Zod en français. Inscription : les erreurs sans champ (trop de tentatives, serveur injoignable) s'affichent enfin, et la **confirmation du mot de passe est vérifiée** (une faute de frappe créait un compte au mot de passe inconnu). 4 tests d'intégration + 3 tests du formulaire, rouges avant (branche `fix/validation-messages`, anomalies R1, R2, R9, R13)
- Emails insensibles à la casse : enregistrés et comparés **en minuscules, sans espaces** (inscription, connexion, mot de passe oublié, profil). Avant, `Cherki@…` ne pouvait pas se connecter si le compte était `cherki@…`, et pouvait créer un **second compte**. 4 tests d'intégration (rouges avant). ⚠️ **Déploiement** : lancer d'abord `apps/api/prisma/normalize-emails.sql` sur la base de prod (contrôle des doublons, puis mise en minuscules des emails existants) (branche `fix/email-normalization`, anomalie R4)
- **Sécurité** — Paramètres : changer de mot de passe ou d'email exige maintenant le **mot de passe actuel** (auparavant une session ouverte suffisait : un ordinateur laissé allumé permettait de prendre le contrôle du compte). Après un changement de mot de passe, **toutes les sessions sont fermées** et l'utilisateur se reconnecte. Mot de passe actuel manquant → 400, erroné → 403 (et non 401, que le client traite comme une session expirée). 5 tests d'intégration, rouges avant la correction (branche `fix/profile-reauth`, anomalie R8 de la recette du 30/10)
- Paramètres : la confirmation et le message de succès utilisaient les fenêtres natives du navigateur (« localhost:8080 indique ») ; remplacées par la fenêtre de confirmation de l'application et un bandeau de succès (anomalie R7, branche `fix/profile-reauth`)
- Montants reçus en texte : les montants des transactions et les dépassements des alertes (`Decimal` en base) arrivaient dans le navigateur sous forme de texte (`"150"`) alors que le client les typait en nombres ; un calcul sans conversion pouvait donner `"100" + "50" = "10050"`. Conversion unique à l'entrée des services (`toTransaction`, `toAlert`), types `TransactionResponse` / `AlertResponse` pour la forme brute, conversions manuelles dispersées supprimées ; 4 tests (rouges avant la correction). Affichage inchangé (branche `fix/decimal-amounts`)
- Catégories affichées dans le désordre (revenus : « Prestations, Remboursements, Autres revenus, Salaire… ») : l'API ne précisait pas d'ordre, et PostgreSQL renvoyait l'ordre physique des lignes, modifié par les mises à jour. Liste triée par id, donc dans l'ordre du seed, et test d'intégration ajouté (branche `fix/category-order`)
- **Confidentialité** — après une déconnexion, le bouton « Précédent » pouvait réafficher un écran privé figé (budgets, transactions) conservé par le navigateur (cache précédent/suivant). Les pages HTML sont maintenant servies en `Cache-Control: no-store` (nginx, images et assets toujours en cache), et une page malgré tout restaurée est rechargée, ce qui revérifie la session (branche `fix/logout-bfcache`, anomalie R11 de la recette du 30/10 ; même en-tête sur le serveur de dev Vite, branche `fix/dev-no-store`)

### Supprimé
- `package.json` et `package-lock.json` à la racine (jamais installés) et `Caddyfile` (remplacé par nginx-proxy + certbot)

---

## [0.7.0] — 2026-10-28

### Ajouté
- Logs structurés avec pino : JSON en production, lisibles en couleur en développement, corps des requêtes masqué dans les logs d'erreur (branche `fix/logger-pino`)
- Tests d'intégration du rate limit de l'inscription et de l'isolation des budgets entre utilisateurs, tests unitaires du générateur d'alertes de budget ; l'envoi d'emails est simulé dans les tests, aucun vrai email ne part (branche `test/alert-generator`)
- Un seul budget par catégorie et par utilisateur : contrainte d'unicité en base, réponse `409` avec un message clair à la création ou au déplacement d'un budget, message affiché dans le formulaire. Règle imposée par le modèle : une alerte est rattachée à une catégorie, pas à un budget (PR #10, branche `feature/one-budget-per-category`)
- Tableau de bord : modifier la limite d'un budget (modale) ou le supprimer (avec confirmation) depuis l'historique des budgets ; boutons accessibles aux lecteurs d'écran, messages d'erreur de l'API affichés dans les modales (PR #11, branche `feature/budget-edit-delete`)

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
- Le build du front échouait sur une variable inutilisée dans la page d'inscription (`tsc -b`) (PR #10)
- Tableau de bord : la popup d'alerte de budget ne s'affichait jamais (les alertes étaient chargées dans une copie du hook que personne n'affichait) ; une alerte disparue ne reste plus affichée, sur l'accueil comme sur le tableau de bord (PR #11, branche `feature/budget-edit-delete`)
- `deleteBudget` (front) levait une erreur sur la réponse `204` alors que la suppression avait réussi ; `updateBudget` annonçait un tableau au lieu d'un budget (PR #11, branche `feature/budget-edit-delete`)
- Session limitée à 45 minutes : le front rafraîchit maintenant le jeton d'accès automatiquement. Sur un `401`, `apiFetch` appelle `/auth/refresh` puis rejoue la requête une fois ; plusieurs `401` simultanés partagent un seul refresh (indispensable avec la rotation des refresh tokens), y compris au démarrage de l'app ; si le refresh échoue, retour à l'accueil public. Avant, passé 45 min, toutes les actions échouaient en silence (branche `fix/session-refresh`)
- Cookies de session : `sessionExists` vit 7 jours comme le refresh token (au lieu de 45 min, ce qui empêchait de rester connecté après un rechargement) ; le cookie `refreshToken` vise `/api/auth/refresh` en dev comme en prod (en dev, le navigateur ne l'envoyait jamais) (branche `fix/session-refresh`)
- Accueil : une suppression ou une modification de transaction qui échoue affiche un message d'erreur au lieu d'échouer en silence (PR #13, branche `fix/front-transactions`)
- Modifier une transaction échouait (`400`) quand seule la description changeait, ou pour une transaction sans description : le montant partait en texte et `null` était refusé par l'API (PR #13)
- Tableau de bord : la recherche, les filtres et les totaux filtrés ne portaient que sur les 20 dernières transactions ; toutes les transactions sont maintenant chargées (PR #13)
- Rate limit en production : derrière les deux proxys nginx, l'API voyait tous les visiteurs avec la même adresse IP (celle de `nginx-proxy`), donc les limites de connexion, d'inscription et de refresh étaient communes à tout le site (par exemple 10 connexions par 15 min pour tout le monde). L'API fait maintenant confiance aux adresses privées du réseau Docker et retrouve la vraie IP du visiteur, sans qu'il puisse en inventer une (branche `fix/trust-proxy`)

### Supprimé
- Variables d'environnement héritées du template O'Clock et jamais utilisées (`FILES_*`, `ADMINER_*`, `PROXY_*`, `LOGS_*`)

### Infra
- Nodemailer mis à jour en v9
- Doc de déploiement : variables SMTP et `FRONTEND_URL` ajoutées, `ALLOWED_ORIGINS` pointe sur `https://mehdicherki.fr`
- Docker (dev) : Prisma Studio tourne sur l'image de l'API au lieu d'installer ses dépendances dans le dossier du projet ; le watch synchronise aussi `services/`, `validators/` et `models/` (PR #6, branche `chore/docker-studio-api-image`)
- ⚠️ Déploiement : la contrainte d'unicité des budgets doit être appliquée à la main en prod (`prisma db push --accept-data-loss` après vérification des doublons), le `db push` du démarrage ne le fait pas
- Prod (28/10/2026) : le certificat HTTPS avait expiré le 14/08/2026 sans jamais être renouvelé (site inaccessible). Cause : certificat obtenu en mode `standalone`, incompatible avec nginx qui occupe le port 80. Renouvelé en mode `webroot` (valide jusqu'au 26/01/2027) ; la configuration de renouvellement automatique utilise désormais ce mode (`authenticator = webroot`)
- Prod : nginx-proxy recharge sa configuration toutes les 6 h pour servir le certificat renouvelé par certbot (sinon il garde l'ancien en mémoire jusqu'à son expiration) ; `restart: unless-stopped` ajouté à `api` et `certbot`, qui ne redémarraient pas après un redémarrage du serveur (branche `fix/nginx-cert-reload`)

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
