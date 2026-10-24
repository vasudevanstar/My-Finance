import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";

interface BalanceCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  subtext?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: "blue" | "emerald" | "amber" | "purple" | "rose";
  className?: string;
}

const colorMap = {
  blue: {
    iconBg: "bg-blue-50 text-blue-600 border-blue-100",
    pill: "text-blue-700 bg-blue-50 border-blue-100",
  },
  emerald: {
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
    pill: "text-emerald-700 bg-emerald-50 border-emerald-100",
  },
  amber: {
    iconBg: "bg-amber-50 text-amber-600 border-amber-100",
    pill: "text-amber-700 bg-amber-50 border-amber-100",
  },
  purple: {
    iconBg: "bg-purple-50 text-purple-600 border-purple-100",
    pill: "text-purple-700 bg-purple-50 border-purple-100",
  },
  rose: {
    iconBg: "bg-rose-50 text-rose-600 border-rose-100",
    pill: "text-rose-700 bg-rose-50 border-rose-100",
  },
};

export function BalanceCard({
  title,
  amount,
  icon: Icon,
  subtext,
  trend,
  accentColor = "blue",
  className,
}: BalanceCardProps) {
  const styles = colorMap[accentColor];

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border",
              styles.iconBg
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {formatCurrency(amount)}
          </div>
          {(subtext || trend) && (
            <div className="mt-2 flex items-center text-xs text-slate-500 space-x-2">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center font-medium px-1.5 py-0.5 rounded",
                    trend.isPositive
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-rose-700 bg-rose-50"
                  )}
                >
                  {trend.isPositive ? "↑ " : "↓ "}
                  {trend.value}
                </span>
              )}
              {subtext && <span className="truncate">{subtext}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
