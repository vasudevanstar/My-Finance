"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Target, Plus, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { SavingsGoal } from "@/types/finance";
import { useFinance } from "@/contexts/finance-context";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";

export default function SavingsPage() {
  const { savingsGoals, refreshData } = useFinance();
  const { user, isConfigured } = useAuth();
  const supabase = React.useMemo(() => createClient(), []);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [targetAmount, setTargetAmount] = React.useState("");
  const [targetDate, setTargetDate] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const totalSaved = savingsGoals.reduce(
    (acc, g) => acc + (g.currentAmount || 0),
    0
  );
  const totalTarget = savingsGoals.reduce(
    (acc, g) => acc + (g.target_amount || g.targetAmount || 0),
    0
  );

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;
    setIsSubmitting(true);

    if (isConfigured && user) {
      await supabase.from("savings_goals").insert({
        user_id: user.id,
        name: title,
        target_amount: parseFloat(targetAmount),
        target_date: targetDate || null,
        description: description || null,
      });
      await refreshData();
    }

    setTitle("");
    setTargetAmount("");
    setTargetDate("");
    setDescription("");
    setIsSubmitting(false);
    setDialogOpen(false);
  };

  return (
    <AppShell
      title="Savings Goals"
      subtitle="Set disciplined financial targets for tech upgrades, semester projects, and emergencies in INR."
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Accumulated Savings
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(totalSaved)}
          </p>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">
            {Math.round((totalSaved / (totalTarget || 1)) * 100)}% of combined goals
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Target Reserve
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(totalTarget)}
          </p>
          <span className="text-xs text-slate-400 mt-1 inline-block">
            Across {savingsGoals.length} target funds
          </span>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>Smart Student Rule</span>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Save 20% of your home allowance or internship stipend as soon as it arrives.
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            size="sm"
            className="mt-4 gap-1.5 self-start"
          >
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {savingsGoals.map((goal) => {
          const target = goal.target_amount || goal.targetAmount || 1;
          const current = goal.currentAmount || 0;
          const pct = Math.min(Math.round((current / target) * 100), 100);

          return (
            <Card key={goal.id} className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Target className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {pct}% Saved
                  </span>
                </div>

                <h3 className="font-semibold text-slate-900 text-base">
                  {goal.name || goal.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Target Date: {goal.target_date || goal.targetDate || "Ongoing"}
                </p>

                <div className="mt-6 mb-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Current: {formatCurrency(current)}</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(target)}
                  </span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Remaining</span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(Math.max(target - current, 0))}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Dialog for New Savings Goal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogClose onClick={() => setDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>Set New Savings Goal</DialogTitle>
          <DialogDescription>
            Specify a target reserve amount in INR and goal deadline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateGoal} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Goal Title
            </label>
            <Input
              placeholder="e.g., Laptop Tech Upgrade, Exam Fees"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Amount (₹ INR)
            </label>
            <Input
              type="number"
              step="any"
              placeholder="25000.00"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Completion Date
            </label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Notes (Optional)
            </label>
            <Input
              placeholder="e.g., Dedicated reserve for semester lab kit"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
