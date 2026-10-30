-- Normalisation des emails existants (lot R4, emails insensibles à la casse)
-- À lancer UNE FOIS sur chaque base AVANT de déployer le code qui compare les emails en minuscules,
-- sinon les comptes enregistrés avec une majuscule ne pourraient plus se connecter.
-- Sans risque à relancer : ne modifie que les emails qui ne sont pas déjà normalisés.

-- 1. Contrôle : doit renvoyer 0 ligne. Sinon, STOP : deux comptes deviendraient identiques,
--    à régler à la main (garder le bon compte) avant l'étape 2.
SELECT lower(trim(email)) AS email_normalise, count(*) AS comptes
FROM users
GROUP BY lower(trim(email))
HAVING count(*) > 1;

-- 2. Normalisation
UPDATE users
SET email = lower(trim(email))
WHERE email <> lower(trim(email));
