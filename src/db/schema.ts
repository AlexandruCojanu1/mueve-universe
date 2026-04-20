import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

// Global site theme (single row, id="default")
export const theme = pgTable("theme", {
  id: text("id").primaryKey().default("default"),
  colors: jsonb("colors").$type<Record<string, string>>().notNull(),
  fonts: jsonb("fonts").$type<{ heading: string; body: string }>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ordered list of page sections
export const sections = pgTable("sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  order: integer("order").notNull(),
  visible: boolean("visible").notNull().default(true),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Admin users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Theme = typeof theme.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
export type User = typeof users.$inferSelect;
