"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  FileText,
  BookOpen,
  Monitor,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  Building2,
  Bot,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import {
  FUNAI_SERVICES,
  AI_SERVICE_MENUS,
  BENCHMARK_SUMMARY,
  SERVICE_CATEGORIES,
  type AIServiceMenu,
  type CompetitorService,
} from "@/lib/competitor-benchmark";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  FileText,
  BookOpen,
  Monitor,
};

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || BarChart3;
}

export default function AIMenuPage() {
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [expandedComparison, setExpandedComparison] = useState<string | null>(null);
  const [showBenchmarkDetail, setShowBenchmarkDetail] = useState(false);

  const filteredMenus =
    selectedCategory === "すべて"
      ? AI_SERVICE_MENUS
      : AI_SERVICE_MENUS.filter((m) => m.category === selectedCategory);

  return (
    <div className="min-h-screen bg-surface">
      <Header
        onBack={() => window.history.back()}
        currentPage="AIコンサルメニュー"
        breadcrumb={[{ label: "AIコンサルメニュー" }]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-8 text-white mb-8 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                AIコンサルティングメニュー
              </h1>
              <p className="text-white/80 mb-4">
                大手コンサルファームと同等のサービスを、AIで月額9,800円から提供。
                船井総研などの従来型コンサルと比較し、各メニューのAI代替可能性を分析しています。
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="bg-white/20 rounded-lg px-3 py-1.5 text-sm">
                  <Zap className="w-3.5 h-3.5 inline mr-1" />
                  コスト約{BENCHMARK_SUMMARY.costReductionPercent}%削減
                </div>
                <div className="bg-white/20 rounded-lg px-3 py-1.5 text-sm">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  {BENCHMARK_SUMMARY.availabilityHours}対応
                </div>
                <div className="bg-white/20 rounded-lg px-3 py-1.5 text-sm">
                  <Zap className="w-3.5 h-3.5 inline mr-1" />
                  即時レスポンス
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benchmark Summary Comparison */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-8">
          <button
            onClick={() => setShowBenchmarkDetail(!showBenchmarkDetail)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              従来型コンサル vs AIコンサル 比較
            </h2>
            {showBenchmarkDetail ? (
              <ChevronUp className="w-5 h-5 text-text-secondary" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-secondary" />
            )}
          </button>

          {showBenchmarkDetail && (
            <div className="mt-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Traditional */}
                <div className="border border-border rounded-xl p-5">
                  <h3 className="font-bold text-sm text-text-secondary mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    従来型コンサル（船井総研等）
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>月額費用</span>
                      <span className="font-bold">{BENCHMARK_SUMMARY.totalTraditionalCostMonthly}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>対応時間</span>
                      <span>{BENCHMARK_SUMMARY.competitorAvailability}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>レスポンス</span>
                      <span>{BENCHMARK_SUMMARY.competitorResponseTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>年間契約社数</span>
                      <span>6,286社（2024年実績）</span>
                    </div>
                    <div className="flex justify-between">
                      <span>コンサルタント数</span>
                      <span>900名以上</span>
                    </div>
                  </div>
                </div>

                {/* AI */}
                <div className="border-2 border-primary rounded-xl p-5 bg-primary/5">
                  <h3 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    Cocreo（当サービス）
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>月額費用</span>
                      <span className="font-bold text-primary">{BENCHMARK_SUMMARY.totalAICostMonthly}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>対応時間</span>
                      <span className="text-primary font-medium">{BENCHMARK_SUMMARY.availabilityHours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>レスポンス</span>
                      <span className="text-primary font-medium">{BENCHMARK_SUMMARY.responseTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>分析の再現性</span>
                      <span>何度でも無制限</span>
                    </div>
                    <div className="flex justify-between">
                      <span>業種横断知識</span>
                      <span>全業種対応</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advantages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-green-700 mb-2">AIコンサルの強み</h4>
                  <ul className="space-y-1">
                    {BENCHMARK_SUMMARY.aiAdvantages.map((a, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-700 mb-2">人的コンサルが優位な領域</h4>
                  <ul className="space-y-1">
                    {BENCHMARK_SUMMARY.humanAdvantages.map((a, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Competitor Service Replaceability */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-8">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            船井総研サービスのAI代替可能性分析
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-text-secondary">サービス</th>
                  <th className="text-left py-2 pr-4 font-medium text-text-secondary">価格帯</th>
                  <th className="text-left py-2 pr-4 font-medium text-text-secondary">AI代替度</th>
                  <th className="text-left py-2 font-medium text-text-secondary hidden md:table-cell">分析</th>
                </tr>
              </thead>
              <tbody>
                {FUNAI_SERVICES.map((service) => (
                  <tr key={service.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{service.name}</div>
                      <div className="text-xs text-text-secondary mt-0.5 hidden sm:block">{service.description.slice(0, 40)}...</div>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-xs">{service.priceRange}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                        service.aiReplaceability === "full"
                          ? "bg-green-50 text-green-700"
                          : service.aiReplaceability === "partial"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {service.aiReplaceability === "full" ? "AI完全代替" : service.aiReplaceability === "partial" ? "AI部分代替" : "AI補完"}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-text-secondary hidden md:table-cell">
                      {service.aiReplaceabilityReason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <h2 className="font-bold text-xl mb-4">AIで提供するコンサルメニュー</h2>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-white"
                    : "bg-white border border-border text-text-secondary hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* AI Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filteredMenus.map((menu) => {
            const Icon = getIcon(menu.icon);
            const isExpanded = expandedComparison === menu.id;
            return (
              <div
                key={menu.id}
                className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{menu.name}</h3>
                        {menu.status === "coming_soon" && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">準備中</span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-1">{menu.description}</p>
                    </div>
                  </div>

                  {/* Price comparison */}
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <span className="line-through text-text-secondary text-xs">{menu.benchmarkPrice}</span>
                    <ArrowRight className="w-3 h-3 text-text-secondary" />
                    <span className="font-bold text-primary">{menu.aiPrice}</span>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      {menu.costReduction}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-1 mb-3">
                    {menu.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    {menu.features.length > 3 && !isExpanded && (
                      <li className="text-xs text-text-secondary">
                        +{menu.features.length - 3}件の機能
                      </li>
                    )}
                    {isExpanded &&
                      menu.features.slice(3).map((f, i) => (
                        <li key={i + 3} className="text-xs flex items-start gap-1.5 animate-fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                  </ul>

                  <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
                    <span>{menu.availableIn}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {menu.linkedPage && menu.status === "available" ? (
                      <a
                        href={menu.linkedPage}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        利用する
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        disabled
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
                      >
                        準備中
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedComparison(isExpanded ? null : menu.id)}
                      className="px-3 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors"
                    >
                      {isExpanded ? "閉じる" : "詳細"}
                    </button>
                  </div>
                </div>

                {/* Expanded comparison detail */}
                {isExpanded && (
                  <div className="border-t border-border bg-surface p-4 animate-fade-in">
                    <h4 className="text-xs font-bold text-text-secondary mb-2">
                      従来型コンサルとの比較
                    </h4>
                    <div className="bg-white rounded-lg p-3 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">ベンチマーク</span>
                        <span>{menu.benchmarkService}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">従来コスト</span>
                        <span className="line-through">{menu.benchmarkPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">AIコスト</span>
                        <span className="font-bold text-primary">{menu.aiPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">削減率</span>
                        <span className="font-bold text-green-600">{menu.costReduction}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white text-center">
          <h3 className="text-lg font-bold mb-2">
            まずは無料でAIコンサルを体験
          </h3>
          <p className="text-white/80 text-sm mb-4">
            従来型コンサル月額30万円相当の分析を、フリープランで今すぐ試せます
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/consulting"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-xl hover:shadow-lg transition-all"
            >
              AIコンサルに相談する
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all"
            >
              料金プランを見る
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
