export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccountType = "bank" | "cash" | "savings" | "wallet" | "credit";
export type CategoryType = "income" | "expense";
export type TransactionType = "income" | "expense" | "transfer";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          major: string | null;
          graduation_year: string | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          major?: string | null;
          graduation_year?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          major?: string | null;
          graduation_year?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: AccountType;
          opening_balance: number;
          current_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: AccountType;
          opening_balance?: number;
          current_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: AccountType;
          opening_balance?: number;
          current_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          type: CategoryType;
          icon: string | null;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          type: CategoryType;
          icon?: string | null;
          is_system?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          type?: CategoryType;
          icon?: string | null;
          is_system?: boolean;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          category_id: string | null;
          type: TransactionType;
          amount: number;
          description: string | null;
          transaction_date: string;
          source_account_id: string | null;
          destination_account_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          category_id?: string | null;
          type: TransactionType;
          amount: number;
          description?: string | null;
          transaction_date?: string;
          source_account_id?: string | null;
          destination_account_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string | null;
          category_id?: string | null;
          type?: TransactionType;
          amount?: number;
          description?: string | null;
          transaction_date?: string;
          source_account_id?: string | null;
          destination_account_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          target_date: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: number;
          target_date?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_amount?: number;
          target_date?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      savings_contributions: {
        Row: {
          id: string;
          user_id: string;
          savings_goal_id: string;
          account_id: string | null;
          amount: number;
          description: string | null;
          contribution_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          savings_goal_id: string;
          account_id?: string | null;
          amount: number;
          description?: string | null;
          contribution_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          savings_goal_id?: string;
          account_id?: string | null;
          amount?: number;
          description?: string | null;
          contribution_date?: string;
          created_at?: string;
        };
      };
    };
  };
}
