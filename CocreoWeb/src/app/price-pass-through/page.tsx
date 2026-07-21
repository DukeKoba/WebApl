"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  simulatePricePassThrough,
  PricePassThroughInput,
  PricePassThroughResult,
} from "@/lib/sme-challenges";

type Step = "input" | "analyzing" | "result";
type CustomerType = PricePassThroughInput["mainCustomerType"];

function formatManYen(value: number): string {
  const man = Math.round(value / 10000);
  return man.toLocaleString() + "万円";
}

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

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-green-50 text-green-700",
  medium: "bg-amber-50 text-amber-700",
  hard: "bg-red-50 text-red-700",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "簡単",
  medium: "普通",
  hard: "難しい",
};

const IMPACT_STYLES: Record<string, string> = {
  high: "bg-blue-50 text-blue-700",
  medium: "bg-slate-100 text-slate-600",
  low: "bg-gray-50 text-gray-500",
};

const IMPACT_LABELS: Record<string, string> = {
  high: "高効果",
  medium: "中効果",
  low: "低効果",
};

export default function PricePassThroughPage() {
  const [step, setStep] = useState<Step>("input");
  const [result, setResult] = useState<PricePassThroughResult | null>(null);

  const [currentRevenue, setCurrentRevenue] = useState<number>(0);
  const [materialCostRatio, setMaterialCostRatio] = useState<number>(0);
  const [laborCostRatio, setLaborCostRatio] = useState<number>(0);
  const [costIncreaseRate, setCostIncreaseRate] = useState<number>(0);
  const [currentPassThroughRate, setCurrentPassThroughRate] = useState<number>(49.7);
  const [targetPassThroughRate, setTargetPassThroughRate] = useState<number>(80);
  const [mainCustomerType, setMainCustomerType] = useState<CustomerType>("BtoB");

  const loadSample = () => {
    setCurrentRevenue(80000000);
    setMaterialCostRatio(35);
    setLaborCostRatio(30);
    setCostIncreaseRate(8);
    setCurrentPassThroughRate(40);
    setTargetPassThroughRate(75);
    setMainCustomerType("BtoB");
  };

  const handleSubmit = () => {
    setStep("analyzing");
    const input: PricePassThroughInput = {
      currentRevenue,
      materialCostRatio,
      laborCostRatio,
      costIncreaseRate,
      currentPassThroughRate,
      targetPassThroughRate,
      mainCustomerType,
    };
    setTimeout(() => {
      const res = simulatePricePassThrough(input);
      setResult(res);
      setStep("result");
    }, 2000);
  };

  const canSubmit = currentRevenue > 0 && costIncreaseRate > 0;

  // Analyzing spinner
  if (step === "analyzing") {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header onBack={() => setStep("input")} currentPage="経営診断ツール" breadcrumb={[{ label: "経営診断ツール", href: "/#features" }, { label: "価格転嫁シミュレーター" }]} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold mb-2">価格転嫁をシミュレーション中...</h2>
            <div className="mt-4 space-y-2 text-sm text-text-secondary">
              <p className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
                コスト構造を分析中...
              </p>
              <p className="animate-fade-in" style={{ animationDelay: "0.9s" }}>
                業界平均転嫁率と比較中...
              </p>
              <p className="animate-fade-in" style={{ animationDelay: "1.5s" }}>
                最適な転嫁戦略を策定中...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result view
  if (step === "result" && result) {
    const currentPct = currentPassThroughRate;
    const industryPct = result.industryAvgRate;
    const targetPct = targetPassThroughRate;

    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header onBack={() => setStep("input")} currentPage="経営診断ツール" breadcrumb={[{ label: "経営診断ツール", href: "/#features" }, { label: "価格転嫁シミュレーター" }]} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white mb-8 animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <Calculator className="w-8 h-8" />
              <h1 className="text-xl md:text-2xl font-bold">
                価格転嫁シミュレーション結果
              </h1>
            </div>
            <p className="text-white/80 text-sm">
              年商 {formatManYen(currentRevenue)} / コスト上昇率 {costIncreaseRate}% /
              転嫁率 {currentPassThroughRate}% → {targetPassThroughRate}%
            </p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "自社負担額（現在）",
                value: formatManYen(result.currentAbsorption),
                icon: TrendingUp,
                color: "text-red-500",
              },
              {
                label: "利益回復額",
                value: formatManYen(result.profitRecovery),
                icon: Zap,
                color: "text-green-600",
              },
              {
                label: "必要値上げ幅",
                value: `${result.requiredPriceIncrease.toFixed(2)}%`,
                icon: Target,
                color: "text-blue-600",
              },
              {
                label: "損益分岐転嫁率",
                value: `${result.breakEvenPassThrough.toFixed(1)}%`,
                icon: BarChart3,
                color: "text-amber-600",
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

          {/* Visual comparison bar */}
          <div className="bg-white rounded-2xl border border-border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              転嫁率の比較
            </h2>
            <div className="space-y-5">
              {[
                { label: "現在の転嫁率", pct: currentPct, color: "bg-red-500" },
                { label: "業界平均（49.7%）", pct: industryPct, color: "bg-amber-500" },
                { label: "目標転嫁率", pct: targetPct, color: "bg-green-500" },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${color}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-primary/5 rounded-xl">
              <p className="text-sm text-text-secondary">
                転嫁率を{currentPct}%から{targetPct}%に引き上げることで、年間
                <span className="font-bold text-primary">
                  {" "}{formatManYen(result.profitRecovery)}
                </span>
                の利益回復が見込めます。
              </p>
            </div>
          </div>

          {/* Strategies */}
          <div className="bg-white rounded-2xl border border-border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              推奨される転嫁戦略
            </h2>
            <div className="space-y-4">
              {result.strategies.map((strategy, i) => (
                <div
                  key={i}
                  className="p-4 bg-surface rounded-xl border border-border"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{i + 1}</span>
                      </div>
                      <h3 className="font-bold text-sm">{strategy.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_STYLES[strategy.difficulty]}`}
                      >
                        {DIFFICULTY_LABELS[strategy.difficulty]}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${IMPACT_STYLES[strategy.impact]}`}
                      >
                        {IMPACT_LABELS[strategy.impact]}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary ml-8">
                    {strategy.description}
                  </p>
                  <div className="ml-8 mt-2 flex items-center gap-1 text-xs text-text-secondary">
                    <Clock className="w-3 h-3" />
                    <span>{strategy.timeframe}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              実行タイムライン
            </h2>
            <div className="space-y-0">
              {result.timeline.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-primary rounded-full shrink-0 mt-1.5" />
                    {i < result.timeline.length - 1 && (
                      <div className="w-0.5 flex-1 bg-primary/20" />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className="text-sm">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white text-center">
            <h3 className="text-lg font-bold mb-2">
              価格転嫁の具体的な進め方を相談しませんか？
            </h3>
            <p className="text-white/80 text-sm mb-4">
              経営戦略コンサルタントAIが、御社に最適な転嫁戦略と交渉シナリオを作成します
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

  // Input form
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header onBack={() => window.history.back()} currentPage="経営診断ツール" breadcrumb={[{ label: "経営診断ツール", href: "/#features" }, { label: "価格転嫁シミュレーター" }]} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-4">
            <Calculator className="w-4 h-4" />
            価格転嫁シミュレーター
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            価格転嫁シミュレーション
          </h1>
          <p className="text-text-secondary text-sm">
            コスト上昇に対する適切な価格転嫁率を分析し、具体的な戦略を提案します
          </p>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">基本情報</h2>
            <button
              onClick={loadSample}
              className="text-xs text-primary hover:underline"
            >
              サンプルデータを入力
            </button>
          </div>
          <div className="space-y-4">
            <NumberInput
              label="年商（売上高）"
              value={currentRevenue}
              onChange={setCurrentRevenue}
              unit="円"
              placeholder="80000000"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberInput
                label="原材料費比率"
                value={materialCostRatio}
                onChange={setMaterialCostRatio}
                unit="%"
                placeholder="35"
              />
              <NumberInput
                label="人件費比率"
                value={laborCostRatio}
                onChange={setLaborCostRatio}
                unit="%"
                placeholder="30"
              />
            </div>
            <NumberInput
              label="コスト上昇率"
              value={costIncreaseRate}
              onChange={setCostIncreaseRate}
              unit="%"
              placeholder="8"
            />
          </div>
        </div>

        {/* Pass-through settings */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-6">
          <h2 className="font-bold mb-4">転嫁率設定</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberInput
                label="現在の転嫁率"
                value={currentPassThroughRate}
                onChange={setCurrentPassThroughRate}
                unit="%"
                placeholder="49.7"
              />
              <NumberInput
                label="目標転嫁率"
                value={targetPassThroughRate}
                onChange={setTargetPassThroughRate}
                unit="%"
                placeholder="80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                主な取引形態
              </label>
              <select
                value={mainCustomerType}
                onChange={(e) =>
                  setMainCustomerType(e.target.value as CustomerType)
                }
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="BtoB">BtoB（企業間取引）</option>
                <option value="BtoC">BtoC（消費者向け）</option>
                <option value="both">両方</option>
              </select>
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="bg-primary/5 rounded-xl p-4 mb-6 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-text-secondary">
            中小企業の価格転嫁率は平均49.7%（2024年9月時点）。コスト上昇分の約半分を自社で吸収している状況です。
          </p>
        </div>

        {/* Submit */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            <Calculator className="w-5 h-5" />
            シミュレーションを実行
          </button>
          <p className="text-xs text-text-secondary mt-2">
            入力されたデータはサーバーに保存されません
          </p>
        </div>
      </div>
    </div>
  );
}
