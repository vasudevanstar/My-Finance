import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { MobileBottomNav } from "./bottom-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppShell({ children, title, subtitle }: AppShellProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50/60 flex flex-col md:flex-row">
        {/* Sidebar for Desktop & Tablets */}
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col md:pl-64 min-w-0">
          <AppHeader title={title} subtitle={subtitle} />
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
            {children}
          </main>
        </div>

        {/* Persistent Bottom Navigation for Mobile */}
        <MobileBottomNav />
      </div>
    </ProtectedRoute>
  );
}
