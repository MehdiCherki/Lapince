#!/usr/bin/env bash
# Tests du script de déploiement, sans serveur : git, docker et curl sont remplacés par des doubles
# qui simulent chaque situation et notent les commandes reçues (fichier calls).
#   bash deploy/deploy.test.sh
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/deploy.sh"
PASSED=0
FAILED=0

# --- Doubles -------------------------------------------------------------------
STUBS="$(mktemp -d)"
cat > "$STUBS/git" <<'EOF'
#!/usr/bin/env bash
echo "git $*" >> "$CALLS"
sha() { if [[ -f "$WORK/pulled" ]]; then echo bbbbbbb; else echo aaaaaaa; fi; }
case "$*" in
  "status --porcelain") echo -n "${GIT_DIRTY:-}" ;;
  "rev-parse --abbrev-ref HEAD") echo "${GIT_BRANCH:-main}" ;;
  "rev-parse --short HEAD") sha ;;
  "log --oneline -1") echo "$(sha) dernier commit" ;;
  "log --oneline HEAD..origin/main") echo -n "${GIT_NEW-bbbbbbb feat: nouveauté}" ;;
  fetch*) ;;
  pull*) touch "$WORK/pulled" ;;
  show*) echo "schéma de 0_init" ;;
esac
EOF
cat > "$STUBS/docker" <<'EOF'
#!/usr/bin/env bash
echo "docker $*" >> "$CALLS"
if [[ "$1" == inspect ]]; then
  case "$*" in
    *Health.Status*) echo "${REDIS_STATE:-healthy}" ;;
    *) if [[ "${API_RECREATED:-1}" == 1 ]]; then echo "2999-01-01T00:00:00Z"; else echo "2000-01-01T00:00:00Z"; fi ;;
  esac
  exit 0
fi
shift 3 # compose -f <fichier>
case "$*" in
  "ps db --format {{.State}}") echo running ;;
  "ps api --format {{.State}}") echo "${API_STATE:-running}" ;;
  "ps -q api") echo conteneur-api ;;
  "ps -q redis") echo conteneur-redis ;;
  "ps --format {{.Service}} {{.State}}") printf '%b' "${PS_ALL:-db running\napi running\nclient running\n}" ;;
  "exec -T db sh -c "*pg_dump*)
    echo "-- dump"; [[ -n "${DUMP_INCOMPLETE:-}" ]] || echo "-- PostgreSQL database dump complete" ;;
  "exec -T db sh -c "*psql*)
    sql="$(cat)"
    echo "sql $sql" >> "$CALLS"
    case "$sql" in
      *to_regclass*) echo "${MIGRATIONS_TABLE:-t}" ;;
      *round*) printf '%b' "${DECIMALS:-0\n0\n0\n}" ;;
      *pg_roles*) echo "${DB_ROLES:-2|0}" ;;
    esac ;;
  "run --rm -T --entrypoint sh api -c "*) cat > /dev/null; exit "${INIT_DIFF:-0}" ;;
  "exec -T api npx prisma migrate diff"*) exit "${FINAL_DIFF:-0}" ;;
  "logs --since "*) [[ "${API_STARTS:-1}" == 1 ]] && echo '{"msg":"🚀 Server started at http://localhost:3007"}' ;;
esac
exit 0
EOF
cat > "$STUBS/curl" <<'EOF'
#!/usr/bin/env bash
echo "curl $*" >> "$CALLS"
case "${*: -1}" in
  */api/categories) echo -n "${CURL_API:-401}" ;;
  *) echo -n "${CURL_SITE:-200}" ;;
