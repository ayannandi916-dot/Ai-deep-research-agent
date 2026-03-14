import { describe, it, expect, beforeEach } from "vitest";
import {
  initBudget,
  trySpend,
  remainingBudget,
  totalSpent,
  snapshot,
  clearSession,
} from "../src/payment/budget-ledger";

const SESSION = "test-session-001";

beforeEach(() => {
  clearSession(SESSION);
});

describe("budget-ledger", () => {
  it("initialises with correct budget and zero spent", () => {
    initBudget(SESSION, 1.0);
    expect(totalSpent(SESSION)).toBe(0);
    expect(remainingBudget(SESSION)).toBe(1.0);
  });

  it("deducts spend correctly", () => {
    initBudget(SESSION, 1.0);
    const ok = trySpend(SESSION, 0.25);
    expect(ok).toBe(true);
    expect(totalSpent(SESSION)).toBeCloseTo(0.25, 6);
    expect(remainingBudget(SESSION)).toBeCloseTo(0.75, 6);
  });

  it("allows spend up to the exact budget limit", () => {
    initBudget(SESSION, 0.5);
    expect(trySpend(SESSION, 0.5)).toBe(true);
    expect(remainingBudget(SESSION)).toBe(0);
  });

  it("rejects spend that would exceed budget", () => {
    initBudget(SESSION, 0.1);
    trySpend(SESSION, 0.09);
    const ok = trySpend(SESSION, 0.02); // 0.09 + 0.02 = 0.11 > 0.1
    expect(ok).toBe(false);
    expect(totalSpent(SESSION)).toBeCloseTo(0.09, 6);
  });

  it("multiple spends accumulate correctly", () => {
    initBudget(SESSION, 1.0);
    trySpend(SESSION, 0.01);
    trySpend(SESSION, 0.008);
    trySpend(SESSION, 0.015);
    expect(totalSpent(SESSION)).toBeCloseTo(0.033, 6);
    expect(remainingBudget(SESSION)).toBeCloseTo(0.967, 6);
  });

  it("snapshot returns a copy, not a reference", () => {
    initBudget(SESSION, 1.0);
    trySpend(SESSION, 0.1);
    const snap = snapshot(SESSION);
    trySpend(SESSION, 0.1);
    // snap should not have changed
    expect(snap.spentUSDC).toBeCloseTo(0.1, 6);
  });

  it("initBudget is idempotent — second call is a no-op", () => {
    initBudget(SESSION, 1.0);
    trySpend(SESSION, 0.5);
    initBudget(SESSION, 99.0); // should be ignored
    expect(remainingBudget(SESSION)).toBeCloseTo(0.5, 6);
  });

  it("throws when accessing unknown session", () => {
    expect(() => totalSpent("ghost-session")).toThrow();
  });
});