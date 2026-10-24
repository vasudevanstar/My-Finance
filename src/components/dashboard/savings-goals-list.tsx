import * as React from "react";
import { SavingsGoal } from "@/types/finance";
import { formatCurrency } from "@/lib/utils";
import { Target } from "lucide-react";

interface SavingsGoalsListProps {
  goals: SavingsGoal[];
}

export function SavingsGoalsList({ goals }: SavingsGoalsListProps) {
  return (
    <div className="space-y-4">
      {goals.map((goal) => {
        const current = goal.current_amount ?? goal.currentAmount ?? 0;
        const target = goal.target_amount ?? goal.targetAmount ?? 1;
        const percentage = Math.min(
          Math.round((current / target) * 100),
          100
        );
        const remaining = Math.max(target - current, 0);

        return (
          <div
            key={goal.id}
            className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/70 text-blue-700">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    {goal.name || goal.title}
                  </h4>
                  <span className="text-xs text-slate-400">
                    Target: {goal.target_date || goal.targetDate || "Ongoing"}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {percentage}% completed
                </span>
              </div>
            </div>

            {/* Progress track */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 my-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs mt-1.5 text-slate-600 font-medium">
              <span>
                {formatCurrency(current)} / {formatCurrency(target)}
              </span>
              <span className="text-slate-400">
                Remaining: {formatCurrency(remaining)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