esac
EOF
printf '#!/usr/bin/env bash\nexit 0\n' > "$STUBS/sleep"
chmod +x "$STUBS"/*

# --- Exécution d'un cas --------------------------------------------------------
REDIS_OK="REDIS_PASSWORD=valeur-a-ne-jamais-afficher"
OWNER_OK="MIGRATION_DATABASE_URL=postgresql://lapince_owner:mdp-proprietaire-a-ne-jamais-afficher@db:5432/Lapince"
APP_OK="DATABASE_URL=postgresql://lapince_app:mdp-api-a-ne-jamais-afficher@db:5432/Lapince"
ENV_OK="$REDIS_OK\n$OWNER_OK\n$APP_OK"

# run <arguments> : lance le script dans un dossier neuf ; résultat dans $CODE, $OUT, $CALLS
run() {
  WORK="$(mktemp -d)"; CALLS="$WORK/calls"; : > "$CALLS"
  touch "$WORK/docker-compose.prod.yml"
  # .env du serveur : mot de passe de Redis et adresses des deux rôles PostgreSQL (valeurs que le
  # script ne doit jamais afficher) ; \n sépare les lignes
  printf '%b\n' "${ENV_FILE-$ENV_OK}" > "$WORK/.env"
  # Sauvegardes plus anciennes déjà présentes (une par jour, du 1er au PRE_BACKUPS octobre), et un autre .sql
  for i in $(seq 1 "${PRE_BACKUPS:-0}"); do
    echo "-- ancienne" > "$WORK/backup-lapince-2026-10-0$i-1200.sql"
    touch -d "2026-10-0$i 12:00" "$WORK/backup-lapince-2026-10-0$i-1200.sql"
  done
  echo "-- autre" > "$WORK/autre.sql"
  OUT="$(cd "$WORK" && env PATH="$STUBS:$PATH" HOME="$WORK" WORK="$WORK" CALLS="$CALLS" bash "$SCRIPT" "$@" 2>&1)"
  CODE=$?
}
check() { # check <description> <condition...>
  local desc="$1"; shift
  if "$@"; then PASSED=$((PASSED + 1)); else FAILED=$((FAILED + 1)); echo "  ✗ $desc"; fi
}
called() { grep -q -- "$1" "$CALLS"; }
not_called() { ! grep -q -- "$1" "$CALLS"; }
says() { grep -q -- "$1" <<< "$OUT"; }
not_says() { ! says "$1"; }
# before <a> <b> : la commande a est lancée avant la commande b
before() { (( $(grep -n -- "$1" "$CALLS" | head -1 | cut -d: -f1) < $(grep -n -- "$2" "$CALLS" | head -1 | cut -d: -f1) )); }
scenario() { echo "• $1"; }

# --- Cas ------------------------------------------------------------------------
scenario "--check : vérifie sans rien modifier"
run --check
check "code 0" test "$CODE" -eq 0
check "annonce les commits à déployer" says "bbbbbbb feat: nouveauté"
check "aucune sauvegarde" not_called "pg_dump"
check "aucun pull" not_called "git pull"

scenario "aucun nouveau commit"
GIT_NEW="" run
check "code 0" test "$CODE" -eq 0
check "« Rien à déployer »" says "Rien à déployer"
check "aucun pull ni build" not_called "build"

scenario "modifications locales sur le serveur"
GIT_DIRTY=" M apps/api/src/app.ts" run
check "code 1" test "$CODE" -eq 1
check "explique pourquoi" says "modifications locales"
check "aucune sauvegarde ni pull" not_called "pg_dump"

scenario "serveur sur une autre branche"
GIT_BRANCH=dev run
check "code 1" test "$CODE" -eq 1
check "aucun pull" not_called "git pull"

scenario "déploiement normal"
run
check "code 0" test "$CODE" -eq 0
check "sauvegarde avant pull" before "pg_dump" "git pull"
check "pull avant build" before "git pull" "build"
check "build avant redémarrage" before "build" "up -d"
check "redémarrage avant rechargement de nginx" before "up -d" "nginx -s reload"
check "contrôle final du schéma" called "migrate diff --from-config-datasource --to-schema prisma/schema.prisma"
check "base déjà inscrite : pas d'inscription" not_called "migrate resolve"
check "fin annoncée" says "Déploiement terminé : aaaaaaa → bbbbbbb"
check "journal écrit" test -n "$(ls "$WORK"/deploy-logs/deploy-*.log 2>/dev/null)"
check "sauvegarde écrite" test -n "$(ls "$WORK"/backup-lapince-*.sql 2>/dev/null)"
check "attend que Redis soit sain après le redémarrage" before "up -d" "Health.Status"
check "Redis sain avant de contrôler l'API" before "Health.Status" "nginx -s reload"
check "mots de passe (Redis, PostgreSQL) jamais affichés" not_says "a-ne-jamais-afficher"
check "ni écrits dans le journal" test -z "$(grep -l "a-ne-jamais-afficher" "$WORK"/deploy-logs/*.log)"
check "comptes PostgreSQL contrôlés avant la sauvegarde" before "pg_roles" "pg_dump"

scenario "sauvegarde incomplète"
DUMP_INCOMPLETE=1 run
check "code 1" test "$CODE" -eq 1
check "explique pourquoi" says "sauvegarde incomplète"
check "aucun pull" not_called "git pull"
check "pas de retour arrière à faire (code inchangé)" not_says "Retour arrière"

scenario "site en erreur après la mise à jour (502)"
CURL_SITE=502 run
check "code 1" test "$CODE" -eq 1
check "explique pourquoi" says "site : 502 au lieu de 200"
check "donne le retour arrière vers l'ancien commit" says "git checkout aaaaaaa"
check "rappelle la sauvegarde" says "restaurer aussi"

scenario "API sans protection (200 au lieu de 401)"
CURL_API=200 run
check "code 1" test "$CODE" -eq 1
check "explique pourquoi" says "API via le site : 200 au lieu de 401"

scenario "API qui redémarre en boucle"
API_STARTS=0 API_STATE=restarting run
check "code 1" test "$CODE" -eq 1
check "explique pourquoi" says "redémarre en boucle"
check "nginx non rechargé" not_called "nginx -s reload"

scenario "API inchangée (seul le client change)"
API_RECREATED=0 API_STARTS=0 run
check "code 0, sans attendre un redémarrage qui n'aura pas lieu" test "$CODE" -eq 0
check "le dit" says "API inchangée"

scenario "service arrêté après le déploiement"
PS_ALL='db running\napi running\nclient exited\n' run
check "code 1" test "$CODE" -eq 1
check "nomme le service" says "client exited"

scenario "base différente du schéma après migration"
FINAL_DIFF=2 run
check "code 1" test "$CODE" -eq 1
check "explique pourquoi" says "la base diffère du schéma"

scenario "1ʳᵉ fois (0.9.0) : base pas encore inscrite, contrôles verts"
MIGRATIONS_TABLE=f run
check "code 0" test "$CODE" -eq 0
check "build avant inscription" before "build" "migrate resolve --applied 0_init"
check "inscription avant redémarrage" before "migrate resolve --applied 0_init" "up -d"
check "contrôle 1 sur le schéma de 0_init (673dcd2)" called "git show 673dcd2:apps/api/prisma/schema.prisma"

scenario "1ʳᵉ fois : base différente de 0_init"
MIGRATIONS_TABLE=f INIT_DIFF=2 run
check "code 1" test "$CODE" -eq 1
check "pas d'inscription" not_called "migrate resolve"
check "pas de redémarrage" not_called "up -d"
check "donne le retour arrière (code déjà mis à jour)" says "git checkout aaaaaaa"

scenario "1ʳᵉ fois : montants à plus de 2 décimales"
MIGRATIONS_TABLE=f DECIMALS='1\n0\n0\n' run
check "code 1" test "$CODE" -eq 1
check "explique pourquoi" says "plus de 2 décimales"
check "pas d'inscription" not_called "migrate resolve"

scenario "0.9.6 : REDIS_PASSWORD absent du .env"
ENV_FILE="POSTGRES_DB=lapince" run --check
check "code 1, dès --check" test "$CODE" -eq 1
check "explique pourquoi" says "REDIS_PASSWORD absent ou vide"
check "aucune sauvegarde ni pull" not_called "pg_dump"

scenario "0.9.6 : REDIS_PASSWORD vide"
ENV_FILE="REDIS_PASSWORD=" run
check "code 1" test "$CODE" -eq 1
check "aucune sauvegarde ni pull" not_called "git pull"

scenario "0.9.6 : Redis non sain après le redémarrage"
REDIS_STATE=unhealthy run
check "code 1" test "$CODE" -eq 1
check "explique pourquoi" says "Redis n'est pas sain (unhealthy)"
check "nginx non rechargé" not_called "nginx -s reload"
check "donne le retour arrière vers l'ancien commit" says "git checkout aaaaaaa"

scenario "0.9.7 : MIGRATION_DATABASE_URL absente du .env"
ENV_FILE="$REDIS_OK\n$APP_OK" run --check
check "code 1, dès --check" test "$CODE" -eq 1
check "explique pourquoi" says "MIGRATION_DATABASE_URL absente de .env"
check "aucune sauvegarde ni pull" not_called "pg_dump"

scenario "0.9.7 : MIGRATION_DATABASE_URL avec un autre rôle que lapince_owner"
ENV_FILE="$REDIS_OK\nMIGRATION_DATABASE_URL=postgresql://Lapince:mdp-a-ne-jamais-afficher@db:5432/Lapince\n$APP_OK" run
check "code 1" test "$CODE" -eq 1
check "explique pourquoi" says "sans le rôle lapince_owner"
check "mot de passe jamais affiché" not_says "a-ne-jamais-afficher"
check "aucun pull" not_called "git pull"

scenario "0.9.7 : DATABASE_URL encore sur l'administrateur"
ENV_FILE="$REDIS_OK\n$OWNER_OK\nDATABASE_URL=postgresql://Lapince:mdp-a-ne-jamais-afficher@db:5432/Lapince" run
check "code 1" test "$CODE" -eq 1
check "explique pourquoi" says "doit se connecter avec le rôle lapince_app"
check "mot de passe jamais affiché" not_says "a-ne-jamais-afficher"
check "aucune sauvegarde ni pull" not_called "pg_dump"

scenario "0.9.7 : adresses entre guillemets, schéma postgres://"
ENV_FILE="$REDIS_OK\nMIGRATION_DATABASE_URL=\"postgres://lapince_owner:x@db:5432/Lapince\"\nDATABASE_URL='postgres://lapince_app:x@db:5432/Lapince'" run --check
check "acceptées" test "$CODE" -eq 0

scenario "0.9.7 : rôles pas encore créés en base"
DB_ROLES="0|13" run --check
check "code 1, dès --check" test "$CODE" -eq 1
check "explique pourquoi" says "0 rôle(s) sur 2, 13 objet(s) à transférer"
check "renvoie au script des rôles" says "lancer db/roles.sql"
check "aucune sauvegarde" not_called "pg_dump"

scenario "0.9.7 : rôles créés, objets pas encore transférés"
DB_ROLES="2|13" run
check "code 1" test "$CODE" -eq 1
check "explique pourquoi" says "13 objet(s) à transférer"
check "aucun pull" not_called "git pull"

scenario "--redeploy sans nouveau commit"
GIT_NEW="" run --redeploy
check "code 0" test "$CODE" -eq 0
check "sauvegarde quand même" called "pg_dump"
check "force la recréation de l'API et du client" called "up -d --no-deps --force-recreate api client"

scenario "rétention : garde les 5 sauvegardes les plus récentes"
PRE_BACKUPS=7 run
backups() { find "$WORK" -maxdepth 1 -name 'backup-lapince-*.sql' | wc -l; }
check "code 0" test "$CODE" -eq 0
check "5 sauvegardes restantes (la nouvelle + les 4 plus récentes)" test "$(backups)" -eq 5
check "les 3 plus anciennes supprimées" test ! -e "$WORK/backup-lapince-2026-10-03-1200.sql"
check "la 4e plus récente gardée" test -e "$WORK/backup-lapince-2026-10-04-1200.sql"
check "un autre fichier .sql n'est pas touché" test -e "$WORK/autre.sql"
check "annonce chaque suppression" says "Ancienne sauvegarde supprimée"

scenario "rétention : rien n'est supprimé en --check"
PRE_BACKUPS=7 run --check
check "7 sauvegardes toujours là" test "$(backups)" -eq 7

scenario "rétention : rien n'est supprimé si la nouvelle sauvegarde est incomplète"
PRE_BACKUPS=7 DUMP_INCOMPLETE=1 run
check "code 1" test "$CODE" -eq 1
check "la plus ancienne toujours là" test -e "$WORK/backup-lapince-2026-10-01-1200.sql"

scenario "rétention : KEEP_BACKUPS invalide refusé"
KEEP_BACKUPS=0 run
check "code 1" test "$CODE" -eq 1
check "explique pourquoi" says "KEEP_BACKUPS"
check "aucune sauvegarde faite" not_called "pg_dump"

scenario "option inconnue"
run --force
check "code 2 (usage)" test "$CODE" -eq 2
check "aucune commande lancée" test ! -s "$CALLS"

echo
echo "$PASSED vérifications réussies, $FAILED en échec."
rm -rf "$STUBS"
[[ "$FAILED" -eq 0 ]]
