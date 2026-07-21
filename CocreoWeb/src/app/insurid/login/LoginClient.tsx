"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Chrome, ArrowLeft, CheckCircle } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/insurid/supabase-browser";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/insurid/account";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const supabase = getSupabaseBrowser();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${location.origin}/insurid/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");

    const supabase = getSupabaseBrowser();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/insurid/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (authError) {
      setError(authError.message);
      setGoogleLoading(false);
    }
    // On success, browser redirects to Google — no need to setGoogleLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="font-bold text-text-primary text-lg mb-2">メールを送信しました</h2>
        <p className="text-sm text-text-secondary mb-1">
          <span className="font-medium text-text-primary">{email}</span> にログインリンクを送りました。
        </p>
        <p className="text-sm text-text-muted mb-6">メールボックスを確認してリンクをクリックしてください。</p>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          className="text-sm text-primary hover:text-primary-dark transition-colors"
        >
          別のメールで試す
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-bold text-text-primary text-xl mb-1">ログイン / 会員登録</h1>
      <p className="text-sm text-text-muted mb-6">
        無料会員登録でブックマーク・メルマガ配信設定ができます
      </p>

      {/* Google OAuth */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-soft transition-colors disabled:opacity-60 mb-4"
      >
        {googleLoading ? (
          <span className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
        ) : (
          <Chrome className="w-4 h-4" />
        )}
        Googleアカウントで続ける
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-muted">または</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Magic link */}
      <form onSubmit={handleMagicLink} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            メールアドレス
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full py-2.5 bg-primary hover:bg-primary-dark disabled:bg-border text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              送信中...
            </span>
          ) : (
            "メールでログインリンクを受け取る"
          )}
        </button>
      </form>

      <p className="text-xs text-text-muted text-center mt-4">
        登録することで
        <Link href="/insurid/privacy" className="text-primary hover:underline mx-0.5">プライバシーポリシー</Link>
        に同意したものとみなします
      </p>
    </>
  );
}

export default function LoginClient() {
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-start justify-center pt-16 px-4">
      <div className="bg-white border border-border rounded-2xl p-8 w-full max-w-sm shadow-sm">
        <Link
          href="/insurid"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          INSURIDトップへ
        </Link>

        <Suspense fallback={<div className="h-40 animate-pulse bg-surface-soft rounded-xl" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
