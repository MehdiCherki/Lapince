import app from "./app.ts";
import { logger } from "./lib/logger.ts";
import { disconnectRedis } from "./lib/redis.ts";

// Même calcul qu'avant le découpage (à unifier avec config.port : backlog #11)
const PORT = Number(process.env.PORT) || 3007;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server started at http://localhost:${PORT}`);
});

// Arrêt propre (docker stop, Ctrl+C) : plus de nouvelle connexion, puis fermeture de Redis
// une fois les commandes en cours terminées
async function shutdown(signal: NodeJS.Signals) {
  logger.info(`${signal} reçu : arrêt de l'API`);
  server.close();
  await disconnectRedis();
  process.exit(0);
}
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
