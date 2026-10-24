"use client";

import * as React from "react";
import {
  Account,
  Category,
  DashboardMetrics,
  SavingsContribution,
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

interface CreateGoalInput {
  name: string;
  target_amount: number;
  target_date?: string;
  description?: string;
}

interface UpdateGoalInput {
  id: string;
  name: string;
  target_amount: number;
  target_date?: string;
  description?: string;
}

interface AddContributionInput {
  savings_goal_id: string;
  amount: number;
  account_id?: string;
  description?: string;
  contribution_date?: string;
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
  createSavingsGoal: (
    input: CreateGoalInput
  ) => Promise<{ success: boolean; error?: string }>;
  updateSavingsGoal: (
    input: UpdateGoalInput
  ) => Promise<{ success: boolean; error?: string }>;
  deleteSavingsGoal: (
    id: string
  ) => Promise<{ success: boolean; error?: string }>;
  addSavingsContribution: (
    input: AddContributionInput
  ) => Promise<{ success: boolean; error?: string }>;
  updateTransaction: (
    id: string,
    input: Partial<AddTransactionInput>
  ) => Promise<{ success: boolean; error?: string }>;
  deleteTransaction: (
    id: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: (
    id: string
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
  // TRANSFERS & SAVINGS CONTRIBUTIONS DO NOT COUNT AS EXPENSES OR INCOME
  const metrics: DashboardMetrics = React.useMemo(() => {
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

    // Sum of all money allocated across active savings targets
    const savingsTotal = savingsGoals.reduce(
      (sum, g) => sum + (g.current_amount ?? g.currentAmount ?? 0),
      0
    );

    // Strictly count ONLY income and expense; Transfers & Savings are excluded
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
  }, [accounts, transactions, savingsGoals]);

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
        if (t.type === "transfer") continue;
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

  // Load real data from Supabase including savings_contributions
  const loadSupabaseData = React.useCallback(async () => {
    if (!isConfigured || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const [accRes, catRes, txRes, goalRes, contribRes] = await Promise.all([
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
            "id, user_id, account_id, category_id, type, amount, description, transaction_date, source_account_id, destination_account_id, created_at"
          )
          .order("transaction_date", { ascending: false }),
        supabase
          .from("savings_goals")
          .select("id, user_id, name, target_amount, target_date, description, created_at, updated_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("savings_contributions")
          .select("id, user_id, savings_goal_id, account_id, amount, description, contribution_date, created_at")
          .order("contribution_date", { ascending: false }),
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

      const accountsMap = new Map(dbAccounts.map((a) => [a.id, a.name]));
      const categoriesMap = new Map(dbCategories.map((c) => [c.id, c.name]));

      const dbTransactions: Transaction[] = (txRes.data || []).map((t: any) => {
        const sourceName = t.source_account_id ? accountsMap.get(t.source_account_id) : undefined;
        const destName = t.destination_account_id ? accountsMap.get(t.destination_account_id) : undefined;
        const accName = accountsMap.get(t.account_id) || (sourceName && destName ? `${sourceName} → ${destName}` : "Account");
        const catName = categoriesMap.get(t.category_id) || (t.type === "transfer" ? "Transfer" : "Other");

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

      // Calculate total contributions per goal from real records
      const contributionsMap = new Map<string, { total: number; list: SavingsContribution[] }>();
      (contribRes.data || []).forEach((c: any) => {
        const existing = contributionsMap.get(c.savings_goal_id) || { total: 0, list: [] };
        const amt = Number(c.amount) || 0;
        existing.total += amt;
        existing.list.push({
          id: c.id,
          user_id: c.user_id,
          savings_goal_id: c.savings_goal_id,
          account_id: c.account_id,
          account_name: accountsMap.get(c.account_id) || "Account",
          amount: amt,
          description: c.description || "",
          contribution_date: c.contribution_date,
          created_at: c.created_at,
        });
        contributionsMap.set(c.savings_goal_id, existing);
      });

      const dbGoals: SavingsGoal[] = (goalRes.data || []).map((g: any) => {
        const goalContribs = contributionsMap.get(g.id);
        const currentSaved = goalContribs?.total || 0;
        const targetAmt = Number(g.target_amount) || 0;

        return {
          id: g.id,
          user_id: g.user_id,
          name: g.name,
          title: g.name,
          target_amount: targetAmt,
          targetAmount: targetAmt,
          current_amount: currentSaved,
          currentAmount: currentSaved,
          target_date: g.target_date || null,
          targetDate: g.target_date || "2027-01-01",
          description: g.description || "",
          contributions: goalContribs?.list || [],
          created_at: g.created_at,
          updated_at: g.updated_at,
        };
      });

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

  // Create Savings Goal
  const createSavingsGoal = async (
    input: CreateGoalInput
  ): Promise<{ success: boolean; error?: string }> => {
    if (!input.name || !input.name.trim()) {
      return { success: false, error: "Please enter a valid goal name." };
    }
    if (!input.target_amount || input.target_amount <= 0) {
      return { success: false, error: "Target amount must be greater than ₹0." };
    }

    const tempId = `goal-${Date.now()}`;
    const newGoal: SavingsGoal = {
      id: tempId,
      user_id: user?.id,
      name: input.name.trim(),
      title: input.name.trim(),
      target_amount: input.target_amount,
      targetAmount: input.target_amount,
      current_amount: 0,
      currentAmount: 0,
      target_date: input.target_date || null,
      targetDate: input.target_date || "2027-01-01",
      description: input.description?.trim() || null,
      contributions: [],
    };

    setSavingsGoals((prev) => [newGoal, ...prev]);

    if (isConfigured && user) {
      try {
        const { data, error } = await supabase
          .from("savings_goals")
          .insert({
            user_id: user.id,
            name: input.name.trim(),
            target_amount: input.target_amount,
            target_date: input.target_date || null,
            description: input.description?.trim() || null,
          })
          .select()
          .single();

        if (error) {
          console.error("Supabase insert savings_goal error:", error);
          return { success: false, error: error.message };
        }
        if (data) {
          setSavingsGoals((prev) =>
            prev.map((g) => (g.id === tempId ? { ...g, id: data.id } : g))
          );
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  };

  // Update Savings Goal
  const updateSavingsGoal = async (
    input: UpdateGoalInput
  ): Promise<{ success: boolean; error?: string }> => {
    if (!input.name || !input.name.trim()) {
      return { success: false, error: "Goal name cannot be empty." };
    }
    if (!input.target_amount || input.target_amount <= 0) {
      return { success: false, error: "Target amount must be greater than ₹0." };
    }

    setSavingsGoals((prev) =>
      prev.map((g) => {
        if (g.id === input.id) {
          return {
            ...g,
            name: input.name.trim(),
            title: input.name.trim(),
            target_amount: input.target_amount,
            targetAmount: input.target_amount,
            target_date: input.target_date || null,
            targetDate: input.target_date || "2027-01-01",
            description: input.description?.trim() || null,
          };
        }
        return g;
      })
    );

    if (isConfigured && user) {
      try {
        const { error } = await supabase
          .from("savings_goals")
          .update({
            name: input.name.trim(),
            target_amount: input.target_amount,
            target_date: input.target_date || null,
            description: input.description?.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", input.id);

        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  };

  // Delete Savings Goal
  const deleteSavingsGoal = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));

    if (isConfigured && user) {
      try {
        const { error } = await supabase
          .from("savings_goals")
          .delete()
          .eq("id", id);

        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  };

  // Add Savings Contribution: Allocates money toward a goal
  // IMPORTANT: A savings contribution represents money allocated toward a goal; NOT an expense!
  const addSavingsContribution = async (
    input: AddContributionInput
  ): Promise<{ success: boolean; error?: string }> => {
    if (!input.amount || input.amount <= 0) {
      return { success: false, error: "Contribution amount must be greater than ₹0." };
    }

    const targetGoal = savingsGoals.find((g) => g.id === input.savings_goal_id);
    if (!targetGoal) {
      return { success: false, error: "Savings goal not found." };
    }

    const sourceAccount = input.account_id
      ? accounts.find((a) => a.id === input.account_id)
      : undefined;

    // Check balance if an account was designated
    if (sourceAccount) {
      const avail = sourceAccount.current_balance ?? sourceAccount.balance ?? 0;
      if (input.amount > avail) {
        return {
          success: false,
          error: `Insufficient balance in ${sourceAccount.name}. Available: ₹${avail.toLocaleString("en-IN")}`,
        };
      }
    }

    const contribId = `contrib-${Date.now()}`;
    const newContrib: SavingsContribution = {
      id: contribId,
      user_id: user?.id,
      savings_goal_id: input.savings_goal_id,
      account_id: input.account_id || null,
      account_name: sourceAccount?.name,
      amount: input.amount,
      description: input.description?.trim() || `Allocated toward ${targetGoal.name}`,
      contribution_date: input.contribution_date || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // 1. Update goal current amount
    setSavingsGoals((prev) =>
      prev.map((g) => {
        if (g.id === input.savings_goal_id) {
          const updatedCurrent = (g.current_amount ?? g.currentAmount ?? 0) + input.amount;
          const updatedList = [newContrib, ...(g.contributions || [])];
          return {
            ...g,
            current_amount: updatedCurrent,
            currentAmount: updatedCurrent,
            contributions: updatedList,
          };
        }
        return g;
      })
    );

    // 2. If source account selected, shift funds from account into savings reserve
    if (input.account_id) {
      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id === input.account_id) {
            const current = a.current_balance ?? a.balance ?? 0;
            const updated = current - input.amount;
            return { ...a, current_balance: updated, balance: updated };
          }
          return a;
        })
      );
    }

    // 3. Persist to Supabase if online
    if (isConfigured && user) {
      try {
        const { error: contribError } = await supabase
          .from("savings_contributions")
          .insert({
            user_id: user.id,
            savings_goal_id: input.savings_goal_id,
            account_id: input.account_id || null,
            amount: input.amount,
            description: input.description?.trim() || `Allocated toward ${targetGoal.name}`,
            contribution_date: (input.contribution_date || new Date().toISOString()).split("T")[0],
          });

        if (contribError) {
          console.error("Supabase insert savings_contribution error:", contribError);
          return { success: false, error: contribError.message };
        }

        if (input.account_id && sourceAccount) {
          const current = sourceAccount.current_balance ?? sourceAccount.balance ?? 0;
          await supabase
            .from("accounts")
            .update({
              current_balance: current - input.amount,
              updated_at: new Date().toISOString(),
            })
            .eq("id", input.account_id);
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: true };
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

    setTransactions((prev) => {
      const updated = [newTransaction, ...prev];
      updateMonthlyChart(updated);
      return updated;
    });

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
          return { success: false, error: insertTxError.message };
        }

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

    setTransactions((prev) => [newTransferTransaction, ...prev]);

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
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  };

  // Edit / Update Transaction Handler
  const updateTransaction = async (
    id: string,
    input: Partial<AddTransactionInput>
  ): Promise<{ success: boolean; error?: string }> => {
    const existing = transactions.find((t) => t.id === id);
    if (!existing) {
      return { success: false, error: "Transaction not found." };
    }

    if (input.amount !== undefined && input.amount <= 0) {
      return { success: false, error: "Amount must be strictly greater than zero." };
    }

    const updatedTx: Transaction = {
      ...existing,
      amount: input.amount ?? existing.amount,
      description: input.description ?? existing.description,
      title: input.description ?? existing.title,
      category_id: input.category_id ?? existing.category_id,
      category_name: input.category_name ?? existing.category_name,
      category: input.category_name ?? existing.category,
      account_id: input.account_id ?? existing.account_id,
      account_name: input.account_name ?? existing.account_name,
      account: input.account_name ?? existing.account,
      transaction_date: input.transaction_date ?? existing.transaction_date,
      date: (input.transaction_date ?? existing.transaction_date).split("T")[0],
    };

    setTransactions((prev) => {
      const nextList = prev.map((t) => (t.id === id ? updatedTx : t));
      updateMonthlyChart(nextList);
      return nextList;
    });

    if (isConfigured && user) {
      try {
        const updatePayload: any = { updated_at: new Date().toISOString() };
        if (input.amount !== undefined) updatePayload.amount = input.amount;
        if (input.description !== undefined) updatePayload.description = input.description;
        if (input.category_id) updatePayload.category_id = input.category_id;
        if (input.account_id) updatePayload.account_id = input.account_id;
        if (input.transaction_date) updatePayload.transaction_date = input.transaction_date.split("T")[0];

        const { error } = await supabase
          .from("transactions")
          .update(updatePayload)
          .eq("id", id)
          .eq("user_id", user.id); // Strict ownership check

        if (error) return { success: false, error: error.message };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  };

  // Delete Transaction Handler (Restores account balances accurately)
  const deleteTransaction = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    const target = transactions.find((t) => t.id === id);
    if (!target) {
      return { success: false, error: "Transaction not found." };
    }

    // Revert account balances
    if (target.type === "income" && target.account_id) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === target.account_id
            ? { ...a, current_balance: (a.current_balance ?? a.balance ?? 0) - target.amount }
            : a
        )
      );
    } else if (target.type === "expense" && target.account_id) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === target.account_id
            ? { ...a, current_balance: (a.current_balance ?? a.balance ?? 0) + target.amount }
            : a
        )
      );
    } else if (target.type === "transfer") {
      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id === target.source_account_id) {
            return { ...a, current_balance: (a.current_balance ?? a.balance ?? 0) + target.amount };
          }
          if (a.id === target.destination_account_id) {
            return { ...a, current_balance: (a.current_balance ?? a.balance ?? 0) - target.amount };
          }
          return a;
        })
      );
    }

    setTransactions((prev) => {
      const nextList = prev.filter((t) => t.id !== id);
      updateMonthlyChart(nextList);
      return nextList;
    });

    if (isConfigured && user) {
      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id); // Strict ownership check

        if (error) return { success: false, error: error.message };

        // Also update accounts in database if online
        if (target.type === "income" && target.account_id) {
          const acc = accounts.find((a) => a.id === target.account_id);
          if (acc) {
            await supabase
              .from("accounts")
              .update({ current_balance: (acc.current_balance ?? 0) - target.amount })
              .eq("id", target.account_id)
              .eq("user_id", user.id);
          }
        } else if (target.type === "expense" && target.account_id) {
          const acc = accounts.find((a) => a.id === target.account_id);
          if (acc) {
            await supabase
              .from("accounts")
              .update({ current_balance: (acc.current_balance ?? 0) + target.amount })
              .eq("id", target.account_id)
              .eq("user_id", user.id);
          }
        } else if (target.type === "transfer") {
          const src = accounts.find((a) => a.id === target.source_account_id);
          const dst = accounts.find((a) => a.id === target.destination_account_id);
          if (src && target.source_account_id) {
            await supabase
              .from("accounts")
              .update({ current_balance: (src.current_balance ?? 0) + target.amount })
              .eq("id", target.source_account_id)
              .eq("user_id", user.id);
          }
          if (dst && target.destination_account_id) {
            await supabase
              .from("accounts")
              .update({ current_balance: (dst.current_balance ?? 0) - target.amount })
              .eq("id", target.destination_account_id)
              .eq("user_id", user.id);
          }
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  };

  // Delete Account Handler (Validates account ownership and safely cascades)
  const deleteAccount = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    const targetAccount = accounts.find((a) => a.id === id);
    if (!targetAccount) {
      return { success: false, error: "Account not found." };
    }

    setAccounts((prev) => prev.filter((a) => a.id !== id));
    // Cleanly dissociate transactions connected to this deleted account
    setTransactions((prev) =>
      prev.map((t) =>
        t.account_id === id ? { ...t, account_id: undefined, account_name: "Deleted Account" } : t
      )
    );

    if (isConfigured && user) {
      try {
        const { error } = await supabase
          .from("accounts")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id); // Strict ownership check

        if (error) return { success: false, error: error.message };
      } catch (err: any) {
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
        createSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        addSavingsContribution,
        updateTransaction,
        deleteTransaction,
        deleteAccount,
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
