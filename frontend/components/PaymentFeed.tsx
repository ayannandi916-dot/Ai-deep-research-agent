"use client";

import type { PaymentEvent } from "../../src/types";

interface Props {
  payments: PaymentEvent[];
}

const STATUS_ICON: Record<string, string> = {
  pending: "🕐",
  success: "✅",
  failed:  "❌",
};

const AGENT_STYLE: Record<string, string> = {
  "web-search":  "bg-blue-50 text-blue-700 border-blue-100",
  "news":        "bg-amber-50 text-amber-700 border-amber-100",
  "academic":    "bg-green-50 text-green-700 border-green-100",
  "synthesizer": "bg-purple-50 text-purple-700 border-purple-100",
};

const AGENT_ICON: Record<string, string> = {
  "web-search":  "🌐",
  "news":        "📰",
  "academic":    "🎓",
  "synthesizer": "🧠",
};

export default function PaymentFeed({ payments }: Props) {
  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
        <p className="text-2xl mb-2">💳</p>
        <p className="text-sm text-gray-400">No payments yet — agents will appear here as they work.</p>
      </div>
    );
  }

  const totalSpent = payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + p.amountUSDC, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          Payment feed
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {payments.length}
          </span>
        </p>
        <p className="text-xs text-gray-500">
          Total:{" "}
          <span className="font-semibold font-mono text-gray-800">
            ${totalSpent.toFixed(4)} USDC
          </span>
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {payments.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm transition-colors hover:bg-gray-100"
          >
            {/* Status */}
            <span className="text-base shrink-0">{STATUS_ICON[p.status] ?? "❓"}</span>

            {/* Agent badge */}
            <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${AGENT_STYLE[p.agentName] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {AGENT_ICON[p.agentName] ?? "🤖"} {p.agentName}
            </span>

            {/* Endpoint */}
            <span className="flex-1 truncate text-xs text-gray-400 font-mono">
              {p.endpoint}
            </span>

            {/* Amount */}
            <span className="shrink-0 font-mono text-xs font-bold text-gray-800">
              ${p.amountUSDC.toFixed(4)}
            </span>

            {/* Tx link */}
            {p.txHash && p.txHash !== "free" && (
              
                href={`https://sepolia.basescan.org/tx/${p.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs text-indigo-500 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                title="View on BaseScan"
              >
                tx ↗
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}