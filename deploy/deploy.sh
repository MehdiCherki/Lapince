#!/usr/bin/env bash
# Mise en production de La Pince, sur le serveur, depuis /opt/lapince :
#
#   ./deploy/deploy.sh             déploie la dernière version de main
#   ./deploy/deploy.sh --check     vérifie seulement (rien n'est modifié)
#   ./deploy/deploy.sh --redeploy  reconstruit et relance même sans nouveau commit
#
# Étapes (procédure détaillée : docs/deploiement-serveur.md, section 2) :
#   1. préconditions  2. sauvegarde de la base  3. mise à jour du code  4. build
#   5. inscription de la base aux migrations (une seule fois)  6. redémarrage
#   7. rechargement de nginx  8. contrôles
# Arrêt à la première erreur, avec les commandes de retour arrière.
# Journal complet : ~/deploy-logs/

main() {
set -Eeuo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
SITE_URL="${SITE_URL:-https://mehdicherki.fr}"
BRANCH="main"
# Commit dont le schéma correspond à la migration initiale 0_init (voir docs/deploiement-serveur.md)
INIT_SCHEMA_COMMIT="673dcd2"
STAMP="$(date +%F-%H%M)"
BACKUP_FILE="$HOME/backup-lapince-$STAMP.sql"
LOG_DIR="$HOME/deploy-logs"

MODE="deploy"
case "${1:-}" in
  "") ;;
  --check) MODE="check" ;;
  --redeploy) MODE="redeploy" ;;
  *) echo "Usage : $0 [--check | --redeploy]" >&2; exit 2 ;;
esac

