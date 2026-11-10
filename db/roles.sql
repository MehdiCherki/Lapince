-- Comptes PostgreSQL de La Pince et leurs droits (0.9.7). Détail : docs/base-de-donnees.md,
-- section « Comptes et droits ».
--
--   administrateur (POSTGRES_USER) : superutilisateur ; administration seulement (ce script,
--                                    sauvegardes). L'API ne s'y connecte plus.
--   lapince_owner : propriétaire des objets du schéma public ; migrations et seed.
--   lapince_app   : l'API en fonctionnement ; lit et écrit les données, rien d'autre.
--
-- Exécuté par l'administrateur avec psql, sur chaque base de l'application (lapince et
-- lapince_test en développement, la base de prod) ; sur un volume neuf, par l'image postgres
-- elle-même (docker-entrypoint-initdb.d). Idempotent : il se relance sans risque et remet les
-- droits dans l'état décrit ici. Tout ou rien : une seule transaction.
--
-- Mots de passe : lus dans l'environnement de psql (\getenv), jamais écrits dans ce fichier ni
-- sur une ligne de commande (que « ps » affiche) :
--   LAPINCE_OWNER_PASSWORD, LAPINCE_APP_PASSWORD
-- Obligatoires à la création d'un rôle ; ensuite facultatifs (fournis, ils remplacent l'ancien).
-- 32 caractères au moins, sans caractère à encoder dans une adresse de connexion :
-- openssl rand -hex 32

\set ON_ERROR_STOP on
\set QUIET on
-- Une erreur n'affiche que son message, jamais la requête, qui peut contenir un mot de passe
\set VERBOSITY terse
\set SHOW_CONTEXT never
-- Ni le journal du serveur : aucune requête de cette session n'y est écrite, même en erreur
SET log_statement = 'none';
SET log_min_error_statement = 'panic';
SET log_min_duration_statement = -1;

\getenv owner_password LAPINCE_OWNER_PASSWORD
\getenv app_password LAPINCE_APP_PASSWORD
-- Vide = absent (Compose transmet vide une variable qui manque au .env)
\if :{?owner_password}
  SELECT :'owner_password' = '' AS owner_password_empty \gset
  \if :owner_password_empty
    \unset owner_password
  \endif
\endif
\if :{?app_password}
  SELECT :'app_password' = '' AS app_password_empty \gset
  \if :app_password_empty
    \unset app_password
  \endif
\endif

-- --- Contrôles préalables -----------------------------------------------------------------
SELECT rolsuper AS is_superuser,
       current_database() NOT IN ('postgres', 'template0', 'template1') AS is_app_database,
       NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'lapince_owner') AS owner_missing,
       NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'lapince_app') AS app_missing
FROM pg_roles WHERE rolname = current_user \gset

\if :is_superuser
\else
  DO $$ BEGIN RAISE EXCEPTION 'à exécuter avec l''administrateur (superutilisateur)'; END $$;
\endif
\if :is_app_database
\else
  DO $$ BEGIN RAISE EXCEPTION 'base système : choisir une base de l''application (psql -d)'; END $$;
\endif

\if :{?owner_password}
  SELECT :'owner_password' ~ '^[A-Za-z0-9._~-]{32,}$' AS owner_password_ok \gset
  \if :owner_password_ok
  \else
    DO $$ BEGIN RAISE EXCEPTION 'LAPINCE_OWNER_PASSWORD : 32 caractères au moins, parmi A-Z a-z 0-9 . _ ~ -'; END $$;
  \endif
\elif :owner_missing
  DO $$ BEGIN RAISE EXCEPTION 'LAPINCE_OWNER_PASSWORD manquant : obligatoire pour créer le rôle lapince_owner'; END $$;
\endif

\if :{?app_password}
  SELECT :'app_password' ~ '^[A-Za-z0-9._~-]{32,}$' AS app_password_ok \gset
  \if :app_password_ok
  \else
    DO $$ BEGIN RAISE EXCEPTION 'LAPINCE_APP_PASSWORD : 32 caractères au moins, parmi A-Z a-z 0-9 . _ ~ -'; END $$;
  \endif
  \if :{?owner_password}
    SELECT :'app_password' = :'owner_password' AS same_passwords \gset
    \if :same_passwords
      DO $$ BEGIN RAISE EXCEPTION 'LAPINCE_APP_PASSWORD et LAPINCE_OWNER_PASSWORD doivent différer'; END $$;
    \endif
  \endif
