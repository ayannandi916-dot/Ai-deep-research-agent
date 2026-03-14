"use client";

interface Props {
  spent: number;
  budget: number;
}

export default function BudgetMeter({ spent, budget }: Props) {
  const pct = Math.min((spent / budget) * 100, 100);
  const remaining = Math.max(budget - spent, 0);

  const barColor =
    pct >= 90 ? "bg-red-500"   :
    pct >= 60 ? "bg-amber-400" :
                "bg-indigo-500";

  const textColor =
    pct >= 90 ? "text-red-600"   :
    pct >= 60 ? "text-amber-600" :
                "text-indigo-600";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-end justify-between">
        <p className="text-sm font-medium text-gray-700">Budget usage</p>
        <div className="text-right">
          <p className="text-xs text-gray-500">
            <span className={`font-semibold ${textColor}`}>
              ${spent.toFixed(4)}
            </span>
            {" "}/ ${budget.toFixed(2)} USDC
          </p>
          <p className="text-xs text-gray-400">{pct.toFixed(1)}% used</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Remaining */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-gray-400">Remaining</span>
        <span className="font-mono font-semibold text-gray-700">
          ${remaining.toFixed(4)} USDC
        </span>
      </div>

      {/* Warning */}
      {pct >= 90 && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-100">
          ⚠️ Budget nearly exhausted — agents may not complete all tasks.
        </p>
      )}
    </div>
  );
}