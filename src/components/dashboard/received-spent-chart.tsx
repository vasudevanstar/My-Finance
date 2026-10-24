import * as React from "react";
import { formatCurrency } from "@/lib/utils";

interface ReceivedSpentChartProps {
  data: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
}

export function ReceivedSpentChart({ data }: ReceivedSpentChartProps) {
  // Find highest value to scale bars accurately
  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 2000);

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center justify-between pb-6 mb-2 border-b border-slate-100">
        <div>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Last 6 Months
          </span>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm font-semibold text-slate-800">
              Net Inflow Tracker
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span className="text-slate-600">Received (Income)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-blue-500" />
            <span className="text-slate-600">Spent (Expenses)</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Display */}
      <div className="grid grid-cols-6 gap-2 sm:gap-6 pt-4 h-56 items-end">
        {data.map((item) => {
          const incomeHeight = Math.round((item.income / maxVal) * 100);
          const expenseHeight = Math.round((item.expense / maxVal) * 100);

          return (
            <div key={item.month} className="flex flex-col items-center h-full justify-end group">
              <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-44">
                {/* Income Bar */}
                <div className="relative w-full max-w-[20px] flex flex-col items-center">
                  <div
                    style={{ height: `${incomeHeight}%` }}
                    className="w-full rounded-t-md bg-emerald-500 transition-all duration-300 group-hover:bg-emerald-600"
                    title={`Received: ${formatCurrency(item.income)}`}
                  />
                </div>
                {/* Expense Bar */}
                <div className="relative w-full max-w-[20px] flex flex-col items-center">
                  <div
                    style={{ height: `${expenseHeight}%` }}
                    className="w-full rounded-t-md bg-blue-500 transition-all duration-300 group-hover:bg-blue-600"
                    title={`Spent: ${formatCurrency(item.expense)}`}
                  />
                </div>
              </div>

              {/* Month label */}
              <span className="text-xs font-medium text-slate-500 mt-3">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