\elif :app_missing
  DO $$ BEGIN RAISE EXCEPTION 'LAPINCE_APP_PASSWORD manquant : obligatoire pour créer le rôle lapince_app'; END $$;
\endif

BEGIN;

-- --- 1. Rôles ---------------------------------------------------------------------------------
-- Aucun attribut d'administration : ni superutilisateur, ni création de base ou de rôle, ni
-- réplication, ni contournement des politiques de sécurité par ligne.
SELECT 'CREATE ROLE lapince_owner' WHERE :'owner_missing'::boolean \gexec
SELECT 'CREATE ROLE lapince_app' WHERE :'app_missing'::boolean \gexec
ALTER ROLE lapince_owner WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER ROLE lapince_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
-- Mot de passe envoyé au serveur, qui n'en garde que l'empreinte (SCRAM-SHA-256, défaut de PostgreSQL 17)
\if :{?owner_password}
  ALTER ROLE lapince_owner PASSWORD :'owner_password';
\endif
\if :{?app_password}
  ALTER ROLE lapince_app PASSWORD :'app_password';
\endif

-- --- 2. Base ----------------------------------------------------------------------------------
-- Par défaut, tout rôle (PUBLIC) peut se connecter à une base et y créer des tables temporaires.
-- Ici, seuls les deux rôles de l'application s'y connectent (l'administrateur, superutilisateur,
-- garde tous les droits).
-- CREATE (créer un schéma, pas une base) pour le propriétaire : la migration 0_init commence par
-- CREATE SCHEMA IF NOT EXISTS "public", et PostgreSQL vérifie ce droit avant de regarder si le
-- schéma existe. Sans lui, une base neuve (CI, volume neuf) ne peut pas être migrée.
SELECT format('REVOKE ALL ON DATABASE %I FROM PUBLIC, lapince_owner, lapince_app', current_database()) \gexec
SELECT format('GRANT CONNECT, CREATE ON DATABASE %I TO lapince_owner', current_database()) \gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO lapince_app', current_database()) \gexec

-- --- 3. Schéma public -------------------------------------------------------------------------
-- Déjà le comportement par défaut depuis PostgreSQL 15 (ici 17) ; écrit pour être explicite et
-- pour une base venue d'une version antérieure, qui garde l'ancien droit.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO lapince_owner;
GRANT USAGE ON SCHEMA public TO lapince_app;

-- --- 4. Propriété des objets existants --------------------------------------------------------
-- REASSIGN OWNED BY <administrateur> est refusé : le superutilisateur d'amorçage (créé par
-- l'image, POSTGRES_USER) possède aussi les objets du système (catalogue pg_catalog,
-- information_schema…), que PostgreSQL ne laisse pas transférer (« required by the database
-- system »). D'où un transfert objet par objet, limité au schéma public.
DO $$
DECLARE
  obj record;
BEGIN
  -- Tables : leurs index et les séquences de leurs colonnes (id) suivent ; une séquence liée
  -- ne peut pas changer de propriétaire seule
  FOR obj IN
    SELECT c.oid::regclass AS name FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
      AND pg_get_userbyid(c.relowner) <> 'lapince_owner'
  LOOP
    EXECUTE format('ALTER TABLE %s OWNER TO lapince_owner', obj.name);
  END LOOP;
  -- Séquences indépendantes, s'il y en a (les autres ont suivi leur table)
  FOR obj IN
    SELECT c.oid::regclass AS name FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'S'
      AND pg_get_userbyid(c.relowner) <> 'lapince_owner'
  LOOP
    EXECUTE format('ALTER SEQUENCE %s OWNER TO lapince_owner', obj.name);
  END LOOP;
  -- Types énumérés (category_type, period_type)
  FOR obj IN
    SELECT t.oid::regtype AS name FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e'
      AND pg_get_userbyid(t.typowner) <> 'lapince_owner'
  LOOP
    EXECUTE format('ALTER TYPE %s OWNER TO lapince_owner', obj.name);
  END LOOP;
END
$$;

