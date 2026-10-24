"use client";

import * as React from "react";
import {
  Account,
  Category,
  DashboardMetrics,
  SavingsGoal,
  Transaction,
  TransactionType,
} from "@/types/finance";
import {
  initialAccounts,
  initialCategories,
  initialSavingsGoals,
  initialTransactions,
  monthlyOverviewData,
} from "@/lib/mock-data";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";

interface AddTransactionInput {
  type: TransactionType;
  amount: number;
  category_id: string;
  category_name: string;
  account_id: string;
  account_name: string;
  description?: string;
  transaction_date: string;
}

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
  chartData: Array<{ month: string; income: number; expense: number }>;
  metrics: DashboardMetrics;
  isLoading: boolean;
  addTransaction: (
    input: AddTransactionInput
  ) => Promise<{ success: boolean; error?: string }>;
  refreshData: () => Promise<void>;
}

const FinanceContext = React.createContext<FinanceContextType | undefined>(
  undefined
);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user, isConfigured } = useAuth();
  const supabase = React.useMemo(() => createClient(), []);

  const [accounts, setAccounts] = React.useState<Account[]>(initialAccounts);
  const [transactions, setTransactions] =
    React.useState<Transaction[]>(initialTransactions);
  const [categories, setCategories] =
    React.useState<Category[]>(initialCategories);
  const [savingsGoals, setSavingsGoals] =
    React.useState<SavingsGoal[]>(initialSavingsGoals);
  const [chartData, setChartData] = React.useState(monthlyOverviewData);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // Compute live dashboard metrics from state
  const metrics: DashboardMetrics = React.useMemo(() => {
    const totalBalance = accounts.reduce(
      (sum, acc) => sum + (acc.current_balance ?? acc.balance ?? 0),
      0
    );

    const bankBalance = accounts
      .filter((acc) => acc.type === "bank")
      .reduce(
        (sum, acc) => sum + (acc.current_balance ?? acc.balance ?? 0),
        0
      );

    const cashInHand = accounts
      .filter((acc) => acc.type === "cash")
      .reduce(
        (sum, acc) => sum + (acc.current_balance ?? acc.balance ?? 0),
        0
      );

    const savingsTotal = accounts
      .filter((acc) => acc.type === "savings")
      .reduce(
        (sum, acc) => sum + (acc.current_balance ?? acc.balance ?? 0),
        0
      );

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalBalance,
      bankBalance,
      cashInHand,
      totalIncome,
      totalExpenses,
      savingsTotal,
      monthReceived: totalIncome,
      monthSpent: totalExpenses,
    };
  }, [accounts, transactions]);

  // Load user data from Supabase if authenticated and tables exist
  const loadSupabaseData = React.useCallback(async () => {
    if (!isConfigured || !user) return;
    setIsLoading(true);

    try {
      // 1. Fetch Accounts
      const { data: dbAccounts, error: accError } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!accError && dbAccounts && dbAccounts.length > 0) {
        setAccounts(
          dbAccounts.map((a: any) => ({
            id: a.id,
            user_id: a.user_id,
            name: a.name,
            type: a.type,
            opening_balance: Number(a.opening_balance),
            current_balance: Number(a.current_balance),
            balance: Number(a.current_balance),
            accountNumberMasked: a.type === "cash" ? "Cash Pocket" : "•••• Bank",
            institution: a.type === "cash" ? "Cash Wallet" : "Campus Bank",
          }))
        );
      }

      // 2. Fetch Categories
      const { data: dbCategories, error: catError } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (!catError && dbCategories && dbCategories.length > 0) {
        setCategories(
          dbCategories.map((c: any) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            icon: c.icon,
            is_system: c.is_system,
          }))
        );
      }

      // 3. Fetch Transactions
      const { data: dbTransactions, error: txError } = await supabase
        .from("transactions")
        .select("*, accounts(name), categories(name)")
        .order("transaction_date", { ascending: false });

      if (!txError && dbTransactions && dbTransactions.length > 0) {
        setTransactions(
          dbTransactions.map((t: any) => ({
            id: t.id,
            user_id: t.user_id,
            account_id: t.account_id,
            account_name: t.accounts?.name || "Account",
            category_id: t.category_id,
            category_name: t.categories?.name || "Other",
            type: t.type,
            amount: Number(t.amount),
            description: t.description || "",
            transaction_date: t.transaction_date,
            title: t.description || t.categories?.name || "Transaction",
            category: t.categories?.name || "Other",
            account: t.accounts?.name || "Account",
            date: t.transaction_date.split("T")[0],
          }))
        );
      }

      // 4. Fetch Savings Goals
      const { data: dbGoals, error: goalError } = await supabase
        .from("savings_goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (!goalError && dbGoals && dbGoals.length > 0) {
        setSavingsGoals(
          dbGoals.map((g: any) => ({
            id: g.id,
            user_id: g.user_id,
            title: g.name,
            name: g.name,
            targetAmount: Number(g.target_amount),
            target_amount: Number(g.target_amount),
            currentAmount: 0,
            targetDate: g.target_date || "2027-01-01",
            category: "General",
          }))
        );
      }
    } catch (err) {
      console.error("Error loading Supabase financial state:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, user, supabase]);

  React.useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  // Recalculate dynamic bar charts
  const updateChartFromTransaction = (type: TransactionType, amount: number) => {
    setChartData((prev) => {
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      if (lastIdx >= 0) {
        if (type === "income") {
          updated[lastIdx] = {
            ...updated[lastIdx],
            income: updated[lastIdx].income + amount,
          };
        } else if (type === "expense") {
          updated[lastIdx] = {
            ...updated[lastIdx],
            expense: updated[lastIdx].expense + amount,
          };
        }
      }
      return updated;
    });
  };

  // Add Transaction Handler: Atomically updates accounts, history, and charts
  const addTransaction = async (
    input: AddTransactionInput
  ): Promise<{ success: boolean; error?: string }> => {
    if (!input.amount || input.amount <= 0) {
      return { success: false, error: "Amount must be greater than zero." };
    }
    if (!input.account_id) {
      return { success: false, error: "Please select an account." };
    }
    if (!input.category_id) {
      return { success: false, error: "Please select a category." };
    }
    if (input.description && input.description.length > 200) {
      return {
        success: false,
        error: "Description cannot exceed 200 characters.",
      };
    }

    const transactionId = `tx-${Date.now()}`;
    const newTransaction: Transaction = {
      id: transactionId,
      user_id: user?.id,
      account_id: input.account_id,
      account_name: input.account_name,
      category_id: input.category_id,
      category_name: input.category_name,
      type: input.type,
      amount: input.amount,
      description: input.description,
      transaction_date: input.transaction_date,
      title: input.description || input.category_name,
      category: input.category_name,
      account: input.account_name,
      date: input.transaction_date.split("T")[0],
    };

    // 1. Optimistic Local State Update for Accounts & Balances
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.id === input.account_id) {
          const current = acc.current_balance ?? acc.balance ?? 0;
          const newBalance =
            input.type === "income"
              ? current + input.amount
              : current - input.amount;

          return {
            ...acc,
            current_balance: newBalance,
            balance: newBalance,
          };
        }
        return acc;
      })
    );

    // 2. Prepend transaction to history
    setTransactions((prev) => [newTransaction, ...prev]);

    // 3. Update Chart
    updateChartFromTransaction(input.type, input.amount);

    // 4. Synchronize with Supabase if online and authenticated
    if (isConfigured && user) {
      try {
        const { error: insertTxError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            account_id: input.account_id,
            category_id: input.category_id,
            type: input.type,
            amount: input.amount,
            description: input.description || null,
            transaction_date: input.transaction_date.split("T")[0],
          });

        if (insertTxError) {
          console.error("Supabase insert transaction error:", insertTxError);
          // Notice: Local optimistic state is retained for responsive UX
        } else {
          // Update account current_balance in Supabase
          const targetAccount = accounts.find((a) => a.id === input.account_id);
          if (targetAccount) {
            const current =
              targetAccount.current_balance ?? targetAccount.balance ?? 0;
            const updatedBalance =
              input.type === "income"
                ? current + input.amount
                : current - input.amount;

            await supabase
              .from("accounts")
              .update({
                current_balance: updatedBalance,
                updated_at: new Date().toISOString(),
              })
              .eq("id", input.account_id);
          }
        }
      } catch (err) {
        console.error("Failed to sync transaction to Supabase:", err);
      }
    }

    return { success: true };
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        categories,
        savingsGoals,
        chartData,
        metrics,
        isLoading,
        addTransaction,
        refreshData: loadSupabaseData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = React.useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
}
