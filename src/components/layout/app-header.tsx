"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  Menu,
  X,
  User,
  ShieldCheck,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";
import { navigationItems } from "./app-sidebar";
import { AppLogo } from "@/components/ui/app-logo";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  // Auto detect title from pathname if not provided explicitly
  const pageTitle =
    title ||
    (pathname === "/dashboard"
      ? "Dashboard Overview"
      : pathname.split("/")[1]?.charAt(0).toUpperCase() +
        pathname.split("/")[1]?.slice(1) ||
        "Dashboard");

  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-sm">
        {/* Mobile menu toggle & Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </Button>

          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
              {pageTitle}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Search, Notifications & User Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden md:block w-56 lg:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search transactions..."
              className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-slate-800 relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-600" />
          </Button>

          {/* User Profile Dropdown connected to Supabase Auth */}
          <DropdownMenu
            trigger={
              <button className="flex items-center gap-2.5 rounded-full p-1 hover:bg-slate-100 transition-colors focus:outline-none">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white font-semibold text-xs ring-2 ring-blue-500/20">
                  {initials}
                </div>
                <div className="text-left hidden lg:block leading-tight pr-1">
                  <span className="block text-xs font-semibold text-slate-800">
                    {profile?.fullName || "Student User"}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    {profile?.major || "Undergraduate"}
                  </span>
                </div>
              </button>
            }
          >
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-900">
                {profile?.fullName || "Student User"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {profile?.email || "student@university.edu"}
              </p>
            </div>
            <Link href="/settings">
              <DropdownItem>
                <User className="h-4 w-4 text-slate-500" />
                <span>Account Settings</span>
              </DropdownItem>
            </Link>
            <DropdownSeparator />
            <DropdownItem destructive onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownItem>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl flex flex-col p-4 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <AppLogo size="sm" withText />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5 text-slate-500" />
              </Button>
            </div>

            <nav className="mt-4 space-y-1 flex-1">
              {navigationItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
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

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 w-full px-2 py-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
