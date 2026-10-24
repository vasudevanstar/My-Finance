"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  Target,
  Plus,
  Sparkles,
  TrendingUp,
  MoreVertical,
  Pencil,
  Trash2,
  Coins,
  History,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";
import { SavingsGoal } from "@/types/finance";
import { useFinance } from "@/contexts/finance-context";

export default function SavingsPage() {
  const {
    savingsGoals,
    accounts,
    createSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addSavingsContribution,
  } = useFinance();

  // Create Goal Dialog
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createTargetAmount, setCreateTargetAmount] = React.useState("");
  const [createTargetDate, setCreateTargetDate] = React.useState("");
  const [createDescription, setCreateDescription] = React.useState("");
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  // Edit Goal Dialog
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<SavingsGoal | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editTargetAmount, setEditTargetAmount] = React.useState("");
  const [editTargetDate, setEditTargetDate] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editError, setEditError] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  // Add Contribution Dialog
  const [contribDialogOpen, setContribDialogOpen] = React.useState(false);
  const [contribGoal, setContribGoal] = React.useState<SavingsGoal | null>(null);
  const [contribAmount, setContribAmount] = React.useState("");
  const [contribAccountId, setContribAccountId] = React.useState("");
  const [contribDescription, setContribDescription] = React.useState("");
  const [contribDate, setContribDate] = React.useState("");
  const [contribError, setContribError] = React.useState<string | null>(null);
  const [isContributing, setIsContributing] = React.useState(false);

  // Delete Goal Confirmation Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingGoal, setDeletingGoal] = React.useState<SavingsGoal | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // View Contributions Drawer / Dialog
  const [viewHistoryGoal, setViewHistoryGoal] = React.useState<SavingsGoal | null>(null);

  // Success Feedback Toast/Banner
  const [successNotice, setSuccessNotice] = React.useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const totalSaved = savingsGoals.reduce(
    (acc, g) => acc + (g.current_amount ?? g.currentAmount ?? 0),
    0
  );
  const totalTarget = savingsGoals.reduce(
    (acc, g) => acc + (g.target_amount ?? g.targetAmount ?? 0),
    0
  );
  const totalRemaining = Math.max(totalTarget - totalSaved, 0);
  const overallPercentage = totalTarget > 0 ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100) : 0;

  // Handle Create Goal
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const amountNum = parseFloat(createTargetAmount);
    if (!createName.trim()) {
      setCreateError("Please enter a goal name (e.g. Laptop, Travel, Emergency Fund).");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setCreateError("Target amount must be a positive number.");
      return;
    }

    setIsCreating(true);
    const res = await createSavingsGoal({
      name: createName.trim(),
      target_amount: amountNum,
      target_date: createTargetDate || undefined,
      description: createDescription.trim() || undefined,
    });

    setIsCreating(false);
    if (!res.success) {
      setCreateError(res.error || "Failed to create savings goal.");
      return;
    }

    setCreateName("");
    setCreateTargetAmount("");
    setCreateTargetDate("");
    setCreateDescription("");
    setCreateDialogOpen(false);
    showSuccess(`Savings goal "${createName}" successfully created!`);
  };

  // Open Edit Modal
  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setEditName(goal.name || goal.title || "");
    setEditTargetAmount(String(goal.target_amount ?? goal.targetAmount ?? ""));
    setEditTargetDate(goal.target_date || goal.targetDate || "");
    setEditDescription(goal.description || "");
    setEditError(null);
    setEditDialogOpen(true);
  };

  // Handle Edit Goal
  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;
    setEditError(null);

    const amountNum = parseFloat(editTargetAmount);
    if (!editName.trim()) {
      setEditError("Goal name cannot be empty.");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setEditError("Target amount must be a positive number.");
      return;
    }

    setIsEditing(true);
    const res = await updateSavingsGoal({
      id: editingGoal.id,
      name: editName.trim(),
      target_amount: amountNum,
      target_date: editTargetDate || undefined,
      description: editDescription.trim() || undefined,
    });

    setIsEditing(false);
    if (!res.success) {
      setEditError(res.error || "Failed to update savings goal.");
      return;
    }

    setEditDialogOpen(false);
    setEditingGoal(null);
    showSuccess("Goal updated successfully!");
  };

  // Open Add Contribution Modal
  const openContributionModal = (goal: SavingsGoal) => {
    setContribGoal(goal);
    setContribAmount("");
    setContribAccountId(accounts[0]?.id || "");
    setContribDescription("");
    setContribDate(new Date().toISOString().split("T")[0]);
    setContribError(null);
    setContribDialogOpen(true);
  };

  // Handle Add Contribution
  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribGoal) return;
    setContribError(null);

    const amountNum = parseFloat(contribAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setContribError("Contribution amount must be greater than ₹0.");
      return;
    }

    setIsContributing(true);
    const res = await addSavingsContribution({
      savings_goal_id: contribGoal.id,
      amount: amountNum,
      account_id: contribAccountId || undefined,
      description: contribDescription.trim() || `Contributed to ${contribGoal.name || contribGoal.title}`,
      contribution_date: contribDate || new Date().toISOString(),
    });

    setIsContributing(false);
    if (!res.success) {
      setContribError(res.error || "Failed to add contribution.");
      return;
    }

    setContribDialogOpen(false);
    setContribGoal(null);
    showSuccess(`Successfully allocated ${formatCurrency(amountNum)} to ${contribGoal.name || contribGoal.title}! (Excluded from expenses)`);
  };

  // Open Delete Confirmation
  const openDeleteModal = (goal: SavingsGoal) => {
    setDeletingGoal(goal);
    setDeleteDialogOpen(true);
  };

  // Handle Delete Goal
  const handleDeleteGoal = async () => {
    if (!deletingGoal) return;
    setIsDeleting(true);
    const res = await deleteSavingsGoal(deletingGoal.id);
    setIsDeleting(false);

    if (!res.success) {
      alert(res.error || "Failed to delete savings goal.");
      return;
    }

    setDeleteDialogOpen(false);
    showSuccess(`Goal "${deletingGoal.name || deletingGoal.title}" was deleted.`);
    setDeletingGoal(null);
  };

  return (
    <AppShell
      title="Savings Goals"
      subtitle="Define financial targets, track progress with real-time percentage completion, and contribute reserves without recording expenses."
    >
      {/* Success Notification */}
      {successNotice && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Saved
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(totalSaved)}
          </p>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">
            {overallPercentage}% of aggregate targets
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Target Reserve
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(totalTarget)}
          </p>
          <span className="text-xs text-slate-400 mt-1 inline-block">
            Across {savingsGoals.length} goals
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Remaining to Target
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(totalRemaining)}
          </p>
          <span className="text-xs text-slate-400 mt-1 inline-block">
            Yet to be accumulated
          </span>
        </div>

        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/60 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>Accounting Notice</span>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Contributions are asset reallocations towards your goals, not expenses!
            </p>
          </div>
          <Button
            onClick={() => {
              setCreateError(null);
              setCreateDialogOpen(true);
            }}
            size="sm"
            className="mt-3 gap-1.5 self-start shadow-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Header with Quick Action */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Your Goals</h2>
          <p className="text-xs text-slate-500">
            Keep track of individual funds, target completion deadlines, and milestones.
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateError(null);
            setCreateDialogOpen(true);
          }}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Savings Goal
        </Button>
      </div>

      {/* Empty State */}
      {savingsGoals.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
            <Target className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No savings goals set yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Start saving for goals like a Laptop (₹60,000), Travel (₹15,000), or an Emergency Fund (₹20,000).
          </p>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="mt-5 gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Your First Goal
          </Button>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savingsGoals.map((goal) => {
          const current = goal.current_amount ?? goal.currentAmount ?? 0;
          const target = goal.target_amount ?? goal.targetAmount ?? 1;
          const percentage = Math.min(Math.round((current / target) * 100), 100);
          const remaining = Math.max(target - current, 0);
          const isComplete = current >= target;

          return (
            <Card
              key={goal.id}
              className={`p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md border ${
                isComplete ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200 bg-white"
              }`}
            >
              <div>
                {/* Goal Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                        isComplete
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-blue-600 border-blue-100"
                      }`}
                    >
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {goal.name || goal.title}
                      </h3>
                      {goal.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <DropdownMenu
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-700"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      }
                      align="right"
                    >
                      <DropdownItem
                        onClick={() => openContributionModal(goal)}
                        className="text-blue-600 font-medium"
                      >
                        <Coins className="h-4 w-4" />
                        Add Contribution
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => setViewHistoryGoal(goal)}
                      >
                        <History className="h-4 w-4" />
                        View History
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => openEditModal(goal)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit Goal
                      </DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem
                        onClick={() => openDeleteModal(goal)}
                        destructive
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Goal
                      </DropdownItem>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Progress Details */}
                <div className="mt-5 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Saved / Target
                      </span>
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(current)}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          / {formatCurrency(target)}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isComplete
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}
                      >
                        {percentage}% completed
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Remaining & Target Date */}
                  <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                    <span>
                      {isComplete ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 inline" /> Goal Accomplished!
                        </span>
                      ) : (
                        <>
                          Remaining:{" "}
                          <strong className="text-slate-700">
                            {formatCurrency(remaining)}
                          </strong>
                        </>
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {goal.target_date || goal.targetDate || "No target date"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center gap-2">
                <Button
                  onClick={() => openContributionModal(goal)}
                  size="sm"
                  className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                >
                  <Coins className="h-4 w-4" />
                  Add Contribution
                </Button>
                <Button
                  onClick={() => setViewHistoryGoal(goal)}
                  variant="outline"
                  size="sm"
                  title="View Contribution History"
                  className="px-3 text-slate-600 hover:text-slate-900"
                >
                  <History className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* -------------------- DIALOG: CREATE NEW GOAL -------------------- */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogClose onClick={() => setCreateDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>Create New Savings Goal</DialogTitle>
          <DialogDescription>
            Allocate disciplined funds for items like a Laptop, Travel, or Emergency Fund.
          </DialogDescription>
        </DialogHeader>

        {createError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{createError}</span>
          </div>
        )}

        <form onSubmit={handleCreateGoal} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Goal Name *
            </label>
            <Input
              placeholder="e.g., Laptop, Travel, Emergency Fund"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Amount (₹ INR) *
            </label>
            <Input
              type="number"
              min="1"
              step="any"
              placeholder="e.g., 60000"
              value={createTargetAmount}
              onChange={(e) => setCreateTargetAmount(e.target.value)}
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Example targets: Laptop (₹60,000), Travel (₹15,000), Emergency Fund (₹20,000)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Completion Date (Optional)
            </label>
            <Input
              type="date"
              value={createTargetDate}
              onChange={(e) => setCreateTargetDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description (Optional)
            </label>
            <Input
              placeholder="e.g., Apple MacBook or gaming laptop for project work"
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? "Creating..." : "Save Goal"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* -------------------- DIALOG: EDIT GOAL -------------------- */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogClose onClick={() => setEditDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>Edit Savings Goal</DialogTitle>
          <DialogDescription>
            Update target amounts, target dates, or descriptions for this goal.
          </DialogDescription>
        </DialogHeader>

        {editError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{editError}</span>
          </div>
        )}

        <form onSubmit={handleEditGoal} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Goal Name *
            </label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Amount (₹ INR) *
            </label>
            <Input
              type="number"
              min="1"
              step="any"
              value={editTargetAmount}
              onChange={(e) => setEditTargetAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Completion Date
            </label>
            <Input
              type="date"
              value={editTargetDate}
              onChange={(e) => setEditTargetDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <Input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isEditing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEditing ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* -------------------- DIALOG: ADD CONTRIBUTION -------------------- */}
      <Dialog open={contribDialogOpen} onOpenChange={setContribDialogOpen}>
        <DialogClose onClick={() => setContribDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-blue-600" />
            Add Contribution to {contribGoal?.name || contribGoal?.title}
          </DialogTitle>
          <DialogDescription>
            Contribute money toward this goal. Note: This will not be recorded as an expense.
          </DialogDescription>
        </DialogHeader>

        {contribError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{contribError}</span>
          </div>
        )}

        <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3 mb-4 text-xs text-slate-700">
          <p className="font-semibold text-blue-900 mb-1">Current Standing:</p>
          <div className="flex justify-between items-center text-slate-600">
            <span>
              Saved: {formatCurrency(contribGoal?.current_amount ?? contribGoal?.currentAmount ?? 0)}
            </span>
            <span>
              Target: {formatCurrency(contribGoal?.target_amount ?? contribGoal?.targetAmount ?? 0)}
            </span>
            <span className="font-semibold text-blue-700">
              Remaining:{" "}
              {formatCurrency(
                Math.max(
                  (contribGoal?.target_amount ?? contribGoal?.targetAmount ?? 0) -
                    (contribGoal?.current_amount ?? contribGoal?.currentAmount ?? 0),
                  0
                )
              )}
            </span>
          </div>
        </div>

        <form onSubmit={handleAddContribution} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contribution Amount (₹ INR) *
            </label>
            <Input
              type="number"
              min="1"
              step="any"
              placeholder="e.g., 2000"
              value={contribAmount}
              onChange={(e) => setContribAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Source Account (Optional)
            </label>
            <select
              value={contribAccountId}
              onChange={(e) => setContribAccountId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None (Standalone contribution)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — Balance: {formatCurrency(acc.current_balance ?? acc.balance ?? 0)}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Selecting an account deducts this amount from its balance without inflating expenses.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Date
            </label>
            <Input
              type="date"
              value={contribDate}
              onChange={(e) => setContribDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Notes (Optional)
            </label>
            <Input
              placeholder="e.g., Monthly stipend savings deposit"
              value={contribDescription}
              onChange={(e) => setContribDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setContribDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isContributing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isContributing ? "Allocating..." : "Add Contribution"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* -------------------- DIALOG: DELETE GOAL CONFIRMATION -------------------- */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogClose onClick={() => setDeleteDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle className="text-rose-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete Savings Goal
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{deletingGoal?.name || deletingGoal?.title}&quot;?
            This will permanently remove this goal and its contributions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDeleteGoal}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isDeleting ? "Deleting..." : "Delete Goal"}
          </Button>
        </div>
      </Dialog>

      {/* -------------------- DIALOG: VIEW CONTRIBUTION HISTORY -------------------- */}
      <Dialog
        open={Boolean(viewHistoryGoal)}
        onOpenChange={(open) => !open && setViewHistoryGoal(null)}
      >
        <DialogClose onClick={() => setViewHistoryGoal(null)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            Contribution History: {viewHistoryGoal?.name || viewHistoryGoal?.title}
          </DialogTitle>
          <DialogDescription>
            Showing all funds contributed toward this savings target.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <div className="flex justify-between items-center rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider block">
                Total Saved
              </span>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(
                  viewHistoryGoal?.current_amount ?? viewHistoryGoal?.currentAmount ?? 0
                )}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase tracking-wider block">
                Target Amount
              </span>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(
                  viewHistoryGoal?.target_amount ?? viewHistoryGoal?.targetAmount ?? 0
                )}
              </p>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {(!viewHistoryGoal?.contributions || viewHistoryGoal.contributions.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No individual contribution entries recorded yet.
              </div>
            ) : (
              viewHistoryGoal.contributions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {c.description || "Contribution"}
                      </p>
                      <span className="text-xs text-slate-400">
                        {c.contribution_date || c.created_at?.split("T")[0] || "Recent"}{" "}
                        {c.account_name ? `• ${c.account_name}` : ""}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    +{formatCurrency(c.amount)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <Button
              onClick={() => {
                const currentG = viewHistoryGoal;
                setViewHistoryGoal(null);
                if (currentG) openContributionModal(currentG);
              }}
              size="sm"
              className="gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              <Coins className="h-4 w-4" />
              Add Another Contribution
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewHistoryGoal(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  );
}
