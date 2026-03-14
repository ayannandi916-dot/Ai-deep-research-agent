/**
 * In-process budget ledger.
 * Tracks per-session spending and enforces a hard cap so agents cannot
 * exceed the budget the user approved.
 */

interface LedgerEntry {
  budgetUSDC: number;
  spentUSDC: number;
}

const ledger = new Map<string, LedgerEntry>();

// ─── Public API ───────────────────────────────────────────────────────────────

/** Initialise a new session budget. Call once when the session is created. */
export function initBudget(sessionId: string, budgetUSDC: number): void {
  if (ledger.has(sessionId)) return; // idempotent
  ledger.set(sessionId, { budgetUSDC, spentUSDC: 0 });
}

/**
 * Try to reserve `amountUSDC` against the session budget.
 * Returns `true` if there is sufficient budget and the amount is debited.
 * Returns `false` if the budget would be exceeded (caller should skip payment).
 */
export function trySpend(sessionId: string, amountUSDC: number): boolean {
  const entry = getEntry(sessionId);
  if (entry.spentUSDC + amountUSDC > entry.budgetUSDC) return false;
  entry.spentUSDC = round6(entry.spentUSDC + amountUSDC);
  return true;
}

/** Return remaining budget in USDC. */
export function remainingBudget(sessionId: string): number {
  const entry = getEntry(sessionId);
  return round6(entry.budgetUSDC - entry.spentUSDC);
}

/** Return total spent in USDC. */
export function totalSpent(sessionId: string): number {
  return getEntry(sessionId).spentUSDC;
}

/** Snapshot of the current ledger state (for persistence / logging). */
export function snapshot(sessionId: string): LedgerEntry {
  const entry = getEntry(sessionId);
  return { ...entry };
}

/** Remove the session from the in-memory ledger (call after persisting). */
export function clearSession(sessionId: string): void {
  ledger.delete(sessionId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEntry(sessionId: string): LedgerEntry {
  const entry = ledger.get(sessionId);
  if (!entry) throw new Error(`No budget ledger entry for session ${sessionId}`);
  return entry;
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}