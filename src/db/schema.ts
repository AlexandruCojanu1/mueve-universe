import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";

// ── Content ──
export const theme = pgTable("theme", {
  id: text("id").primaryKey().default("default"),
  colors: jsonb("colors").$type<Record<string, string>>().notNull(),
  fonts: jsonb("fonts").$type<{ heading: string; body: string }>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sections = pgTable("sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  order: integer("order").notNull(),
  visible: boolean("visible").notNull().default(true),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Auth + users ──
export const userRole = pgEnum("user_role", ["user", "coach", "admin", "partner"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  name: text("name"),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: userRole("role").notNull().default("user"),
  stripeCustomerId: text("stripe_customer_id"),
  qrToken: text("qr_token").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (a) => [primaryKey({ columns: [a.provider, a.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (v) => [primaryKey({ columns: [v.identifier, v.token] })],
);

// ── Stripe ──
export const subscriptionStatus = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePriceId: text("stripe_price_id"),
  stripeProductId: text("stripe_product_id"),
  planId: text("plan_id"),
  planName: text("plan_name"),
  status: subscriptionStatus("status").notNull(),
  currentPeriodStart: timestamp("current_period_start", { mode: "date" }),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Attendance ──
export const attendanceMethod = pgEnum("attendance_method", ["qr", "manual"]);

export const attendances = pgTable(
  "attendances",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slotId: text("slot_id").notNull(),
    slotDate: text("slot_date").notNull(),
    method: attendanceMethod("method").notNull().default("qr"),
    validatedAt: timestamp("validated_at").defaultNow().notNull(),
    validatedBy: uuid("validated_by").references(() => users.id),
    notes: text("notes"),
  },
  (a) => [primaryKey({ columns: [a.userId, a.slotId, a.slotDate] })],
);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeInvoiceId: text("stripe_invoice_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("ron"),
  status: text("status").notNull(),
  planId: text("plan_id"),
  planName: text("plan_name"),
  mode: text("mode"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Class credits (pass-gated access) ──
export const creditSource = pgEnum("credit_source", ["purchase", "pass_included"]);

export const classCredits = pgTable("class_credits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sourceType: creditSource("source_type").notNull().default("purchase"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  planId: text("plan_id"),
  planName: text("plan_name"),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  consumedSlotId: text("consumed_slot_id"),
  consumedSlotDate: text("consumed_slot_date"),
});

// ── Partners (reduceri) ──
export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  companyName: text("company_name").notNull(),
  discountPercent: integer("discount_percent").notNull().default(10),
  discountDescription: text("discount_description").notNull().default(""),
  logoUrl: text("logo_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const partnerVisits = pgTable("partner_visits", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  memberEmail: text("member_email").notNull(),
  memberName: text("member_name"),
  valid: boolean("valid").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Class slots (coach-level schedule) ──
export const classSlots = pgTable("class_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  coachId: uuid("coach_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  durationMin: integer("duration_min").notNull().default(60),
  classType: text("class_type").notNull().default(""),
  capacity: integer("capacity").notNull().default(20),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Types ──
export type Theme = typeof theme.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserRole = (typeof userRole.enumValues)[number];
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type SubscriptionStatus = (typeof subscriptionStatus.enumValues)[number];
export type Attendance = typeof attendances.$inferSelect;
export type AttendanceMethod = (typeof attendanceMethod.enumValues)[number];
export type ClassCredit = typeof classCredits.$inferSelect;
export type NewClassCredit = typeof classCredits.$inferInsert;
export type CreditSource = (typeof creditSource.enumValues)[number];
export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;
export type PartnerVisit = typeof partnerVisits.$inferSelect;
export type NewPartnerVisit = typeof partnerVisits.$inferInsert;
export type ClassSlot = typeof classSlots.$inferSelect;
export type NewClassSlot = typeof classSlots.$inferInsert;
