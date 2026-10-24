"use client";

import * as React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { initialAccounts } from "@/lib/mock-data";

export type ActionModalType = "income" | "expense" | "transfer" | null;

interface ActionModalsProps {
  activeModal: ActionModalType;
  onClose: () => void;
  onSuccessNotice?: (message: string) => void;
}

export function ActionModals({
  activeModal,
  onClose,
  onSuccessNotice,
}: ActionModalsProps) {
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("Food & Dining");
  const [account, setAccount] = React.useState(initialAccounts[0].name);
  const [toAccount, setToAccount] = React.useState(initialAccounts[1].name);

  // Reset form when modal closes or opens
  React.useEffect(() => {
    setAmount("");
    setDescription("");
  }, [activeModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    if (activeModal === "income") {
      onSuccessNotice?.(`Added income of $${amount} to ${account}`);
    } else if (activeModal === "expense") {
      onSuccessNotice?.(`Recorded expense of $${amount} for ${description || category}`);
    } else if (activeModal === "transfer") {
      onSuccessNotice?.(`Transferred $${amount} from ${account} to ${toAccount}`);
    }
    onClose();
  };

  return (
    <Dialog open={activeModal !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogClose onClick={onClose} />
      <DialogHeader>
        <DialogTitle>
          {activeModal === "income" && "Add New Income"}
          {activeModal === "expense" && "Record Expense"}
          {activeModal === "transfer" && "Transfer Funds"}
        </DialogTitle>
        <DialogDescription>
          {activeModal === "income" &&
            "Record part-time paychecks, family allowance, or student stipends."}
          {activeModal === "expense" &&
            "Track everyday student expenses, books, meals, and transport."}
          {activeModal === "transfer" &&
            "Move money between your checking, savings, or physical cash."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Amount ($)
          </label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-base font-semibold"
          />
        </div>

        {activeModal !== "transfer" && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Payee
            </label>
            <Input
              type="text"
              placeholder={
                activeModal === "income"
                  ? "e.g., Campus Library Tutoring"
                  : "e.g., University Bookstore, Grocery prep"
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}

        {activeModal === "expense" && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Food & Dining">Food & Dining</option>
              <option value="Tuition & Books">Tuition & Books</option>
              <option value="Housing & Rent">Housing & Rent</option>
              <option value="Transport">Transport</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </Select>
          </div>
        )}

        {activeModal === "income" && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Income Source
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Part-time Job">Part-time Job</option>
              <option value="Allowance & Family">Allowance & Family</option>
              <option value="Scholarship / Grant">Scholarship / Grant</option>
              <option value="Other">Other</option>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {activeModal === "transfer" ? "From Account" : "Account"}
            </label>
            <Select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            >
              {initialAccounts.map((acc) => (
                <option key={acc.id} value={acc.name}>
                  {acc.name}
                </option>
              ))}
            </Select>
          </div>

          {activeModal === "transfer" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                To Account
              </label>
              <Select
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
              >
                {initialAccounts
                  .filter((acc) => acc.name !== account)
                  .map((acc) => (
                    <option key={acc.id} value={acc.name}>
                      {acc.name}
                    </option>
                  ))}
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={
              activeModal === "income"
                ? "success"
                : activeModal === "expense"
                ? "destructive"
                : "default"
            }
          >
            {activeModal === "income" && "Add Income"}
            {activeModal === "expense" && "Record Expense"}
            {activeModal === "transfer" && "Complete Transfer"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
