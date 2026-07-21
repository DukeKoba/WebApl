"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Mail, CheckCircle, ArrowRight, Newspaper, Clock, Globe2, Bot } from "lucide-react";

const FEATURES = [
  { icon: Newspaper, text: "海外ブローカー・代理店のAI事例（米英欧アジア）" },
  { icon: Bot,       text: "AIが下書き、編集者がレビューした高精度な日本語記事" },
  { icon: Clock,     text: "毎朝7:30に受信トレイへお届け" },
  { icon: Globe2,    text: "国内DX・規制動向・ウェビナー要約も網羅" },
];

export default function NewsletterSignupClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/insurid/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "エラーが発生しました。しばらく経ってから再試行してください。");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="font-serif-jp text-2xl font-bold text-text-primary mb-3">
          登録ありがとうございます！
        </h1>
        <p className="text-text-secondary mb-2">
          <span className="font-medium text-text-primary">{email}</span> に確認メールをお送りしました。
        </p>
        <p className="text-sm text-text-muted mb-8">
          メール内のリンクをクリックして登録を完了してください。明日の朝7:30から配信が始まります。
        </p>
        <Link
          href="/insurid"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm"
        >
          記事を読む <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">

      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/5 border border-primary/15 rounded-full px-3 py-1 mb-4">
          <Mail className="w-3.5 h-3.5" /> 無料メルマガ
        </div>
        <h1 className="font-serif-jp text-3xl sm:text-4xl font-bold text-text-primary mb-4 leading-snug">
          保険業界の朝刊を、<br className="sm:hidden" />毎朝お届け
        </h1>
        <p className="text-text-secondary max-w-md mx-auto">
          海外ブローカー・代理店のAI最新事例、国内DX事例、規制動向を毎朝7:30に日本語でお届け。完全無料。
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {FEATURES.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-3 bg-white border border-border rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      {/* Signup form */}
      <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
        <h2 className="font-bold text-text-primary mb-1">無料登録</h2>
        <p className="text-sm text-text-muted mb-5">メールアドレスだけで登録できます</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full pl-9 pr-3 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-dark disabled:bg-border text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                登録中...
              </>
            ) : (
              <>
                無料で登録する <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-text-muted text-center mt-4">
          いつでも配信停止できます ·{" "}
          <Link href="/insurid/privacy" className="text-primary hover:underline">プライバシーポリシー</Link>
        </p>
      </div>

      {/* Already member */}
      <p className="text-center text-sm text-text-muted mt-6">
        すでに会員の方は{" "}
        <Link href="/insurid/login" className="text-primary hover:underline font-medium">
          ログイン
        </Link>
      </p>
    </div>
  );
}
