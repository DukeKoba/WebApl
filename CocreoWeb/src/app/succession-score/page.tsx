"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {
  scoreSuccession,
  type SuccessionInput,
  type SuccessionResult,
} from "@/lib/sme-challenges";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  ShieldAlert,
  Users,
  Lightbulb,
  BadgeCheck,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const URGENCY_STYLES: Record<
  SuccessionResult["urgencyLevel"],
  { bg: string; text: string; label: string }
> = {
  critical: { bg: "bg-red-100", text: "text-red-700", label: "非常に緊急" },
  high: { bg: "bg-orange-100", text: "text-orange-700", label: "緊急度：高" },
  medium: { bg: "bg-amber-100", text: "text-amber-700", label: "緊急度：中" },
  low: { bg: "bg-green-100", text: "text-green-700", label: "緊急度：低" },
};

const STATUS_COLORS: Record<string, string> = {
  good: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  good: "良好",
  warning: "注意",
  danger: "要改善",
};

function NumberInput({
  label,
  value,
  onChange,
  unit,
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
          className="w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="flex items-center gap-1 text-sm"
      >
        {value ? (
          <ToggleRight className="w-8 h-8 text-primary" />
        ) : (
          <ToggleLeft className="w-8 h-8 text-text-secondary" />
        )}
        <span className={value ? "text-primary font-medium" : "text-text-secondary"}>
          {value ? "あり" : "なし"}
        </span>
      </button>
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
      </div>
    </div>
  );
}

