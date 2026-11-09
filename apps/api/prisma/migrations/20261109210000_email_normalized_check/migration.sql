-- RG1 : l'email est unique sans distinction de casse. L'index d'unicité users_email_key porte sur
-- le texte tel qu'il est enregistré ; la contrainte CHECK impose qu'il soit enregistré normalisé
-- (en minuscules, sans espaces autour). Les deux réunies, la base garantit l'unicité sans
-- distinction de casse, même pour une écriture qui contournerait la validation de l'API.
-- Écrite à la main : Prisma ne représente pas les contraintes CHECK (voir schema.prisma).
-- 1. Normalise les emails existants (déjà fait par prisma/normalize-emails.sql : sans effet si
--    rien n'est à normaliser). Si deux comptes ne diffèrent que par la casse, l'index d'unicité
--    fait échouer la migration, qui ne modifie alors rien : régler le doublon à la main d'abord.
-- 2. Ajoute la contrainte.

UPDATE "users" SET "email" = lower(btrim("email")) WHERE "email" <> lower(btrim("email"));

ALTER TABLE "users" ADD CONSTRAINT "users_email_normalized_check" CHECK ("email" = lower(btrim("email")));
