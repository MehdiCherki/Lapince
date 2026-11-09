-- Une seule alerte par utilisateur et par catégorie (règle RG6) : la base le garantit désormais,
-- en plus du verrou de withAlertRefresh, qui reste nécessaire pour calculer la somme des dépenses
-- sur des données à jour. Défense en profondeur : une écriture qui contournerait le service
-- est refusée par la base.
-- Écrite à la main : les alertes sont des données dérivées, recalculées à chaque écriture et à
-- chaque lecture. D'éventuels doublons, antérieurs au verrou, sont d'abord supprimés en gardant
-- l'alerte la plus récente de chaque couple, sans quoi l'index d'unicité ne pourrait pas être créé.

DELETE FROM "alerts" AS older
USING "alerts" AS newer
WHERE older."user_id" = newer."user_id"
  AND older."category_id" = newer."category_id"
  AND (older."created_at", older."id") < (newer."created_at", newer."id");

-- CreateIndex
CREATE UNIQUE INDEX "alerts_user_id_category_id_key" ON "alerts"("user_id", "category_id");
