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
import { useFinance } from "@/contexts/finance-context";
import { TransactionType } from "@/types/finance";
import { getCurrentDateTimeLocal, formatCurrency } from "@/lib/utils";
import {
  PlusCircle,
  MinusCircle,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  onSuccessNotice?: (message: string) => void;
}

export function AddTransactionModal({
  open,
  onClose,
  defaultType = "expense",
  onSuccessNotice,
}: AddTransactionModalProps) {
  const { accounts, categories, addTransaction } = useFinance();

  const [type, setType] = React.useState<TransactionType>(defaultType);
  const [amount, setAmount] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [transactionDateTime, setTransactionDateTime] = React.useState(
    getCurrentDateTimeLocal()
  );
  const [showCustomDate, setShowCustomDate] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Sync type when defaultType changes
  React.useEffect(() => {
    if (open) {
      setType(defaultType);
      setAmount("");
      setDescription("");
      setTransactionDateTime(getCurrentDateTimeLocal());
      setShowCustomDate(false);
      setErrorMessage(null);
    }
  }, [open, defaultType]);

  // Set default account when accounts load
  React.useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Filter categories by type
  const availableCategories = React.useMemo(() => {
    return categories.filter((c) => c.type === type);
  }, [categories, type]);

  // Update categoryId when availableCategories change
  React.useEffect(() => {
    if (availableCategories.length > 0) {
      setCategoryId(availableCategories[0].id);
    }
  }, [availableCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Please enter an amount greater than ₹0.");
      return;
    }

    if (!accountId) {
      setErrorMessage("Please select a target account.");
      return;
    }

    if (!categoryId) {
      setErrorMessage("Please select a category.");
      return;
    }

    if (description.length > 200) {
      setErrorMessage("Description must be 200 characters or fewer.");
      return;
    }

    setIsSubmitting(true);

    const selectedAccount = accounts.find((a) => a.id === accountId);
    const selectedCategory = categories.find((c) => c.id === categoryId);

    const result = await addTransaction({
      type,
      amount: numericAmount,
      account_id: accountId,
      account_name: selectedAccount?.name || "Account",
      category_id: categoryId,
      category_name: selectedCategory?.name || "Other",
      description: description.trim() || undefined,
      transaction_date: transactionDateTime,
    });

    setIsSubmitting(false);

    if (result.success) {
      onSuccessNotice?.(
        `${type === "income" ? "Income added" : "Expense recorded"}: ${formatCurrency(
          numericAmount
        )} (${selectedCategory?.name})`
      );
      onClose();
    } else {
      setErrorMessage(result.error || "Failed to record transaction.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogClose onClick={onClose} />
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {type === "income" ? (
            <PlusCircle className="h-5 w-5 text-emerald-600" />
          ) : (
            <MinusCircle className="h-5 w-5 text-rose-600" />
          )}
          <span>{type === "income" ? "Add Income" : "Add Expense"}</span>
        </DialogTitle>
        <DialogDescription>
          {type === "income"
            ? "Log college allowance, stipend, scholarship or part-time salary."
            : "Record daily food, study books, transport or personal bills."}
        </DialogDescription>
      </DialogHeader>

      {/* Type Toggle Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg mb-4">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
            type === "expense"
              ? "bg-white text-rose-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
            type === "income"
              ? "bg-white text-emerald-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Income
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Amount (₹ INR) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-base font-bold text-slate-500">
              ₹
            </span>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              required
              autoFocus
              className="pl-8 text-lg font-bold text-slate-900"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Category & Account Selects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Account / Wallet <span className="text-red-500">*</span>
            </label>
            <Select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.current_balance ?? acc.balance ?? 0)})
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Description (Optional) */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {description.length}/200
            </span>
          </div>
          <Input
            type="text"
            placeholder={
              type === "income"
                ? "e.g., Monthly allowance from home, Tutoring salary"
                : "e.g., Lunch with friends, Final-year project components"
            }
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Date Behavior: Automatically current date/time, toggleable for older entries */}
        <div className="rounded-lg border border-slate-200/70 bg-slate-50/50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>
                {showCustomDate ? "Custom Transaction Date" : "Date: Today, Now (Auto)"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomDate(!showCustomDate)}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              {showCustomDate ? "Use Current Time" : "Edit Date/Time"}
            </button>
          </div>

          {showCustomDate && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 animate-in fade-in">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Select Old Transaction Date & Time
              </label>
              <Input
                type="datetime-local"
                value={transactionDateTime}
                onChange={(e) => setTransactionDateTime(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            variant={type === "income" ? "success" : "default"}
            className="gap-2"
          >
            {isSubmitting ? (
              "Saving..."
            ) : (
              <>
                {type === "income" ? "Record Income" : "Record Expense"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
