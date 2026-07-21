"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  FileText,
  Shield,
  DollarSign,
  PieChart,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  Clock,
  Wrench,
} from "lucide-react";
import {
  PLData,
  BSData,
  generateFinancialAnalysis,
  FinancialAnalysisResult,
  WeaknessDetail,
} from "@/lib/financial-analysis";

type Step = "input" | "analyzing" | "result";
type Tab = "pl" | "bs";

const INDUSTRIES = [
  "食品・飲食", "製造業", "小売・卸売", "農林水産", "観光・宿泊",
  "建設・不動産", "医療・福祉", "教育", "IT・通信", "運輸・物流",
  "サービス業", "伝統工芸", "その他",
];

function NumberInput({
  label,
  value,
  onChange,
  unit = "円",
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder || "0"}
          className="w-full px-3 py-2 pr-8 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">
          {unit}
        </span>
      </div>
    </div>
  );
}

export default function FinancialAnalysisPage() {
  const [step, setStep] = useState<Step>("input");
  const [activeTab, setActiveTab] = useState<Tab>("pl");
  const [includeBs, setIncludeBs] = useState(false);
  const [industry, setIndustry] = useState("食品・飲食");
  const [result, setResult] = useState<FinancialAnalysisResult | null>(null);
  const [expandedWeakness, setExpandedWeakness] = useState<number | null>(null);

  const [pl, setPL] = useState<PLData>({
    period: "2025年度",
    revenue: 0,
    cogs: 0,
    sellingExpenses: 0,
    nonOperatingIncome: 0,
    nonOperatingExpenses: 0,
    extraordinaryGains: 0,
    extraordinaryLosses: 0,
    incomeTax: 0,
  });

  const [bs, setBS] = useState<BSData>({
    period: "2025年度",
    cashAndDeposits: 0,
    accountsReceivable: 0,
    inventory: 0,
    otherCurrentAssets: 0,
    fixedAssets: 0,
    accountsPayable: 0,
    shortTermLoans: 0,
    otherCurrentLiabilities: 0,
    longTermLoans: 0,
    otherFixedLiabilities: 0,
    capital: 0,
    retainedEarnings: 0,
  });

  const updatePL = (field: keyof PLData, value: number) =>
    setPL((prev) => ({ ...prev, [field]: value }));
  const updateBS = (field: keyof BSData, value: number) =>
    setBS((prev) => ({ ...prev, [field]: value }));

  const handleAnalyze = () => {
    setStep("analyzing");
    setTimeout(() => {
      const analysisResult = generateFinancialAnalysis(
        pl,
        includeBs ? bs : null,
        industry
      );
      setResult(analysisResult);
      setStep("result");
    }, 2500);
  };

  const loadSampleData = () => {
    setPL({
      period: "2025年度",
      revenue: 80000000,
      cogs: 48000000,
      sellingExpenses: 25000000,
      nonOperatingIncome: 200000,
      nonOperatingExpenses: 1500000,
      extraordinaryGains: 0,
      extraordinaryLosses: 0,
      incomeTax: 1700000,
    });
    setBS({
      period: "2025年度",
      cashAndDeposits: 12000000,
      accountsReceivable: 8000000,
      inventory: 5000000,
      otherCurrentAssets: 2000000,
      fixedAssets: 30000000,
      accountsPayable: 6000000,
      shortTermLoans: 5000000,
      otherCurrentLiabilities: 3000000,
      longTermLoans: 15000000,
      otherFixedLiabilities: 2000000,
      capital: 10000000,
      retainedEarnings: 16000000,
    });
    setIncludeBs(true);
  };

  if (step === "analyzing") {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header onBack={() => setStep("input")} currentPage="PL/BS分析" breadcrumb={[{ label: "PL/BS分析" }]} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold mb-2">財務データをAI分析中...</h2>
            <div className="mt-4 space-y-2 text-sm text-text-secondary">
              <p className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
                損益計算書の構造を分析中...
              </p>
              <p className="animate-fade-in" style={{ animationDelay: "1.2s" }}>
                業界ベンチマークと比較中...
              </p>
              <p className="animate-fade-in" style={{ animationDelay: "2.0s" }}>
                改善提案を生成中...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "result" && result) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header onBack={() => setStep("input")} currentPage="PL/BS分析" breadcrumb={[{ label: "PL/BS分析" }]} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white mb-8 animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="w-8 h-8" />
              <h1 className="text-xl md:text-2xl font-bold">
                AI財務分析レポート
              </h1>
            </div>
            <p className="text-white/80 text-sm">
              {result.pl.period} / {industry} /
              売上高 {(result.pl.revenue / 10000).toLocaleString()}万円
            </p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "売上総利益率",
                value: `${(((result.pl.grossProfit || 0) / result.pl.revenue) * 100).toFixed(1)}%`,
                icon: TrendingUp,
                color: (result.pl.grossProfit || 0) / result.pl.revenue >= 0.3 ? "text-green-600" : "text-red-500",
              },
              {
                label: "営業利益率",
                value: `${(((result.pl.operatingProfit || 0) / result.pl.revenue) * 100).toFixed(1)}%`,
                icon: BarChart3,
                color: (result.pl.operatingProfit || 0) / result.pl.revenue >= 0.03 ? "text-green-600" : "text-red-500",
              },
              {
                label: "経常利益",
                value: `${((result.pl.ordinaryProfit || 0) / 10000).toLocaleString()}万円`,
                icon: DollarSign,
                color: (result.pl.ordinaryProfit || 0) > 0 ? "text-green-600" : "text-red-500",
              },
              {
                label: "当期純利益",
                value: `${((result.pl.netProfit || 0) / 10000).toLocaleString()}万円`,
                icon: PieChart,
                color: (result.pl.netProfit || 0) > 0 ? "text-green-600" : "text-red-500",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs text-text-secondary">{label}</span>
                </div>
                <div className={`text-lg font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Cash flow warning */}
          {result.cashFlowWarning && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-800 text-sm">資金繰り警告</h3>
                <p className="text-sm text-red-700">{result.cashFlowWarning}</p>
              </div>
            </div>
          )}

          {/* Financial ratios */}
          <div className="bg-white rounded-2xl border border-border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              経営指標
            </h2>
            <div className="space-y-4">
              {result.ratios.map((ratio) => {
                const percentage = ratio.unit === "%"
                  ? Math.min(100, Math.max(0, ratio.value))
                  : Math.min(100, (ratio.value / (ratio.benchmark * 2)) * 100);
                return (
                  <div key={ratio.name}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            ratio.status === "good"
                              ? "bg-green-500"
                              : ratio.status === "warning"
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="text-sm font-medium">{ratio.name}</span>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          ratio.status === "good"
                            ? "text-green-600"
                            : ratio.status === "warning"
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {ratio.value}
                        {ratio.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-700 ${
                            ratio.status === "good"
                              ? "bg-green-500"
                              : ratio.status === "warning"
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary whitespace-nowrap">
                        目安: {ratio.benchmark}
                        {ratio.unit}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      {ratio.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Industry comparison */}
          {result.industryComparison.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-6 mb-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                業種別比較（{industry}）
              </h2>
              <div className="space-y-3">
                {result.industryComparison.map((comp) => (
                  <div
                    key={comp.metric}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface"
                  >
                    <span className="text-sm font-medium">{comp.metric}</span>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-text-secondary">御社</div>
                        <div className="font-bold text-sm">
                          {comp.companyValue}{comp.unit}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-text-secondary" />
                      <div className="text-right">
                        <div className="text-xs text-text-secondary">業界平均</div>
                        <div className="font-bold text-sm">
                          {comp.industryAvg}{comp.unit}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          comp.verdict === "業界平均以上"
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {comp.verdict}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          <div className="bg-white rounded-2xl border border-border p-6 mb-6">
            <h2 className="font-bold mb-3 flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              強み
            </h2>
            {result.strengths.length > 0 ? (
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-secondary">分析にはより詳細なデータが必要です</p>
            )}
          </div>

          {/* Weaknesses with detailed issues & improvements */}
          <div className="bg-white rounded-2xl border border-border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              弱み・課題・改善案
            </h2>
            {result.weaknessDetails.length > 0 ? (
              <div className="space-y-3">
                {result.weaknessDetails.map((detail, i) => (
                  <div key={i} className="border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedWeakness(expandedWeakness === i ? null : i)}
                      className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                        detail.severity === "high" ? "bg-red-500" : detail.severity === "medium" ? "bg-amber-500" : "bg-yellow-400"
                      }`} />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{detail.weakness}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          detail.severity === "high" ? "bg-red-50 text-red-600" : detail.severity === "medium" ? "bg-amber-50 text-amber-600" : "bg-yellow-50 text-yellow-600"
                        }`}>
                          {detail.severity === "high" ? "重要度：高" : detail.severity === "medium" ? "重要度：中" : "重要度：低"}
                        </span>
                      </div>
                      {expandedWeakness === i ? (
                        <ChevronUp className="w-4 h-4 text-text-secondary shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-text-secondary shrink-0 mt-1" />
                      )}
                    </button>

                    {expandedWeakness === i && (
                      <div className="px-4 pb-4 animate-fade-in">
                        {/* Issues */}
                        <div className="mb-4">
                          <h4 className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                            <Target className="w-3.5 h-3.5" />
                            想定される課題
                          </h4>
                          <ul className="space-y-1.5">
                            {detail.issues.map((issue, j) => (
                              <li key={j} className="text-sm text-gray-700 flex items-start gap-2 pl-1">
                                <span className="text-red-400 shrink-0 mt-1">•</span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Improvements */}
                        <div>
                          <h4 className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                            <Lightbulb className="w-3.5 h-3.5" />
                            改善案
                          </h4>
                          <div className="space-y-2">
                            {detail.improvements.map((imp, j) => (
                              <div key={j} className="bg-blue-50/60 rounded-lg p-3">
                                <div className="flex items-start gap-2 mb-1.5">
                                  <Wrench className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                  <span className="text-sm font-medium text-blue-900">{imp.action}</span>
                                </div>
                                <div className="pl-5.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-700">
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    期待効果: {imp.effect}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {imp.timeframe}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    imp.difficulty === "easy" ? "bg-green-100 text-green-700" :
                                    imp.difficulty === "medium" ? "bg-amber-100 text-amber-700" :
                                    "bg-red-100 text-red-700"
                                  }`}>
                                    {imp.difficulty === "easy" ? "難易度：低" : imp.difficulty === "medium" ? "難易度：中" : "難易度：高"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : result.weaknesses.length > 0 ? (
              <ul className="space-y-2">
                {result.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-secondary">大きな問題は検出されませんでした</p>
            )}
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-2xl border border-border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              AI改善提案
            </h2>
            <div className="space-y-3">
              {result.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl"
                >
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white text-center">
            <h3 className="text-lg font-bold mb-2">
              この分析結果をもとに、改善策を詳しく相談しませんか？
            </h3>
            <p className="text-white/80 text-sm mb-4">
              経営戦略コンサルタントAIが具体的な実行プランを作成します
            </p>
            <a
              href="/consulting"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-xl hover:shadow-lg transition-all"
            >
              AIコンサルに相談する
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Input step
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header onBack={() => window.history.back()} currentPage="PL/BS分析" breadcrumb={[{ label: "PL/BS分析" }]} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-4">
            <BarChart3 className="w-4 h-4" />
            AI財務分析
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            PL/BS分析
          </h1>
          <p className="text-text-secondary text-sm">
            損益計算書・貸借対照表を入力すると、AIが経営指標を分析し改善提案を行います
          </p>
        </div>

        {/* Industry selector */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">基本情報</h2>
            <button
              onClick={loadSampleData}
              className="text-xs text-primary hover:underline"
            >
              サンプルデータを入力
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">業種</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">対象期間</label>
              <input
                type="text"
                value={pl.period}
                onChange={(e) => setPL((p) => ({ ...p, period: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("pl")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "pl"
                ? "bg-primary text-white"
                : "bg-white border border-border text-text-secondary hover:bg-gray-50"
            }`}
          >
            損益計算書（PL）
          </button>
          <button
            onClick={() => {
              setActiveTab("bs");
              setIncludeBs(true);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "bs"
                ? "bg-primary text-white"
                : "bg-white border border-border text-text-secondary hover:bg-gray-50"
            }`}
          >
            貸借対照表（BS）
          </button>
        </div>

        {/* PL Input */}
        {activeTab === "pl" && (
          <div className="bg-white rounded-2xl border border-border p-6 animate-fade-in">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              損益計算書
            </h2>
            <div className="space-y-4">
              <div className="border-b border-border pb-4">
                <h3 className="text-xs font-medium text-text-secondary mb-3">売上・原価</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberInput label="売上高" value={pl.revenue} onChange={(v) => updatePL("revenue", v)} />
                  <NumberInput label="売上原価" value={pl.cogs} onChange={(v) => updatePL("cogs", v)} />
                </div>
                {pl.revenue > 0 && (
                  <p className="text-xs text-text-secondary mt-2">
                    → 売上総利益: {((pl.revenue - pl.cogs) / 10000).toLocaleString()}万円
                    （利益率 {(((pl.revenue - pl.cogs) / pl.revenue) * 100).toFixed(1)}%）
                  </p>
                )}
              </div>
              <div className="border-b border-border pb-4">
                <h3 className="text-xs font-medium text-text-secondary mb-3">販管費</h3>
                <NumberInput label="販売費及び一般管理費" value={pl.sellingExpenses} onChange={(v) => updatePL("sellingExpenses", v)} />
              </div>
              <div className="border-b border-border pb-4">
                <h3 className="text-xs font-medium text-text-secondary mb-3">営業外損益</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberInput label="営業外収益" value={pl.nonOperatingIncome} onChange={(v) => updatePL("nonOperatingIncome", v)} />
                  <NumberInput label="営業外費用" value={pl.nonOperatingExpenses} onChange={(v) => updatePL("nonOperatingExpenses", v)} />
                </div>
              </div>
              <div className="border-b border-border pb-4">
                <h3 className="text-xs font-medium text-text-secondary mb-3">特別損益</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberInput label="特別利益" value={pl.extraordinaryGains} onChange={(v) => updatePL("extraordinaryGains", v)} />
                  <NumberInput label="特別損失" value={pl.extraordinaryLosses} onChange={(v) => updatePL("extraordinaryLosses", v)} />
                </div>
              </div>
              <NumberInput label="法人税等" value={pl.incomeTax} onChange={(v) => updatePL("incomeTax", v)} />
            </div>
          </div>
        )}

        {/* BS Input */}
        {activeTab === "bs" && (
          <div className="bg-white rounded-2xl border border-border p-6 animate-fade-in">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              貸借対照表
            </h2>
            <div className="space-y-4">
              <div className="border-b border-border pb-4">
                <h3 className="text-xs font-medium text-text-secondary mb-3">流動資産</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberInput label="現金及び預金" value={bs.cashAndDeposits} onChange={(v) => updateBS("cashAndDeposits", v)} />
                  <NumberInput label="売掛金" value={bs.accountsReceivable} onChange={(v) => updateBS("accountsReceivable", v)} />
                  <NumberInput label="棚卸資産" value={bs.inventory} onChange={(v) => updateBS("inventory", v)} />
                  <NumberInput label="その他流動資産" value={bs.otherCurrentAssets} onChange={(v) => updateBS("otherCurrentAssets", v)} />
                </div>
              </div>
              <div className="border-b border-border pb-4">
                <h3 className="text-xs font-medium text-text-secondary mb-3">固定資産</h3>
                <NumberInput label="固定資産合計" value={bs.fixedAssets} onChange={(v) => updateBS("fixedAssets", v)} />
              </div>
              <div className="border-b border-border pb-4">
                <h3 className="text-xs font-medium text-text-secondary mb-3">流動負債</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberInput label="買掛金" value={bs.accountsPayable} onChange={(v) => updateBS("accountsPayable", v)} />
                  <NumberInput label="短期借入金" value={bs.shortTermLoans} onChange={(v) => updateBS("shortTermLoans", v)} />
                  <NumberInput label="その他流動負債" value={bs.otherCurrentLiabilities} onChange={(v) => updateBS("otherCurrentLiabilities", v)} />
                </div>
              </div>
              <div className="border-b border-border pb-4">
                <h3 className="text-xs font-medium text-text-secondary mb-3">固定負債</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberInput label="長期借入金" value={bs.longTermLoans} onChange={(v) => updateBS("longTermLoans", v)} />
                  <NumberInput label="その他固定負債" value={bs.otherFixedLiabilities} onChange={(v) => updateBS("otherFixedLiabilities", v)} />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-medium text-text-secondary mb-3">純資産</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberInput label="資本金" value={bs.capital} onChange={(v) => updateBS("capital", v)} />
                  <NumberInput label="利益剰余金" value={bs.retainedEarnings} onChange={(v) => updateBS("retainedEarnings", v)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analyze button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleAnalyze}
            disabled={pl.revenue === 0}
            className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            <BarChart3 className="w-5 h-5" />
            AIで財務分析する
          </button>
          <p className="text-xs text-text-secondary mt-2">
            入力されたデータはサーバーに保存されません
          </p>
        </div>
      </div>
    </div>
  );
}
