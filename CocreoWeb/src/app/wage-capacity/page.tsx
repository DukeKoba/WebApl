"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Wallet,
  PieChart,
} from "lucide-react";
import {
  diagnoseWageCapacity,
  WageCapacityInput,
  WageCapacityResult,
} from "@/lib/sme-challenges";

type Step = "input" | "analyzing" | "result";

function NumberInput({
  label,
  value,
  onChange,
  unit = "円",
  placeholder,
  icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {icon}
          </span>
        )}
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder || "0"}
          className={`w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
            icon ? "pl-10" : ""
          }`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">
          {unit}
        </span>
      </div>
    </div>
  );
}

function LaborShareGauge({ rate, status }: { rate: number; status: "healthy" | "warning" | "critical" }) {
  const colorMap = {
    healthy: { bar: "bg-green-500", text: "text-green-700", bg: "bg-green-50", label: "健全" },
    warning: { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", label: "注意" },
    critical: { bar: "bg-red-500", text: "text-red-700", bg: "bg-red-50", label: "危険" },
  };
  const colors = colorMap[status];
  const clampedRate = Math.min(rate, 100);

  return (
    <div className={`rounded-2xl p-6 ${colors.bg} border border-border`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">労働分配率</h3>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${colors.text} ${colors.bg} border ${
            status === "healthy"
              ? "border-green-200"
              : status === "warning"
              ? "border-amber-200"
              : "border-red-200"
          }`}
        >
          {colors.label}
        </span>
      </div>
      <div className="text-4xl font-bold mb-3">
        <span className={colors.text}>{rate}</span>
        <span className="text-lg text-text-secondary">%</span>
      </div>
      <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colors.bar} transition-all duration-1000`}
          style={{ width: `${clampedRate}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-text-secondary">
        <span>0%</span>
        <span className="text-green-600">60%</span>
        <span className="text-amber-600">75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function AffordabilityBadge({ level }: { level: "affordable" | "stretch" | "difficult" }) {
  const config = {
    affordable: {
      label: "賃上げ余力あり",
      icon: <CheckCircle2 className="w-5 h-5" />,
      cls: "bg-green-50 text-green-700 border-green-200",
    },
    stretch: {
      label: "工夫次第で可能",
      icon: <AlertTriangle className="w-5 h-5" />,
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    difficult: {
      label: "現状では困難",
      icon: <AlertTriangle className="w-5 h-5" />,
      cls: "bg-red-50 text-red-700 border-red-200",
    },
  };
  const c = config[level];

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm ${c.cls}`}>
      {c.icon}
      {c.label}
    </div>
  );
}

function FeasibilityBadge({ level }: { level: "high" | "medium" | "low" }) {
  const config = {
    high: { label: "実現性 高", cls: "bg-green-100 text-green-700" },
    medium: { label: "実現性 中", cls: "bg-amber-100 text-amber-700" },
    low: { label: "実現性 低", cls: "bg-red-100 text-red-700" },
  };
  const c = config[level];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.cls}`}>
      {c.label}
    </span>
  );
}

function formatYen(amount: number): string {
  if (Math.abs(amount) >= 100_000_000) {
    return `${(amount / 100_000_000).toFixed(1)}億円`;
  }
  if (Math.abs(amount) >= 10_000) {
    return `${Math.round(amount / 10_000)}万円`;
  }
  return `${amount.toLocaleString()}円`;
}

export default function WageCapacityPage() {
  const [step, setStep] = useState<Step>("input");
  const [result, setResult] = useState<WageCapacityResult | null>(null);

  const [input, setInput] = useState<WageCapacityInput>({
    annualRevenue: 0,
    operatingProfit: 0,
    totalLaborCost: 0,
    employeeCount: 0,
    currentAvgWage: 0,
    targetRaiseRate: 0,
    pricePassThroughPlan: 0,
    productivityGainPlan: 0,
  });

  const updateInput = <K extends keyof WageCapacityInput>(
    key: K,
    value: WageCapacityInput[K]
  ) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const loadSample = () => {
    setInput({
      annualRevenue: 80_000_000,
      operatingProfit: 4_000_000,
      totalLaborCost: 28_000_000,
      employeeCount: 15,
      currentAvgWage: 3_800_000,
      targetRaiseRate: 4.5,
      pricePassThroughPlan: 100,
      productivityGainPlan: 80,
    });
  };

  const handleSubmit = () => {
    setStep("analyzing");
    setTimeout(() => {
      const res = diagnoseWageCapacity(input);
      setResult(res);
      setStep("result");
    }, 2000);
  };

  const handleReset = () => {
    setStep("input");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-surface">
      <Header
        onBack={() => window.history.back()}
        currentPage="経営診断ツール"
        breadcrumb={[{ label: "経営診断ツール", href: "/#features" }, { label: "賃上げ余力診断" }]}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              賃上げ余力診断
            </h1>
          </div>
          <p className="text-text-secondary text-sm ml-13">
            自社の財務データから、賃上げの余力と最適な原資確保策をAIが診断します
          </p>
        </div>

        {/* Input step */}
        {step === "input" && (
          <div className="space-y-6">
            {/* Sample button */}
            <div className="flex justify-end">
              <button
                onClick={loadSample}
                className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                サンプルデータを読み込む
              </button>
            </div>

            {/* Revenue & Profit */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-text-primary">売上・利益情報</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NumberInput
                  label="年商（売上高）"
                  value={input.annualRevenue}
                  onChange={(v) => updateInput("annualRevenue", v)}
                  unit="円"
                  placeholder="80000000"
                  icon={<TrendingUp className="w-4 h-4" />}
                />
                <NumberInput
                  label="営業利益"
                  value={input.operatingProfit}
                  onChange={(v) => updateInput("operatingProfit", v)}
                  unit="円"
                  placeholder="4000000"
                  icon={<BarChart3 className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Labor info */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-text-primary">人件費・従業員情報</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NumberInput
                  label="人件費総額"
                  value={input.totalLaborCost}
                  onChange={(v) => updateInput("totalLaborCost", v)}
                  unit="円"
                  placeholder="28000000"
                />
                <NumberInput
                  label="従業員数"
                  value={input.employeeCount}
                  onChange={(v) => updateInput("employeeCount", v)}
                  unit="人"
                  placeholder="15"
                />
                <NumberInput
                  label="平均年収（1人あたり）"
                  value={input.currentAvgWage}
                  onChange={(v) => updateInput("currentAvgWage", v)}
                  unit="円"
                  placeholder="3800000"
                />
                <NumberInput
                  label="目標賃上げ率"
                  value={input.targetRaiseRate}
                  onChange={(v) => updateInput("targetRaiseRate", v)}
                  unit="%"
                  placeholder="4.5"
                />
              </div>
            </div>

            {/* Funding plans */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-text-primary">原資確保計画</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NumberInput
                  label="価格転嫁での吸収予定"
                  value={input.pricePassThroughPlan}
                  onChange={(v) => updateInput("pricePassThroughPlan", v)}
                  unit="万円"
                  placeholder="100"
                />
                <NumberInput
                  label="生産性向上での捻出予定"
                  value={input.productivityGainPlan}
                  onChange={(v) => updateInput("productivityGainPlan", v)}
                  unit="万円"
                  placeholder="80"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-primary text-white rounded-2xl font-semibold text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
            >
              診断を実行する
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Analyzing step */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-text-secondary text-sm font-medium">
              AIが賃上げ余力を分析しています...
            </p>
          </div>
        )}

        {/* Result step */}
        {step === "result" && result && (
          <div className="space-y-6">
            {/* Affordability badge */}
            <div className="flex items-center justify-between">
              <AffordabilityBadge level={result.affordability} />
              <button
                onClick={handleReset}
                className="text-sm text-text-secondary hover:text-primary transition-colors"
              >
                条件を変更する
              </button>
            </div>

            {/* Labor share gauge */}
            <LaborShareGauge
              rate={result.laborShareRate}
              status={result.laborShareStatus}
            />

            {/* Key metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-xs text-text-secondary">賃上げ総額</span>
                </div>
                <p className="text-xl font-bold text-text-primary">
                  {formatYen(result.totalRaiseCost)}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-xs text-text-secondary">賃上げ後営業利益</span>
                </div>
                <p
                  className={`text-xl font-bold ${
                    result.profitAfterRaise >= 0
                      ? "text-text-primary"
                      : "text-red-600"
                  }`}
                >
                  {formatYen(result.profitAfterRaise)}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-2">
                  <PieChart className="w-4 h-4 text-primary" />
                  <span className="text-xs text-text-secondary">
                    賃上げ後労働分配率
                  </span>
                </div>
                <p className="text-xl font-bold text-text-primary">
                  {result.laborShareAfterRaise}%
                </p>
              </div>
            </div>

            {/* Industry benchmark */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-text-primary">
                  中小企業業界ベンチマーク比較
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-text-secondary font-medium">
                        指標
                      </th>
                      <th className="text-right py-2 text-text-secondary font-medium">
                        自社
                      </th>
                      <th className="text-right py-2 text-text-secondary font-medium">
                        業界平均
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="py-3 text-text-primary">平均年収</td>
                      <td className="py-3 text-right font-medium text-text-primary">
                        {formatYen(input.currentAvgWage)}
                      </td>
                      <td className="py-3 text-right text-text-secondary">
                        {formatYen(result.industryBenchmark.avgWage)}
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 text-text-primary">賃上げ率</td>
                      <td className="py-3 text-right font-medium text-text-primary">
                        {input.targetRaiseRate}%
                      </td>
                      <td className="py-3 text-right text-text-secondary">
                        {result.industryBenchmark.avgRaiseRate}%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-text-primary">労働分配率</td>
                      <td className="py-3 text-right font-medium text-text-primary">
                        {result.laborShareRate}%
                      </td>
                      <td className="py-3 text-right text-text-secondary">
                        {result.industryBenchmark.laborShare}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Funding sources */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-text-primary">
                  賃上げ原資の確保手段
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-text-secondary font-medium">
                        手段
                      </th>
                      <th className="text-right py-2 text-text-secondary font-medium">
                        想定金額
                      </th>
                      <th className="text-right py-2 text-text-secondary font-medium">
                        実現性
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.fundingSources.map((fs, i) => (
                      <tr
                        key={i}
                        className={
                          i < result.fundingSources.length - 1
                            ? "border-b border-border"
                            : ""
                        }
                      >
                        <td className="py-3 text-text-primary">{fs.source}</td>
                        <td className="py-3 text-right font-medium text-text-primary">
                          {formatYen(fs.amount)}
                        </td>
                        <td className="py-3 text-right">
                          <FeasibilityBadge level={fs.feasibility} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-text-primary">
                  AIからの提言
                </h3>
              </div>
              <ul className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm text-text-primary leading-relaxed">
                      {rec}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <a
              href="/consulting"
              className="block w-full py-4 bg-primary text-white rounded-2xl font-semibold text-sm text-center hover:bg-primary-dark transition-colors"
            >
              <span className="flex items-center justify-center gap-2">
                賃上げ戦略をAIコンサルタントに相談する
                <ArrowRight className="w-4 h-4" />
              </span>
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
