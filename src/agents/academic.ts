/**
 * Academic Agent
 * Queries a paid X-402 academic paper search endpoint (e.g. Semantic Scholar / arXiv proxy).
 */

import { paidFetch } from "../payment/x402-client";
import type { AgentResult, PaymentEvent } from "../types";

interface AgentInput {
  sessionId: string;
  query: string;
}

interface PaperResponse {
  papers: Array<{
    title: string;
    authors: string[];
    year: number;
    abstract: string;
    url: string;
    citationCount?: number;
  }>;
}

const ACADEMIC_ENDPOINT =
  process.env.ACADEMIC_ENDPOINT ?? "http://localhost:4003/papers";

export async function runAcademicAgent(
  input: AgentInput
): Promise<AgentResult> {
  const { sessionId, query } = input;

  const { body, paymentEventId } = await paidFetch(ACADEMIC_ENDPOINT, {
    sessionId,
    agentName: "academic",
    estimatedCostUSDC: 0.015,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 5 }),
    },
  });

  const data = JSON.parse(body) as PaperResponse;

  const content = data.papers
    .map((p) => {
      const authors = p.authors.slice(0, 3).join(", ");
      const citations = p.citationCount != null ? ` · ${p.citationCount} citations` : "";
      return (
        `### ${p.title}\n` +
        `*${authors} (${p.year})${citations}*\n\n` +
        `${p.abstract}\n\n[Paper →](${p.url})`
      );
    })
    .join("\n\n---\n\n");

  const sources = data.papers.map((p) => p.url);

  const paymentEvents: PaymentEvent[] = paymentEventId
    ? [
        {
          id: paymentEventId,
          sessionId,
          agentName: "academic",
          endpoint: ACADEMIC_ENDPOINT,
          amountUSDC: 0.015,
          status: "success",
          createdAt: new Date().toISOString(),
        },
      ]
    : [];

  return {
    agentName: "academic",
    content,
    sources,
    paymentEvents,
  };
}