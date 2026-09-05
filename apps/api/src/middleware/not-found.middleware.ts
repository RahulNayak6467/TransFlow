import { type Request, type Response, type NextFunction } from "express"
import { AppError } from "../errors/app-error.js"
import type { AppErrorOptions } from "../errors/error-types.js";

export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const notFoundError: AppErrorOptions = {
    code: "ROUTE_NOT_FOUND",
    message: "The requested route does not exist",
    statusCode: 404,
    retryable: false,
  }

  next(new AppError(notFoundError));
}
