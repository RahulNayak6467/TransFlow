import { type Request, type Response, type NextFunction } from "express"
import { AppError } from "../errors/app-error.js"
import type { BaseError } from "../types/error-types/base-error.types.js";
import type { ErrorCode } from "../errors/error-codes.js";

export const handleError = (error: unknown, req: Request, res: Response, next: NextFunction) => {

  const isHeadersSent = res.headersSent;

  if (isHeadersSent) return next(error);

  const requestId = req.requestId as string;

  if (error instanceof AppError) {
    const baseErrorResponse: BaseError = {
      code: error.code,
      message: error.message,
      requestId,
    }

    const errorResponse = error.details !== undefined ? { ...baseErrorResponse, details: error.details } : { ...baseErrorResponse };

    return res.status(error.statusCode).json({ error: errorResponse });
  }
  else if (typeof error === 'object' && error !== null && "type" in error && error.type === "entity.parse.failed") {
    const baseErrorResponse: BaseError = {
      code: "INVALID_JSON",
      message: "Request body contains invalid JSON",
      requestId: requestId,
    }

    return res.status(400).json({ error: baseErrorResponse });
  }
  else if (typeof error === "object" && error !== null && "type" in error && error.type === "entity.too.large") {
    const baseErrorResponse: BaseError = {
      code: "PAYLOAD_TOO_LARGE",
      message: "Request body exceeds the allowed size",
      requestId: requestId,
    }

    return res.status(413).json({ error: baseErrorResponse });
  }
  else if (error instanceof Error) {
    const baseErrorResponse: BaseError = {
      code:  "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      requestId,
    }
    req.log.error(
      {
        err: error,
        errorCode: baseErrorResponse.code
      },
      "Unexpected request error"
    )
    return res.status(500).json({
      error: baseErrorResponse
    })
  }
  else {
    const baseErrorResponse: BaseError = {
      code:  "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      requestId,
    }
    req.log.error({
      thrownType: typeof error,
      errorCode: baseErrorResponse.code
    },
    "Non-Error value reached error middleware"
    )
    return res.status(500).json({
      error: baseErrorResponse
    })
  }
}
