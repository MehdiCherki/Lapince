if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

if (!process.env.ALLOWED_ORIGINS) {
  throw new Error("ALLOWED_ORIGINS environment variable is required");
}

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is required");
}

if (!process.env.REDIS_PASSWORD) {
  throw new Error("REDIS_PASSWORD environment variable is required");
}

// Préfixe des clés du limiteur de tentatives. Les tests d'intégration en prennent un par fichier.
// L'utilisateur Redis n'a accès qu'aux clés rl:* (redis/start.sh) : un autre préfixe ferait échouer
// chaque compteur, et le limiteur laisserait alors tout passer. On refuse donc de démarrer.
const rateLimitPrefix = process.env.RATE_LIMIT_PREFIX ?? "rl:";
if (!rateLimitPrefix.startsWith("rl:")) {
  throw new Error("RATE_LIMIT_PREFIX must start with rl:");
}

export const config = {
  port: parseInt(process.env.PORT || "3007"),
  allowedOrigins: process.env.ALLOWED_ORIGINS.split(","),
  isProd: process.env.NODE_ENV !== "development",
  jwtSecret: process.env.JWT_SECRET,
  logLevel: process.env.LOG_LEVEL || "info",
  logServiceHost: process.env.LOGS_SERVICE_HOST || "localhost",
  logServicePort: parseInt(process.env.LOGS_SERVICE_PORT || "3500"),
  redisUrl: process.env.REDIS_URL,
  redisPassword: process.env.REDIS_PASSWORD,
  rateLimitPrefix,
};
