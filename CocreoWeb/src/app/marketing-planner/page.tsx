"use client";

import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";

export default function MarketingPlannerPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header
        currentPage="Webマーケティング"
        breadcrumb={[{ label: "ホーム", href: "/" }, { label: "Webマーケティングプランナー" }]}
      />
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            有料プラン限定機能
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-3">
            Webマーケティングプランナー
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed mb-8">
            Web・SNS・広告の現状を入力すると、AIが最適なデジタルマーケティング戦略と予算配分を提案します。
            この機能はスタンダードプラン以上でご利用いただけます。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/pricing"
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors"
            >
              プランを確認する
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-border text-text-secondary rounded-xl text-sm hover:border-primary hover:text-primary transition-colors"
            >
              トップへ戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
