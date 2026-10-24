"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, Mail, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { signIn, user, loading: authLoading, isConfigured } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("Invalid email or password. Please verify your credentials.");
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMessage("Your email address is not yet confirmed. Please check your inbox.");
        } else {
          setErrorMessage(error.message);
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || "An unexpected network error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50/70">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-md shadow-blue-500/20 mb-3">
          MF
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to My Finance
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Track your student expenses, college budgets, and semester goals.
        </p>
      </div>

      <Card className="w-full max-w-md shadow-lg shadow-slate-200/50">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Enter your email and password to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isConfigured && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-800">
              <Sparkles className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
              <span>
                <strong>Dev / Test Mode:</strong> Sign in with any student email (e.g., student@university.edu) & password (min 6 chars) to preview persistent auth sessions.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                University Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="student@university.edu"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gap-2 mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-blue-600 hover:underline"
            >
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
