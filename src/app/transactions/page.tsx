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
import { Search, Plus, Filter, PlusCircle, MinusCircle, ArrowRightLeft } from "lucide-react";
import { useFinance } from "@/contexts/finance-context";
import { TransactionType } from "@/types/finance";

export default function TransactionsPage() {
  const { transactions, categories, transfers } = useFinance();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [typeFilter, setTypeFilter] = React.useState("ALL");
  const [activeTab, setActiveTab] = React.useState<"all" | "transfers">("all");

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

  const currentDataset = activeTab === "transfers" ? transfers : transactions;

  const filteredTransactions = currentDataset.filter((tx) => {
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

  return (
    <AppShell
      title="Transactions & Transfers"
      subtitle="View, filter and audit all your student income, expenditure, and inter-account money transfers."
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

      {/* View Switcher: All Activity vs Dedicated Transfer History */}
      <div className="flex border-b border-slate-200 mb-6 gap-6">
        <button
          onClick={() => {
            setActiveTab("all");
            setTypeFilter("ALL");
          }}
          className={`pb-3 text-sm font-medium cursor-pointer border-b-2 transition-all ${
            activeTab === "all"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          All Activity ({transactions.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("transfers");
            setTypeFilter("transfer");
          }}
          className={`pb-3 text-sm font-medium cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "transfers"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Transfer History ({transfers.length})
        </button>
      </div>

      {/* Top Filter and Actions Toolbar */}
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

          {activeTab === "all" && (
            <div className="w-full sm:w-48">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {activeTab === "all" && (
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
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            onClick={() => setTransferModalOpen(true)}
            variant="outline"
            className="gap-1.5 shrink-0 text-blue-700 border-blue-200 hover:bg-blue-50"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Transfer
          </Button>
          <Button
            onClick={() => openAddModal("income")}
            variant="outline"
            className="gap-1.5 shrink-0 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
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

      {/* Transactions List */}
      <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-slate-50/40">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {activeTab === "transfers" ? "Transfer Records" : "All Records"}: Showing {filteredTransactions.length} of {currentDataset.length}
          </span>
          <span className="text-xs text-slate-400">
            Sorted by most recent
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={activeTab === "transfers" ? ArrowRightLeft : Filter}
            title={activeTab === "transfers" ? "No transfers recorded" : "No transactions found"}
            description={
              activeTab === "transfers"
                ? "You haven't recorded any internal account transfers yet (e.g. Bank to Cash in Hand)."
                : "We couldn't find any transaction matching your active filter criteria."
            }
            actionLabel={activeTab === "transfers" ? "Make a Transfer" : "Clear Filters"}
            onAction={
              activeTab === "transfers"
                ? () => setTransferModalOpen(true)
                : () => {
                    setSearchTerm("");
                    setCategoryFilter("ALL");
                    setTypeFilter("ALL");
                  }
            }
          />
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
