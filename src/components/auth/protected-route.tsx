"use client";

import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/ui/loading-state";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingState message="Checking authentication session..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
