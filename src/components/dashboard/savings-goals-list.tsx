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
        const percentage = Math.min(
          Math.round((goal.currentAmount / goal.targetAmount) * 100),
          100
        );

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
                    {goal.title}
                  </h4>
                  <span className="text-xs text-slate-400">
                    Target: {goal.targetDate}
                  </span>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-700">
                {percentage}%
              </span>
            </div>

            {/* Progress track */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs mt-2 text-slate-500">
              <span>Saved: {formatCurrency(goal.currentAmount)}</span>
              <span>Goal: {formatCurrency(goal.targetAmount)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
