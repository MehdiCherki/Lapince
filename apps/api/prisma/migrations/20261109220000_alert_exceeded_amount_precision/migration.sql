-- Le dépassement d'une alerte est une somme de dépenses moins une limite : il peut excéder le
-- montant maximal d'une seule dépense (DECIMAL(12, 2), moins de 10 milliards). Deux dépenses
-- maximales valides provoquaient donc une erreur 500 au calcul de l'alerte.
-- DECIMAL(15, 2) : au plus 999 999 999 999 999 centimes, soit moins que le plus grand entier
-- exact d'un nombre JavaScript (2^53 - 1) : le calcul en centimes reste exact sur toute la plage.
-- Au-delà, le service refuse l'écriture avec un 400 explicite.
-- Élargissement sans perte : aucune valeur existante ne change.

-- AlterTable
ALTER TABLE "alerts" ALTER COLUMN "exceeded_amount" SET DATA TYPE DECIMAL(15,2);
