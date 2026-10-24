"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  WalletCards,
  PiggyBank,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: Receipt,
  },
  {
    name: "Accounts",
    href: "/accounts",
    icon: WalletCards,
  },
  {
    name: "Savings",
    href: "/savings",
    icon: PiggyBank,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 border-r border-slate-200 bg-white",
        className
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-6 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20">
          MF
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight text-slate-900 leading-none">
            My Finance
          </span>
          <span className="text-[11px] font-medium text-slate-400 mt-1">
            Student Edition
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-1 flex-col justify-between p-4 overflow-y-auto">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-blue-600" : "text-slate-400"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Tip / College Student Budget Card */}
        <div className="rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-indigo-50/30 p-4">
          <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold">
            <Sparkles className="h-4 w-4" />
            <span>Student Budget Tip</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
            Aim to allocate 20% of part-time earnings toward emergency savings.
          </p>
        </div>
      </div>
    </aside>
  );
}
