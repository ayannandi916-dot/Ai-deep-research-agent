import { Router } from "express";
import { nanoid } from "nanoid";
import { createSession, updateSessionStatus } from "../../src/db/queries";
import { initBudget, totalSpent, clearSession } from "../../src/payment/budget-ledger";
import { orchestrate } from "../../src/orchestrator";
import type {
  CreateSessionRequest,
  CreateSessionResponse,
} from "../../src/types";

export const researchRouter = Router();

/**
 * POST /api/research
 * Start a new research session.
 * Returns sessionId immediately; processing happens in the background.
 */
researchRouter.post("/", async (req, res, next) => {
  try {
    const { query, budgetUSDC } = req.body as CreateSessionRequest;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ error: "query is required" });
    }
    if (!budgetUSDC || typeof budgetUSDC !== "number" || budgetUSDC <= 0) {
      return res.status(400).json({ error: "budgetUSDC must be a positive number" });
    }

    const sessionId = nanoid();

    // Persist session row
    await createSession({
      id: sessionId,
      query: query.trim(),
      status: "pending",
      budgetUsdc: budgetUSDC.toFixed(6),
      spentUsdc: "0",
    });

    // Initialise in-memory budget ledger
    initBudget(sessionId, budgetUSDC);

    // Fire-and-forget orchestration
    runOrchestration(sessionId, query.trim(), budgetUSDC).catch((err) =>
      console.error(`[research] orchestration error for ${sessionId}`, err)
    );

    const response: CreateSessionResponse = { sessionId };
    res.status(202).json(response);
  } catch (err) {
    next(err);
  }
});

// ─── Background runner ────────────────────────────────────────────────────────

async function runOrchestration(
  sessionId: string,
  query: string,
  budgetUSDC: number
): Promise<void> {
  try {
    await updateSessionStatus(sessionId, "running");

    const output = await orchestrate({ sessionId, query, budgetUSDC });

    await updateSessionStatus(sessionId, "completed", {
      report: output.report,
      completedAt: new Date(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateSessionStatus(sessionId, "failed", { error: message });
  } finally {
    clearSession(sessionId);
  }
}