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
import { getCurrentDateTimeLocal, formatCurrency } from "@/lib/utils";
import {
  ArrowRightLeft,
  AlertCircle,
  Clock,
  ArrowRight,
  Info,
  CheckCircle2,
} from "lucide-react";

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  onSuccessNotice?: (message: string) => void;
}

export function TransferModal({
  open,
  onClose,
  onSuccessNotice,
}: TransferModalProps) {
  const { accounts, transferMoney } = useFinance();

  const [fromAccountId, setFromAccountId] = React.useState("");
  const [toAccountId, setToAccountId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [transactionDateTime, setTransactionDateTime] = React.useState(
    getCurrentDateTimeLocal()
  );
  const [showCustomDate, setShowCustomDate] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize source and destination accounts
  React.useEffect(() => {
    if (open) {
      setAmount("");
      setDescription("");
      setTransactionDateTime(getCurrentDateTimeLocal());
      setShowCustomDate(false);
      setErrorMessage(null);

      if (accounts.length >= 2) {
        setFromAccountId(accounts[0].id);
        setToAccountId(accounts[1].id);
      } else if (accounts.length === 1) {
        setFromAccountId(accounts[0].id);
        setToAccountId(accounts[0].id);
      }
    }
  }, [open, accounts]);

  const selectedSourceAccount = accounts.find((a) => a.id === fromAccountId);
  const selectedDestAccount = accounts.find((a) => a.id === toAccountId);
  const sourceAvailableBalance =
    selectedSourceAccount?.current_balance ??
    selectedSourceAccount?.balance ??
    0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numericAmount = parseFloat(amount);

    // Validation 1: Zero / negative amount
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Transfer amount must be greater than zero (₹0).");
      return;
    }

    // Validation 2: Same source and destination
    if (!fromAccountId || !toAccountId) {
      setErrorMessage("Please select both source and destination accounts.");
      return;
    }
    if (fromAccountId === toAccountId) {
      setErrorMessage(
        "Source and destination cannot be the same account. Please choose different accounts."
      );
      return;
    }

    // Validation 3: Transfer greater than available balance
    if (numericAmount > sourceAvailableBalance) {
      setErrorMessage(
        `Insufficient balance in ${
          selectedSourceAccount?.name
        }. Available: ${formatCurrency(sourceAvailableBalance)}`
      );
      return;
    }

    if (description.length > 200) {
      setErrorMessage("Description must be 200 characters or fewer.");
      return;
    }

    setIsSubmitting(true);

    const result = await transferMoney({
      fromAccountId,
      toAccountId,
      amount: numericAmount,
      description: description.trim() || undefined,
      transactionDate: transactionDateTime,
    });

    setIsSubmitting(false);

    if (result.success) {
      onSuccessNotice?.(
        `Transferred ${formatCurrency(numericAmount)} from ${
          selectedSourceAccount?.name
        } to ${selectedDestAccount?.name}`
      );
      onClose();
    } else {
      setErrorMessage(result.error || "Failed to complete transfer.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogClose onClick={onClose} />
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-blue-700">
          <ArrowRightLeft className="h-5 w-5" />
          <span>Transfer Money</span>
        </DialogTitle>
        <DialogDescription>
          Move funds internally between your bank, cash pocket, or savings without affecting your income or expense totals.
        </DialogDescription>
      </DialogHeader>

      {/* Info notice about transfer accounting */}
      <div className="flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-800 mb-4">
        <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
        <span>
          <strong>Transfer Note:</strong> Transfers shift balances between your accounts (e.g., Bank decreases, Cash in Hand increases) and will NOT count as income or expense.
        </span>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source and Destination Account Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                From (Source Account) <span className="text-red-500">*</span>
              </label>
            </div>
            <Select
              value={fromAccountId}
              onChange={(e) => {
                setFromAccountId(e.target.value);
                setErrorMessage(null);
              }}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.current_balance ?? acc.balance ?? 0)})
                </option>
              ))}
            </Select>
            {selectedSourceAccount && (
              <span className="text-[11px] text-slate-500 mt-1 block">
                Available: <strong>{formatCurrency(sourceAvailableBalance)}</strong>
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              To (Destination Account) <span className="text-red-500">*</span>
            </label>
            <Select
              value={toAccountId}
              onChange={(e) => {
                setToAccountId(e.target.value);
                setErrorMessage(null);
              }}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.current_balance ?? acc.balance ?? 0)})
                </option>
              ))}
            </Select>
            {fromAccountId && toAccountId && fromAccountId === toAccountId && (
              <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                Destination cannot match source
              </span>
            )}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Transfer Amount (₹ INR) <span className="text-red-500">*</span>
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
              className="pl-8 text-lg font-bold text-slate-900"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrorMessage(null);
              }}
            />
          </div>
        </div>

        {/* Description (Optional) */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Description / Reason <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {description.length}/200
            </span>
          </div>
          <Input
            type="text"
            placeholder="e.g., ATM Cash withdrawal, Bank to Cash Pocket"
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Date Behavior: Auto current date/time with optional edit */}
        <div className="rounded-lg border border-slate-200/70 bg-slate-50/50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>
                {showCustomDate ? "Custom Transfer Date" : "Date: Today, Now (Auto)"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomDate(!showCustomDate)}
              className="text-xs text-blue-600 font-medium hover:underline cursor-pointer"
            >
              {showCustomDate ? "Use Current Time" : "Edit Date/Time"}
            </button>
          </div>

          {showCustomDate && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 animate-in fade-in">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Select Old Transfer Date & Time
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

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              (!!fromAccountId && !!toAccountId && fromAccountId === toAccountId)
            }
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              "Transferring..."
            ) : (
              <>
                Confirm Transfer
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
