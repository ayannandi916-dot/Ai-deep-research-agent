/**
 * News Agent
 * Fetches recent news articles from a paid X-402 news endpoint.
 */

import { paidFetch } from "../payment/x402-client";
import type { AgentResult, PaymentEvent } from "../types";

interface AgentInput {
  sessionId: string;
  query: string;
}

interface NewsResponse {
  articles: Array<{
    title: string;
    source: string;
    url: string;
    publishedAt: string;
    summary: string;
  }>;
}

const NEWS_ENDPOINT =
  process.env.NEWS_ENDPOINT ?? "http://localhost:4002/news";

export async function runNewsAgent(input: AgentInput): Promise<AgentResult> {
  const { sessionId, query } = input;

  const { body, paymentEventId } = await paidFetch(NEWS_ENDPOINT, {
    sessionId,
    agentName: "news",
    estimatedCostUSDC: 0.008,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, maxArticles: 5 }),
    },
  });

  const data = JSON.parse(body) as NewsResponse;

  const content = data.articles
    .map(
      (a) =>
        `### ${a.title}\n` +
        `*${a.source} — ${new Date(a.publishedAt).toDateString()}*\n\n` +
        `${a.summary}\n\n[Read more](${a.url})`
    )
    .join("\n\n---\n\n");

  const sources = data.articles.map((a) => a.url);

  const paymentEvents: PaymentEvent[] = paymentEventId
    ? [
        {
          id: paymentEventId,
          sessionId,
          agentName: "news",
          endpoint: NEWS_ENDPOINT,
          amountUSDC: 0.008,
          status: "success",
          createdAt: new Date().toISOString(),
        },
      ]
    : [];

  return {
    agentName: "news",
    content,
    sources,
    paymentEvents,
  };
}