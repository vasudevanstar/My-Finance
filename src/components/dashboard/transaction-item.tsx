import * as React from "react";
import {
  GraduationCap,
  Utensils,
  Home,
  Bus,
  Film,
  Briefcase,
  PiggyBank,
  CircleDollarSign,
  Wifi,
  ShoppingBag,
  User,
  CreditCard,
  Award,
  ArrowRightLeft,
} from "lucide-react";
import { Transaction } from "@/types/finance";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface TransactionItemProps {
  transaction: Transaction;
  className?: string;
  onClick?: (transaction: Transaction) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  Food: Utensils,
  "Food & Dining": Utensils,
  Travel: Bus,
  Transport: Bus,
  Education: GraduationCap,
  "Tuition & Books": GraduationCap,
  "Mobile & Internet": Wifi,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Personal: User,
  "Bills & Subscriptions": CreditCard,
  Home: Home,
  Scholarship: Award,
  "Part-time": Briefcase,
  "Part-time Job": Briefcase,
  Transfer: ArrowRightLeft,
  Other: CircleDollarSign,
};

export function TransactionItem({
  transaction,
  className,
  onClick,
}: TransactionItemProps) {
  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";

  const catName =
    transaction.type === "transfer"
      ? "Internal Transfer"
      : transaction.category_name || transaction.category || "Other";

  const accName =
    transaction.type === "transfer" && (transaction.source_account_name || transaction.destination_account_name)
      ? `${transaction.source_account_name || "Account"} → ${transaction.destination_account_name || "Account"}`
      : transaction.account_name || transaction.account || "Account";

  const displayTitle =
    transaction.description ||
    (transaction.type === "transfer" ? accName : transaction.title || catName);

  const displayDate =
    transaction.transaction_date || transaction.date || new Date().toISOString();

  const CategoryIcon = isTransfer
    ? ArrowRightLeft
    : categoryIcons[catName] || CircleDollarSign;

  return (
    <div
      onClick={() => onClick?.(transaction)}
      className={cn(
        "flex items-center justify-between p-3.5 sm:p-4 rounded-xl transition-colors hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            isIncome
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : isTransfer
              ? "bg-blue-50 text-blue-600 border-blue-100"
              : "bg-slate-100 text-slate-600 border-slate-200"
          )}
        >
          <CategoryIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-900 truncate">
              {displayTitle}
            </p>
            {isTransfer && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                Transfer
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span className="truncate">{catName}</span>
            <span>•</span>
            <span className="truncate">{accName}</span>
          </div>
        </div>
      </div>

      <div className="text-right shrink-0 ml-3">
        <p
          className={cn(
            "text-sm font-semibold",
            isIncome
              ? "text-emerald-600"
              : isTransfer
              ? "text-blue-700"
              : "text-slate-900"
          )}
        >
          {isIncome ? "+" : isTransfer ? "⇄ " : "-"}
          {formatCurrency(transaction.amount)}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {formatDate(displayDate)}
        </p>
      </div>
    </div>
  );
}
