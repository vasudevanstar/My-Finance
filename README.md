# My Finance — Student Financial Management Application

A full-stack personal finance web application built for college students to track accounts, manage daily income and expenses in Indian Rupees (₹ - INR), transfer funds without skewing cashflow, and allocate savings toward disciplined goals.

Built with **Next.js 16 (App Router & Turbopack)**, **Tailwind CSS**, **Recharts**, and **Supabase (PostgreSQL with Row Level Security)**.

---

## Recommended Application Workflow

Follow this step-by-step workflow to get the most out of **My Finance**:

### 1. Step 1: Set Up Accounts & Wallets (`/accounts`)
> **Crucial First Step**: Every income, expense, and transfer requires an account to deposit into or deduct from.
- Navigate to **Accounts & Wallets**.
- Click **Add Account**.
- Create your primary accounts:
  - **Student Bank Account** (e.g., checking account with an opening balance like ₹5,000).
  - **Cash in Hand** (e.g., physical wallet cash like ₹1,000).
- Supports additional account types: *Savings*, *Campus Meal / Digital Wallet*, and *Student Credit Card*.

### 2. Step 2: Record Daily Transactions (`/dashboard` & `/transactions`)
- **Add Income**: Log your monthly home allowance, internship stipend, scholarship, or part-time earnings directly into your Bank account.
- **Add Expense**: Log meals, travel, lab component purchases, or mobile recharges.
- **Inter-Account Transfers**: Move money between accounts (e.g., ATM withdrawals: `Bank → Cash in Hand`).
  - *Accounting Rule*: Transfers are neutral fund movements—they update account balances without inflating total income or expenses.
- **Auto-Date & Time**: Uses current timestamp with manual override support for entering older transactions.

### 3. Step 3: Set and Fund Savings Goals (`/savings`)
- Create dedicated goal reserves (e.g., *Laptop* — ₹60,000, *Travel* — ₹15,000, *Emergency Fund* — ₹20,000).
- Click **Add Contribution** to allocate money toward goals.
- *Strict Rule*: Savings contributions represent asset reallocations and are never treated as expenses.
- Track progress with dynamic completion bars, percentages, and contribution history.

### 4. Step 4: Audit History & Filter Records (`/transactions`)
- **Fast In-Memory Search**: Search by description (e.g., `"project"` matches *"Bought project components"*, *"Project printing"*, etc.), category, or amount.
- **Filter**: Filter by date (single-day calendar or custom range), type (`Income`, `Expense`, `Transfer`), account, and category.
- **Snapshot Metrics**: View daily net cashflow change and separate transfer totals.

### 5. Step 5: Review Analytics & Spending Insights (`/dashboard` & `/reports`)
- **Received vs Spent**: Interactive Recharts comparison bar chart with Daily, Weekly, Monthly, and Yearly filters.
- Real-time balances and savings metrics automatically computed from verified transaction records.

---

## Getting Started Locally

### 1. Prerequisites
- Node.js 18.18+ or 20+
- A Supabase project with the schema from `supabase/schema.sql` applied.

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-publishable-key
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Build & Quality Checks

Run the production build:
```bash
npm run build
```

Run ESLint:
```bash
npm run lint
```

---

## Deployment to Vercel

1. Import this repository in [Vercel](https://vercel.com/new).
2. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy!
