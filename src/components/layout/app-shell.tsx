import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppShell({ children, title, subtitle }: AppShellProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50/60 flex">
        {/* Sidebar for Desktop */}
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col md:pl-64 min-w-0">
          <AppHeader title={title} subtitle={subtitle} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
