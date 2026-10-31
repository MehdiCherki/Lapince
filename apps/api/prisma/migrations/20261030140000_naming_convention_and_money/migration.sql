-- Convention de nommage en base + argent au centime près.
--   Tables au pluriel, colonnes en snake_case, clés étrangères <entité>_id, types énumérés en snake_case.
--   Montants : DECIMAL(12, 2).
-- Écrite à la main : uniquement des RENAME et des changements de type, AUCUNE donnée supprimée.
-- (Prisma, qui ne détecte pas les renommages, aurait généré DROP + ADD : colonnes et table vidées.)
-- Les noms côté code (champs Prisma, API) ne changent pas : voir les @map / @@map de schema.prisma.

-- Types énumérés
ALTER TYPE "PeriodType" RENAME TO "period_type";
ALTER TYPE "CategoryType" RENAME TO "category_type";

-- category -> categories (avec sa séquence, sa clé primaire et son index d'unicité)
ALTER TABLE "category" RENAME TO "categories";
ALTER SEQUENCE "category_id_seq" RENAME TO "categories_id_seq";
ALTER TABLE "categories" RENAME CONSTRAINT "category_pkey" TO "categories_pkey";
ALTER INDEX "category_name_key" RENAME TO "categories_name_key";

-- users
ALTER TABLE "users" RENAME COLUMN "emailVerified" TO "email_verified";
ALTER TABLE "users" RENAME COLUMN "emailVerificationToken" TO "email_verification_token";
ALTER TABLE "users" RENAME COLUMN "passwordResetTokenHash" TO "password_reset_token_hash";
ALTER TABLE "users" RENAME COLUMN "passwordResetExpiresAt" TO "password_reset_expires_at";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER INDEX "users_passwordResetTokenHash_key" RENAME TO "users_password_reset_token_hash_key";

-- refresh_tokens
ALTER TABLE "refresh_tokens" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "refresh_tokens" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "refresh_tokens" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "refresh_tokens" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "refresh_tokens" RENAME CONSTRAINT "refresh_tokens_userId_fkey" TO "refresh_tokens_user_id_fkey";

-- transactions
ALTER TABLE "transactions" RENAME COLUMN "iduser" TO "user_id";
ALTER TABLE "transactions" RENAME COLUMN "idcategory" TO "category_id";
ALTER TABLE "transactions" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "transactions" RENAME CONSTRAINT "transactions_iduser_fkey" TO "transactions_user_id_fkey";
ALTER TABLE "transactions" RENAME CONSTRAINT "transactions_idcategory_fkey" TO "transactions_category_id_fkey";
ALTER INDEX "transactions_iduser_idx" RENAME TO "transactions_user_id_idx";
ALTER INDEX "transactions_iduser_date_idx" RENAME TO "transactions_user_id_date_idx";

-- budgets (limit_amount : nombre à virgule flottante -> DECIMAL(12, 2))
ALTER TABLE "budgets" RENAME COLUMN "id_category" TO "category_id";
ALTER TABLE "budgets" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "budgets" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "budgets" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "budgets" ALTER COLUMN "limit_amount" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "budgets" RENAME CONSTRAINT "budgets_userId_fkey" TO "budgets_user_id_fkey";
ALTER TABLE "budgets" RENAME CONSTRAINT "budgets_id_category_fkey" TO "budgets_category_id_fkey";
ALTER INDEX "budgets_userId_idx" RENAME TO "budgets_user_id_idx";
ALTER INDEX "budgets_userId_id_category_key" RENAME TO "budgets_user_id_category_id_key";

-- alerts
ALTER TABLE "alerts" RENAME COLUMN "exceededAmount" TO "exceeded_amount";
ALTER TABLE "alerts" RENAME COLUMN "isRead" TO "is_read";
ALTER TABLE "alerts" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "alerts" RENAME COLUMN "categoryId" TO "category_id";
ALTER TABLE "alerts" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "alerts" ALTER COLUMN "exceeded_amount" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "alerts" RENAME CONSTRAINT "alerts_userId_fkey" TO "alerts_user_id_fkey";
ALTER TABLE "alerts" RENAME CONSTRAINT "alerts_categoryId_fkey" TO "alerts_category_id_fkey";
ALTER INDEX "alerts_userId_idx" RENAME TO "alerts_user_id_idx";
