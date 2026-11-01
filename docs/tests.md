# Tests — La Pince

Ce document décrit comment l'application est testée : la stratégie, la façon de lancer les tests, ce que chaque test couvre (matrice), les tests de sécurité et le cahier de recette.

**État au 01/11/2026** : 139 tests automatisés de l'application et 21 scénarios du script de déploiement, tous verts, lancés sur chaque pull request par la CI.

| Ensemble | Outil | Tests |
|---|---|---|
| API — unitaires | Vitest | 17 |
| API — intégration (dont sécurité) | Vitest + Supertest + PostgreSQL | 81 |
| Client — composants, services, fonctions | Vitest + Testing Library (jsdom) | 41 |
| Script de déploiement | Bash, doubles de `git`, `docker` et `curl` | 21 scénarios (69 vérifications) |
| Recette (tests d'acceptation) | navigateur, cahier ci-dessous | 9 parcours |

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
- aucun email réel : le transporteur SMTP est remplacé par un double dans tous les fichiers ;
- chaque fichier supprime les comptes qu'il a créés (et leurs données, en cascade) ;
- emails de test uniques (horodatés) : les fichiers ne se gênent pas entre eux.

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
docker compose exec api npm run test:db:setup      # migrations + seed des catégories
```

Le code est copié dans l'image au build : après une modification, `docker compose up -d --build api` (ou `client`) avant de relancer les tests, ou `docker compose watch` pendant le développement.

### En intégration continue

[.github/workflows/ci.yml](../.github/workflows/ci.yml), sur chaque pull request, sur une machine neuve et à partir du dépôt seul :

| Job | Étapes |
|---|---|
| Formatage | Prettier sur tout le dépôt |
| API | `npm ci` → client Prisma → types → **unitaires** → migrations + seed sur une base PostgreSQL 17 jetable → **intégration** → build |
| Client | `npm ci` → lint → **tests** → types et build |
| Images de production | construction des Dockerfiles de prod |
| Script de déploiement | ShellCheck → tests du script ([deploy/deploy.test.sh](../deploy/deploy.test.sh)) |

Les branches `dev` et `main` sont protégées : GitHub refuse le merge tant que tous ces jobs ne sont pas verts.

### Tests manuels de l'API

[apps/api/http/](../apps/api/http/) : une requête par route (extension REST Client de VS Code), pour explorer l'API à la main pendant le développement.

---

## 3. Matrice fonctionnalités × tests

Chemins relatifs à `apps/api/tests/integration/` (API, intégration), `apps/api/src/` (API, unitaires) et `apps/client/src/` (client). R1 à R13 : anomalies de la recette du 30/10/2026, chacune couverte par un test au moment de sa correction.

| Fonctionnalité | API — unitaires | API — intégration | Client | Recette |
|---|---|---|---|---|
| **Inscription** | — | `auth/register` (compte non vérifié, email envoyé, doublon 409, mot de passe faible 400) ; `auth/register-rate-limit` ; `validation-messages` (message sous le bon champ) ; `auth/email-case` (minuscules, doublon de casse refusé) | `RegisterForm` (confirmation différente refusée sans appel, erreur générale) | P1 |
| **Vérification de l'email** | — | `auth/register` (jeton émis) ; `auth/session-tokens` (seule l'empreinte du jeton en base, lien à usage unique, jeton en double dans l'adresse → 400) | `VerifyEmailPage` (sans jeton, jeton accepté, jeton refusé) | P1 |
| **Connexion, déconnexion, sessions** | — | `auth/login-rate-limit-per-ip` (un compteur par visiteur derrière les proxys) ; `auth/multi-device-sessions` ; `auth/session-limit` (5 sessions max) ; `auth/session-tokens` (seule l'empreinte du jeton en base, jeton déjà utilisé refusé, 10 rafraîchissements simultanés → une seule session) ; `auth/cookies-production` (`Secure`, `SameSite=Lax`, `HttpOnly`) ; `auth/email-case` (connexion en majuscules) | `apiClient` (401 → rafraîchissement → requête rejouée, un seul rafraîchissement pour deux 401) ; `lib/bfcache` (page privée non réaffichée après déconnexion) | P2 |
| **Mot de passe oublié** | — | `auth/password-reset` (réponse identique compte connu ou non, lien 30 min, seul le hash du jeton en base, usage unique, sessions fermées, lien expiré, mot de passe faible) | — | P3 |
| **Profil et compte (paramètres)** | — | `users/profile-reauth` (mot de passe actuel exigé pour changer mot de passe ou email, sessions fermées) ; `users/account-deletion` (compte et toutes ses données supprimés en cascade, session fermée, données d'un autre intactes, 401 sans session) ; `auth/email-case` ; `validation-messages` | — | P4 |
| **Dépenses et revenus** | — | `transactions/security` ; `transactions/description` (intitulé facultatif) ; `transactions/order` (ordre stable, même jour) ; `transactions/date-filter` (période avec début et fin, début seul, fin seul) ; `amounts` (au centime, < 10 milliards) ; `validation-messages` | `transactionApi` (montants convertis, pagination) ; `lib/transaction` (libellé) ; `lib/sort` ; `AmountInputs` (saisie au centime) | P5 |
| **Budgets** | `lib/period` (7 : mois civil, semaine du lundi au dimanche, jour courant à l'heure de Paris, changement d'année) | `budgets/ownership` (isolation, un budget par catégorie → 409) ; `budgets/budget-period` (période « custom » refusée) ; `amounts` (bornes de la limite) ; `invalid-input` (identifiants, catégorie inexistante) | `budgetApi` (limite convertie) ; `BudgetEditModal` ; `BudgetHistory` | P6 |
| **Alertes de dépassement** | `services/alert.service` (7 : création, égalité exacte 0,10 + 0,20 = 0,30, centimes, pas de doublon, réactivation, retrait, mise à jour) | `budgets/alert-lifecycle` (retrait après suppression de la dépense, hausse de la limite, suppression du budget) ; `budgets/alert-consistency` (**atomicité** et **requêtes simultanées**) ; `budgets/budget-period` (dépenses du mois précédent ignorées, **alerte retirée au changement de mois**, alerte lue qui reste lue) | `alertApi` (montant converti) | P6 |
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
| Force brute | `auth/login-rate-limit-per-ip`, `auth/register-rate-limit` | 429 au-delà de la limite, par visiteur |
| Prise de contrôle du compte | `users/profile-reauth` | mot de passe actuel exigé ; sessions fermées après changement |
| Énumération des comptes | `auth/password-reset` | même réponse que l'email existe ou non |
| Vol des jetons en base | `auth/password-reset`, `auth/session-tokens` | seule l'empreinte SHA-256 des jetons est stockée (réinitialisation, session, confirmation d'email) ; liens à usage unique |
| Requête lancée depuis un autre site (CSRF) | `auth/cookies-production` | cookies `SameSite=Lax` et `Secure` ; jetons en `HttpOnly`, inaccessibles au JavaScript |
| Rejeu d'un jeton de session | `auth/session-tokens` | jeton déjà utilisé → 401 ; présenté 10 fois en même temps → une seule session |
| Écran privé réaffiché après déconnexion | `lib/bfcache` (client) | page restaurée depuis le cache rechargée |
| Requêtes simultanées | `budgets/alert-consistency` | une seule alerte, au montant exact (verrou par utilisateur et catégorie) |

**Contre-épreuves** (dans le conteneur seulement, fichiers restaurés ensuite → verts) :
- 30/10/2026 : filtre par utilisateur retiré du service des dépenses et contrôle d'audience retiré du middleware → 4 tests de `transactions/security` rouges ;
- 31/10/2026 : jeton de session présenté non consommé lors de la rotation → « jeton déjà utilisé » et « rafraîchissements simultanés » rouges ;
- 01/11/2026 : suppression du compte neutralisée dans le contrôleur → « supprime le compte et toutes ses données » rouge (l'utilisateur existe encore).

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
