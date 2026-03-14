/**
 * Full X-402 client with facilitator support, retry logic,
 * budget-ledger integration and DB persistence of payment events.
 */

import { nanoid } from "nanoid";
import { fetchWithPayment } from "./x402-client-simple";
import { trySpend, remainingBudget } from "./budget-ledger";
import { formatReceipt } from "./receipt";
import { createPaymentEvent, updatePaymentEvent, incrementSpent } from "../db/queries";

export interface PaidFetchOptions {
  sessionId: string;
  agentName: string;
  /** fetch init options (method, headers, body …) */
  init?: RequestInit;
  /** Override cost estimate for budget check. If omitted, no pre-check. */
  estimatedCostUSDC?: number;
}

export interface PaidFetchResult {
  body: string;
  /** null when no payment was required */
  paymentEventId: string | null;
}

/**
 * fetch() wrapper that:
 *  1. Checks the session budget before making the request
 *  2. Handles the 402 payment flow
 *  3. Persists a payment_event row
 *  4. Updates the session's spent total
 */
export async function paidFetch(
  url: string,
  options: PaidFetchOptions
): Promise<PaidFetchResult> {
  const { sessionId, agentName, init = {}, estimatedCostUSDC } = options;

  // Pre-flight budget check (optional, based on caller's estimate)
  if (estimatedCostUSDC !== undefined) {
    const remaining = remainingBudget(sessionId);
    if (remaining < estimatedCostUSDC) {
      throw new BudgetExceededError(
        `Insufficient budget: need ${estimatedCostUSDC} USDC, have ${remaining} USDC`
      );
    }
  }

  const eventId = nanoid();

  // Create a pending payment event so we have a record even on failure
  await createPaymentEvent({
    id: eventId,
    sessionId,
    agentName,
    endpoint: url,
    amountUsdc: "0",        // filled in after we know the actual cost
    status: "pending",
  });

  try {
    const { body, receipt } = await fetchWithPayment(url, init);

    if (!receipt) {
      // No payment was needed — mark event as irrelevant / remove it
      await updatePaymentEvent(eventId, { status: "success", txHash: "free" });
      return { body, paymentEventId: null };
    }

    // Deduct from in-memory ledger
    const ok = trySpend(sessionId, receipt.amountUSDC);
    if (!ok) {
      // Payment already went through on-chain but ledger rejects it —
      // log and surface as an error rather than silently dropping.
      throw new BudgetExceededError(
        `On-chain payment of ${receipt.amountUSDC} USDC exceeded remaining budget`
      );
    }

    // Persist outcome
    await updatePaymentEvent(eventId, {
      status: "success",
      txHash: receipt.txHash,
    });
    await incrementSpent(sessionId, receipt.amountUSDC.toFixed(6));

    console.info(`[x402] ${formatReceipt(receipt)}`);

    return { body, paymentEventId: eventId };
  } catch (err) {
    await updatePaymentEvent(eventId, { status: "failed" });
    throw err;
  }
}

// ─── Custom Errors ────────────────────────────────────────────────────────────

export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceededError";
  }
}