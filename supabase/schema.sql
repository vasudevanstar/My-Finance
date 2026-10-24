-- ==============================================================================
-- MY FINANCE - SUPABASE POSTGRESQL SCHEMA INITIALIZATION
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean Existing Tables (Cascade if recreating)
DROP TABLE IF EXISTS public.savings_contributions CASCADE;
DROP TABLE IF EXISTS public.savings_goals CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ==============================================================================
-- TABLE 1: profiles
-- Stores user identity, student details, and baseline preferences
-- ==============================================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    major TEXT DEFAULT 'Undergraduate',
    graduation_year TEXT DEFAULT '2027',
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ==============================================================================
-- TABLE 2: accounts
-- Stores bank, cash, and future financial wallets
-- ==============================================================================
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'savings', 'wallet', 'credit')),
    opening_balance NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
    current_balance NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ==============================================================================
-- TABLE 3: categories
-- Categorization for income and expense classification
-- ==============================================================================
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system presets, UUID for user custom
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    is_system BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ==============================================================================
-- TABLE 4: transactions
-- Records all expenses, earnings, and balance transfers
-- ==============================================================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    destination_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ==============================================================================
-- TABLE 5: savings_goals
-- Targets for college savings and tech/travel goals
-- ==============================================================================
CREATE TABLE public.savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(14, 2) NOT NULL CHECK (target_amount > 0),
    target_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ==============================================================================
-- TABLE 6: savings_contributions
-- Records individual deposits into savings targets
-- ==============================================================================
CREATE TABLE public.savings_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    savings_goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY EFFICIENCY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_source_dest ON public.transactions(source_account_id, destination_account_id);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_contributions_user_id ON public.savings_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_contributions_goal_id ON public.savings_contributions(savings_goal_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES RLS
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- 2. ACCOUNTS RLS
CREATE POLICY "Users can read own accounts"
    ON public.accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
    ON public.accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
    ON public.accounts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
    ON public.accounts FOR DELETE
    USING (auth.uid() = user_id);

-- 3. CATEGORIES RLS (Users see system defaults or their own custom categories)
CREATE POLICY "Users can view system and own categories"
    ON public.categories FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- 4. TRANSACTIONS RLS
CREATE POLICY "Users can read own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

-- 5. SAVINGS GOALS RLS
CREATE POLICY "Users can read own savings goals"
    ON public.savings_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings goals"
    ON public.savings_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals"
    ON public.savings_goals FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals"
    ON public.savings_goals FOR DELETE
    USING (auth.uid() = user_id);

-- 6. SAVINGS CONTRIBUTIONS RLS
CREATE POLICY "Users can read own savings contributions"
    ON public.savings_contributions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings contributions"
    ON public.savings_contributions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings contributions"
    ON public.savings_contributions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings contributions"
    ON public.savings_contributions FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION & DEFAULT CATEGORIES ON USER SIGNUP
-- ==============================================================================

-- Function: Auto create profile and default categories upon new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Create student profile
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );

    -- 2. Create default starter accounts
    INSERT INTO public.accounts (user_id, name, type, opening_balance, current_balance)
    VALUES 
        (NEW.id, 'Campus Checking', 'bank', 0.00, 0.00),
        (NEW.id, 'Cash in Hand', 'cash', 0.00, 0.00);

    -- 3. Populate Default Expense Categories for user
    INSERT INTO public.categories (user_id, name, type, icon, is_system)
    VALUES
        (NEW.id, 'Food', 'expense', 'Utensils', true),
        (NEW.id, 'Travel', 'expense', 'Bus', true),
        (NEW.id, 'Education', 'expense', 'GraduationCap', true),
        (NEW.id, 'Mobile & Internet', 'expense', 'Wifi', true),
        (NEW.id, 'Shopping', 'expense', 'ShoppingBag', true),
        (NEW.id, 'Entertainment', 'expense', 'Film', true),
        (NEW.id, 'Personal', 'expense', 'User', true),
        (NEW.id, 'Bills & Subscriptions', 'expense', 'CreditCard', true),
        (NEW.id, 'Other', 'expense', 'CircleDollarSign', true);

    -- 4. Populate Default Income Categories for user
    INSERT INTO public.categories (user_id, name, type, icon, is_system)
    VALUES
        (NEW.id, 'Home', 'income', 'Home', true),
        (NEW.id, 'Scholarship', 'income', 'Award', true),
        (NEW.id, 'Part-time', 'income', 'Briefcase', true),
        (NEW.id, 'Other', 'income', 'DollarSign', true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Execute whenever a new row is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- AUTOMATIC UPDATED_AT TIMESTAMP TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_accounts_timestamp BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_transactions_timestamp BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_savings_goals_timestamp BEFORE UPDATE ON public.savings_goals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
