#!/bin/sh
# Démarrage de l'API dans son conteneur, en deux temps, chacun avec son compte PostgreSQL (0.9.7) :
#   1. migrations puis seed, avec le rôle propriétaire du schéma, lapince_owner
#      (MIGRATION_DATABASE_URL, lue par prisma.config.ts et prisma/seed.ts) ;
#   2. le serveur, avec le rôle applicatif, lapince_app (DATABASE_URL, lue par src/lib/prisma.ts),
#      qui lit et écrit les données mais ne peut modifier aucune table.
# Arguments : la commande du serveur (node dist/server.js en production, npm run dev en développement).
# exec : le serveur remplace ce shell et reçoit directement le signal d'arrêt de Docker.
# Aucune adresse de connexion n'est affichée : elles contiennent les mots de passe.
set -eu

: "${MIGRATION_DATABASE_URL:?MIGRATION_DATABASE_URL manquante (rôle lapince_owner)}"
: "${DATABASE_URL:?DATABASE_URL manquante (rôle lapince_app)}"
[ "$#" -gt 0 ] || { echo "Usage : docker-start.sh <commande du serveur>" >&2; exit 2; }

npx prisma migrate deploy
npx prisma db seed
exec "$@"
