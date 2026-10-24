"use client";

import * as React from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  major?: string;
  graduationYear?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "my_finance_mock_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const router = useRouter();

  const supabase = React.useMemo(() => createClient(), []);

  const isConfigured = React.useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return !!url && !!key && !url.includes("placeholder") && !key.includes("placeholder");
  }, []);

  React.useEffect(() => {
    if (isConfigured) {
      const initializeAuth = async () => {
        try {
          const { data } = await supabase.auth.getSession();
          setSession(data.session);
          setUser(data.session?.user ?? null);
          if (data.session?.user) {
            setProfile({
              id: data.session.user.id,
              email: data.session.user.email ?? "",
              fullName:
                data.session.user.user_metadata?.full_name ||
                data.session.user.email?.split("@")[0] ||
                "Student User",
              major: data.session.user.user_metadata?.major || "Computer Science",
              graduationYear: data.session.user.user_metadata?.graduation_year || "2027",
            });
          }
        } catch (err) {
          console.error("Error reading Supabase session:", err);
        } finally {
          setLoading(false);
        }
      };

      initializeAuth();

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (newSession?.user) {
            setProfile({
              id: newSession.user.id,
              email: newSession.user.email ?? "",
              fullName:
                newSession.user.user_metadata?.full_name ||
                newSession.user.email?.split("@")[0] ||
                "Student User",
              major: newSession.user.user_metadata?.major || "Computer Science",
              graduationYear: newSession.user.user_metadata?.graduation_year || "2027",
            });
          } else {
            setProfile(null);
          }
          setLoading(false);
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      try {
        const savedSession = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          const mockUser = {
            id: parsed.id || "student-user-1",
            email: parsed.email || "alex.morgan@university.edu",
            user_metadata: {
              full_name: parsed.fullName || "Alex Morgan",
            },
          } as unknown as User;

          setUser(mockUser);
          setProfile({
            id: mockUser.id,
            email: parsed.email || "alex.morgan@university.edu",
            fullName: parsed.fullName || "Alex Morgan",
            major: parsed.major || "Computer Science",
            graduationYear: parsed.graduationYear || "2027",
          });
        }
      } catch (err) {
        console.error("Local mock session restore error:", err);
      } finally {
        setLoading(false);
      }
    }
  }, [isConfigured, supabase]);

  const signIn = async (email: string, password: string) => {
    if (isConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error && data.user) {
        router.push("/dashboard");
      }
      return { error };
    } else {
      if (!email.includes("@")) {
        return { error: new Error("Please enter a valid email address.") };
      }
      if (password.length < 6) {
        return { error: new Error("Password must be at least 6 characters.") };
      }

      const mockUser = {
        id: "mock-" + Date.now(),
        email,
        fullName: email.split("@")[0].replace(".", " "),
        major: "Computer Science",
        graduationYear: "2027",
      };

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockUser));
      setUser({
        id: mockUser.id,
        email: mockUser.email,
        user_metadata: { full_name: mockUser.fullName },
      } as unknown as User);
      setProfile(mockUser);
      router.push("/dashboard");
      return { error: null };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (isConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (!error && data.user) {
        router.push("/dashboard");
      }
      return { error };
    } else {
      if (!email.includes("@")) {
        return { error: new Error("Please enter a valid email address.") };
      }
      if (password.length < 6) {
        return { error: new Error("Password must be at least 6 characters.") };
      }

      const mockUser = {
        id: "mock-" + Date.now(),
        email,
        fullName: fullName || email.split("@")[0],
        major: "Computer Science",
        graduationYear: "2027",
      };

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockUser));
      setUser({
        id: mockUser.id,
        email: mockUser.email,
        user_metadata: { full_name: mockUser.fullName },
      } as unknown as User);
      setProfile(mockUser);
      router.push("/dashboard");
      return { error: null };
    }
  };

  const signOut = async () => {
    if (isConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    router.push("/login");
  };

  const resetPassword = async (email: string) => {
    if (isConfigured) {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : "/reset-password";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      return { error };
    } else {
      if (!email || !email.includes("@")) {
        return { error: new Error("Please enter a valid email address.") };
      }
      return { error: null };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (isConfigured) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } else {
      if (newPassword.length < 6) {
        return { error: new Error("Password must be at least 6 characters.") };
      }
      return { error: null };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (profile) {
      const updated = { ...profile, ...updates };
      setProfile(updated);
      if (!isConfigured) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } else {
        await supabase.auth.updateUser({
          data: {
            full_name: updated.fullName,
            major: updated.major,
            graduation_year: updated.graduationYear,
          },
        });
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