dc() { docker compose -f "$COMPOSE_FILE" "$@"; }
step() { echo; echo "=== $* ==="; }
# Requête SQL sur la base de prod (par l'entrée standard : pas de guillemets imbriqués à protéger).
# Les $ entre apostrophes sont lus par le shell du conteneur, qui connaît les variables POSTGRES_*.
# shellcheck disable=SC2016
sql() { echo "$1" | dc exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -v ON_ERROR_STOP=1'; }

mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG_DIR/deploy-$STAMP.log") 2>&1

PREVIOUS_COMMIT=""
CODE_UPDATED=false
# Arrêt : sur un contrôle en échec (fail) comme sur une commande en erreur (piège ERR)
stop() {
  trap - ERR
  echo
  echo "!!! Déploiement interrompu : $1"
  echo "Rien n'a été annulé automatiquement."
  if [[ "$CODE_UPDATED" == true ]]; then
    echo "Retour arrière (docs/deploiement-serveur.md, étape D) :"
    echo "  git checkout $PREVIOUS_COMMIT && docker compose -f $COMPOSE_FILE up -d --build"
    echo "  Si des migrations ont été appliquées : restaurer aussi $BACKUP_FILE (section 5)."
  fi
  echo "Journal : $LOG_DIR/deploy-$STAMP.log"
  exit 1
}
fail() { stop "$*"; }
trap 'stop "commande en erreur, ligne $LINENO"' ERR

# --- 1. Préconditions --------------------------------------------------------
step "1. Préconditions ($MODE)"
[[ -f "$COMPOSE_FILE" ]] || fail "$COMPOSE_FILE introuvable : lancer le script depuis /opt/lapince"
[[ -z "$(git status --porcelain)" ]] || fail "modifications locales sur le serveur (git status) : rien ne doit être modifié à la main"
[[ "$(git rev-parse --abbrev-ref HEAD)" == "$BRANCH" ]] || fail "le serveur n'est pas sur la branche $BRANCH"
[[ "$(dc ps db --format '{{.State}}')" == "running" ]] || fail "la base (service db) ne tourne pas"
PREVIOUS_COMMIT="$(git rev-parse --short HEAD)"
echo "Version en production : $(git log --oneline -1)"

git fetch --quiet origin "$BRANCH"
NEW_COMMITS="$(git log --oneline "HEAD..origin/$BRANCH")"
if [[ -n "$NEW_COMMITS" ]]; then
  echo "À déployer :"; echo "$NEW_COMMITS"
else
  echo "Aucun nouveau commit sur origin/$BRANCH."
fi

BASELINE_NEEDED=false
if [[ "$(sql "SELECT to_regclass('public._prisma_migrations') IS NOT NULL;")" != "t" ]]; then
  BASELINE_NEEDED=true
  echo "La base n'est pas encore inscrite aux migrations : l'étape 5 le fera, après contrôles."
fi

if [[ "$MODE" == "check" ]]; then
  echo; echo "Vérification terminée, rien n'a été modifié."
  exit 0
fi
if [[ -z "$NEW_COMMITS" && "$MODE" != "redeploy" ]]; then
  echo "Rien à déployer (--redeploy pour reconstruire quand même)."
  exit 0
fi

# --- 2. Sauvegarde ------------------------------------------------------------
step "2. Sauvegarde de la base → $BACKUP_FILE"
# shellcheck disable=SC2016
dc exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$BACKUP_FILE"
# Une sauvegarde interrompue n'a pas la ligne de fin de pg_dump : on ne continue pas sans sauvegarde complète
grep -q "PostgreSQL database dump complete" "$BACKUP_FILE" || fail "sauvegarde incomplète : $BACKUP_FILE"
ls -lh "$BACKUP_FILE"

# --- 3. Mise à jour du code ---------------------------------------------------
step "3. Mise à jour du code"
git pull --ff-only --quiet origin "$BRANCH"
CODE_UPDATED=true
echo "Code : $PREVIOUS_COMMIT → $(git log --oneline -1)"

# --- 4. Build -----------------------------------------------------------------
step "4. Construction des images"
dc build

# --- 5. Inscription aux migrations (une seule fois) ----------------------------
if [[ "$BASELINE_NEEDED" == true ]]; then
  step "5. Inscription de la base aux migrations"
  # Contrôle 1 : la base doit être identique à 0_init (pas au schéma actuel, qui contient déjà les migrations suivantes)
  # shellcheck disable=SC2016
  git show "$INIT_SCHEMA_COMMIT:apps/api/prisma/schema.prisma" |
    dc run --rm -T --entrypoint sh api -c 'cat > /tmp/0_init.prisma && npx prisma migrate diff --from-config-datasource --to-schema /tmp/0_init.prisma --exit-code' ||
    fail "la base diffère de 0_init : ne pas l'inscrire (afficher les différences, voir docs/deploiement-serveur.md)"
  # Contrôle 2 : aucun montant à plus de 2 décimales (DECIMAL(12, 2) l'arrondirait)
  DECIMALS="$(sql 'SELECT count(*) FROM transactions WHERE amount <> round(amount, 2) UNION ALL SELECT count(*) FROM budgets WHERE limit_amount::numeric <> round(limit_amount::numeric, 2) UNION ALL SELECT count(*) FROM alerts WHERE "exceededAmount" <> round("exceededAmount", 2);' | tr '\n' ' ')"
  [[ "$DECIMALS" == "0 0 0 " ]] || fail "montants à plus de 2 décimales (transactions, budgets, alertes) : $DECIMALS"
  dc run --rm -T --entrypoint npx api prisma migrate resolve --applied 0_init
fi

# --- 6. Redémarrage -----------------------------------------------------------
step "6. Redémarrage (l'API applique les migrations au démarrage)"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
dc up -d  # recrée les services dont l'image ou la configuration a changé
if [[ "$MODE" == "redeploy" ]]; then
  dc up -d --no-deps --force-recreate api client
fi
# API recréée → attendre qu'elle ait appliqué les migrations et démarré ; sinon elle tourne déjà, inchangée
API_STARTED_AT="$(docker inspect -f '{{.State.StartedAt}}' "$(dc ps -q api)")"
if [[ "$API_STARTED_AT" > "$STARTED_AT" ]]; then
  for _ in $(seq 1 40); do
    if dc logs --since "$STARTED_AT" api 2>/dev/null | grep -q "Server started"; then break; fi
    if [[ "$(dc ps api --format '{{.State}}')" == "restarting" ]]; then
      fail "l'API redémarre en boucle : dc logs api --tail 50"
    fi
    sleep 3
  done
  dc logs --since "$STARTED_AT" api | grep -q "Server started" || fail "l'API n'a pas démarré en 2 minutes : dc logs api --tail 50"
  echo "API redémarrée."
else
  echo "API inchangée (image identique) : pas de redémarrage."
fi

# --- 7. Rechargement de nginx ---------------------------------------------------
step "7. Rechargement de nginx-proxy"
# Les conteneurs recréés changent d'adresse IP : sans rechargement, nginx-proxy vise l'ancienne (502)
dc exec -T nginx-proxy nginx -s reload

# --- 8. Contrôles ---------------------------------------------------------------
step "8. Contrôles"
NOT_RUNNING="$(dc ps --format '{{.Service}} {{.State}}' | grep -v ' running$' || true)"
[[ -z "$NOT_RUNNING" ]] || fail "services arrêtés : $NOT_RUNNING"
echo "Services : tous démarrés."
dc exec -T api npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code > /dev/null ||
  fail "la base diffère du schéma"
echo "Base conforme au schéma."
CODE_API="$(curl -s -o /dev/null -w '%{http_code}' "$SITE_URL/api/categories")"
[[ "$CODE_API" == "401" ]] || fail "API via le site : $CODE_API au lieu de 401 (route protégée)"
CODE_SITE="$(curl -s -o /dev/null -w '%{http_code}' "$SITE_URL/")"
[[ "$CODE_SITE" == "200" ]] || fail "site : $CODE_SITE au lieu de 200"
echo "Site : 200, API : 401 (répond et protège ses routes)."

echo
echo "Déploiement terminé : $PREVIOUS_COMMIT → $(git rev-parse --short HEAD)."
echo "Point de retour : $PREVIOUS_COMMIT + $BACKUP_FILE"
echo "À faire dans le navigateur : connexion, ajout d'une transaction, tableau de bord."
}

# Tout le fichier est lu avant d'être exécuté : le git pull de l'étape 3, qui peut modifier
# ce script pendant qu'il tourne, ne le perturbe pas (bash lit sinon un script au fil de l'eau).
main "$@"
