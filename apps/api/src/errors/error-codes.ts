  export const ERROR_CODES = {
    ROUTE_NOT_FOUND: "ROUTE_NOT_FOUND",
    INVALID_JSON: "INVALID_JSON",
    PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
    INTERNAL_ERROR: "INTERNAL_ERROR",
  } as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
