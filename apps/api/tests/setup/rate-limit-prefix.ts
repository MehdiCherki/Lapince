import { randomUUID } from "node:crypto";

// Chaque fichier de test a ses propres compteurs dans Redis : les fichiers tournent en parallèle,
// et leurs requêtes viennent toutes de la même adresse (127.0.0.1). Clés rl:test:<uuid>:login:…,
// effacées par Redis à la fin de leur fenêtre : aucune suppression à faire, jamais de FLUSHALL.
// Premier fichier de setup, sans import de l'application : la configuration lit ce préfixe ensuite.
process.env.RATE_LIMIT_PREFIX = `rl:test:${randomUUID()}:`;
