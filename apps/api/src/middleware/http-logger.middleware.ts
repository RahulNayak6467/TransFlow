import { type Request, type Response } from "express"
import { loggerConfig } from "@transflow/logger";
import crypto from "crypto"
import { pinoHttp } from "pino-http";
import { env } from "@transflow/config";

const generateRequestId = (req: Request, res: Response) => {
  const requestID = req.headers['x-request-id'] || crypto.randomUUID();

  req.requestId = requestID as string;

  res.setHeader('x-request-id', requestID);

  return requestID;
}

const logger = loggerConfig(env.NODE_ENV, env.LOG_LEVEL, 'http-logger-service');

export const httpLogger = pinoHttp({
  logger,
  genReqId: generateRequestId,
  quietReqLogger: true,
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    else if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
  customAttributeKeys: {
    reqId: "requestId",
  }
})
