import type { ErrorCode } from "../../errors/error-codes.js";

export interface BaseError {
  code: ErrorCode,
  message: string,
  requestId: string,
}
