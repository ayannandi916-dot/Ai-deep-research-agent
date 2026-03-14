/**
 * Simplified X-402 client.
 * Handles the two-step HTTP 402 payment flow without the full
 * facilitator layer — useful for trusted / mock endpoints in dev.
 *
 *  1. GET/POST the resource → receive 402 + payment details in headers
 *  2. Sign & send a USDC transfer on-chain
 *  3. Retry the original request with the tx proof in headers
 */

import { encodeFunctionData, parseUnits } from "viem";
import { walletClient, USDC_ADDRESS, ERC20_ABI, agentAddress } from "./wallet";
import type { PaymentReceipt } from "./receipt";

export interface X402Challenge {
  payee: `0x${string}`;
  amountUSDC: number;
  endpoint: string;
  nonce: string;          // server-provided nonce to prevent replay
}

/**
 * Parse the `X-Payment-Required` header emitted by a 402 response.
 * Header format (JSON-encoded):
 *   { payee, amount, nonce }
 */
export function parseChallenge(
  headers: Headers,
  endpoint: string
): X402Challenge {
  const raw = headers.get("X-Payment-Required");
  if (!raw) throw new Error("402 response missing X-Payment-Required header");
  const parsed = JSON.parse(raw) as {
    payee: string;
    amount: string;
    nonce: string;
  };
  return {
    payee: parsed.payee as `0x${string}`,
    amountUSDC: Number(parsed.amount),
    endpoint,
    nonce: parsed.nonce,
  };
}

/**
 * Execute an ERC-20 transfer to satisfy a 402 challenge and return the receipt.
 */
export async function payChallenge(
  challenge: X402Challenge
): Promise<PaymentReceipt> {
  const amountWei = parseUnits(challenge.amountUSDC.toFixed(6), 6);

  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [challenge.payee, amountWei],
  });

  const hash = await walletClient.sendTransaction({
    account: agentAddress,
    to: USDC_ADDRESS,
    data,
  });

  const receipt = await walletClient.waitForTransactionReceipt({ hash });

  const block = await walletClient.getBlock({
    blockNumber: receipt.blockNumber,
  });

  return {
    txHash: hash,
    amountUSDC: challenge.amountUSDC,
    endpoint: challenge.endpoint,
    payee: challenge.payee,
    blockNumber: receipt.blockNumber,
    blockTimestamp: Number(block.timestamp),
  };
}

/**
 * Fetch a URL, handling the 402 flow automatically.
 * Returns the final response body as text.
 */
export async function fetchWithPayment(
  url: string,
  init: RequestInit = {}
): Promise<{ body: string; receipt: PaymentReceipt | null }> {
  // First attempt
  const first = await fetch(url, init);

  if (first.status !== 402) {
    return { body: await first.text(), receipt: null };
  }

  // Parse challenge → pay → retry
  const challenge = parseChallenge(first.headers, url);
  const receipt = await payChallenge(challenge);

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("X-Payment-Tx", receipt.txHash);
  retryHeaders.set("X-Payment-Nonce", challenge.nonce);

  const second = await fetch(url, { ...init, headers: retryHeaders });

  if (!second.ok) {
    throw new Error(
      `Payment succeeded but request failed: ${second.status} ${second.statusText}`
    );
  }

  return { body: await second.text(), receipt };
}