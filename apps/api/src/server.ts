import app from "./app.ts";
import { logger } from "./lib/logger.ts";

// Même calcul qu'avant le découpage (à unifier avec config.port : backlog #11)
const PORT = Number(process.env.PORT) || 3007;

app.listen(PORT, () => {
  logger.info(`🚀 Server started at http://localhost:${PORT}`);
});
