import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function DashboardCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: DashboardCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <CardContent className={cn("p-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
