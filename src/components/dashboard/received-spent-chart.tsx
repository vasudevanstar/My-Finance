"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Transaction } from "@/types/finance";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3, Calendar, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

export type AnalyticsTimeframe = "daily" | "weekly" | "monthly" | "yearly";

interface ReceivedSpentChartProps {
  transactions?: Transaction[];
}

interface ChartDataPoint {
  label: string;
  received: number;
  spent: number;
  dateKey: string;
}

export function ReceivedSpentChart({ transactions = [] }: ReceivedSpentChartProps) {
  const [timeframe, setTimeframe] = React.useState<AnalyticsTimeframe>("monthly");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");

  // Filter out transfers strictly: Transfers are NOT income and NOT expense!
  const validTransactions = React.useMemo(() => {
    return transactions.filter((t) => {
      // STRICT ISOLATION: Exclude transfers between user accounts
      if (t.type === "transfer") return false;
      if (t.type !== "income" && t.type !== "expense") return false;

      // Apply optional custom date range filtering
      const dateStr = (t.transaction_date || t.date || "").split("T")[0];
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;

      return true;
    });
  }, [transactions, startDate, endDate]);

  // Group transactions into Recharts data based on selected timeframe
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    if (validTransactions.length === 0) return [];

    const grouped: Record<string, { label: string; received: number; spent: number; dateKey: string; sortOrder: number }> = {};

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    validTransactions.forEach((tx) => {
      const rawDate = tx.transaction_date || tx.date || new Date().toISOString();
      const dateObj = new Date(rawDate);
      if (isNaN(dateObj.getTime())) return;

      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const day = dateObj.getDate();

      let key = "";
      let label = "";
      let sortOrder = 0;

      if (timeframe === "daily") {
        // e.g. "24 Oct"
        key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        label = `${day} ${monthNames[month]}`;
        sortOrder = dateObj.getTime();
      } else if (timeframe === "weekly") {
        // Find beginning of week (Sunday)
        const weekStart = new Date(dateObj);
        weekStart.setDate(day - dateObj.getDay());
        const startDay = weekStart.getDate();
        const startMonth = monthNames[weekStart.getMonth()];
        key = `${weekStart.getFullYear()}-W${Math.ceil((day + 6) / 7)}`;
        label = `Wk ${Math.ceil((day + 6) / 7)} (${startDay} ${startMonth})`;
        sortOrder = weekStart.getTime();
      } else if (timeframe === "monthly") {
        // e.g. "Oct 2026" or "Jan", "Feb"
        key = `${year}-${String(month + 1).padStart(2, "0")}`;
        label = monthNames[month];
        sortOrder = new Date(year, month, 1).getTime();
      } else if (timeframe === "yearly") {
        // e.g. "2025", "2026"
        key = `${year}`;
        label = `${year}`;
        sortOrder = new Date(year, 0, 1).getTime();
      }

      if (!grouped[key]) {
        grouped[key] = {
          label,
          received: 0,
          spent: 0,
          dateKey: key,
          sortOrder,
        };
      }

      if (tx.type === "income") {
        grouped[key].received += tx.amount;
      } else if (tx.type === "expense") {
        grouped[key].spent += tx.amount;
      }
    });

    return Object.values(grouped)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ label, received, spent, dateKey }) => ({
        label,
        received,
        spent,
        dateKey,
      }));
  }, [validTransactions, timeframe]);

  // Total summary in current view
  const totalReceived = chartData.reduce((acc, curr) => acc + curr.received, 0);
  const totalSpent = chartData.reduce((acc, curr) => acc + curr.spent, 0);

  // Custom Recharts Tooltip with Indian Rupee (INR) formatting
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const receivedVal = payload.find((p: any) => p.dataKey === "received")?.value || 0;
      const spentVal = payload.find((p: any) => p.dataKey === "spent")?.value || 0;
      const netSavings = receivedVal - spentVal;

      return (
        <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-lg backdrop-blur-sm text-xs min-w-[200px]">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">
            {label} Flow Summary
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Received (Income):
              </span>
              <span className="font-bold">{formatCurrency(receivedVal)}</span>
            </div>
            <div className="flex items-center justify-between text-rose-700">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Spent (Expenses):
              </span>
              <span className="font-bold">{formatCurrency(spentVal)}</span>
            </div>
            <div className="border-t border-slate-100 pt-1.5 flex items-center justify-between font-semibold text-slate-700">
              <span>Net Surplus:</span>
              <span className={netSavings >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {netSavings >= 0 ? "+" : ""}
                {formatCurrency(netSavings)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col">
      {/* Top Filter Bar: Timeframe Buttons & Date Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-4 border-b border-slate-100">
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Cashflow Comparison
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <h3 className="text-base font-bold text-slate-900">Received vs Spent</h3>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Received: <strong className="text-emerald-600">{formatCurrency(totalReceived)}</strong> | Spent:{" "}
              <strong className="text-rose-600">{formatCurrency(totalSpent)}</strong>
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Buttons: Daily, Weekly, Monthly (Default), Yearly */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {(["daily", "weekly", "monthly", "yearly"] as AnalyticsTimeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700"
              title="Start Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700"
              title="End Date"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-blue-600 hover:underline px-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chart Canvas or Empty State */}
      {chartData.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Insufficient transaction data"
          description="Log income or expense transactions in this date range to view your Received vs Spent comparison."
          className="my-4"
        />
      ) : (
        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 15, fontSize: 12 }}
                formatter={(val) => (
                  <span className="text-xs font-semibold text-slate-700 capitalize">
                    {val === "received" ? "Money Received" : "Money Spent"}
                  </span>
                )}
              />
              {/* Money Received Bar */}
              <Bar
                dataKey="received"
                name="received"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
              {/* Money Spent Bar */}
              <Bar
                dataKey="spent"
                name="spent"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
