"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ResearchForm from "../components/ResearchForm";
import { startResearch } from "../lib/api";

const EXAMPLE_QUERIES = [
  "What are the latest breakthroughs in solid-state batteries?",
  "How is AI being used in drug discovery in 2024?",
  "What is the current state of nuclear fusion research?",
  "How do large language models handle long-context reasoning?",
];

export default function HomePage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  async function handleSubmit(query: string, budgetUSDC: number) {
    setGlobalError(null);
    try {
      const { sessionId } = await startResearch({ query, budgetUSDC });
      router.push(`/session/${sessionId}`);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Failed to start research");
    }
  }

  return (
    <div className="flex flex-col items-center gap-12 pt-6">
      <div className="text-center max-w-2xl">
        <h2 className="text-4xl font-bold tracking-tight text-gray-900 leading-tight">
          Ask anything.{" "}
          <span className="text-indigo-600">Pay only for what you use.</span>
        </h2>
        <p className="mt-4 text-gray-500 text-base leading-relaxed">
          Multiple AI agents — web search, news, and academic papers — research
          your question in parallel, then synthesize a structured report. Each
          data source is paid for with USDC micro-payments via the X-402 protocol.
        </p>
      </div>

      <ResearchForm onSubmit={handleSubmit} />

      {globalError && (
        <div className="w-full max-w-2xl rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      <div className="w-full max-w-2xl">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gray-400">
          Try an example
        </p>
        <div className="flex flex-col gap-2">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => handleSubmit(q, 0.25)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-2xl mt-4">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-gray-400">
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "💬", title: "Ask a question",   desc: "Enter your research question and set a USDC budget." },
            { icon: "🤖", title: "Agents research",  desc: "Web, news and academic agents run in parallel, paying micro-fees per request." },
            { icon: "📄", title: "Get a report",     desc: "Claude synthesizes all findings into a structured markdown report." },
          ].map((step) => (
            <div key={step.title} className="rounded-xl border border-gray-100 bg-white p-5">
              <span className="text-2xl">{step.icon}</span>
              <p className="mt-3 text-sm font-semibold text-gray-800">{step.title}</p>
              <p className="mt-1 text-xs text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}