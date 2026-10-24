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
  category_id?: string;
  category_name?: string;
  account_id?: string;
  account_name?: string;
  source_account_id?: string;
  source_account_name?: string;
  destination_account_id?: string;
  destination_account_name?: string;
  description?: string;
  transaction_date: string;
}

interface TransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  transactionDate: string;
}

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  transfers: Transaction[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
  chartData: Array<{ month: string; income: number; expense: number }>;
  metrics: DashboardMetrics;
  isLoading: boolean;
  addTransaction: (
    input: AddTransactionInput
  ) => Promise<{ success: boolean; error?: string }>;
  transferMoney: (
    input: TransferInput
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
  // CRITICAL REQUIREMENT: Transfers must NOT affect totalIncome or totalExpenses!
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

    // Only count pure income and expense types
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

  // Distinct transfers list
  const transfers = React.useMemo(() => {
    return transactions.filter((t) => t.type === "transfer");
  }, [transactions]);

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
            category_name: t.categories?.name || (t.type === "transfer" ? "Transfer" : "Other"),
            type: t.type,
            amount: Number(t.amount),
            description: t.description || "",
            transaction_date: t.transaction_date,
            source_account_id: t.source_account_id,
            destination_account_id: t.destination_account_id,
            title: t.description || t.categories?.name || (t.type === "transfer" ? "Transfer" : "Transaction"),
            category: t.categories?.name || (t.type === "transfer" ? "Transfer" : "Other"),
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

  // Recalculate dynamic bar charts ONLY for income or expense (Transfers are ignored)
  const updateChartFromTransaction = (type: TransactionType, amount: number) => {
    if (type === "transfer") return; // TRANSFERS MUST NOT AFFECT SPENDING CHARTS

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

  // Add Income / Expense Transaction Handler
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
        } else {
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

  // Money Transfer Handler: Decreases source and increases destination
  const transferMoney = async (
    input: TransferInput
  ): Promise<{ success: boolean; error?: string }> => {
    // Validation 1: Zero / negative amount
    if (!input.amount || input.amount <= 0) {
      return { success: false, error: "Transfer amount must be greater than zero." };
    }

    // Validation 2: Same source and destination
    if (!input.fromAccountId || !input.toAccountId) {
      return { success: false, error: "Please select both source and destination accounts." };
    }
    if (input.fromAccountId === input.toAccountId) {
      return {
        success: false,
        error: "Source and destination accounts cannot be the same.",
      };
    }

    // Validation 3: Transfer greater than available balance
    const sourceAccount = accounts.find((a) => a.id === input.fromAccountId);
    const destAccount = accounts.find((a) => a.id === input.toAccountId);

    if (!sourceAccount) {
      return { success: false, error: "Source account not found." };
    }
    if (!destAccount) {
      return { success: false, error: "Destination account not found." };
    }

    const availableBalance = sourceAccount.current_balance ?? sourceAccount.balance ?? 0;
    if (input.amount > availableBalance) {
      return {
        success: false,
        error: `Insufficient balance. Available in ${sourceAccount.name}: ₹${availableBalance.toLocaleString(
          "en-IN"
        )}`,
      };
    }

    if (input.description && input.description.length > 200) {
      return {
        success: false,
        error: "Description cannot exceed 200 characters.",
      };
    }

    const transactionId = `tx-transfer-${Date.now()}`;
    const defaultTransferDesc = `Transfer: ${sourceAccount.name} → ${destAccount.name}`;

    const newTransferTransaction: Transaction = {
      id: transactionId,
      user_id: user?.id,
      account_id: input.fromAccountId,
      account_name: sourceAccount.name,
      source_account_id: input.fromAccountId,
      source_account_name: sourceAccount.name,
      destination_account_id: input.toAccountId,
      destination_account_name: destAccount.name,
      type: "transfer",
      amount: input.amount,
      description: input.description?.trim() || defaultTransferDesc,
      transaction_date: input.transactionDate,
      title: input.description?.trim() || defaultTransferDesc,
      category: "Transfer",
      category_name: "Transfer",
      account: `${sourceAccount.name} → ${destAccount.name}`,
      date: input.transactionDate.split("T")[0],
    };

    // 1. Optimistic Local State Update:
    // Decrement source by amount, increment destination by amount
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (acc.id === input.fromAccountId) {
          const current = acc.current_balance ?? acc.balance ?? 0;
          const newBal = current - input.amount;
          return { ...acc, current_balance: newBal, balance: newBal };
        }
        if (acc.id === input.toAccountId) {
          const current = acc.current_balance ?? acc.balance ?? 0;
          const newBal = current + input.amount;
          return { ...acc, current_balance: newBal, balance: newBal };
        }
        return acc;
      })
    );

    // 2. Prepend to transaction history
    setTransactions((prev) => [newTransferTransaction, ...prev]);

    // Notice: We deliberately DO NOT call updateChartFromTransaction because
    // transfers must not affect spending charts, total income, or total expenses.

    // 3. Synchronize with Supabase if online
    if (isConfigured && user) {
      try {
        const { error: insertTxError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            account_id: input.fromAccountId,
            source_account_id: input.fromAccountId,
            destination_account_id: input.toAccountId,
            type: "transfer",
            amount: input.amount,
            description: input.description?.trim() || defaultTransferDesc,
            transaction_date: input.transactionDate.split("T")[0],
          });

        if (insertTxError) {
          console.error("Supabase transfer insert error:", insertTxError);
        } else {
          // Update both source and destination account balances in Supabase
          const newSourceBal = (sourceAccount.current_balance ?? sourceAccount.balance ?? 0) - input.amount;
          const newDestBal = (destAccount.current_balance ?? destAccount.balance ?? 0) + input.amount;

          await Promise.all([
            supabase
              .from("accounts")
              .update({
                current_balance: newSourceBal,
                updated_at: new Date().toISOString(),
              })
              .eq("id", input.fromAccountId),
            supabase
              .from("accounts")
              .update({
                current_balance: newDestBal,
                updated_at: new Date().toISOString(),
              })
              .eq("id", input.toAccountId),
          ]);
        }
      } catch (err) {
        console.error("Failed to sync transfer to Supabase:", err);
      }
    }

    return { success: true };
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        transfers,
        categories,
        savingsGoals,
        chartData,
        metrics,
        isLoading,
        addTransaction,
        transferMoney,
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
