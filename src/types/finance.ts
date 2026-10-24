export type TransactionType = "income" | "expense" | "transfer";

export type AccountType = "bank" | "cash" | "savings" | "wallet" | "credit";

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  is_system?: boolean;
}

export interface Account {
  id: string;
  user_id?: string;
  name: string;
  type: AccountType;
  opening_balance?: number;
  current_balance: number;
  balance?: number; // fallback compatibility
  accountNumberMasked?: string;
  institution?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  account_id?: string;
  account_name?: string;
  category_id?: string;
  category_name?: string;
  type: TransactionType;
  amount: number;
  description?: string;
  transaction_date: string; // ISO string or YYYY-MM-DD
  source_account_id?: string;
  source_account_name?: string;
  destination_account_id?: string;
  destination_account_name?: string;
  created_at?: string;
  updated_at?: string;
  // Compatibility fields
  title?: string;
  category?: string;
  account?: string;
  date?: string;
}

export interface SavingsContribution {
  id: string;
  user_id?: string;
  savings_goal_id: string;
  account_id?: string | null;
  account_name?: string;
  amount: number;
  description?: string;
  contribution_date: string;
  created_at?: string;
}

export interface SavingsGoal {
  id: string;
  user_id?: string;
  name: string;
  title?: string; // compatibility
  target_amount: number;
  targetAmount?: number; // compatibility
  current_amount: number;
  currentAmount?: number; // compatibility
  target_date?: string | null;
  targetDate?: string; // compatibility
  description?: string | null;
  category?: string;
  iconName?: string;
  contributions?: SavingsContribution[];
  created_at?: string;
  updated_at?: string;
}

export interface DashboardMetrics {
  totalBalance: number;
  bankBalance: number;
  cashInHand: number;
  totalIncome: number;
  totalExpenses: number;
  savingsTotal: number;
  monthReceived: number;
  monthSpent: number;
}
