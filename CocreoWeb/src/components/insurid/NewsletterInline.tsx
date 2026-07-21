"use client";

import { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";

interface NewsletterInlineProps {
  variant?: "card" | "banner";
}

export default function NewsletterInline({ variant = "card" }: NewsletterInlineProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  if (variant === "banner") {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
        {submitted ? (
          <p className="text-sm text-primary font-medium text-center">ご登録ありがとうございます！毎朝7:30にお届けします。</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-text-secondary shrink-0">
              <Mail className="w-4 h-4 text-primary" />
              <span>毎朝7:30 無料朝刊</span>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレスを入力"
              className="flex-1 w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              required
            />
            <button type="submit" className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors">
              登録 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-surface-soft to-accent border border-border rounded-2xl p-6 sm:p-8">
      {submitted ? (
        <div className="text-center">
          <p className="text-xl font-bold text-text-primary mb-1">ご登録ありがとうございます！</p>
          <p className="text-sm text-text-secondary">明日の朝7:30からお届けします。</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">無料ニュースレター</span>
          </div>
          <h3 className="font-serif-jp text-xl font-bold text-text-primary mb-2">
            毎朝7:30、保険×AIの最前線を届けます
          </h3>
          <p className="text-sm text-text-secondary mb-5">
            海外ブローカー・代理店のAI事例から国内DXまで。読者6,000名が読む保険代理店向けメディア。
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 text-sm border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              required
            />
            <button type="submit" className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors">
              無料で登録 <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[11px] text-text-muted mt-2">配信解除はワンクリック。個人情報は第三者に提供しません。</p>
        </>
      )}
    </div>
  );
}
