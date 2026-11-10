-- Comptes PostgreSQL séparés (0.9.7) : l'API (rôle lapince_app) n'a aucun accès à l'historique
-- des migrations. Ses droits sur les tables lui viennent des privilèges par défaut du rôle
-- propriétaire (db/roles.sql) ; sur une base neuve, ils s'appliquent aussi à _prisma_migrations,
-- que Prisma crée juste avant de jouer les migrations. Celle-ci les retire.
-- Sans effet sur une base existante (db/roles.sql les a déjà retirés), sur une base sans rôle
-- lapince_app (sans comptes séparés) et sur la base shadow de prisma migrate dev (qui rejoue les
-- migrations sans créer _prisma_migrations).
-- Écrite à la main : Prisma ne représente pas les droits.

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'lapince_app')
     AND to_regclass('"_prisma_migrations"') IS NOT NULL THEN
    REVOKE ALL ON TABLE "_prisma_migrations" FROM lapince_app;
  END IF;
END
$$;
