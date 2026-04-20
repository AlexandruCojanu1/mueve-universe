import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

// Migrations (DDL) prefer the direct/unpooled connection — PgBouncer transaction mode
// doesn't handle DDL well. On Vercel Marketplace, Neon exposes DATABASE_URL_UNPOOLED.
// Locally or on other providers we fall back to DATABASE_URL.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL (or DATABASE_URL_UNPOOLED) is not set");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
