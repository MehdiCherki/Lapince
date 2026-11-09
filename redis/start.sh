#!/bin/sh
# Démarrage de Redis : stockage clé/valeur des compteurs du limiteur de tentatives de l'API.
# Même script en développement, en CI, pour le test de charge et en production.
#
# Sécurité :
#   - utilisateur « default » désactivé : aucune commande sans authentification ;
#   - un seul utilisateur, lapince_app (celui de l'API), limité aux clés rl:* et aux commandes
#     du limiteur : SCRIPT LOAD et EVALSHA (script Lua de rate-limit-redis, qui appelle GET, SET,
#     INCR et PTTL), DECR, DEL, et PING pour le healthcheck. Tout le reste est refusé (NOPERM),
#     dont FLUSHALL, CONFIG, KEYS, EVAL et SHUTDOWN ;
#   - mot de passe lu dans REDIS_PASSWORD et écrit dans un fichier d'ACL lisible par le seul
#     utilisateur redis : jamais sur la ligne de commande, que « ps » affiche sur l'hôte.
# Compteurs éphémères (fenêtres de 15 min à 1 h) : aucune persistance sur disque.
# Mémoire bornée à 32 Mo : si elle est pleine, Redis efface d'abord les compteurs les plus proches
# de leur expiration (volatile-ttl), au lieu de refuser les écritures.
set -eu

: "${REDIS_PASSWORD:?REDIS_PASSWORD manquant}"
case "$REDIS_PASSWORD" in
  *[[:space:]]*) echo "REDIS_PASSWORD ne doit contenir aucun espace" >&2; exit 1 ;;
esac
if [ "${#REDIS_PASSWORD}" -lt 16 ]; then
  echo "REDIS_PASSWORD trop court (16 caractères au moins)" >&2
  exit 1
fi

ACL_FILE=/tmp/users.acl
umask 077
cat > "$ACL_FILE" <<EOF
user default off
user lapince_app on >$REDIS_PASSWORD resetkeys ~rl:* resetchannels -@all +ping +script|load +evalsha +get +set +incr +pttl +decr +del
EOF
chown redis:redis "$ACL_FILE"
# Redis lit le mot de passe dans le fichier : inutile de le laisser dans son environnement
unset REDIS_PASSWORD

# docker-entrypoint.sh de l'image officielle : lance Redis sous l'utilisateur redis, pas root
exec docker-entrypoint.sh redis-server \
  --aclfile "$ACL_FILE" \
  --save "" --appendonly no \
  --maxmemory 32mb --maxmemory-policy volatile-ttl
