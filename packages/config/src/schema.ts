import * as z from "zod";

export const envConfig = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"]),
  PORT: z
    .coerce
    .number()
    .int()
    .min(1, {
      error: "PORT number should be atleast 1"
    })
    .max(65535, {
      error: "PORT number should be atmost 65535"
    })
    .default(5000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DB_POOL_MAX: z
    .coerce
    .number()
    .int()
    .min(1, {
      error: "DB_POOL_MAX must be at least 1"
    })
    .max(100, {
      error: "DB_POOL_MAX must be at most 100"
    })
    .default(10),
  DB_CONNECTION_TIMEOUT_MS: z
    .coerce
    .number()
    .int()
    .min(100, {
      error: "DB_CONNECTION_TIMEOUT_MS should be atleast  100ms"
    })
    .max(30000,{
      error: "DB_CONNECTION_TIMEOUT_MS should be atmost 30000ms"
    })
    .default(5000),
  DB_IDLE_TIMEOUT_MS: z
    .coerce
    .number()
    .int()
    .min(1000, {
      error: "DB_IDLE_TIMEOUT_MS should be atleast 1000ms"
    })
    .max(300000,{
      error: "DB_IDLE_TIMEOUT_MS should be most 300000ms"
    })
    .default(30000),
  DB_STATEMENT_TIMEOUT_MS: z
    .coerce
    .number()
    .int()
    .min(100, {
      error: "DB_STATEMENT_TIMEOUT_MS should be atleast 100ms"
    })
    .max(60000,{
      error: "DB_STATEMENT_TIMEOUT_MS should be atmost 60000ms"
    })
    .default(10000),
  DATABASE_URL: z.url({ protocol: /^postgres(?:ql)?$/ }).refine((value) => {
    const url = new URL(value);
    return url.hostname.length > 0 && url.pathname.length > 1;
  },
    {
      message: "DATABASE_URL must contain a hostname and database name"
    }
  )
})

export type envConfigType = z.infer<typeof envConfig>
