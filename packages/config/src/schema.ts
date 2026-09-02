import * as z from "zod";

export const envConfig = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"]),
  PORT: z
    .coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(5000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info")
})

export type envConfigType = z.infer<typeof envConfig>
