"use client";

import { useState } from "react";

interface Props {
  onSubmit: (query: string, budgetUSDC: number) => Promise<void>;
}

const BUDGET_OPTIONS = [
  { value: 0.1,  label: "$0.10", desc: "Quick scan" },
  { value: 0.25, label: "$0.25", desc: "Standard"   },
  { value: 0.5,  label: "$0.50", desc: "Deep dive"  },
  { value: 1.0,  label: "$1.00", desc: "Thorough"   },
];

export default function ResearchForm({ onSubmit }: Props) {
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState(0.25);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 500;

  function handleQueryChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value.slice(0, MAX_CHARS);
    setQuery(val);
    setCharCount(val.length);
  }

  async function handleSubmit() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setErr(null);
    try {
      await onSubmit(query.trim(), budget);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Something went wrong");
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5">

        {/* Query */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Research question</label>
            <span className={`text-xs ${charCount > MAX_CHARS * 0.9 ? "text-amber-500" : "text-gray-400"}`}>
              {charCount}/{MAX_CHARS}
            </span>
          </div>
          <textarea
            rows={3}
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g. What are the latest breakthroughs in solid-state batteries?"
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          <p className="mt-1 text-xs text-gray-400">
            Press <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 font-mono text-xs">⌘ Enter</kbd> to submit
          </p>
        </div>

        {/* Budget */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Budget (USDC)</p>
          <div className="grid grid-cols-4 gap-2">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBudget(opt.value)}
                className={`flex flex-col items-center rounded-xl border px-3 py-2.5 transition-all text-center ${
                  budget === opt.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/50"
                }`}
              >
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-xs mt-0.5 opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Agents info */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Agents that will run</p>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "web-search",  color: "bg-blue-100 text-blue-700",    icon: "🌐" },
              { name: "news",        color: "bg-amber-100 text-amber-700",   icon: "📰" },
              { name: "academic",    color: "bg-green-100 text-green-700",   icon: "🎓" },
              { name: "synthesizer", color: "bg-purple-100 text-purple-700", icon: "🧠" },
            ].map((a) => (
              <span key={a.name} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${a.color}`}>
                {a.icon} {a.name}
              </span>
            ))}
          </div>
        </div>

        {/* Error */}
        {err && (
          <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-600">
            {err}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !query.trim()}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="animate-spin text-base">⚙️</span> Starting research…
            </>
          ) : (
            <>🔬 Start Research</>
          )}
        </button>
      </div>
    </div>
  );
}