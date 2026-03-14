/**
 * Synthesizer Agent
 * Takes all agent results and calls Claude via the Anthropic API
 * to produce a polished, structured markdown research report.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { AgentResult } from "../types";

interface SynthesizerInput {
  sessionId: string;
  query: string;
  agentResults: AgentResult[];
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function runSynthesizer(
  input: SynthesizerInput
): Promise<AgentResult> {
  const { sessionId, query, agentResults } = input;

  // Build context block from all agent outputs
  const context = agentResults
    .map(
      (r) =>
        `=== ${r.agentName.toUpperCase()} AGENT ===\n${r.content}`
    )
    .join("\n\n");

  const systemPrompt = `You are an expert research synthesizer. 
Given raw outputs from multiple research agents (web search, news, academic papers),
produce a coherent, well-structured markdown report that:
- Starts with a clear executive summary
- Groups findings thematically, not by source
- Cites sources inline using markdown links
- Highlights consensus and contradictions across sources
- Ends with key takeaways and suggested next research steps
Be thorough but concise. Use headers, bullet points, and emphasis appropriately.`;

  const userPrompt = `Research question: "${query}"

Below are the raw outputs gathered by research agents:

${context}

Please synthesize these into a comprehensive research report.`;

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const content =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Collect all unique sources from contributing agents
  const allSources = [...new Set(agentResults.flatMap((r) => r.sources))];

  return {
    agentName: "synthesizer",
    content,
    sources: allSources,
    paymentEvents: [],
    tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
  };
}