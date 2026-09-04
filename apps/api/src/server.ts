import { env } from "@transflow/config";
import { createApp } from "./app.js";
import { loggerConfig } from "@transflow/logger";
import router from "./routes/index.js";
import healthRoute from "./health/health.routes.js";

const PORT = env.PORT;
const app = createApp(router, healthRoute);
const logger = loggerConfig(env.NODE_ENV, env.LOG_LEVEL,"api-start-service");

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, "Express server started");
})

let shuttingDown = false;
const shutdown = (signal: "SIGTERM" | "SIGINT") => {
  if (shuttingDown) return;
  logger.info(`received ${signal}, shutting down`);

  const force = setTimeout(() => process.exit(1), 10_000);

  server.close(async () => {
    clearTimeout(force);
    process.exit(0);
  })
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"));
