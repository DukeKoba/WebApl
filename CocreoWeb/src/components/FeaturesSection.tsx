"use client";

import {
  MessageSquare,
  BarChart3,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Repeat,
  Award,
  Bot,
} from "lucide-react";
import Link from "next/link";

interface Tool {
  icon: React.ComponentType<Record<string, unknown>>;
  title: string;
  description: string;
  href: string;
  badge?: string;
  color: string;
}

const tools: Tool[] = [
  {
    icon: DollarSign,
    title: "価格転嫁シミュレーター",
    description:
      "コスト上昇分をどれだけ価格に転嫁できているか診断。転嫁率49.7%の壁を突破する具体策を提案。",
    href: "/price-pass-through",
    badge: "白書2025",
    color: "#EA580C",
  },
  {
    icon: TrendingUp,
    title: "賃上げ余力診断",
    description:
      "労働分配率・営業利益から賃上げの実現可能性を分析。原資確保の方法と補助金活用を提案。",
    href: "/wage-capacity",
    badge: "白書2025",
    color: "#F97316",
  },
  {
    icon: Repeat,
    title: "事業承継スコアリング",
    description:
      "後継者準備・計画・時間的余裕・組織体制の4軸で承継の緊急度を100点満点で評価。",
    href: "/succession-score",
    badge: "白書2025",
    color: "#C2410C",
  },
  {
    icon: Award,
    title: "経営力スコア",
    description:
      "白書の「個人特性・戦略策定・組織人材」3軸で経営力をS〜Dランク判定。改善アクションプランを提示。",
    href: "/management-power",
    badge: "白書2025",
    color: "#FB923C",
  },
  {
    icon: BarChart3,
    title: "PL/BS AI分析",
    description:
      "損益計算書・貸借対照表から10指標を算出。業種別ベンチマーク比較と改善提案。",
    href: "/financial-analysis",
    color: "#EA580C",
  },
  {
    icon: MessageSquare,
    title: "オーダーメイドAIコンサル",
    description:
      "課題を入力するだけで、5人の専門AIエージェントが連携してオーダーメイドの提案書を作成。",
    href: "/consulting",
    color: "#C2410C",
  },
  {
    icon: Bot,
    title: "AIコンサルメニュー",
    description:
      "大手コンサル月額30万円相当のサービスをAIで月額9,800円から。船井総研ベンチマーク分析付き。",
    href: "/ai-menu",
    badge: "NEW",
    color: "#F97316",
  },
];

const stats = [
  { value: "49.7%", label: "中小企業の価格転嫁率", source: "白書2025" },
  { value: "78%", label: "労働分配率（賃上げ余力限界）", source: "白書2025" },
  { value: "60.7歳", label: "経営者の平均年齢", source: "白書2025" },
  { value: "70%", label: "DX未着手の中小企業", source: "白書2025" },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats bar */}
        <div className="border border-border rounded-2xl p-8 mb-16 bg-orange-50">
          <p className="text-center text-text-secondary text-xs mb-6 uppercase tracking-wider font-medium">
            中小企業白書2025が示す課題 — チイキAIはこれらを解決するために設計されています
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-primary mb-1 tracking-tight">
                  {s.value}
                </div>
                <div className="text-xs text-text-secondary">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full text-primary text-xs font-medium mb-4">
            AI経営ツール
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            他にないAI経営ツール群
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            中小企業白書2025の分析に基づき、地方中小企業が
            <strong>今まさに直面している課題</strong>を解決する専用ツールを提供。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.title}
                href={tool.href}
                className="group bg-white border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block relative overflow-hidden"
              >
                {/* Hover gradient accent */}
                <div
                  className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: tool.color }}
                />
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${tool.color}12` }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: tool.color }}
                    />
                  </div>
                  {tool.badge && (
                    <span className="text-xs px-2.5 py-1 bg-orange-50 text-primary rounded-full font-medium border border-orange-200">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  {tool.description}
                </p>
                <div
                  className="flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all"
                  style={{ color: tool.color }}
                >
                  診断する
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
