import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an issue fetching your records. Please try again.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-red-200 bg-red-50/50 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 max-w-sm mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
