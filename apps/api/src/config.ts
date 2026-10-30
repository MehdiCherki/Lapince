if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

if (!process.env.ALLOWED_ORIGINS) {
  throw new Error("ALLOWED_ORIGINS environment variable is required");
}

export const config = {
  port: parseInt(process.env.PORT || "3007"),
  allowedOrigins: process.env.ALLOWED_ORIGINS.split(","),
  isProd: process.env.NODE_ENV !== "development",
  jwtSecret: process.env.JWT_SECRET,
  logLevel: process.env.LOG_LEVEL || "info",
  logServiceHost: process.env.LOGS_SERVICE_HOST || "localhost",
  logServicePort: parseInt(process.env.LOGS_SERVICE_PORT || "3500"),
};
