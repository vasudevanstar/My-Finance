"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ReceivedSpentChart } from "@/components/dashboard/received-spent-chart";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Layers } from "lucide-react";
import { useFinance } from "@/contexts/finance-context";

export default function ReportsPage() {
  const { chartData, transactions, metrics } = useFinance();

  // Dynamically compute category distribution from real transactions
  const categoryTotals = React.useMemo(() => {
    const expenseTxs = transactions.filter((t) => t.type === "expense");
    const totalExp = expenseTxs.reduce((sum, t) => sum + t.amount, 0) || 1;

    const map: Record<string, number> = {};
    expenseTxs.forEach((t) => {
      const cat = t.category_name || t.category || "Other";
      map[cat] = (map[cat] || 0) + t.amount;
    });

    const colors = [
      "bg-blue-600",
      "bg-emerald-500",
      "bg-amber-500",
      "bg-purple-500",
      "bg-rose-500",
      "bg-indigo-500",
      "bg-slate-400",
    ];

    return Object.entries(map).map(([category, amount], idx) => ({
      category,
      amount,
      percentage: Math.round((amount / totalExp) * 100),
      color: colors[idx % colors.length],
    }));
  }, [transactions]);

  return (
    <AppShell
      title="Financial Analytics & Reports"
      subtitle="Analyze your monthly spending breakdown, net cashflow patterns, and student category distribution in INR."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Income vs Expenses Bar breakdown */}
        <div className="lg:col-span-2">
          <DashboardCard
            title="Net Cashflow Trend"
            description="Semester-long comparative breakdown of incoming funds vs outgoing spending"
          >
            <ReceivedSpentChart data={chartData} />
          </DashboardCard>
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-1">
          <DashboardCard
            title="Expenses by Category"
            description="Active expenditure allocation"
          >
            {categoryTotals.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No recorded expenses yet.
              </p>
            ) : (
              <div className="space-y-4">
                {categoryTotals.map((item) => (
                  <div key={item.category}>
                    <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                      <span className="text-slate-700">{item.category}</span>
                      <span className="text-slate-900 font-semibold">
                        {formatCurrency(item.amount)} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="h-4 w-4" />
            <span>Total Recorded Income</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(metrics.totalIncome)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Student allowance & earnings</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingDown className="h-4 w-4" />
            <span>Total Recorded Expense</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(metrics.totalExpenses)}
          </p>
          <p className="text-xs text-slate-500 mt-1">College spending & books</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Layers className="h-4 w-4" />
            <span>Net Monthly Surplus</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(Math.max(metrics.totalIncome - metrics.totalExpenses, 0))}
          </p>
          <p className="text-xs text-slate-500 mt-1">Available for savings reserves</p>
        </div>
      </div>
    </AppShell>
  );
}
