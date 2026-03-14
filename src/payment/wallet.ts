import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

/**
 * Singleton agent wallet derived from AGENT_PRIVATE_KEY env var.
 * Uses Base Sepolia for dev; switch to `base` for production.
 */

if (!process.env.AGENT_PRIVATE_KEY) {
  throw new Error("AGENT_PRIVATE_KEY env var is required");
}

const account = privateKeyToAccount(
  process.env.AGENT_PRIVATE_KEY as `0x${string}`
);

export const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(process.env.RPC_URL ?? "https://sepolia.base.org"),
}).extend(publicActions);

export const agentAddress = account.address;

/** USDC contract address on Base Sepolia */
export const USDC_ADDRESS =
  (process.env.USDC_ADDRESS as `0x${string}`) ??
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

/** Minimal ERC-20 ABI fragments we need */
export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

/** Return USDC balance in human-readable units (6 decimals) */
export async function getUSDCBalance(): Promise<number> {
  const raw = await walletClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [agentAddress],
  });
  return Number(raw) / 1e6;
}