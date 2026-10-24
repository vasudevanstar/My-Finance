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
  loadError: string | null;
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

  const [accounts, setAccounts] = React.useState<Account[]>(() =>
    !isConfigured ? initialAccounts : []
  );
  const [transactions, setTransactions] = React.useState<Transaction[]>(() =>
    !isConfigured ? initialTransactions : []
  );
  const [categories, setCategories] = React.useState<Category[]>(() =>
    !isConfigured ? initialCategories : []
  );
  const [savingsGoals, setSavingsGoals] = React.useState<SavingsGoal[]>(() =>
    !isConfigured ? initialSavingsGoals : []
  );
  const [chartData, setChartData] = React.useState(monthlyOverviewData);
  const [isLoading, setIsLoading] = React.useState<boolean>(isConfigured);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Compute live balances & totals purely from transactions & accounts
  // TRANSFERS DO NOT COUNT TOWARDS INCOME OR EXPENSES
  const metrics: DashboardMetrics = React.useMemo(() => {
    // 1. Calculate per-account net balance from transactions
    // Each account balance = opening_balance + sum(income into acc) - sum(expense from acc) + sum(transfers into acc) - sum(transfers out of acc)
    const computedAccounts = accounts.map((acc) => {
      const accTxs = transactions.filter(
        (t) =>
          t.account_id === acc.id ||
          t.source_account_id === acc.id ||
          t.destination_account_id === acc.id
      );

      let balance = acc.opening_balance ?? 0;
      for (const t of accTxs) {
        if (t.type === "income" && t.account_id === acc.id) {
          balance += t.amount;
        } else if (t.type === "expense" && t.account_id === acc.id) {
          balance -= t.amount;
        } else if (t.type === "transfer") {
          if (t.destination_account_id === acc.id) {
            balance += t.amount;
          }
          if (t.source_account_id === acc.id) {
            balance -= t.amount;
          }
        }
      }
      return { ...acc, current_balance: balance };
    });

    const totalBalance = computedAccounts.reduce(
      (sum, acc) => sum + acc.current_balance,
      0
    );

    const bankBalance = computedAccounts
      .filter((acc) => acc.type === "bank")
      .reduce((sum, acc) => sum + acc.current_balance, 0);

    const cashInHand = computedAccounts
      .filter((acc) => acc.type === "cash")
      .reduce((sum, acc) => sum + acc.current_balance, 0);

    const savingsTotal = computedAccounts
      .filter((acc) => acc.type === "savings")
      .reduce((sum, acc) => sum + acc.current_balance, 0);

    // Strictly count ONLY income and expense; Transfers are excluded
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

  const transfers = React.useMemo(() => {
    return transactions.filter((t) => t.type === "transfer");
  }, [transactions]);

  // Dynamic monthly chart calculated from real transaction dates
  const updateMonthlyChart = React.useCallback(
    (txs: Transaction[]) => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();
      const last6Months: Array<{ month: string; income: number; expense: number; monthKey: string }> = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = monthNames[d.getMonth()];
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        last6Months.push({ month: monthName, income: 0, expense: 0, monthKey });
      }

      for (const t of txs) {
        if (t.type === "transfer") continue; // NEVER count transfers in charts!
        const txMonth = (t.transaction_date || t.date || "").slice(0, 7);
        const match = last6Months.find((m) => m.monthKey === txMonth);
        if (match) {
          if (t.type === "income") {
            match.income += t.amount;
          } else if (t.type === "expense") {
            match.expense += t.amount;
          }
        }
      }

      setChartData(
        last6Months.map(({ month, income, expense }) => ({ month, income, expense }))
      );
    },
    []
  );

  // Load real data from Supabase
  const loadSupabaseData = React.useCallback(async () => {
    if (!isConfigured || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      // 1. Efficient parallel queries using user isolation
      const [accRes, catRes, txRes, goalRes] = await Promise.all([
        supabase
          .from("accounts")
          .select("id, user_id, name, type, opening_balance, current_balance, created_at, updated_at")
          .order("created_at", { ascending: true }),
        supabase
          .from("categories")
          .select("id, user_id, name, type, icon, is_system, created_at")
          .order("name", { ascending: true }),
        supabase
          .from("transactions")
          .select(
            "id, user_id, account_id, category_id, type, amount, description, transaction_date, source_account_id, destination_account_id, created_at, accounts(id, name), categories(id, name)"
          )
          .order("transaction_date", { ascending: false }),
        supabase
          .from("savings_goals")
          .select("id, user_id, name, target_amount, target_date, description, created_at, updated_at")
          .order("created_at", { ascending: false }),
      ]);

      if (accRes.error) throw new Error(accRes.error.message);
      if (catRes.error) throw new Error(catRes.error.message);
      if (txRes.error) throw new Error(txRes.error.message);
      if (goalRes.error) throw new Error(goalRes.error.message);

      const dbAccounts: Account[] = (accRes.data || []).map((a: any) => ({
        id: a.id,
        user_id: a.user_id,
        name: a.name,
        type: a.type,
        opening_balance: Number(a.opening_balance) || 0,
        current_balance: Number(a.current_balance) || 0,
        balance: Number(a.current_balance) || 0,
        accountNumberMasked: a.type === "cash" ? "Cash Wallet" : "•••• Bank",
        institution: a.type === "cash" ? "Physical Cash" : "Bank Account",
      }));

      const dbCategories: Category[] = (catRes.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        icon: c.icon,
        is_system: c.is_system,
      }));

      // Map transactions with account names
      const accountsMap = new Map(dbAccounts.map((a) => [a.id, a.name]));

      const dbTransactions: Transaction[] = (txRes.data || []).map((t: any) => {
        const sourceName = t.source_account_id ? accountsMap.get(t.source_account_id) : undefined;
        const destName = t.destination_account_id ? accountsMap.get(t.destination_account_id) : undefined;
        const accName = t.accounts?.name || accountsMap.get(t.account_id) || (sourceName && destName ? `${sourceName} → ${destName}` : "Account");
        const catName = t.categories?.name || (t.type === "transfer" ? "Transfer" : "Other");

        return {
          id: t.id,
          user_id: t.user_id,
          account_id: t.account_id,
          account_name: accName,
          category_id: t.category_id,
          category_name: catName,
          type: t.type,
          amount: Number(t.amount),
          description: t.description || "",
          transaction_date: t.transaction_date,
          source_account_id: t.source_account_id,
          source_account_name: sourceName,
          destination_account_id: t.destination_account_id,
          destination_account_name: destName,
          title: t.description || catName,
          category: catName,
          account: accName,
          date: t.transaction_date.split("T")[0],
        };
      });

      const dbGoals: SavingsGoal[] = (goalRes.data || []).map((g: any) => ({
        id: g.id,
        user_id: g.user_id,
        title: g.name,
        name: g.name,
        targetAmount: Number(g.target_amount),
        target_amount: Number(g.target_amount),
        currentAmount: 0,
        targetDate: g.target_date || "2027-01-01",
        category: "General",
      }));

      setAccounts(dbAccounts);
      setCategories(dbCategories);
      setTransactions(dbTransactions);
      setSavingsGoals(dbGoals);
      updateMonthlyChart(dbTransactions);
    } catch (err: any) {
      console.error("Error loading real Supabase data:", err);
      setLoadError(err.message || "Failed to load financial records from database.");
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, user, supabase, updateMonthlyChart]);

  React.useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

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

    // Optimistic Local State Update for Accounts & Balances
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

    // Prepend transaction to history
    setTransactions((prev) => {
      const updated = [newTransaction, ...prev];
      updateMonthlyChart(updated);
      return updated;
    });

    // Synchronize with Supabase
    if (isConfigured && user) {
      try {
        const { data: inserted, error: insertTxError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            account_id: input.account_id,
            category_id: input.category_id,
            type: input.type,
            amount: input.amount,
            description: input.description || null,
            transaction_date: input.transaction_date.split("T")[0],
          })
          .select()
          .single();

        if (insertTxError) {
          console.error("Supabase insert transaction error:", insertTxError);
          return { success: false, error: insertTxError.message };
        }

        // Update real balance in accounts table
        const targetAccount = accounts.find((a) => a.id === input.account_id);
        if (targetAccount) {
          const current = targetAccount.current_balance ?? targetAccount.balance ?? 0;
          const updatedBalance =
            input.type === "income" ? current + input.amount : current - input.amount;

          await supabase
            .from("accounts")
            .update({
              current_balance: updatedBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("id", input.account_id);
        }
      } catch (err: any) {
        console.error("Failed to sync transaction to Supabase:", err);
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  };

  // Money Transfer Handler
  const transferMoney = async (
    input: TransferInput
  ): Promise<{ success: boolean; error?: string }> => {
    if (!input.amount || input.amount <= 0) {
      return { success: false, error: "Transfer amount must be greater than zero." };
    }
    if (!input.fromAccountId || !input.toAccountId) {
      return { success: false, error: "Please select both source and destination accounts." };
    }
    if (input.fromAccountId === input.toAccountId) {
      return {
        success: false,
        error: "Source and destination accounts cannot be the same.",
      };
    }

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

    // Optimistic balance shift: Decrement source, increment destination
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

    // Prepend to transaction history
    setTransactions((prev) => [newTransferTransaction, ...prev]);

    // Synchronize with Supabase
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
          return { success: false, error: insertTxError.message };
        }

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
      } catch (err: any) {
        console.error("Failed to sync transfer to Supabase:", err);
        return { success: false, error: err.message };
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
        loadError,
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
