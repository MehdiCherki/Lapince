import pino from "pino";
import { config } from "../config.ts";

export const logger = pino({
  level: config.logLevel,
  serializers: { err: pino.stdSerializers.err },
  redact: ["err.body"],
  // pino-pretty seulement hors prod. Spread conditionnel plutôt que `transport: undefined` :
  // exactOptionalPropertyTypes (tsconfig) interdit de passer undefined à une option facultative
  ...(config.isProd
    ? {}
    : { transport: { target: "pino-pretty", options: { colorize: true } } }),
});
