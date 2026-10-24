"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TransactionItem } from "@/components/dashboard/transaction-item";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal";
import { TransferModal } from "@/components/dashboard/transfer-modal";
import {
  Search,
  Plus,
  Filter,
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useFinance } from "@/contexts/finance-context";
import { TransactionType } from "@/types/finance";
import { formatCurrency, formatFullDate, getISODateString } from "@/lib/utils";

export default function TransactionsPage() {
  const { transactions, categories, transfers } = useFinance();

  // Mode: "single-day" vs "custom-range"
  const [filterMode, setFilterMode] = React.useState<"single-day" | "custom-range">("single-day");

  // Single date selector state (initialized in useEffect for stable client-side local timezone)
  const [selectedDate, setSelectedDate] = React.useState<string>("2026-10-24");
  const [todayDate, setTodayDate] = React.useState<string>("2026-10-24");

  React.useEffect(() => {
    const today = getISODateString(new Date());
    setSelectedDate(today);
    setTodayDate(today);
  }, []);

  // Custom date range state
  const [rangeStart, setRangeStart] = React.useState<string>("");
  const [rangeEnd, setRangeEnd] = React.useState<string>("");

  // Search & Type filter
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [typeFilter, setTypeFilter] = React.useState("ALL");

  // View tabs
  const [activeTab, setActiveTab] = React.useState<"all" | "transfers">("all");

  // Modals
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalType, setModalType] = React.useState<TransactionType>("expense");
  const [transferModalOpen, setTransferModalOpen] = React.useState(false);
  const [notification, setNotification] = React.useState<string | null>(null);

  const openAddModal = (type: TransactionType) => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleSuccessNotice = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  };

  // Day navigation helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(getISODateString(d));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(getISODateString(d));
  };

  const handleToday = () => {
    setSelectedDate(getISODateString(new Date()));
  };

  // Filter dataset by chosen date/range
  const dateFilteredTransactions = React.useMemo(() => {
    return transactions.filter((t) => {
      const txDate = (t.transaction_date || t.date || "").split("T")[0];
      if (filterMode === "single-day") {
        return txDate === selectedDate;
      } else {
        if (rangeStart && txDate < rangeStart) return false;
        if (rangeEnd && txDate > rangeEnd) return false;
        return true;
      }
    });
  }, [transactions, filterMode, selectedDate, rangeStart, rangeEnd]);

  // Compute daily / range financial KPIs from filtered date records
  // IMPORTANT: Transfers are computed separately and NOT counted in Income or Expenses!
  const dailyKPIs = React.useMemo(() => {
    let income = 0;
    let expenses = 0;
    let transfersSum = 0;
    let transfersCount = 0;

    dateFilteredTransactions.forEach((t) => {
      if (t.type === "income") {
        income += t.amount;
      } else if (t.type === "expense") {
        expenses += t.amount;
      } else if (t.type === "transfer") {
        transfersSum += t.amount;
        transfersCount += 1;
      }
    });

    const netChange = income - expenses; // Strictly Income - Expense

    return {
      income,
      expenses,
      netChange,
      transfersSum,
      transfersCount,
    };
  }, [dateFilteredTransactions]);

  // Apply tab, category, type, and search filters on top of date filtered records
  const finalDisplayTransactions = React.useMemo(() => {
    return dateFilteredTransactions.filter((tx) => {
      if (activeTab === "transfers" && tx.type !== "transfer") return false;

      const titleMatch = (tx.title || tx.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const categoryMatch = (tx.category_name || tx.category || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const accountMatch = (tx.account_name || tx.account || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesSearch = titleMatch || categoryMatch || accountMatch;

      const currentCat = tx.category_name || tx.category;
      const matchesCategory =
        categoryFilter === "ALL" || currentCat === categoryFilter;

      const matchesType = typeFilter === "ALL" || tx.type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [dateFilteredTransactions, activeTab, searchTerm, categoryFilter, typeFilter]);

  // Format header title
  const dateTitle =
    filterMode === "single-day"
      ? formatFullDate(selectedDate)
      : rangeStart || rangeEnd
      ? `${rangeStart ? formatFullDate(rangeStart) : "Beginning"} — ${
          rangeEnd ? formatFullDate(rangeEnd) : "Present"
        }`
      : "All Dates";

  const isToday = selectedDate === todayDate;

  return (
    <AppShell
      title="Transaction History"
      subtitle="Calendar-driven daily financial audit, income, expenses, and transfer tracking in your local timezone."
    >
      {notification && (
        <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm font-medium text-emerald-800 flex items-center justify-between animate-in fade-in">
          <span>✓ {notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Date Selector Toolbar: Previous Day, Next Day, Today, and Custom Range */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 mb-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          {/* Day Navigation Controls */}
          {filterMode === "single-day" ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevDay}
                  className="h-8 w-8 text-slate-700 hover:bg-white cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 px-3">
                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-sm font-bold text-slate-900 bg-transparent border-0 focus:outline-none cursor-pointer"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextDay}
                  className="h-8 w-8 text-slate-700 hover:bg-white cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant={isToday ? "default" : "outline"}
                size="sm"
                onClick={handleToday}
                className="h-9 px-3 text-xs font-semibold"
              >
                Today
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-600">Range:</span>
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 font-medium"
                title="Start Date"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 font-medium"
                title="End Date"
              />
              {(rangeStart || rangeEnd) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRangeStart("");
                    setRangeEnd("");
                  }}
                  className="h-8 text-xs text-slate-500 hover:text-slate-900"
                >
                  Reset
                </Button>
              )}
            </div>
          )}

          {/* Mode Switcher: Single Date vs Custom Range */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setFilterMode("single-day")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  filterMode === "single-day"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Single Date
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("custom-range")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  filterMode === "custom-range"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>
        </div>

        {/* 2. Daily Summary Metric KPI Cards (Income, Expenses, Net Change, Transfers Separately) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {filterMode === "single-day" ? "Daily Financial Snapshot" : "Range Financial Snapshot"} • {dateTitle}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Daily Income */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold mb-1">
                <TrendingUp className="h-4 w-4" />
                <span>Daily Income</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-emerald-700">
                +{formatCurrency(dailyKPIs.income)}
              </p>
            </div>

            {/* Daily Expenses */}
            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
              <div className="flex items-center gap-1.5 text-rose-700 text-xs font-semibold mb-1">
                <TrendingDown className="h-4 w-4" />
                <span>Daily Expenses</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-rose-700">
                -{formatCurrency(dailyKPIs.expenses)}
              </p>
            </div>

            {/* Daily Net Change */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold mb-1">
                <Layers className="h-4 w-4" />
                <span>Net Cashflow Change</span>
              </div>
              <p
                className={`text-lg sm:text-2xl font-bold ${
                  dailyKPIs.netChange >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {dailyKPIs.netChange >= 0 ? "+" : ""}
                {formatCurrency(dailyKPIs.netChange)}
              </p>
            </div>

            {/* Transfers Shown Separately */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div className="flex items-center gap-1.5 text-blue-700 text-xs font-semibold mb-1">
                <ArrowRightLeft className="h-4 w-4" />
                <span>Transfers (Neutral)</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-blue-700">
                {formatCurrency(dailyKPIs.transfersSum)}
              </p>
              <span className="text-[11px] text-blue-600/80 mt-0.5 block">
                {dailyKPIs.transfersCount} inter-account movement{dailyKPIs.transfersCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar: Search, Category, Type & Add Action Buttons */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between mb-6">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search description, category, or account..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-44">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-full sm:w-36">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="income">Income (+)</option>
              <option value="expense">Expense (-)</option>
              <option value="transfer">Transfer (⇄)</option>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            onClick={() => setTransferModalOpen(true)}
            variant="outline"
            className="gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50 shrink-0"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Transfer
          </Button>
          <Button
            onClick={() => openAddModal("income")}
            variant="outline"
            className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 shrink-0"
          >
            <PlusCircle className="h-4 w-4 text-emerald-600" />
            Add Income
          </Button>
          <Button
            onClick={() => openAddModal("expense")}
            className="gap-1.5 shrink-0"
          >
            <MinusCircle className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* 4. Transactions List for Selected Date */}
      <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-slate-50/40">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {dateTitle} — {finalDisplayTransactions.length} Record{finalDisplayTransactions.length === 1 ? "" : "s"}
          </span>
          <span className="text-xs text-slate-400">
            Local Timezone Display
          </span>
        </div>

        {finalDisplayTransactions.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title={`No transactions on ${dateTitle}`}
            description="There are no income, expense, or transfer entries recorded for this selection."
            actionLabel="Add Transaction for This Date"
            onAction={() => openAddModal("expense")}
          />
        ) : (
          <div className="p-2 sm:p-4 divide-y divide-slate-100">
            {finalDisplayTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </div>
        )}
      </div>

      {/* Income / Expense Modal */}
      <AddTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
        onSuccessNotice={handleSuccessNotice}
      />

      {/* Transfer Modal */}
      <TransferModal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onSuccessNotice={handleSuccessNotice}
      />
    </AppShell>
  );
}
