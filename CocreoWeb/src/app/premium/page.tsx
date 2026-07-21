"use client";

import { Lock, Megaphone, TrendingUp, BarChart3, Users, Globe } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";

const premiumFeatures = [
  {
    icon: Megaphone,
    label: "Webマーケティングプランナー",
    href: "/marketing-planner",
    description: "Web・SNS・広告の現状を分析し、AIが最適なデジタルマーケティング戦略と予算配分を提案。",
    status: "ready",
    plan: "スタンダード",
  },
  // 今後の有料機能はここに追加
  // {
  //   icon: TrendingUp,
  //   label: "競合ベンチマーク分析",
  //   href: "/competitor-benchmark",
  //   description: "業界内の競合他社と経営指標を比較・分析。",
  //   status: "wip",
  //   plan: "プレミアム",
  // },
];

const statusLabel: Record<string, { label: string; color: string }> = {
  ready: { label: "実装済み・非公開", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  wip: { label: "開発中", color: "bg-amber-50 text-amber-700 border-amber-200" },
  planned: { label: "企画中", color: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function PremiumFeaturesPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header
        breadcrumb={[{ label: "ホーム", href: "/" }, { label: "有料機能管理" }]}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-primary text-xs font-medium mb-4">
            <Lock className="w-3.5 h-3.5" />
            有料プラン機能の管理ページ（内部用）
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">有料機能一覧</h1>
          <p className="text-text-secondary text-sm">
            有料プラン公開時に順次ナビゲーションに追加する機能を管理しています。
            各機能の実装状況と対象プランを確認できます。
          </p>
        </div>

        <div className="space-y-4">
          {premiumFeatures.map((feature) => {
            const Icon = feature.icon;
            const status = statusLabel[feature.status];
            return (
              <div key={feature.href} className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4">
                <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-bold text-text-primary text-sm">{feature.label}</h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-primary font-medium">
                      {feature.plan}プラン以上
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{feature.description}</p>
                </div>
                <Link
                  href={feature.href}
                  className="text-xs text-primary border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0"
                >
                  プレビュー
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-5 bg-gray-50 border border-border rounded-2xl">
          <h3 className="text-sm font-bold text-text-primary mb-2">機能を公開するには</h3>
          <ol className="text-xs text-text-secondary space-y-1.5 list-decimal list-inside">
            <li><code className="bg-white px-1 rounded border border-border">Header.tsx</code> の <code className="bg-white px-1 rounded border border-border">navItems</code> に該当機能のエントリを追加する</li>
            <li><code className="bg-white px-1 rounded border border-border">page.tsx</code> のゲート画面を <code className="bg-white px-1 rounded border border-border">_page.premium.tsx</code> の実装に差し替える</li>
            <li>この一覧のコメントアウトを外して次の機能の準備を進める</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
