import pino from "pino";
import { config } from "../config.js"

export const logger = pino ({
    level: config.logLevel,
    serializers: { err: pino.stdSerializers.err },
    redact: ["err.body"],
    transport: config.isProd
        ? undefined
        : { target: "pino-pretty", options: { colorize: true}}, 
});