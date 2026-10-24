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
  destination_account_id?: string;
  created_at?: string;
  updated_at?: string;
  // Compatibility fields
  title?: string;
  category?: string;
  account?: string;
  date?: string;
}

export interface SavingsGoal {
  id: string;
  user_id?: string;
  title: string;
  name?: string;
  targetAmount: number;
  target_amount?: number;
  currentAmount: number;
  targetDate: string;
  target_date?: string;
  category?: string;
  description?: string;
  iconName?: string;
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
