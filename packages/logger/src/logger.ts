import pino from "pino";
import {env} from "@transflow/config"


export const loggerConfig = (environment: typeof env.NODE_ENV, logLevel: typeof env.LOG_LEVEL, serviceName: string) => {

const isProduction = environment === "production";
  const logger = pino({
    level: logLevel,
  formatters: {
    level: (label) => {
      return {severity: label.toUpperCase()}
    }
    },
  ...(!isProduction
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.1",
            ignore: "pid,hostname",
            messageFormat: "{msg}",
            colorizeObjects: true,
          },
        },
      }
    : {}),

  base: {
    service: serviceName,
    env: environment,
  },

  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err
  },

  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "secret",
      "authorization",
      "cookie",
      "email",
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.token",
      "req.body.accessToken",
      "req.body.refreshToken",
      "req.body.secret",
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.secret",
      "*.authorization",
      "*.cookie",
      "req.body.email",
      "*.email",
    ],
    ...(isProduction ? { remove: true } : { censor: "[REDACTED]" }),
  },

  timestamp: pino.stdTimeFunctions.isoTime,
   messageKey: "msg"
})

  return logger;
}
