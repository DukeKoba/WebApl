"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, User, LogOut, Crown, ChevronDown } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/insurid/supabase-browser";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function AuthButton() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [plan, setPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("plan")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setPlan((data as { plan: string }).plan);
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/insurid");
    router.refresh();
  };

  if (loading) {
    return <div className="w-20 h-7 bg-surface-soft animate-pulse rounded-lg" />;
  }

  if (!user) {
    return (
      <Link
        href="/insurid/login"
        className="hidden lg:flex items-center gap-1 px-3 py-1.5 border border-border text-sm text-text-secondary rounded-lg hover:bg-surface-soft transition-colors"
      >
        <LogIn className="w-3.5 h-3.5" /> ログイン
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:bg-surface-soft transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          {plan === "premium" ? (
            <Crown className="w-3 h-3 text-amber-600" />
          ) : (
            <User className="w-3 h-3 text-primary" />
          )}
        </div>
        <span className="hidden sm:block text-xs font-medium text-text-secondary max-w-[80px] truncate">
          {user.email?.split("@")[0]}
        </span>
        <ChevronDown className="w-3 h-3 text-text-muted" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-xs font-medium text-text-primary truncate">{user.email}</p>
              <p className="text-[11px] text-text-muted capitalize">
                {plan === "premium" ? "⭐ Premium" : "無料会員"}
              </p>
            </div>
            <Link
              href="/insurid/account"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-soft transition-colors"
            >
              <User className="w-3.5 h-3.5" /> マイページ
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> ログアウト
            </button>
          </div>
        </>
      )}
    </div>
  );
}
