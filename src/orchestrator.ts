/**
 * Orchestrator — coordinates all research agents in parallel,
 * collects their results, then calls the synthesizer to produce
 * a final markdown report.
 */

import { runWebSearchAgent } from "./agents/web-search";
import { runNewsAgent } from "./agents/news";
import { runAcademicAgent } from "./agents/academic";
import { runSynthesizer } from "./agents/synthesizer";
import type {
  OrchestratorInput,
  OrchestratorOutput,
  AgentResult,
} from "./types";
import { totalSpent } from "./payment/budget-ledger";

export async function orchestrate(
  input: OrchestratorInput
): Promise<OrchestratorOutput> {
  const { sessionId, query, budgetUSDC } = input;

  console.info(
    `[orchestrator] starting session=${sessionId} budget=${budgetUSDC} USDC`
  );

  // Run web-search, news and academic agents in parallel
  const [webResult, newsResult, academicResult] = await Promise.allSettled([
    runWebSearchAgent({ sessionId, query }),
    runNewsAgent({ sessionId, query }),
    runAcademicAgent({ sessionId, query }),
  ]);

  const agentResults: AgentResult[] = [];

  for (const settled of [webResult, newsResult, academicResult]) {
    if (settled.status === "fulfilled") {
      agentResults.push(settled.value);
    } else {
      console.warn("[orchestrator] agent failed", settled.reason);
    }
  }

  // Synthesize all successful agent results into a coherent report
  const synthResult = await runSynthesizer({
    sessionId,
    query,
    agentResults,
  });

  agentResults.push(synthResult);

  const report = synthResult.content;
  const totalSpentUSDC = totalSpent(sessionId);

  console.info(
    `[orchestrator] session=${sessionId} done. spent=${totalSpentUSDC} USDC`
  );

  return {
    sessionId,
    agentResults,
    report,
    totalSpentUSDC,
  };
}