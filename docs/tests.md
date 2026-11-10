# Tests — La Pince

Ce document décrit comment l'application est testée : la stratégie, la façon de lancer les tests, ce que chaque test couvre (matrice), les tests de sécurité et le cahier de recette.

**État au 10/11/2026 (0.9.7)** : 180 tests automatisés de l'application et 30 scénarios du script de déploiement, tous verts, lancés sur chaque pull request par la CI.

| Ensemble | Outil | Tests |
|---|---|---|
| API — unitaires (dont fuzzing) | Vitest + fast-check | 25 |
| API — intégration (dont sécurité et fuzzing) | Vitest + Supertest + PostgreSQL + Redis | 104 |
| Client — composants, services, fonctions | Vitest + Testing Library (jsdom) | 51 |
| Script de déploiement | Bash, doubles de `git`, `docker` et `curl` | 30 scénarios (102 vérifications) |
| Recette (tests d'acceptation) | navigateur, cahier ci-dessous | 9 parcours |
| Charge | k6, image de production de l'API, en local | 2 scénarios |

---

## 1. Stratégie

| Niveau | Ce qu'il vérifie | Pourquoi ce niveau |
|---|---|---|
| **Unitaire (API)** | une règle de calcul isolée : dépassement de budget, période d'un budget, statistiques. Prisma est remplacé par un double (`vi.mock`) | rapide, et chaque cas limite (0,10 + 0,20 = 0,30) se teste sans base |
| **Intégration (API)** | une route HTTP de bout en bout : requête → validation → service → **vraie base PostgreSQL** → réponse | c'est là que se jouent les contraintes de la base, les transactions, l'authentification et l'isolation entre utilisateurs |
| **Client** | un composant ou un service : affichage, conversion des montants, rafraîchissement de session | le comportement visible sans lancer de navigateur |
| **Recette** | un parcours utilisateur complet, dans le navigateur | ce qu'aucun test automatisé ne voit : mise en page, enchaînement des écrans, messages |

**Règles appliquées à chaque correctif** :
- **Test rouge d'abord** : le test reproduit le défaut et échoue, puis le correctif le fait passer. Un test écrit après coup peut passer sans rien prouver.
- **Contre-épreuve** pour un test vert dès le départ (comportement déjà correct) : on casse volontairement le code protégé, le test doit devenir rouge. Exemple : en retirant le filtre par utilisateur et le contrôle d'audience des jetons, 4 tests de sécurité échouent (section 4).
- **Témoins** : chaque garde-fou des tests a été vérifié dans les deux sens (le mock du mailer est bien appelé ; la suite refuse de démarrer sur une autre base que `*_test`).

**Isolation des tests d'intégration** :
- base dédiée `lapince_test`, jamais la base de dev : la suite refuse de démarrer si `DATABASE_URL` ne contient pas `_test` ([tests/setup/integration.ts](../apps/api/tests/setup/integration.ts)) ;
- mêmes comptes qu'en production : la suite se connecte avec `lapince_app`, le rôle de l'API (lecture et écriture des données, aucun DDL), ce qui prouve que l'application fonctionne avec ce moindre privilège ; migrations et seed de la base de test passent par `lapince_owner` (`MIGRATION_DATABASE_URL_TEST`). Le nettoyage entre les tests se fait par `DELETE`, sans `TRUNCATE` ni DDL : aucun droit supplémentaire n'est nécessaire ;
- aucun email réel : le transporteur SMTP est remplacé par un double dans tous les fichiers ;
- chaque fichier supprime les comptes qu'il a créés (et leurs données, en cascade) ;
- emails de test uniques (horodatés) : les fichiers ne se gênent pas entre eux ;
- compteurs du limiteur dans un vrai Redis, sous un préfixe tiré au hasard pour chaque fichier (`rl:test:<uuid>:`, [tests/setup/rate-limit-prefix.ts](../apps/api/tests/setup/rate-limit-prefix.ts)) : les fichiers tournent en parallèle depuis la même adresse sans partager de compteur ; les clés expirent seules, aucune suppression (jamais de `FLUSHALL`).

---

## 2. Lancer les tests

### En local (Docker)

```bash
docker compose exec api npm run test:unit          # API : unitaires (sans base)
docker compose exec api npm run test:integration   # API : intégration, sur lapince_test
docker compose exec client npm test                # client
```

Base de test, une seule fois, puis après chaque nouvelle migration :
```bash
echo "CREATE DATABASE lapince_test;" | docker compose exec -T db sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB'
docker compose exec -T db sh -c 'psql -X -U "$POSTGRES_USER" -d lapince_test' < db/roles.sql   # comptes et droits (une fois)
docker compose exec api npm run test:db:setup      # migrations + seed des catégories (rôle lapince_owner)
```

Les tests d'intégration utilisent aussi Redis (service `redis`, `REDIS_URL` et `REDIS_PASSWORD` du conteneur `api`), sous leurs propres préfixes : ils ne touchent pas aux compteurs du développement.

Le code est copié dans l'image au build : après une modification, `docker compose up -d --build api` (ou `client`) avant de relancer les tests, ou `docker compose watch` pendant le développement.

### Test de charge

En local seulement, jamais en production : l'**image de production** de l'API sur une base jetable `lapince_load_test` et un Redis jetable, et k6 1.4.0 ([apps/api/tests/load](../apps/api/tests/load)). Deux scénarios successifs de 70 s (montée à 50 utilisateurs virtuels, palier, descente), une seule session :

| Scénario | Ce qu'il éprouve | Requêtes | Erreurs | Latence médiane | p95 | p99 |
|---|---|---|---|---|---|---|
| `meme_categorie` | pire cas du verrou : 50 ajouts simultanés sur la **même** catégorie, au budget dépassé | 6 170 dépenses | 0 | 529 ms | 825 ms | 849 ms |
| `categories_differentes` | usage courant : chacun sur sa catégorie | 59 519 dépenses | 0 | 57 ms | **62 ms** | 65 ms |

Mesure du 10/11/2026 sur le poste de développement (Docker Desktop, Windows 11). Seuils : moins de 1 % d'erreurs et tous les contrôles verts dans les deux scénarios ; p95 sous 500 ms pour l'usage courant. Tous respectés.

Rejoué le 09/11/2026 avec Redis (0.9.6 : image de production, Redis jetable lancé par le même script qu'en production) : 63 143 requêtes, 0 erreur, tous les contrôles verts ; p95 de 65 ms pour l'usage courant, 851 ms pour le pire cas. Résultats équivalents : ces routes ne passent pas par le limiteur, seule la connexion initiale l'utilise.

- **Exactitude sous charge** : à la fin, une seule alerte, au dépassement exact au centime (6 160,00 € = 6 170 dépenses de 1 € − 10 € de budget). Le verrou par utilisateur et par catégorie tient.
- **Pire cas** : les écritures sur un même couple utilisateur-catégorie passent l'une après l'autre, par conception (environ 89 par seconde). Une file de 50 requêtes attend donc environ une demi-seconde. Une personne n'ajoute pas 50 dépenses à la seconde : la latence de ce scénario est rapportée, sans seuil.
- **Transactions de Prisma** : pool de 10 connexions (défaut de l'adaptateur `pg`), attente d'une connexion `maxWait` 2 s, durée `timeout` 5 s (défauts). Aucun dépassement dans les deux scénarios : valeurs conservées.

Rejouer le test, depuis la racine du dépôt :

```bash
L="-f docker-compose.yml -f apps/api/tests/load/compose.load.yml --profile load"
echo "CREATE DATABASE lapince_load_test;" | docker compose exec -T db sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB'
docker compose exec -T db sh -c 'psql -X -U "$POSTGRES_USER" -d lapince_load_test' < db/roles.sql   # comptes et droits
docker compose $L up -d --build --no-deps redis-load api-load   # Redis jetable ; migrations + seed (lapince_owner), puis l'API (lapince_app)
docker compose $L exec api-load node tests/load/prepare-user.ts  # utilisateur vérifié
docker compose $L run --rm --no-deps k6                         # résumé : apps/api/tests/load/results/
docker compose $L rm -sf api-load redis-load
echo "DROP DATABASE lapince_load_test;" | docker compose exec -T db sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB'
```

### Fuzzing

Des entrées générées au hasard par `fast-check`, rejouables (graine fixe, exemple minimal affiché en cas d'échec) :

- **schéma de création d'une dépense** (`validators/transaction.validator`, unitaire, 5 propriétés × 2 000 essais) : aucune entrée ne fait lever d'exception ; toute dépense valide est acceptée, au centime exact ; montants à plus de 2 décimales, nuls, négatifs, non finis ou trop grands refusés ; catégorie non entière refusée ;
- **API** (`transactions/fuzz`, intégration, 200 corps de requête) : champs valides trois fois sur quatre, piégés une fois sur quatre (types inattendus, textes hostiles, opérateurs `{ $gt: 0 }`, nombres limites, clés `__proto__`) → toujours 201 ou 400, jamais 500 ; rien n'est écrit sur un refus ; une dépense acceptée appartient toujours à l'utilisateur de la session.

**Contre-épreuves** (10/11/2026, dans le conteneur seulement) : règle « au centime » retirée → contre-exemple `0,01 + 0,001` trouvé ; vérification de la catégorie retirée → contre-exemple `{ amount: 0.01, idcategory: 40 }` → 500 trouvé. Une première version du générateur, trop aléatoire, n'atteignait presque jamais le service : elle ne trouvait pas ce second défaut. D'où la pondération.

### Couverture du code

`npm run test:coverage` (API, dans le conteneur, base `lapince_test` ; client) mesure la part du code de `src/` exécutée par les tests (Vitest, fournisseur v8). Mesure du 10/11/2026 :

| Ensemble | Instructions | Branches | Fonctions | Lignes |
|---|---|---|---|---|
| API (unitaires + intégration, 110 tests) | 78,8 % | 70,1 % | 80,0 % | 80,4 % |
| Client (44 tests) | 19,5 % | 20,0 % | 17,7 % | 19,9 % |

Dans l'API : middlewares 97 %, validateurs 95 %, services 81 %, contrôleurs 70 %. Côté client, les tests portent sur les services, les fonctions et les composants à risque (fenêtre d'alerte, saisie des montants) ; les écrans sont vérifiés par la recette. La couverture dit ce qui est exécuté, pas ce qui est vérifié : un test sans assertion juste la ferait monter. C'est un indicateur suivi, sans seuil imposé.

### En intégration continue

[.github/workflows/ci.yml](../.github/workflows/ci.yml), sur chaque pull request, sur une machine neuve et à partir du dépôt seul :

| Job | Étapes |
|---|---|
| Formatage | Prettier sur tout le dépôt |
| API | Redis jetable (même image, même script et mêmes ACL qu'en production) → `npm ci` → **audit des dépendances** (`npm audit --omit=dev --audit-level=high`) → client Prisma → types → **unitaires** → comptes PostgreSQL (`db/roles.sql`, même script qu'en production) → migrations + seed sur une base PostgreSQL 17 jetable (rôle `lapince_owner`) → **intégration** (rôle `lapince_app`) → build |
| Client | `npm ci` → **audit des dépendances** → lint → **tests** → types et build |
| Images de production | construction des Dockerfiles de prod |
| Script de déploiement | ShellCheck (scripts de déploiement, de Redis et de démarrage de l'API) → tests du script ([deploy/deploy.test.sh](../deploy/deploy.test.sh)) |

Les branches `dev` et `main` sont protégées : GitHub refuse le merge tant que tous ces jobs ne sont pas verts.

**Dépendances** : Dependabot ([.github/dependabot.yml](../.github/dependabot.yml)) propose chaque semaine, par pull request vers `dev`, les mises à jour npm (API, client), des actions GitHub et des images Docker (Dockerfiles, fichiers Compose). L'étape d'audit de la CI bloque toute pull request qui introduirait une faille haute ou critique connue dans les dépendances de production.

### Tests manuels de l'API

[apps/api/http/](../apps/api/http/) : une requête par route (extension REST Client de VS Code), pour explorer l'API à la main pendant le développement.

---

## 3. Matrice fonctionnalités × tests

Chemins relatifs à `apps/api/tests/integration/` (API, intégration), `apps/api/src/` (API, unitaires) et `apps/client/src/` (client). R1 à R13 : anomalies de la recette du 30/10/2026, chacune couverte par un test au moment de sa correction.

| Fonctionnalité | API — unitaires | API — intégration | Client | Recette |
|---|---|---|---|---|
| **Inscription** | — | `auth/register` (compte non vérifié, email envoyé, doublon 409, mot de passe faible 400) ; `auth/register-rate-limit` ; `validation-messages` (message sous le bon champ) ; `auth/email-case` (minuscules, doublon de casse refusé) | `RegisterForm` (confirmation différente refusée sans appel, erreur générale) | P1 |
| **Vérification de l'email** | — | `auth/register` (jeton émis) ; `auth/session-tokens` (seule l'empreinte du jeton en base, lien à usage unique, jeton en double dans l'adresse → 400) | `VerifyEmailPage` (sans jeton, jeton accepté, jeton refusé) | P1 |
| **Connexion, déconnexion, sessions** | — | `auth/login-rate-limit-per-ip` (un compteur par visiteur derrière les proxys) ; `auth/rate-limit-redis` (compteur créé dans Redis avec une durée de vie de 15 min, `Retry-After`, connexion réussie non comptée sans effacer les échecs, compteur partagé par deux instances de l'API) ; `auth/rate-limit-redis-down` (Redis coupé : requêtes servies, jamais 429 ni 500, incident journalisé) ; `auth/multi-device-sessions` ; `auth/session-limit` (5 sessions max) ; `auth/session-tokens` (seule l'empreinte du jeton en base, jeton déjà utilisé refusé, 10 rafraîchissements simultanés → une seule session) ; `auth/cookies-production` (`Secure`, `SameSite=Lax`, `HttpOnly`) ; `auth/email-case` (connexion en majuscules) | `apiClient` (401 → rafraîchissement → requête rejouée, un seul rafraîchissement pour deux 401) ; `lib/bfcache` (page privée non réaffichée après déconnexion) | P2 |
| **Mot de passe oublié** | — | `auth/password-reset` (réponse identique compte connu ou non, lien 30 min, seul le hash du jeton en base, usage unique, sessions fermées, lien expiré, mot de passe faible) | — | P3 |
| **Profil et compte (paramètres)** | — | `users/profile-reauth` (mot de passe actuel exigé pour changer mot de passe ou email, sessions fermées) ; `users/account-deletion` (compte et toutes ses données supprimés en cascade, session fermée, données d'un autre intactes, 401 sans session) ; `auth/email-case` ; `validation-messages` | — | P4 |
| **Dépenses et revenus** | — | `transactions/security` ; `transactions/description` (intitulé facultatif) ; `transactions/order` (ordre stable, même jour) ; `transactions/date-filter` (période avec début et fin, début seul, fin seul) ; `amounts` (au centime, < 10 milliards) ; `validation-messages` | `transactionApi` (montants convertis, pagination) ; `lib/transaction` (libellé) ; `lib/sort` ; `AmountInputs` (saisie au centime) | P5 |
| **Budgets** | `lib/period` (7 : mois civil, semaine du lundi au dimanche, jour courant à l'heure de Paris, changement d'année) | `budgets/ownership` (isolation, un budget par catégorie → 409) ; `budgets/budget-period` (période « custom » refusée) ; `amounts` (bornes de la limite) ; `invalid-input` (identifiants, catégorie inexistante) | `budgetApi` (limite convertie) ; `BudgetEditModal` ; `BudgetHistory` | P6 |
| **Alertes de dépassement** | `services/alert.service` (7 : création, égalité exacte 0,10 + 0,20 = 0,30, centimes, pas de doublon, réactivation, retrait, mise à jour) | `budgets/alert-lifecycle` (retrait après suppression de la dépense, hausse de la limite, suppression du budget) ; `budgets/alert-consistency` (**atomicité**, **requêtes simultanées**, dépassement plus grand qu'une dépense : alerte exacte ; au-delà de la borne : 400, rien enregistré) ; `budgets/budget-period` (dépenses du mois précédent ignorées, **alerte retirée au changement de mois**, alerte lue qui reste lue) | `alertApi` (montant converti) ; `AlertPopup` (boîte de dialogue non modale nommée et décrite, focus sur « Fermer » à l'apparition puis rendu à l'élément d'origine, fermeture par Échap et par le bouton) | P6 |
| **Tableau de bord, statistiques** | `services/stats.service` (revenus, dépenses, solde ; zéros sans transaction ; suivi d'un budget sur sa période, au centime) | — | `StatsCards` (solde négatif en rouge) | P7 |
| **Catégories** | — | `categories/order` (ordre du seed) ; `invalid-input` (identifiants) | `CategoryIcon` (icône d'une catégorie connue ; rien pour une icône absente ou inconnue) | P5, P6 |
| **Navigation et affichage** | — | — | `Logo` (retour à l'accueil connecté ou public) ; `ScreenImage` (chaque image n'est proposée qu'à son format d'écran) | P8 |

---

## 4. Tests de sécurité

| Menace | Test | Résultat attendu |
|---|---|---|
| Accès sans session | `transactions/security` : les 5 routes des dépenses | 401 |
| Jeton forgé ou détourné | `transactions/security` : jeton quelconque, signé avec un autre secret, expiré, non signé (`alg: none`), jeton de rafraîchissement présenté comme jeton d'accès | 401, en lecture comme en écriture |
| Accès aux données d'un autre utilisateur | `transactions/security`, `budgets/ownership` : lecture, modification, suppression | 404 (et non 403 : l'existence de la ressource n'est pas révélée) ; ressource vérifiée intacte |
| Usurpation par le corps de la requête | `transactions/security` : `userId` d'un autre glissé à la création et à la modification | ignoré, la dépense reste à son auteur |
| Entrées malformées | `transactions/security`, `invalid-input`, `amounts`, `validation-messages` | 400 avec un message, jamais 500 ni une ressource devinée (`/budgets/12abc`) |
| Montant valide qui ferait déborder un calcul | `budgets/alert-consistency` | deux dépenses maximales → 201 et alerte exacte (19 999 999 999,97 €) ; dépassement au-delà de la borne de la base → 400 explicite, rien n'est enregistré |
| Image arbitraire en photo de profil (pistage, contenu choisi par un tiers) | `users/avatar` | adresse étrangère, `javascript:`, paramètres ajoutés → 400, à l'inscription comme au profil ; seul l'avatar DiceBear construit par le client est accepté |
| Navigation au clavier (RGAA) | `CategorySelect`, `TransactionSheet`, `AlertPopup` (client) | aucun élément masqué atteignable avec Tab (liste de catégories fermée, feuille des transactions fermée : `inert`) ; feuille ouverte au clavier ; Échap referme la liste ; contour de focus visible partout (règle globale) |
| Force brute | `auth/login-rate-limit-per-ip`, `auth/register-rate-limit`, `auth/rate-limit-redis` | 429 au-delà de la limite, par visiteur, avec le temps restant (`Retry-After`) ; compteur commun à toutes les instances de l'API, conservé quand elle redémarre |
| Contournement du limiteur en se connectant à son propre compte | `auth/rate-limit-redis` | une connexion réussie ne compte pas, mais n'efface pas les échecs : après 9 échecs et 1 succès, il reste 9 échecs comptés, et le 11e essai est refusé |
| Panne du stockage des compteurs | `auth/rate-limit-redis-down` | Redis coupé : l'application reste utilisable (aucun 429 ni 500), chaque incident est journalisé |
| Prise de contrôle du compte | `users/profile-reauth` | mot de passe actuel exigé ; sessions fermées après changement |
| Énumération des comptes | `auth/password-reset` | même réponse que l'email existe ou non |
| Vol des jetons en base | `auth/password-reset`, `auth/session-tokens` | seule l'empreinte SHA-256 des jetons est stockée (réinitialisation, session, confirmation d'email) ; liens à usage unique |
| Requête lancée depuis un autre site (CSRF) | `auth/cookies-production` | cookies `SameSite=Lax` et `Secure` ; jetons en `HttpOnly`, inaccessibles au JavaScript |
| Rejeu d'un jeton de session | `auth/session-tokens` | jeton déjà utilisé → 401 ; présenté 10 fois en même temps → une seule session |
| Écran privé réaffiché après déconnexion | `lib/bfcache` (client) | page restaurée depuis le cache rechargée |
| Requêtes simultanées | `budgets/alert-consistency` | une seule alerte, au montant exact (verrou par utilisateur et catégorie) |
| Écriture qui contournerait le service | `budgets/alert-consistency` | seconde alerte pour le même utilisateur et la même catégorie refusée par la base (contrainte d'unicité, erreur P2002) |
| Deux comptes qui ne diffèrent que par la casse | `auth/email-unique-database` | email non normalisé refusé par la base (contrainte CHECK) ; inscriptions ou changements d'email simultanés → un seul réussit, les autres 409, jamais 500 ; email non ASCII refusé |
| Faille de l'API exploitée contre la base (injection SQL, dépendance compromise) | `database-roles` | l'API, et toute la suite d'intégration, se connectent avec `lapince_app`, sans attribut d'administration ; `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE users`, `TRUNCATE users` → refusés (42501) ; historique des migrations illisible (42501) ; lecture et écriture des données acceptées |
| Fuite de données dans les journaux | `middlewares/error.middleware` (unitaire) | donnée refusée par une contrainte CHECK → 400, sans le détail de PostgreSQL (qui recopie la ligne refusée) dans le journal |

**Contre-épreuves** (dans le conteneur seulement, fichiers restaurés ensuite → verts) :
- 30/10/2026 : filtre par utilisateur retiré du service des dépenses et contrôle d'audience retiré du middleware → 4 tests de `transactions/security` rouges ;
- 31/10/2026 : jeton de session présenté non consommé lors de la rotation → « jeton déjà utilisé » et « rafraîchissements simultanés » rouges ;
- 01/11/2026 : suppression du compte neutralisée dans le contrôleur → « supprime le compte et toutes ses données » rouge (l'utilisateur existe encore) ;
- 09/11/2026 : `skipSuccessfulRequests` retiré du limiteur de connexion → « ne compte pas une connexion réussie » rouge (10 échecs comptés au lieu de 9) ; `passOnStoreError` à `false` → « Redis indisponible » rouge (500 au lieu de 400). Avant le passage à Redis, 4 des 5 tests de `auth/rate-limit-redis*` étaient rouges (compteur absent de Redis, deux instances qui comptent chacune de leur côté, 429 quand Redis est coupé).
- 10/11/2026 : `database-roles` lancé avec le superutilisateur, comme l'API de la 0.9.6 → 6 tests sur 7 rouges (DDL acceptés, ou refusés pour une autre raison que les droits : dépendances pour `DROP`, clés étrangères pour `TRUNCATE` ; historique des migrations lisible). Chaque requête testée s'exécute dans une transaction toujours annulée : même acceptée, elle n'a rien modifié (vérifié). Sur une base neuve sans la migration `20261110120000_private_migrations_table`, `lapince_app` avait les droits de lecture et d'écriture sur `_prisma_migrations` (privilèges par défaut) ; `deploy.sh` de la 0.9.6 → 15 des vérifications ajoutées rouges.

---

## 5. Cahier de recette

Parcours à dérouler dans le navigateur avant chaque mise en production, sur un compte de test. Dernière exécution complète : **30/10/2026**, avant la 0.8.0 (13 anomalies relevées, R1 à R13, toutes corrigées puis revérifiées). Les parcours P5 et P6 ont été rejoués le 30/10 après les chantiers sur les montants et les alertes.

| # | Parcours | Étapes | Résultat attendu |
|---|---|---|---|
| **P1** | Inscription et vérification | S'inscrire avec un mot de passe faible, puis valide ; confirmation différente ; ouvrir le lien reçu ; ouvrir `/verify-email` sans jeton | Message sous le champ en cause ; confirmation différente refusée ; « Votre adresse email a bien été confirmée » ; sans jeton : « Ce lien est invalide », immédiatement |
| **P2** | Connexion et session | Se connecter avec l'email en majuscules ; laisser la session expirer (supprimer le cookie `accessToken`) puis agir ; se déconnecter puis « Précédent » | Connexion acceptée ; l'action aboutit sans reconnexion ; après déconnexion, aucun écran privé réaffiché |
| **P3** | Mot de passe oublié | Demander un lien pour un email inconnu puis connu ; utiliser le lien ; le réutiliser | Même message dans les deux cas ; mot de passe changé, autres sessions fermées ; lien refusé la 2ᵉ fois |
| **P4** | Paramètres | Changer le prénom ; changer le mot de passe sans puis avec le mot de passe actuel ; supprimer le compte (sur un compte de test), puis tenter de se reconnecter | Prénom changé sans mot de passe ; changement de mot de passe refusé sans le mot de passe actuel, accepté avec ; après la suppression, retour à la page de connexion et connexion refusée |
| **P5** | Dépenses et revenus | Ajouter une dépense de 0,10 € sans intitulé ; un revenu ; modifier ; supprimer ; essayer 12,345 € | Montants au centime ; sans intitulé, la catégorie s'affiche ; 12,345 refusé par le formulaire |
| **P6** | Budgets et alertes | Budget de 0,30 € + dépenses de 0,10 € et 0,20 € ; limite passée à 0,10 € ; supprimer la dépense ; supprimer le budget ; 2ᵉ budget sur la même catégorie | Pas d'alerte à 0,30 € pile ; alerte de 0,20 € ; alerte retirée dans les deux cas ; 2ᵉ budget refusé (« Un budget existe déjà ») |
| **P7** | Tableau de bord | Ouvrir le tableau de bord ; filtrer par mois, type, catégorie ; modifier un budget | Cartes, graphique et tableau cohérents avec les filtres ; tableau à jour après modification |
| **P8** | Navigation | Cliquer sur le logo connecté puis déconnecté ; ouvrir une adresse inconnue | Accueil connecté ou accueil public ; page 404 |
| **P9** | Affichage mobile | Parcourir accueil, saisie et tableau de bord en largeur mobile (outils de développement du navigateur) | Contenus lisibles, formulaires utilisables |

Une anomalie trouvée en recette suit la même méthode qu'un bug : test automatisé qui la reproduit (quand c'est possible), correctif, puis le parcours est rejoué.
