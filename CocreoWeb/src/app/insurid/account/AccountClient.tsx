"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Crown, Bookmark, Settings, LogOut,
  ChevronRight, ArrowRight, Trash2, Bell, BellOff,
} from "lucide-react";
import { getSupabaseBrowser } from "@/lib/insurid/supabase-browser";
import type { Profile, Bookmark as BookmarkType } from "@/lib/insurid/database.types";
import { CATEGORY_LABELS, type Category } from "@/lib/insurid/mock-articles";

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  free:       { label: "無料会員",       color: "text-text-secondary", bg: "bg-surface-soft border-border" },
  premium:    { label: "Premium",        color: "text-amber-700",      bg: "bg-amber-50 border-amber-200" },
  enterprise: { label: "Enterprise",     color: "text-purple-700",     bg: "bg-purple-50 border-purple-200" },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

interface Props {
  user: { id: string; email: string };
  profile: Profile | null;
  bookmarks: Pick<BookmarkType, "article_slug" | "article_title" | "created_at">[];
}

export default function AccountClient({ user, profile, bookmarks: initialBookmarks }: Props) {
  const router = useRouter();
  const plan = profile?.plan ?? "free";
  const planInfo = PLAN_LABELS[plan];

  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [preferences, setPreferences] = useState({
    newsletter: profile?.preferences?.newsletter ?? true,
    frequency: profile?.preferences?.frequency ?? "daily",
    categories: (profile?.preferences?.categories as string[]) ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleLogout = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/insurid");
    router.refresh();
  }, [router]);

  const handleRemoveBookmark = useCallback(async (slug: string) => {
    const supabase = getSupabaseBrowser();
    await supabase.from("bookmarks").delete()
      .eq("user_id", user.id).eq("article_slug", slug);
    setBookmarks((prev) => prev.filter((b) => b.article_slug !== slug));
  }, [user.id]);

  const toggleCategory = useCallback((cat: string) => {
    setPreferences((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  }, []);

  const handleSavePreferences = useCallback(async () => {
    setSaving(true);
    const supabase = getSupabaseBrowser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("profiles") as any).update({ preferences }).eq("id", user.id);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  }, [user.id, preferences]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">

      {/* Profile card */}
      <div className="bg-white border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-text-primary">
                {profile?.display_name || user.email.split("@")[0]}
              </p>
              <p className="text-sm text-text-muted">{user.email}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${planInfo.bg} ${planInfo.color}`}>
            {plan === "premium" && <Crown className="w-3 h-3" />}
            {planInfo.label}
          </span>
        </div>

        {plan === "free" && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Premiumにアップグレード</p>
              <p className="text-xs text-text-muted">全記事の全文＋週次レポートが読み放題</p>
            </div>
            <Link
              href="/insurid/pricing"
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              月額¥3,980 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Bookmarks */}
      <section className="bg-white border border-border rounded-2xl p-6">
        <h2 className="font-bold text-text-primary flex items-center gap-2 mb-4">
          <Bookmark className="w-4 h-4 text-primary" />
          保存済み記事 <span className="text-sm text-text-muted font-normal">({bookmarks.length}件)</span>
        </h2>

        {bookmarks.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">保存した記事はありません</p>
            <Link href="/insurid/articles" className="text-xs text-primary hover:underline mt-1 inline-block">
              記事を探す
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((b) => (
              <div key={b.article_slug} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <Link
                  href={`/insurid/articles/${b.article_slug}`}
                  className="flex-1 text-sm text-text-primary hover:text-primary transition-colors line-clamp-1"
                >
                  {b.article_title}
                </Link>
                <button
                  onClick={() => handleRemoveBookmark(b.article_slug)}
                  className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  title="ブックマークを削除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Delivery preferences */}
      <section className="bg-white border border-border rounded-2xl p-6">
        <h2 className="font-bold text-text-primary flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-primary" />
          配信設定
        </h2>

        {/* Newsletter toggle */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {preferences.newsletter ? (
              <Bell className="w-4 h-4 text-primary" />
            ) : (
              <BellOff className="w-4 h-4 text-text-muted" />
            )}
            <div>
              <p className="text-sm font-medium text-text-primary">朝刊メルマガ</p>
              <p className="text-xs text-text-muted">毎朝7:30 に最新記事をお届け</p>
            </div>
          </div>
          <button
            onClick={() => setPreferences((p) => ({ ...p, newsletter: !p.newsletter }))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              preferences.newsletter ? "bg-primary" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                preferences.newsletter ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Frequency */}
        <div className="py-3 border-b border-border">
          <p className="text-sm font-medium text-text-primary mb-2">配信頻度</p>
          <div className="flex gap-2">
            {(["daily", "weekly", "none"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setPreferences((p) => ({ ...p, frequency: f }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  preferences.frequency === f
                    ? "bg-primary text-white border-primary"
                    : "border-border text-text-secondary hover:border-primary hover:text-primary"
                }`}
              >
                {f === "daily" ? "毎日" : f === "weekly" ? "週次" : "受け取らない"}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="py-3">
          <p className="text-sm font-medium text-text-primary mb-2">
            カテゴリフィルター
            <span className="text-xs text-text-muted font-normal ml-1.5">（未選択 = すべて）</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  preferences.categories.includes(cat)
                    ? "bg-primary text-white border-primary"
                    : "border-border text-text-muted hover:border-primary hover:text-primary"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSavePreferences}
          disabled={saving}
          className="mt-4 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-border text-white text-sm font-medium rounded-xl transition-colors"
        >
          {saving ? "保存中..." : saveSuccess ? "✓ 保存しました" : "設定を保存"}
        </button>
      </section>

      {/* Account actions */}
      <section className="bg-white border border-border rounded-2xl divide-y divide-border overflow-hidden">
        <Link
          href="/insurid/pricing"
          className="flex items-center justify-between px-5 py-3.5 text-sm text-text-secondary hover:bg-surface-soft transition-colors"
        >
          <span className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            サブスクリプション管理
          </span>
          <ChevronRight className="w-4 h-4" />
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-5 py-3.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          ログアウト
        </button>
      </section>

    </div>
  );
}
