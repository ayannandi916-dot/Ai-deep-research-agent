/**
 * Structured payment receipt returned after a successful X-402 flow.
 */

export interface PaymentReceipt {
  /** Transaction hash on-chain */
  txHash: string;
  /** Amount paid in USDC (human-readable, 6 decimals) */
  amountUSDC: number;
  /** The endpoint URL that was paid */
  endpoint: string;
  /** Payee address (from the 402 challenge) */
  payee: string;
  /** Block number the tx was included in */
  blockNumber: bigint;
  /** Unix timestamp of the block */
  blockTimestamp: number;
}

/**
 * Summarise a receipt for logging / DB storage.
 */
export function formatReceipt(r: PaymentReceipt): string {
  return (
    `Paid ${r.amountUSDC.toFixed(6)} USDC to ${r.payee} ` +
    `for ${r.endpoint} (tx: ${r.txHash}, block: ${r.blockNumber})`
  );
}