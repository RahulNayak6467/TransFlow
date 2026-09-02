import { envConfig } from "./schema.js";

const parsed = envConfig.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  console.error(`❌ Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env = parsed.data;