export default function SuccessionScorePage() {
  const [step, setStep] = useState<"input" | "analyzing" | "result">("input");
  const [result, setResult] = useState<SuccessionResult | null>(null);

  const [form, setForm] = useState<SuccessionInput>({
    ownerAge: 60,
    hasSuccessor: false,
    successorType: undefined,
    yearsToPlannedRetirement: 5,
    hasWrittenPlan: false,
    hasStartedTransition: false,
    keyPersonDependency: "high",
    financialHealth: "fair",
    employeeCount: 10,
    hasIntellectualProperty: false,
    businessValuationDone: false,
  });

  const updateForm = <K extends keyof SuccessionInput>(
    key: K,
    value: SuccessionInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    setStep("analyzing");
    setTimeout(() => {
      const scored = scoreSuccession(form);
      setResult(scored);
      setStep("result");
    }, 2000);
  };

  const handleBack = () => {
    if (step === "result") {
      setStep("input");
      setResult(null);
    } else {
      window.history.back();
    }
  };

  const scoreColor = (score: number, max: number) => {
    const pct = score / max;
    if (pct >= 0.7) return "bg-green-500";
    if (pct >= 0.4) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header
        onBack={handleBack}
        currentPage="経営診断ツール"
        breadcrumb={[{ label: "経営診断ツール", href: "/#features" }, { label: "事業承継スコアリング" }]}
      />

      {/* Input Form */}
      {step === "input" && (
        <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              事業承継スコアリング
            </h1>
            <p className="text-sm text-text-secondary">
              現在の事業承継準備状況を診断し、リスクと推奨アクションを可視化します。中小企業白書2025のデータに基づく分析です。
            </p>
          </div>

          <div className="space-y-6">
            {/* 経営者情報 */}
            <section className="bg-white border border-border rounded-2xl p-5 space-y-4">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                経営者情報
              </h2>
              <NumberInput
                label="経営者の年齢"
                value={form.ownerAge}
                onChange={(v) => updateForm("ownerAge", v)}
                unit="歳"
                placeholder="60"
              />
              <NumberInput
                label="引退予定までの年数"
                value={form.yearsToPlannedRetirement}
                onChange={(v) => updateForm("yearsToPlannedRetirement", v)}
                unit="年"
                placeholder="5"
              />
              <NumberInput
                label="従業員数"
                value={form.employeeCount}
                onChange={(v) => updateForm("employeeCount", v)}
                unit="人"
                placeholder="10"
              />
            </section>

            {/* 後継者 */}
            <section className="bg-white border border-border rounded-2xl p-5 space-y-4">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-primary" />
                後継者について
              </h2>
              <Toggle
                label="後継者の有無"
                value={form.hasSuccessor}
                onChange={(v) => {
                  updateForm("hasSuccessor", v);
                  if (!v) updateForm("successorType", undefined);
                  else updateForm("successorType", "family");
                }}
              />
              {form.hasSuccessor && (
                <SelectInput
                  label="後継者のタイプ"
                  value={form.successorType || "family"}
                  onChange={(v) =>
                    updateForm(
                      "successorType",
                      v as SuccessionInput["successorType"]
                    )
                  }
                  options={[
                    { value: "family", label: "親族" },
                    { value: "employee", label: "従業員" },
                    { value: "external", label: "外部（M&A含む）" },
                    { value: "undecided", label: "未定" },
                  ]}
                />
              )}
              <Toggle
                label="引き継ぎ開始済み"
                value={form.hasStartedTransition}
                onChange={(v) => updateForm("hasStartedTransition", v)}
              />
            </section>

            {/* 計画・準備 */}
            <section className="bg-white border border-border rounded-2xl p-5 space-y-4">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                計画・準備状況
              </h2>
              <Toggle
                label="事業承継計画書の有無"
                value={form.hasWrittenPlan}
                onChange={(v) => updateForm("hasWrittenPlan", v)}
              />
              <Toggle
                label="企業価値評価の実施有無"
                value={form.businessValuationDone}
                onChange={(v) => updateForm("businessValuationDone", v)}
              />
              <Toggle
                label="知的財産・特許の有無"
                value={form.hasIntellectualProperty}
                onChange={(v) => updateForm("hasIntellectualProperty", v)}
              />
            </section>

            {/* 組織・財務 */}
            <section className="bg-white border border-border rounded-2xl p-5 space-y-4">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" />
                組織体制・財務
              </h2>
              <SelectInput
                label="経営者依存度"
                value={form.keyPersonDependency}
                onChange={(v) =>
                  updateForm(
                    "keyPersonDependency",
                    v as SuccessionInput["keyPersonDependency"]
                  )
                }
                options={[
                  { value: "high", label: "高い（経営者なしでは事業継続困難）" },
                  { value: "medium", label: "中程度（一部業務は属人化）" },
                  { value: "low", label: "低い（組織として自律的に運営可能）" },
                ]}
              />
              <SelectInput
                label="財務状況"
                value={form.financialHealth}
                onChange={(v) =>
                  updateForm(
                    "financialHealth",
                    v as SuccessionInput["financialHealth"]
                  )
                }
                options={[
                  { value: "good", label: "良好（安定した利益を確保）" },
                  { value: "fair", label: "普通（収支はほぼ均衡）" },
                  { value: "poor", label: "厳しい（赤字または債務超過）" },
                ]}
              />
            </section>

            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-primary text-white font-bold rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              診断を実行する
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </main>
      )}

      {/* Analyzing Spinner */}
      {step === "analyzing" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-primary animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              事業承継スコアを分析中...
            </h2>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              入力された情報をもとに、承継準備の進捗度・リスク・推奨アクションを算出しています
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      {step === "result" && result && (
        <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full space-y-6">
          {/* Total Score */}
          <section className="bg-white border border-border rounded-2xl p-6 text-center">
            <h2 className="text-sm font-medium text-text-secondary mb-3">
              事業承継スコア
            </h2>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-6xl font-extrabold text-text-primary">
                {result.totalScore}
              </div>
              <div className="text-2xl text-text-secondary font-medium">
                / {result.maxScore}
              </div>
            </div>
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${URGENCY_STYLES[result.urgencyLevel].bg} ${URGENCY_STYLES[result.urgencyLevel].text}`}
            >
              {URGENCY_STYLES[result.urgencyLevel].label}
            </span>
          </section>

          {/* Category Breakdown */}
          <section className="bg-white border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-bold text-text-primary">
              カテゴリ別スコア
            </h2>
            {result.categories.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-text-primary">
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary">
                      {cat.score} / {cat.maxScore}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${STATUS_COLORS[cat.status]}`}
                    >
                      {STATUS_LABELS[cat.status]}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${scoreColor(cat.score, cat.maxScore)}`}
                    style={{
                      width: `${(cat.score / cat.maxScore) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-text-secondary">{cat.details}</p>
              </div>
            ))}
          </section>

          {/* Estimated Timeline */}
          <section className="bg-white border border-border rounded-2xl p-5">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-primary" />
              想定タイムライン
            </h2>
            <p className="text-sm text-text-secondary">
              現在の準備状況から、事業承継完了までに
              <span className="font-bold text-text-primary mx-1">
                約{result.estimatedTimelineMonths}ヶ月
              </span>
              （約{Math.round(result.estimatedTimelineMonths / 12 * 10) / 10}年）
              が必要と見込まれます。
            </p>
          </section>

          {/* Risks */}
          {result.risks.length > 0 && (
            <section className="bg-white border border-border rounded-2xl p-5 space-y-3">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                リスク
              </h2>
              <ul className="space-y-2">
                {result.risks.map((risk, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-text-secondary"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <section className="bg-white border border-border rounded-2xl p-5 space-y-3">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                推奨アクション
              </h2>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-text-secondary"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Support Programs */}
          <section className="bg-white border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-primary" />
              活用可能な支援制度
            </h2>
            <ul className="space-y-2">
              {result.supportPrograms.map((prog, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-text-secondary"
                >
                  <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {prog}
                </li>
              ))}
            </ul>
          </section>

          {/* CTA */}
          <Link
            href="/consulting"
            className="block w-full py-3 bg-primary text-white font-bold rounded-2xl hover:opacity-90 transition-opacity text-center"
          >
            専門家に相談する
          </Link>

          <button
            onClick={() => {
              setStep("input");
              setResult(null);
            }}
            className="w-full py-3 border border-border text-text-secondary font-medium rounded-2xl hover:bg-gray-50 transition-colors text-center"
          >
            もう一度診断する
          </button>
        </main>
      )}
    </div>
  );
}
