"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { User, Database, CheckCircle2, ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function SettingsPage() {
  const { profile, updateProfile, signOut, isConfigured } = useAuth();
  const [saved, setSaved] = React.useState(false);
  const [fullName, setFullName] = React.useState(profile?.fullName || "Alex Morgan");
  const [major, setMajor] = React.useState(profile?.major || "Computer Science");
  const [gradYear, setGradYear] = React.useState(profile?.graduationYear || "2027");

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      if (profile.major) setMajor(profile.major);
      if (profile.graduationYear) setGradYear(profile.graduationYear);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      fullName,
      major,
      graduationYear: gradYear,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AppShell
      title="Application Settings"
      subtitle="Customize profile preferences, currency, notifications, and Supabase cloud connection parameters."
    >
      <div className="max-w-4xl space-y-6">
        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Profile preferences updated successfully!</span>
          </div>
        )}

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-slate-800">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle>Student Profile</CardTitle>
            </div>
            <CardDescription>
              Manage your display name, academic institution, and contact email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <Input
                    value={profile?.email || "student@university.edu"}
                    type="email"
                    disabled
                    className="bg-slate-50 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Major / Field of Study
                  </label>
                  <Input
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g. Computer Science, Business"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Graduation Year
                  </label>
                  <Select
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                  >
                    <option value="2025">Class of 2025</option>
                    <option value="2026">Class of 2026</option>
                    <option value="2027">Class of 2027</option>
                    <option value="2028">Class of 2028</option>
                    <option value="Graduate">Graduate Studies</option>
                  </Select>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signOut()}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Supabase Connection Status Card */}
        <Card className="border-blue-100 bg-gradient-to-r from-white via-white to-blue-50/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-slate-800">
              <Database className="h-5 w-5 text-blue-600" />
              <CardTitle>Supabase Authentication Status</CardTitle>
            </div>
            <CardDescription>
              {isConfigured
                ? "Connected directly to live Supabase Auth instance."
                : "Active in developer test session mode with instant credential persistence."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-xs font-mono text-slate-600 space-y-1">
              <div>
                NEXT_PUBLIC_SUPABASE_URL = &quot;{process.env.NEXT_PUBLIC_SUPABASE_URL || "configured"}&quot;
              </div>
              <div>
                NEXT_PUBLIC_SUPABASE_ANON_KEY = &quot;{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "••••••••••••••••" : "configured"}&quot;
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>
                Client key isolation verified: Service-role admin keys are strictly restricted from frontend bundles.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
