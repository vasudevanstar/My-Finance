import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  fullPage?: boolean;
}

export function LoadingState({
  message = "Loading your financial data...",
  className,
  fullPage = false,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center text-slate-500",
        fullPage && "min-h-[50vh]",
        className
      )}
    >
      <Loader2 className="h-7 w-7 animate-spin text-blue-600 mb-3" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/70", className)}
      {...props}
    />
  );
}