-- --- 5. Droits de l'API -----------------------------------------------------------------------
-- Remis à zéro puis accordés : le script fixe l'état exact, même si un droit a été ajouté à la main.
-- Ni TRUNCATE, ni REFERENCES, ni TRIGGER ; aucun DDL (seul le propriétaire modifie une table).
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM lapince_app;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM lapince_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lapince_app;
-- USAGE : nextval (identifiants) ; SELECT : currval. Pas UPDATE (setval).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lapince_app;
-- Historique des migrations : réservé au propriétaire
SELECT 'REVOKE ALL ON TABLE public._prisma_migrations FROM lapince_app'
WHERE to_regclass('public._prisma_migrations') IS NOT NULL \gexec

-- Tables et séquences créées plus tard par les migrations (rôle lapince_owner) : mêmes droits,
-- accordés automatiquement. Prisma crée _prisma_migrations sur une base neuve : la migration
-- 20261110120000_private_migrations_table retire alors ce droit.
ALTER DEFAULT PRIVILEGES FOR ROLE lapince_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lapince_app;
ALTER DEFAULT PRIVILEGES FOR ROLE lapince_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO lapince_app;

-- --- 6. Contrôle ------------------------------------------------------------------------------
-- La transaction échoue si l'état obtenu n'est pas celui attendu
DO $$
DECLARE
  bad text;
BEGIN
  SELECT string_agg(rolname, ', ') INTO bad FROM pg_roles
  WHERE rolname IN ('lapince_owner', 'lapince_app')
    AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR NOT rolcanlogin);
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'attributs inattendus : %', bad; END IF;

  SELECT string_agg(rolname, ', ') INTO bad FROM pg_authid
  WHERE rolname IN ('lapince_owner', 'lapince_app') AND rolpassword IS NULL;
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'rôle sans mot de passe : %', bad; END IF;

  SELECT string_agg(c.relname, ', ') INTO bad FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'S')
    AND pg_get_userbyid(c.relowner) <> 'lapince_owner';
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'objets sans le bon propriétaire : %', bad; END IF;

  SELECT string_agg(c.relname, ', ') INTO bad FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relname <> '_prisma_migrations'
    AND NOT (has_table_privilege('lapince_app', c.oid, 'SELECT')
             AND has_table_privilege('lapince_app', c.oid, 'INSERT')
             AND has_table_privilege('lapince_app', c.oid, 'UPDATE')
             AND has_table_privilege('lapince_app', c.oid, 'DELETE'));
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'tables sans les droits de l''API : %', bad; END IF;

  SELECT string_agg(c.relname, ', ') INTO bad FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
    AND (has_table_privilege('lapince_app', c.oid, 'TRUNCATE, REFERENCES, TRIGGER')
         OR (c.relname = '_prisma_migrations'
             AND has_table_privilege('lapince_app', c.oid, 'SELECT, INSERT, UPDATE, DELETE')));
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'droits en trop pour l''API : %', bad; END IF;

  IF has_schema_privilege('lapince_app', 'public', 'CREATE')
     OR has_database_privilege('lapince_app', current_database(), 'CREATE, TEMPORARY') THEN
    RAISE EXCEPTION 'lapince_app peut créer des objets (schéma public ou base)';
  END IF;
END
$$;

COMMIT;

-- Rôles (sans les mots de passe : seulement s'ils existent)
SELECT r.rolname AS role, r.rolsuper AS superutilisateur, r.rolcreatedb AS createdb,
       r.rolcreaterole AS createrole, r.rolcanlogin AS connexion,
       a.rolpassword IS NOT NULL AS mot_de_passe
FROM pg_roles r JOIN pg_authid a ON a.oid = r.oid
WHERE r.rolname IN ('lapince_owner', 'lapince_app', current_user)
ORDER BY r.rolsuper DESC, r.rolname;

-- Propriétaire et droits de l'API, objet par objet
SELECT c.relname AS objet,
       CASE c.relkind WHEN 'S' THEN 'séquence' ELSE 'table' END AS type,
       pg_get_userbyid(c.relowner) AS proprietaire,
       coalesce((SELECT string_agg(p.privilege_type, ', ' ORDER BY p.privilege_type)
                 FROM aclexplode(c.relacl) p
                 WHERE p.grantee = 'lapince_app'::regrole), '—') AS droits_lapince_app
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'S')
UNION ALL
SELECT t.typname, 'type', pg_get_userbyid(t.typowner), 'USAGE (PUBLIC)'
FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' AND t.typtype = 'e'
ORDER BY type, objet;
