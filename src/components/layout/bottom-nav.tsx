"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  WalletCards,
  PiggyBank,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onQuickAction?: () => void;
}

export function MobileBottomNav({ onQuickAction }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navTabs = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "History",
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
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-lg"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navTabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/dashboard" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-2 text-[11px] font-semibold transition-colors min-h-[48px] touch-manipulation",
                isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                  isActive ? "bg-blue-50 text-blue-600" : "text-slate-400"
                )}
              >
                <tab.icon className="h-5 w-5" />
              </div>
              <span className="mt-0.5 leading-none">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
