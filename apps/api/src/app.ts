import express, {type Application} from "express";
import helmet from "helmet";
import { httpLogger } from "./middleware/http-logger.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { handleError } from "./middleware/error.middleware.js";

export const createApp = (router: express.Router, healthRoutes: express.Router) => {
  const app: Application = express();

  app.use(helmet());
  app.use(httpLogger);
  app.use("/health", healthRoutes);
  app.use(express.json({limit: "100kb"}));
  app.disable('x-powered-by');
  app.use("/api/v1", router);
  app.use(notFoundMiddleware);
  app.use(handleError);

  return app;
}
