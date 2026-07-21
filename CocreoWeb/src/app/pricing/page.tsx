"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  Check,
  X,
  Crown,
  Sparkles,
  Users,
  ArrowRight,
  TrendingUp,
  BarChart3,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import {
  PRICING_PLANS,
  calculateMonthlyCost,
  generateBusinessProjection,
} from "@/lib/pricing";

export default function PricingPage() {
  const [showCostAnalysis, setShowCostAnalysis] = useState(false);
  const projections = generateBusinessProjection(24);

  return (
    <div className="min-h-screen bg-surface">
      <Header
        onBack={() => window.history.back()}
        currentPage="料金プラン"
        breadcrumb={[{ label: "料金プラン" }]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            料金プラン
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            AIが経営コンサルを完結。必要に応じて専門コンサルタントもご紹介します。
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border-2 p-6 relative ${
                plan.recommended
                  ? "border-primary shadow-xl scale-[1.02]"
                  : "border-border"
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  おすすめ
                </div>
              )}
              <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
              <p className="text-xs text-text-secondary mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold">{plan.priceLabel}</span>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
                {plan.limitations.map((l) => (
                  <li key={l} className="flex items-start gap-2 text-sm text-text-secondary">
                    <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>

              {plan.consultantReferral && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800">
                    <Users className="w-3.5 h-3.5" />
                    専門コンサルタント紹介付き
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    AIで戦略を立案後、実行フェーズで各領域の専門家をご紹介
                  </p>
                </div>
              )}

              <button
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  plan.recommended
                    ? "bg-primary text-white hover:bg-primary-dark"
                    : "border-2 border-primary text-primary hover:bg-primary/5"
                }`}
              >
                {plan.priceJPY === 0 ? "無料で始める" : "プランを選択"}
              </button>
            </div>
          ))}
        </div>

        {/* Consultant referral section */}
        <div className="bg-white rounded-2xl border border-border p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">
              AIコンサル + 専門家紹介モデル
            </h2>
            <p className="text-text-secondary text-sm max-w-2xl mx-auto">
              戦略立案はAIが担当。実行支援が必要な場合のみ、各領域の専門コンサルタントをご紹介します。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-primary/5 rounded-xl">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Step 1: AI分析・戦略立案</h3>
              <p className="text-sm text-text-secondary">
                AIエージェントが課題を分析し、オーダーメイドの戦略・施策を提案。PL/BS分析で経営状態を可視化。
              </p>
              <div className="mt-3 text-xs text-primary font-medium">全プランで利用可能</div>
            </div>

            <div className="text-center p-6 bg-secondary/5 rounded-xl">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-bold mb-2">Step 2: AI実行サポート</h3>
              <p className="text-sm text-text-secondary">
                マニュアル作成、テンプレート生成、補助金情報など、AIで完結できる実行支援を提供。
              </p>
              <div className="mt-3 text-xs text-secondary font-medium">スターター以上</div>
            </div>

            <div className="text-center p-6 bg-amber-50 rounded-xl">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold mb-2">Step 3: 専門家紹介（任意）</h3>
              <p className="text-sm text-text-secondary">
                対面での支援が必要な場合、マーケティング・財務・IT・人事等の専門コンサルタントを紹介。
              </p>
              <div className="mt-3 text-xs text-amber-600 font-medium">プロ以上 / 紹介料: 3万円〜</div>
            </div>
          </div>
        </div>

        {/* Cost analysis toggle */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowCostAnalysis(!showCostAnalysis)}
            className="text-sm text-primary hover:underline flex items-center gap-1 mx-auto"
          >
            <BarChart3 className="w-4 h-4" />
            {showCostAnalysis ? "事業収支分析を隠す" : "事業収支分析を見る（内部資料）"}
          </button>
        </div>

        {/* Internal: Cost analysis & monetization model */}
        {showCostAnalysis && (
          <div className="space-y-8 animate-fade-in">
            {/* AI Cost per plan */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                プラン別AIコスト・粗利分析
              </h2>
              <p className="text-xs text-text-secondary mb-4">
                Claude API料金: Sonnet 4.5 ($3/$15 per 1M tokens) / Haiku 4.5 ($1/$5 per 1M tokens) / 為替 ¥150/$
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3">プラン</th>
                      <th className="text-right py-2 px-3">月額料金</th>
                      <th className="text-right py-2 px-3">AIコスト</th>
                      <th className="text-right py-2 px-3">インフラ</th>
                      <th className="text-right py-2 px-3">原価合計</th>
                      <th className="text-right py-2 px-3">粗利</th>
                      <th className="text-right py-2 px-3">粗利率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRICING_PLANS.filter((p) => p.priceJPY > 0).map((plan) => {
                      const cost = calculateMonthlyCost(plan.id);
                      return (
                        <tr key={plan.id} className="border-b border-border/50">
                          <td className="py-2 px-3 font-medium">{plan.name}</td>
                          <td className="py-2 px-3 text-right">
                            ¥{plan.priceJPY.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right">
                            ¥{Math.round(cost.items.filter((i) => i.name.includes("Claude")).reduce((s, i) => s + i.costJPY, 0)).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right">
                            ¥{Math.round(cost.items.find((i) => i.name.includes("インフラ"))?.costJPY || 0).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right">
                            ¥{Math.round(cost.totalCostJPY).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-green-600">
                            ¥{Math.round(cost.margin).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                cost.marginRate >= 70
                                  ? "bg-green-50 text-green-600"
                                  : cost.marginRate >= 50
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {cost.marginRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Business projection */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                24ヶ月事業収支シミュレーション
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2">月</th>
                      <th className="text-right py-2 px-2">ユーザー数</th>
                      <th className="text-right py-2 px-2">月間売上</th>
                      <th className="text-right py-2 px-2">AIコスト</th>
                      <th className="text-right py-2 px-2">運営費</th>
                      <th className="text-right py-2 px-2">月次損益</th>
                      <th className="text-right py-2 px-2">累計損益</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections
                      .filter((_, i) => i % 3 === 0 || i < 6)
                      .map((p) => (
                        <tr key={p.month} className="border-b border-border/30">
                          <td className="py-1.5 px-2">{p.month}月目</td>
                          <td className="py-1.5 px-2 text-right">{p.users}</td>
                          <td className="py-1.5 px-2 text-right">
                            ¥{Math.round(p.revenue / 10000).toLocaleString()}万
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            ¥{Math.round(p.aiCost / 10000).toLocaleString()}万
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            ¥{Math.round((p.infraCost + p.operatingCost) / 10000).toLocaleString()}万
                          </td>
                          <td
                            className={`py-1.5 px-2 text-right font-medium ${
                              p.profit >= 0 ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            ¥{Math.round(p.profit / 10000).toLocaleString()}万
                          </td>
                          <td
                            className={`py-1.5 px-2 text-right font-medium ${
                              p.cumulativeProfit >= 0
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            ¥{Math.round(p.cumulativeProfit / 10000).toLocaleString()}万
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {(() => {
                const bep = projections.find((p) => p.cumulativeProfit >= 0);
                return bep ? (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-800">
                    <strong>損益分岐点:</strong> {bep.month}ヶ月目に累計黒字化
                    （ユーザー数 {bep.users}名時点）
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
                    24ヶ月以内での累計黒字化にはユーザー獲得の加速が必要
                  </div>
                );
              })()}
            </div>

            {/* Unit economics */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-bold text-lg mb-4">ユニットエコノミクス</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-surface rounded-xl">
                  <div className="text-xs text-text-secondary mb-1">平均顧客単価（ARPU）</div>
                  <div className="text-2xl font-bold text-primary">¥23,200</div>
                  <div className="text-xs text-text-secondary mt-1">
                    加重平均（Starter55% + Pro35% + Enterprise10%）
                  </div>
                </div>
                <div className="p-4 bg-surface rounded-xl">
                  <div className="text-xs text-text-secondary mb-1">顧客獲得コスト（CAC）</div>
                  <div className="text-2xl font-bold text-amber-600">¥15,000</div>
                  <div className="text-xs text-text-secondary mt-1">
                    想定（SEO+コンテンツマーケティング中心）
                  </div>
                </div>
                <div className="p-4 bg-surface rounded-xl">
                  <div className="text-xs text-text-secondary mb-1">LTV / CAC比率</div>
                  <div className="text-2xl font-bold text-green-600">9.3x</div>
                  <div className="text-xs text-text-secondary mt-1">
                    LTV ¥139,200（平均継続6ヶ月）/ CAC ¥15,000
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
