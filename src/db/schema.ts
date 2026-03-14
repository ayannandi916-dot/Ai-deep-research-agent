import {
  pgTable,
  text,
  numeric,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const researchStatusEnum = pgEnum("research_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "success",
  "failed",
]);

// ─── research_sessions ───────────────────────────────────────────────────────

export const researchSessions = pgTable("research_sessions", {
  id: text("id").primaryKey(),                          // nanoid / uuid
  query: text("query").notNull(),
  status: researchStatusEnum("status").notNull().default("pending"),
  budgetUsdc: numeric("budget_usdc", { precision: 10, scale: 6 }).notNull(),
  spentUsdc: numeric("spent_usdc", { precision: 10, scale: 6 }).notNull().default("0"),
  report: text("report"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ─── payment_events ──────────────────────────────────────────────────────────

export const paymentEvents = pgTable("payment_events", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => researchSessions.id, { onDelete: "cascade" }),
  agentName: text("agent_name").notNull(),
  endpoint: text("endpoint").notNull(),
  amountUsdc: numeric("amount_usdc", { precision: 10, scale: 6 }).notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ResearchSessionRow = typeof researchSessions.$inferSelect;
export type NewResearchSession = typeof researchSessions.$inferInsert;

export type PaymentEventRow = typeof paymentEvents.$inferSelect;
export type NewPaymentEvent = typeof paymentEvents.$inferInsert;