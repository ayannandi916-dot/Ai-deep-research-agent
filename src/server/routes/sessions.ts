import { Router } from "express";
import { getSession, getPaymentsBySession } from "../../src/db/queries";
import type { GetSessionResponse, ResearchSession, PaymentEvent } from "../../src/types";

export const sessionsRouter = Router();

/**
 * GET /api/sessions/:id
 * Returns the session details and all payment events.
 */
sessionsRouter.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const [row, paymentRows] = await Promise.all([
      getSession(id),
      getPaymentsBySession(id),
    ]);

    if (!row) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session: ResearchSession = {
      id: row.id,
      query: row.query,
      status: row.status,
      budgetUSDC: Number(row.budgetUsdc),
      spentUSDC: Number(row.spentUsdc),
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString(),
      report: row.report ?? undefined,
      error: row.error ?? undefined,
    };

    const payments: PaymentEvent[] = paymentRows.map((p) => ({
      id: p.id,
      sessionId: p.sessionId,
      agentName: p.agentName,
      endpoint: p.endpoint,
      amountUSDC: Number(p.amountUsdc),
      status: p.status,
      txHash: p.txHash ?? undefined,
      createdAt: p.createdAt.toISOString(),
    }));

    const response: GetSessionResponse = { session, payments };
    res.json(response);
  } catch (err) {
    next(err);
  }
});
