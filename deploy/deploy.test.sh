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
  if [[ "${API_RECREATED:-1}" == 1 ]]; then echo "2999-01-01T00:00:00Z"; else echo "2000-01-01T00:00:00Z"; fi
  exit 0
fi
shift 3 # compose -f <fichier>
case "$*" in
  "ps db --format {{.State}}") echo running ;;
  "ps api --format {{.State}}") echo "${API_STATE:-running}" ;;
  "ps -q api") echo conteneur-api ;;
  "ps --format {{.Service}} {{.State}}") printf '%b' "${PS_ALL:-db running\napi running\nclient running\n}" ;;
  "exec -T db sh -c "*pg_dump*)
    echo "-- dump"; [[ -n "${DUMP_INCOMPLETE:-}" ]] || echo "-- PostgreSQL database dump complete" ;;
  "exec -T db sh -c "*psql*)
    sql="$(cat)"
    case "$sql" in
      *to_regclass*) echo "${MIGRATIONS_TABLE:-t}" ;;
      *round*) printf '%b' "${DECIMALS:-0\n0\n0\n}" ;;
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
# run <arguments> : lance le script dans un dossier neuf ; résultat dans $CODE, $OUT, $CALLS
run() {
  WORK="$(mktemp -d)"; CALLS="$WORK/calls"; : > "$CALLS"
  touch "$WORK/docker-compose.prod.yml"
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

scenario "--redeploy sans nouveau commit"
GIT_NEW="" run --redeploy
check "code 0" test "$CODE" -eq 0
check "sauvegarde quand même" called "pg_dump"
check "force la recréation de l'API et du client" called "up -d --no-deps --force-recreate api client"

scenario "option inconnue"
run --force
check "code 2 (usage)" test "$CODE" -eq 2
check "aucune commande lancée" test ! -s "$CALLS"

echo
echo "$PASSED vérifications réussies, $FAILED en échec."
rm -rf "$STUBS"
[[ "$FAILED" -eq 0 ]]
