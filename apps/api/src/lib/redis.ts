import { createClient } from "@redis/client";
import { config } from "../config.ts";
import { logger } from "./logger.ts";

// Redis : stockage clé/valeur des compteurs du limiteur de tentatives (rate-limit.middleware.ts).
// Utilisateur ACL dédié, créé par redis/start.sh : seules les commandes du limiteur, sur les clés rl:*.
export const redis = createClient({
  // Hôte et port seulement : le mot de passe est passé à part, jamais écrit dans une adresse
  url: config.redisUrl,
  username: "lapince_app",
  password: config.redisPassword,
  // Redis injoignable : chaque commande échoue aussitôt au lieu d'attendre la reconnexion dans une file.
  // Le limiteur laisse alors passer la requête sans la ralentir (passOnStoreError).
  disableOfflineQueue: true,
  // Pas de commandes d'identification du client ni de notifications de maintenance (Redis Enterprise) :
  // l'utilisateur ACL n'a pas à les autoriser
  disableClientInfo: true,
  maintNotifications: "disabled",
});

// Sans écouteur, une erreur de connexion arrêterait le processus. L'erreur seule est journalisée,
// jamais la configuration du client (qui contient le mot de passe).
redis.on("error", (err: unknown) => {
  logger.error({ err }, "Redis : erreur de connexion");
});
redis.on("ready", () => {
  logger.info("Redis : connecté");
});

// Connexion avant la création des limiteurs, qui chargent leur script Lua dès l'import.
// Redis absent au démarrage : l'API attend, avec un nouvel essai toutes les 2 s au plus.
// Ensuite, après une coupure, le client se reconnecte seul.
await redis.connect();

// Arrêt propre : attend la réponse des commandes en cours, puis ferme la connexion
export async function disconnectRedis(): Promise<void> {
  if (redis.isOpen) await redis.close();
}
