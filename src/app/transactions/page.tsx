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
  FilterX,
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
  X,
  SlidersHorizontal,
} from "lucide-react";
import { useFinance } from "@/contexts/finance-context";
import { TransactionType } from "@/types/finance";
import { formatCurrency, formatFullDate, getISODateString } from "@/lib/utils";

export default function TransactionsPage() {
  const { transactions, categories, accounts } = useFinance();

  // Mode: "all-dates" vs "single-day" vs "custom-range"
  const [filterMode, setFilterMode] = React.useState<"all-dates" | "single-day" | "custom-range">("all-dates");

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

  // Search input: Matches Description, Category, and Amount
  const [searchQuery, setSearchQuery] = React.useState("");

  // Dedicated filters
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [accountFilter, setAccountFilter] = React.useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");

  // Amount range filters (optional min/max bounds)
  const [minAmount, setMinAmount] = React.useState<string>("");
  const [maxAmount, setMaxAmount] = React.useState<string>("");

  // Collapsible advanced filters panel
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

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

  // Clear all filters handler
  const handleClearAllFilters = () => {
    setSearchQuery("");
    setTypeFilter("ALL");
    setAccountFilter("ALL");
    setCategoryFilter("ALL");
    setMinAmount("");
    setMaxAmount("");
    setRangeStart("");
    setRangeEnd("");
    setFilterMode("all-dates");
  };

  // Determine if any filter is active
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    typeFilter !== "ALL" ||
    accountFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    minAmount !== "" ||
    maxAmount !== "" ||
    filterMode !== "all-dates";

  // Fast In-Memory Filtering (O(N), avoids redundant database calls)
  const filteredTransactions = React.useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    const minVal = minAmount ? parseFloat(minAmount) : null;
    const maxVal = maxAmount ? parseFloat(maxAmount) : null;

    return transactions.filter((tx) => {
      const txDate = (tx.transaction_date || tx.date || "").split("T")[0];

      // 1. Date filter
      if (filterMode === "single-day") {
        if (txDate !== selectedDate) return false;
      } else if (filterMode === "custom-range") {
        if (rangeStart && txDate < rangeStart) return false;
        if (rangeEnd && txDate > rangeEnd) return false;
      }

      // 2. Type filter (Income, Expense, Transfer)
      if (typeFilter !== "ALL") {
        if (tx.type !== typeFilter) return false;
      }

      // 3. Account filter
      if (accountFilter !== "ALL") {
        const matchesAccount =
          tx.account_id === accountFilter ||
          tx.source_account_id === accountFilter ||
          tx.destination_account_id === accountFilter ||
          tx.account_name === accountFilter ||
          tx.account === accountFilter;
        if (!matchesAccount) return false;
      }

      // 4. Category filter
      if (categoryFilter !== "ALL") {
        const cat = tx.category_name || tx.category || "";
        if (cat !== categoryFilter) return false;
      }

      // 5. Amount range bounds
      if (minVal !== null && !isNaN(minVal) && tx.amount < minVal) {
        return false;
      }
      if (maxVal !== null && !isNaN(maxVal) && tx.amount > maxVal) {
        return false;
      }

      // 6. Search query by:
      // - Description (e.g., "project" matches "Bought project components", "Project printing", "Final year project")
      // - Category (e.g., "Education", "Food")
      // - Amount (e.g., "1450", "380", "1450.00")
      if (cleanQuery) {
        const descMatch = (tx.description || tx.title || "")
          .toLowerCase()
          .includes(cleanQuery);
        const catMatch = (tx.category_name || tx.category || "")
          .toLowerCase()
          .includes(cleanQuery);
        const accMatch = (tx.account_name || tx.account || "")
          .toLowerCase()
          .includes(cleanQuery);
        const amountStr = String(tx.amount);
        const amountFormatted = tx.amount.toLocaleString("en-IN");
        const amountMatch =
          amountStr.includes(cleanQuery) || amountFormatted.includes(cleanQuery);

        if (!descMatch && !catMatch && !accMatch && !amountMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    filterMode,
    selectedDate,
    rangeStart,
    rangeEnd,
    typeFilter,
    accountFilter,
    categoryFilter,
    minAmount,
    maxAmount,
    searchQuery,
  ]);

  // Compute live KPIs strictly from the filtered transactions
  // Transfers are counted separately and NOT mixed into income or expenses!
  const summaryKPIs = React.useMemo(() => {
    let income = 0;
    let expenses = 0;
    let transfersSum = 0;
    let transfersCount = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === "income") {
        income += t.amount;
      } else if (t.type === "expense") {
        expenses += t.amount;
      } else if (t.type === "transfer") {
        transfersSum += t.amount;
        transfersCount += 1;
      }
    });

    const netChange = income - expenses;

    return {
      income,
      expenses,
      netChange,
      transfersSum,
      transfersCount,
    };
  }, [filteredTransactions]);

  // Active Date Label
  const dateTitle =
    filterMode === "all-dates"
      ? "All Time Records"
      : filterMode === "single-day"
      ? formatFullDate(selectedDate)
      : rangeStart || rangeEnd
      ? `${rangeStart ? formatFullDate(rangeStart) : "Beginning"} — ${
          rangeEnd ? formatFullDate(rangeEnd) : "Present"
        }`
      : "Custom Range";

  const isToday = selectedDate === todayDate;

  return (
    <AppShell
      title="Transaction History & Search"
      subtitle="Fast in-memory search by description, category, or amount, with date ranges, accounts, and transfer filters."
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

      {/* 1. Date Selector Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 mb-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          {/* Mode Switcher Tabs */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 self-start">
            <button
              type="button"
              onClick={() => setFilterMode("all-dates")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                filterMode === "all-dates"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Dates
            </button>
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
              Custom Date Range
            </button>
          </div>

          {/* Date Controls for Active Mode */}
          {filterMode === "single-day" && (
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
          )}

          {filterMode === "custom-range" && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-600">From:</span>
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 font-medium"
                title="Start Date"
              />
              <span className="text-slate-400 text-xs">to:</span>
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
                  Clear Dates
                </Button>
              )}
            </div>
          )}

          {filterMode === "all-dates" && (
            <span className="text-xs font-medium text-slate-500">
              Showing transactions across entire database history
            </span>
          )}
        </div>

        {/* 2. Financial Snapshot KPI Cards */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Financial Summary • {dateTitle} ({filteredTransactions.length} matching)
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Income */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold mb-0.5">
                <TrendingUp className="h-4 w-4" />
                <span>Income</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-emerald-700">
                +{formatCurrency(summaryKPIs.income)}
              </p>
            </div>

            {/* Expenses */}
            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3.5">
              <div className="flex items-center gap-1.5 text-rose-700 text-xs font-semibold mb-0.5">
                <TrendingDown className="h-4 w-4" />
                <span>Expenses</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-rose-700">
                -{formatCurrency(summaryKPIs.expenses)}
              </p>
            </div>

            {/* Net Change */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold mb-0.5">
                <Layers className="h-4 w-4" />
                <span>Net Cashflow</span>
              </div>
              <p
                className={`text-lg sm:text-xl font-bold ${
                  summaryKPIs.netChange >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {summaryKPIs.netChange >= 0 ? "+" : ""}
                {formatCurrency(summaryKPIs.netChange)}
              </p>
            </div>

            {/* Transfers Separately */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5">
              <div className="flex items-center gap-1.5 text-blue-700 text-xs font-semibold mb-0.5">
                <ArrowRightLeft className="h-4 w-4" />
                <span>Transfers</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-blue-700">
                {formatCurrency(summaryKPIs.transfersSum)}
              </p>
              <span className="text-[11px] text-blue-600/80 mt-0.5 block">
                {summaryKPIs.transfersCount} inter-account movement{summaryKPIs.transfersCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search and Multi-Facet Filtering Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 mb-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder='Search by description (e.g. "project"), category, or amount...'
              className="pl-9 pr-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Type Filter */}
            <div className="w-full sm:w-36">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </Select>
            </div>

            {/* Category Filter */}
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

            {/* Account Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
              >
                <option value="ALL">All Accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Advanced Filters Toggle */}
            <Button
              variant={showAdvancedFilters ? "default" : "outline"}
              size="icon"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className="h-10 w-10 shrink-0 cursor-pointer"
              title="Toggle Amount Range Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 shrink-0 text-xs font-semibold cursor-pointer"
                title="Reset all active filters"
              >
                <FilterX className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Collapsible Amount Range Filter Panel */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 flex items-center gap-3 flex-wrap bg-slate-50/60 p-3 rounded-xl animate-in fade-in">
            <span className="text-xs font-semibold text-slate-700">Filter by Amount (₹):</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min ₹"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-28 h-8 text-xs bg-white"
              />
              <span className="text-xs text-slate-400">to</span>
              <Input
                type="number"
                placeholder="Max ₹"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-28 h-8 text-xs bg-white"
              />
            </div>
            {(minAmount || maxAmount) && (
              <button
                type="button"
                onClick={() => {
                  setMinAmount("");
                  setMaxAmount("");
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline ml-2 cursor-pointer"
              >
                Reset Amount
              </button>
            )}
          </div>
        )}

        {/* Active Filters Badges */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            <span className="font-semibold text-slate-400">Active:</span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Search: &quot;{searchQuery}&quot;
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="hover:text-blue-900 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {typeFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                Type: {typeFilter}
                <button
                  type="button"
                  onClick={() => setTypeFilter("ALL")}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {categoryFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Category: {categoryFilter}
                <button
                  type="button"
                  onClick={() => setCategoryFilter("ALL")}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {accountFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Account: {accounts.find((a) => a.id === accountFilter)?.name || accountFilter}
                <button
                  type="button"
                  onClick={() => setAccountFilter("ALL")}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {(minAmount || maxAmount) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Amount: {minAmount ? `₹${minAmount}` : "₹0"} – {maxAmount ? `₹${maxAmount}` : "∞"}
                <button
                  type="button"
                  onClick={() => {
                    setMinAmount("");
                    setMaxAmount("");
                  }}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filterMode !== "all-dates" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Date: {dateTitle}
                <button
                  type="button"
                  onClick={() => setFilterMode("all-dates")}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. Action Buttons for Transactions & Transfers */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm font-bold text-slate-800">
            {filteredTransactions.length} Transaction{filteredTransactions.length === 1 ? "" : "s"} Found
          </span>
          {hasActiveFilters && (
            <span className="text-xs text-slate-400 ml-2">
              (Filtered from {transactions.length} total)
            </span>
          )}
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
            className="gap-1.5 shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <MinusCircle className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* 5. Transactions List */}
      <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        <div className="border-b border-slate-100 px-6 py-3.5 flex justify-between items-center bg-slate-50/40">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {dateTitle}
          </span>
          <span className="text-xs text-slate-400">
            Local Timezone Display
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              icon={Search}
              title="No transactions matched your criteria"
              description={
                hasActiveFilters
                  ? "Try adjusting your search query, selecting different categories/accounts, or clearing active filters."
                  : "No income, expense, or transfer entries recorded yet."
              }
              actionLabel={hasActiveFilters ? "Clear All Filters" : "Add New Transaction"}
              onAction={hasActiveFilters ? handleClearAllFilters : () => openAddModal("expense")}
            />
          </div>
        ) : (
          <div className="p-2 sm:p-4 divide-y divide-slate-100">
            {filteredTransactions.map((tx) => (
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
