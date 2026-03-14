import { eq, sql } from "drizzle-orm";
import { db } from "./client";
import {
  researchSessions,
  paymentEvents,
  type NewResearchSession,
  type NewPaymentEvent,
  type ResearchSessionRow,
  type PaymentEventRow,
} from "./schema";

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function createSession(
  data: NewResearchSession
): Promise<ResearchSessionRow> {
  const [row] = await db
    .insert(researchSessions)
    .values(data)
    .returning();
  return row;
}

export async function getSession(
  id: string
): Promise<ResearchSessionRow | undefined> {
  return db.query.researchSessions.findFirst({
    where: eq(researchSessions.id, id),
  });
}

export async function updateSessionStatus(
  id: string,
  status: ResearchSessionRow["status"],
  extras: Partial<Pick<ResearchSessionRow, "report" | "error" | "completedAt">> = {}
): Promise<void> {
  await db
    .update(researchSessions)
    .set({ status, ...extras })
    .where(eq(researchSessions.id, id));
}

export async function incrementSpent(
  id: string,
  amountUsdc: string
): Promise<void> {
  await db
    .update(researchSessions)
    .set({
      spentUsdc: sql`${researchSessions.spentUsdc} + ${amountUsdc}::numeric`,
    })
    .where(eq(researchSessions.id, id));
}

// ─── Payment Events ──────────────────────────────────────────────────────────

export async function createPaymentEvent(
  data: NewPaymentEvent
): Promise<PaymentEventRow> {
  const [row] = await db
    .insert(paymentEvents)
    .values(data)
    .returning();
  return row;
}

export async function updatePaymentEvent(
  id: string,
  patch: Partial<Pick<PaymentEventRow, "status" | "txHash">>
): Promise<void> {
  await db
    .update(paymentEvents)
    .set(patch)
    .where(eq(paymentEvents.id, id));
}

export async function getPaymentsBySession(
  sessionId: string
): Promise<PaymentEventRow[]> {
  return db.query.paymentEvents.findMany({
    where: eq(paymentEvents.sessionId, sessionId),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  });
}
