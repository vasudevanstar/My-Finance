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
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { QuickActionButton } from "@/components/dashboard/quick-action-button";
import { TransactionItem } from "@/components/dashboard/transaction-item";
import { ReceivedSpentChart } from "@/components/dashboard/received-spent-chart";
import { SavingsGoalsList } from "@/components/dashboard/savings-goals-list";
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal";
import { useFinance } from "@/contexts/finance-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { TransactionType } from "@/types/finance";

export default function DashboardPage() {
  const { metrics, transactions, savingsGoals, chartData } = useFinance();
  const { profile } = useAuth();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalType, setModalType] = React.useState<TransactionType>("expense");
  const [notification, setNotification] = React.useState<string | null>(null);

  const openAddModal = (type: TransactionType) => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleSuccessNotice = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <AppShell
      title="Financial Dashboard"
      subtitle={`Welcome back, ${profile?.fullName || "Student"}. Here is your live college budget snapshot in INR.`}
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

      {/* 6 Key Financial Metrics Grid (in INR) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">
        <BalanceCard
          title="Total Balance"
          amount={metrics.totalBalance}
          icon={Wallet}
          subtext="Across all connected accounts"
          trend={{ value: "+8.4%", isPositive: true }}
          accentColor="blue"
        />
        <BalanceCard
          title="Bank Balance"
          amount={metrics.bankBalance}
          icon={Building2}
          subtext="Checking & student savings"
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
          subtext="Recorded income inflow"
          trend={{ value: "+12.1%", isPositive: true }}
          accentColor="emerald"
        />
        <BalanceCard
          title="Total Expenses"
          amount={metrics.totalExpenses}
          icon={TrendingDown}
          subtext="Spent this period"
          trend={{ value: "-4.3%", isPositive: true }}
          accentColor="rose"
        />
        <BalanceCard
          title="Savings"
          amount={metrics.savingsTotal}
          icon={PiggyBank}
          subtext="Allocated in reserve funds"
          trend={{ value: "+15.0%", isPositive: true }}
          accentColor="blue"
        />
      </section>

      {/* Quick Actions Panel: Add Income & Add Expense */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <QuickActionButton
            label="Add Income"
            description="Log allowance from home, part-time, or stipend"
            icon={PlusCircle}
            variant="income"
            onClick={() => openAddModal("income")}
          />
          <QuickActionButton
            label="Add Expense"
            description="Log meals, travel, education books, or shopping"
            icon={MinusCircle}
            variant="expense"
            onClick={() => openAddModal("expense")}
          />
          <QuickActionButton
            label="Quick Transfer"
            description="Move funds between bank and cash wallet"
            icon={ArrowRightLeft}
            variant="transfer"
            onClick={() => openAddModal("expense")}
          />
        </div>
      </section>

      {/* Main Insights Grid: Dynamic Chart & Savings Goals */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Received vs Spent Comparison Chart */}
        <div className="lg:col-span-2">
          <DashboardCard
            title="Received vs Spent"
            description="Visual monthly flow breakdown in Indian Rupees (INR)"
            action={
              <Link href="/reports">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Full Report <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            }
          >
            <ReceivedSpentChart data={chartData} />
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
            <SavingsGoalsList goals={savingsGoals} />
          </DashboardCard>
        </div>
      </section>

      {/* Recent Transactions Section */}
      <section>
        <DashboardCard
          title="Recent Transactions"
          description="Your latest recorded college income and expenditures"
          action={
            <Link href="/transactions">
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                View All Transactions <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          }
          contentClassName="p-2 sm:p-4 divide-y divide-slate-100"
        >
          {transactions.slice(0, 5).map((tx) => (
            <TransactionItem key={tx.id} transaction={tx} />
          ))}
        </DashboardCard>
      </section>

      {/* Reusable Add Transaction Modal (Income / Expense) */}
      <AddTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
        onSuccessNotice={handleSuccessNotice}
      />
    </AppShell>
  );
}
