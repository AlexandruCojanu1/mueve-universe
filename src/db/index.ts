import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// `prepare: false` is required when hitting Neon's pooled (PgBouncer transaction-mode) endpoint.
// Harmless for direct/local Postgres. Without it, prepared statements can fail on the pooler.
const client = postgres(connectionString, {
  max: 10,
  prepare: false,
});

export const db = drizzle(client, { schema });
export { schema };
