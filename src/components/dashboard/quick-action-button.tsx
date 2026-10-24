import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickActionButtonProps {
  label: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "income" | "expense" | "transfer";
  className?: string;
}

const variantStyles = {
  income: {
    bg: "hover:border-emerald-300 hover:bg-emerald-50/40",
    iconBox: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  expense: {
    bg: "hover:border-rose-300 hover:bg-rose-50/40",
    iconBox: "bg-rose-50 text-rose-600 border-rose-100",
  },
  transfer: {
    bg: "hover:border-blue-300 hover:bg-blue-50/40",
    iconBox: "bg-blue-50 text-blue-600 border-blue-100",
  },
};

export function QuickActionButton({
  label,
  description,
  icon: Icon,
  onClick,
  variant = "transfer",
  className,
}: QuickActionButtonProps) {
  const current = variantStyles[variant];

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3.5 rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 text-left transition-all hover:shadow-sm cursor-pointer",
        current.bg,
        className
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-105",
          current.iconBox
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-slate-900 group-hover:text-slate-950">
          {label}
        </span>
        {description && (
          <span className="block text-xs text-slate-500 truncate mt-0.5">
            {description}
          </span>
        )}
      </div>
    </button>
  );
}
