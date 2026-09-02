import { env } from "@transflow/config";
import { loggerConfig } from "@transflow/logger"

const logger = loggerConfig(env.NODE_ENV, env.LOG_LEVEL, "api");

logger.info("API logger initialized");
