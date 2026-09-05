import type { ErrorCode } from "./error-codes.js";
import type { AppErrorOptions } from "./error-types.js";

export class AppError extends Error{
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>
  constructor(options: AppErrorOptions) {
    super(options.message,
     options.cause === undefined ? undefined : {cause: options.cause});

    if (!Number.isInteger(options.statusCode) || options.statusCode < 400 || options.statusCode > 599) {
      throw new RangeError("AppError statusCode must be an integer between 400 and 599");
    }

    this.statusCode = options.statusCode;
    this.code = options.code;
    this.name = "App Error";
    this.cause = options.cause;
    this.retryable = options.retryable ?? false;

    if (options.details !== undefined) {
      this.details = options.details;
    }
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
