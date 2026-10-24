"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Building2, Plus, CreditCard, Banknote } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Account, AccountType } from "@/types/finance";
import { useFinance } from "@/contexts/finance-context";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";

export default function AccountsPage() {
  const { accounts, refreshData } = useFinance();
  const { user, isConfigured } = useAuth();
  const supabase = React.useMemo(() => createClient(), []);

  const [addAccountOpen, setAddAccountOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [balance, setBalance] = React.useState("");
  const [type, setType] = React.useState<AccountType>("bank");
  const [institution, setInstitution] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return;
    setIsSubmitting(true);

    const numericBalance = parseFloat(balance);

    if (isConfigured && user) {
      await supabase.from("accounts").insert({
        user_id: user.id,
        name,
        type,
        opening_balance: numericBalance,
        current_balance: numericBalance,
      });
      await refreshData();
    }

    setName("");
    setBalance("");
    setInstitution("");
    setIsSubmitting(false);
    setAddAccountOpen(false);
  };

  const totalCalculated = accounts.reduce(
    (acc, curr) => acc + (curr.current_balance ?? curr.balance ?? 0),
    0
  );

  return (
    <AppShell
      title="Accounts & Wallets"
      subtitle="Manage your connected campus bank accounts, savings funds, and physical cash in INR."
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Combined Assets
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(totalCalculated)}
          </div>
        </div>

        <Button onClick={() => setAddAccountOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const Icon =
            acc.type === "cash"
              ? Banknote
              : acc.type === "bank"
              ? Building2
              : CreditCard;

          const bal = acc.current_balance ?? acc.balance ?? 0;

          return (
            <Card
              key={acc.id}
              className="p-6 relative flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                    {acc.type}
                  </span>
                </div>

                <h3 className="font-semibold text-slate-900 text-base">
                  {acc.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {acc.institution || (acc.type === "cash" ? "Cash Wallet" : "Campus Bank")}{" "}
                  {acc.accountNumberMasked ? `• ${acc.accountNumberMasked}` : ""}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">Available Balance</span>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {formatCurrency(bal)}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Account Modal Dialog */}
      <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
        <DialogClose onClick={() => setAddAccountOpen(false)} />
        <DialogHeader>
          <DialogTitle>Add Financial Account</DialogTitle>
          <DialogDescription>
            Register a student checking account, college wallet, or physical cash in hand.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateAccount} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Account Name
            </label>
            <Input
              placeholder="e.g., SBI Student Account, Hostel Cash"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Account Type
            </label>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
            >
              <option value="bank">Bank Account</option>
              <option value="cash">Physical Cash in Hand</option>
              <option value="savings">Savings Account</option>
              <option value="wallet">Campus Meal / Digital Wallet</option>
              <option value="credit">Student Credit Card</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Institution / Provider
            </label>
            <Input
              placeholder="e.g., State Bank of India, HDFC, Cash"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Opening Balance (₹ INR)
            </label>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddAccountOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Account"}
            </Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
