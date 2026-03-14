/**
 * Web-Search Agent
 * Calls a paid X-402 web-search endpoint, parses the results,
 * and returns a structured AgentResult.
 */

import { paidFetch } from "../payment/x402-client";
import type { AgentResult, PaymentEvent } from "../types";

interface AgentInput {
  sessionId: string;
  query: string;
}

interface SearchResponse {
  results: Array<{ title: string; url: string; snippet: string }>;
}

const WEB_SEARCH_ENDPOINT =
  process.env.WEB_SEARCH_ENDPOINT ?? "http://localhost:4001/search";

export async function runWebSearchAgent(
  input: AgentInput
): Promise<AgentResult> {
  const { sessionId, query } = input;

  const { body, paymentEventId } = await paidFetch(WEB_SEARCH_ENDPOINT, {
    sessionId,
    agentName: "web-search",
    estimatedCostUSDC: 0.01,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    },
  });

  const data = JSON.parse(body) as SearchResponse;

  const content = data.results
    .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.snippet}\n   ${r.url}`)
    .join("\n\n");

  const sources = data.results.map((r) => r.url);

  const paymentEvents: PaymentEvent[] = paymentEventId
    ? [
        {
          id: paymentEventId,
          sessionId,
          agentName: "web-search",
          endpoint: WEB_SEARCH_ENDPOINT,
          amountUSDC: 0.01,
          status: "success",
          createdAt: new Date().toISOString(),
        },
      ]
    : [];

  return {
    agentName: "web-search",
    content,
    sources,
    paymentEvents,
  };
}