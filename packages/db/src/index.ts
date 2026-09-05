import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { env } from "@transflow/config";
import { loggerConfig } from "@transflow/logger";

const logger = loggerConfig(env.NODE_ENV, env.LOG_LEVEL, "database");

export const db: Pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
  idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
  statement_timeout: env.DB_STATEMENT_TIMEOUT_MS,
  application_name: "transflow-api",
});

db.on("connect", () => {
  logger.debug(
    { totalCount: db.totalCount },
    "PostgreSQL pool established a connection",
  );
})

db.on("error", (error) => {
  logger.error(
    {
      err: error,
      totalCount: db.totalCount,
      idleCount: db.idleCount,
      waitingCount: db.waitingCount,
    },
    "Unexpected error on an idle PostgreSQL connection",
  );
})

export const query = async <T extends QueryResultRow>(text: string, values: readonly unknown[] = []): Promise<QueryResult<T>> => {
  return db.query<T>(text, [...values]);
};

export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await db.query("SELECT 1");
    return true;
  }
  catch (error) {
    logger.warn({ err: error }, "PostgreSQL readiness check failed");
    return false;
  }
}

let closePromise: Promise<void> | undefined;

export const closeDatabase = (): Promise<void> => {
  closePromise ??= db.end();
  return closePromise;
}
