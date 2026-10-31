-- Jetons de session et de confirmation d'email : seule leur empreinte SHA-256 est stockée,
-- comme le jeton de réinitialisation du mot de passe. Une fuite de la base ne donne plus aucun
-- jeton utilisable.
-- Écrite à la main : RENAME (Prisma aurait généré DROP + ADD), puis les jetons existants sont
-- hachés sur place. Le code hache le jeton reçu de la même façon (SHA-256 de son texte UTF-8,
-- en hexadécimal) : les sessions ouvertes et les liens de confirmation déjà envoyés restent valides.

-- refresh_tokens.token -> token_hash (avec son index d'unicité)
ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "token_hash";
ALTER INDEX "refresh_tokens_token_key" RENAME TO "refresh_tokens_token_hash_key";
UPDATE "refresh_tokens"
SET "token_hash" = encode(sha256(convert_to("token_hash", 'UTF8')), 'hex');

-- users.email_verification_token -> email_verification_token_hash
ALTER TABLE "users" RENAME COLUMN "email_verification_token" TO "email_verification_token_hash";
UPDATE "users"
SET "email_verification_token_hash" = encode(sha256(convert_to("email_verification_token_hash", 'UTF8')), 'hex')
WHERE "email_verification_token_hash" IS NOT NULL;
