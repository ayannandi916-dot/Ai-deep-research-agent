"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { fetchSession } from "../../../lib/api";
import BudgetMeter from "../../../components/BudgetMeter";
import PaymentFeed from "../../../components/PaymentFeed";
import ReportViewer from "../../../components/ReportViewer";
import type { GetSessionResponse } from "../../../../src/types";

const POLL_INTERVAL_MS = 2_500;

const STATUS_CONFIG = {
  pending:   { label: "Pending",   cls: "bg-gray-100 text-gray-600",              icon: "🕐" },
  running:   { label: "Running…",  cls: "bg-blue-100 text-blue-700 animate-pulse", icon: "⚙️" },
  completed: { label: "Completed", cls: "bg-green-100 text-green-700",             icon: "✅" },
  failed:    { label: "Failed",    cls: "bg-red-100 text-red-700",                 icon: "❌" },
} as const;

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<GetSessionResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchSession(id);
      setData(result);
      if (result.session.status === "completed" || result.session.status === "failed") {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load session");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [id]);

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, POLL_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [load]);

  if (!data && !loadError) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="skeleton h-7 w-2/3 rounded-lg" />
        <div className="skeleton h-4 w-1/3 rounded-md" />
        <div className="skeleton h-12 w-full rounded-xl" />
        <div className="skeleton h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-100 p-6 text-red-700 animate-fade-in">
        <p className="font-semibold text-sm">Could not load session</p>
        <p className="text-sm mt-1 opacity-80">{loadError}</p>
        <a href="/" className="mt-4 inline-block text-sm underline text-red-600">← Back to home</a>
      </div>
    );
  }

  const { session, payments } = data!;
  const statusCfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.pending;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600">← New research</a>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 leading-snug line-clamp-3">
            {session.query}
          </h2>
          <p className="mt-1 text-xs text-gray-400 font-mono">{session.id}</p>
        </div>
        <span className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${statusCfg.cls}`}>
          <span>{statusCfg.icon}</span>
          {statusCfg.label}
        </span>
      </div>

      <BudgetMeter spent={session.spentUSDC} budget={session.budgetUSDC} />
      <PaymentFeed payments={payments} />

      {session.status === "completed" && session.report && (
        <ReportViewer markdown={session.report} />
      )}

      {session.status === "running" && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-700 flex items-center gap-3">
          <span className="text-lg animate-spin">⚙️</span>
          <span>Agents are researching your question and making payments… this usually takes 20–60 seconds.</span>
        </div>
      )}

      {session.status === "failed" && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-semibold mb-1">Research failed</p>
          <p className="opacity-80">{session.error ?? "An unknown error occurred."}</p>
        </div>
      )}
    </div>
  );
}