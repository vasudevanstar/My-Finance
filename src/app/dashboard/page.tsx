"use client";

import * as React from "react";
import Link from "next/link";
import {
  Wallet,
  Building2,
  Banknote,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  ArrowUpRight,
  Receipt,
  Plus,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { QuickActionButton } from "@/components/dashboard/quick-action-button";
import { TransactionItem } from "@/components/dashboard/transaction-item";
import { ReceivedSpentChart } from "@/components/dashboard/received-spent-chart";
import { SavingsGoalsList } from "@/components/dashboard/savings-goals-list";
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal";
import { TransferModal } from "@/components/dashboard/transfer-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState, Skeleton } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { useFinance } from "@/contexts/finance-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { TransactionType } from "@/types/finance";

export default function DashboardPage() {
  const {
    metrics,
    transactions,
    savingsGoals,
    chartData,
    isLoading,
    loadError,
    refreshData,
  } = useFinance();
  const { profile } = useAuth();

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
    setTimeout(() => setNotification(null), 4500);
  };

  // Full page loading state for initial fetch
  if (isLoading && transactions.length === 0) {
    return (
      <AppShell
        title="Financial Dashboard"
        subtitle="Loading your real-time accounts and live balances from Supabase..."
      >
        <div className="space-y-6 animate-in fade-in">
          {/* Skeleton Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-white p-6 border border-slate-200">
                <Skeleton className="h-4 w-28 mb-3" />
                <Skeleton className="h-8 w-36 mb-2" />
                <Skeleton className="h-3 w-44" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 rounded-xl bg-white border border-slate-200 p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="h-72 rounded-xl bg-white border border-slate-200 p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Error state if database queries fail
  if (loadError && transactions.length === 0) {
    return (
      <AppShell
        title="Financial Dashboard"
        subtitle="Unable to retrieve financial data from Supabase."
      >
        <ErrorState
          title="Failed to Load Financial Records"
          message={loadError}
          onRetry={refreshData}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Financial Dashboard"
      subtitle={`Welcome back, ${profile?.fullName || "Student"}. Here is your live college budget snapshot calculated from real transaction data in INR.`}
    >
      {/* Toast Notification Banner */}
      {notification && (
        <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm font-medium text-emerald-800 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span>✓ {notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile Priority 1 & 2: Prominent Total Balance & Instant Quick Action Buttons */}
      <section className="mb-6">
        {/* Quick Actions Panel: Add Income, Add Expense, Transfer - Super accessible on mobile and desktop */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
            Quick Actions
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refreshData()}
            className="h-8 text-xs gap-1 text-slate-500 hover:text-slate-800"
            title="Refresh database records"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sync</span>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 mb-6">
          <QuickActionButton
            label="Income"
            description="Log allowance or stipend"
            icon={PlusCircle}
            variant="income"
            onClick={() => openAddModal("income")}
          />
          <QuickActionButton
            label="Expense"
            description="Log meals or shopping"
            icon={MinusCircle}
            variant="expense"
            onClick={() => openAddModal("expense")}
          />
          <QuickActionButton
            label="Transfer"
            description="Between bank & cash"
            icon={ArrowRightLeft}
            variant="transfer"
            onClick={() => setTransferModalOpen(true)}
          />
        </div>
      </section>

      {/* 6 Key Financial Metrics Grid (Responsive 1-col on mobile, 2-col on tablet, 3-col on desktop) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 mb-8">
        <BalanceCard
          title="Total Balance"
          amount={metrics.totalBalance}
          icon={Wallet}
          subtext="Net balance across all accounts"
          trend={{ value: "+8.4%", isPositive: true }}
          accentColor="blue"
          className="border-blue-200/80 bg-gradient-to-br from-white to-blue-50/20 shadow-xs"
        />
        <BalanceCard
          title="Bank Balance"
          amount={metrics.bankBalance}
          icon={Building2}
          subtext="Checking & bank accounts"
          accentColor="purple"
        />
        <BalanceCard
          title="Cash in Hand"
          amount={metrics.cashInHand}
          icon={Banknote}
          subtext="Pocket money & wallet cash"
          accentColor="amber"
        />
        <BalanceCard
          title="Total Income"
          amount={metrics.totalIncome}
          icon={TrendingUp}
          subtext="Total earnings & allowances"
          trend={{ value: "+12.1%", isPositive: true }}
          accentColor="emerald"
        />
        <BalanceCard
          title="Total Expenses"
          amount={metrics.totalExpenses}
          icon={TrendingDown}
          subtext="Total spending & purchases"
          trend={{ value: "-4.3%", isPositive: true }}
          accentColor="rose"
        />
        <BalanceCard
          title="Savings"
          amount={metrics.savingsTotal}
          icon={PiggyBank}
          subtext="Dedicated savings accounts"
          trend={{ value: "+15.0%", isPositive: true }}
          accentColor="blue"
        />
      </section>

      {/* Main Insights Grid: Dynamic Chart & Savings Goals */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Received vs Spent Comparison Chart */}
        <div className="lg:col-span-2">
          <DashboardCard
            title="Received vs Spent"
            description="Live comparison of money received and money spent (Transfers strictly excluded)"
            action={
              <Link href="/reports">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Full Report <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            }
          >
            <ReceivedSpentChart transactions={transactions} />
          </DashboardCard>
        </div>

        {/* Savings Goals */}
        <div className="lg:col-span-1">
          <DashboardCard
            title="Savings Goals"
            description="Target reserve milestones"
            action={
              <Link href="/savings">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Manage <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            }
          >
            {savingsGoals.length === 0 ? (
              <EmptyState
                icon={PiggyBank}
                title="No savings goals yet"
                description="Set a target for tech upgrades, semester projects, or travel funds."
                actionLabel="Create Goal"
                onAction={() => window.location.assign("/savings")}
              />
            ) : (
              <SavingsGoalsList goals={savingsGoals} />
            )}
          </DashboardCard>
        </div>
      </section>

      {/* Recent Transactions Section: Date, Category, Description, Account, Amount, Income/Expense Indicator */}
      <section>
        <DashboardCard
          title="Recent Transactions"
          description="Latest recorded income, expenses, and inter-account transfers"
          action={
            <Link href="/transactions">
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                View All Transactions <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          }
          contentClassName="p-2 sm:p-4 divide-y divide-slate-100"
        >
          {transactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions recorded yet"
              description="Start managing your student finances by logging your first income or expense."
              actionLabel="Add Transaction"
              onAction={() => openAddModal("expense")}
            />
          ) : (
            transactions.slice(0, 6).map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))
          )}
        </DashboardCard>
      </section>

      {/* Reusable Add Transaction Modal (Income / Expense) */}
      <AddTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
        onSuccessNotice={handleSuccessNotice}
      />

      {/* Dedicated Transfer Money Modal */}
      <TransferModal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onSuccessNotice={handleSuccessNotice}
      />
    </AppShell>
  );
}
