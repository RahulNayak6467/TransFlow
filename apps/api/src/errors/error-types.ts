import type { ErrorCode } from "./error-codes.js";

export type AppErrorOptions = {
    code: ErrorCode;
    message: string;
    statusCode: number;
    retryable?: boolean;
    details?: Record<string, unknown>;
    cause?: unknown;
  };
