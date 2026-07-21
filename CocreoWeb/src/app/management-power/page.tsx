"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  User,
  Target,
  Users,
  TrendingUp,
} from "lucide-react";
import {
  scoreManagementPower,
  type ManagementPowerInput,
} from "@/lib/sme-challenges";
import type { ManagementPowerResult } from "@/lib/sme-challenges";

type ScaleValue = 1 | 2 | 3 | 4 | 5;

const SCALE_LABELS: Record<ScaleValue, string> = {
  1: "全くない",
  2: "少し",
  3: "ある程度",
  4: "かなり",
  5: "非常に高い",
};

const GRADE_COLORS: Record<string, string> = {
  S: "text-purple-600 bg-purple-50 border-purple-300",
  A: "text-blue-600 bg-blue-50 border-blue-300",
  B: "text-green-600 bg-green-50 border-green-300",
  C: "text-amber-600 bg-amber-50 border-amber-300",
  D: "text-red-600 bg-red-50 border-red-300",
};

const AXIS_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-violet-500"];
const AXIS_BG_COLORS = ["bg-blue-100", "bg-emerald-100", "bg-violet-100"];
const AXIS_ICONS = [User, Target, Users];

interface ScaleButtonGroupProps {
  value: ScaleValue | null;
  onChange: (v: ScaleValue) => void;
}

function ScaleButtonGroup({ value, onChange }: ScaleButtonGroupProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {([1, 2, 3, 4, 5] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            value === v
              ? "bg-primary text-white border-primary"
              : "bg-white text-text-secondary border-border hover:border-primary hover:text-primary"
          }`}
        >
          {v}: {SCALE_LABELS[v]}
        </button>
      ))}
    </div>
  );
}

interface BooleanButtonGroupProps {
  value: boolean | null;
  onChange: (v: boolean) => void;
}

function BooleanButtonGroup({ value, onChange }: BooleanButtonGroupProps) {
  return (
    <div className="flex gap-2 mt-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
          value === true
            ? "bg-primary text-white border-primary"
            : "bg-white text-text-secondary border-border hover:border-primary hover:text-primary"
        }`}
      >
        はい
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
          value === false
            ? "bg-primary text-white border-primary"
            : "bg-white text-text-secondary border-border hover:border-primary hover:text-primary"
        }`}
      >
        いいえ
      </button>
    </div>
  );
}

interface FormState {
  networkActivity: ScaleValue | null;
  learningHabit: ScaleValue | null;
  digitalLiteracy: ScaleValue | null;
  riskTolerance: ScaleValue | null;
  hasBusinessPlan: boolean | null;
  planExecutionRate: ScaleValue | null;
  pricingStrategy: ScaleValue | null;
  differentiationLevel: ScaleValue | null;
  investmentInDX: ScaleValue | null;
  missionSharing: ScaleValue | null;
  infoTransparency: ScaleValue | null;
  psychologicalSafety: ScaleValue | null;
  talentDevelopment: ScaleValue | null;
  wageCompetitiveness: ScaleValue | null;
}

const INITIAL_STATE: FormState = {
  networkActivity: null,
  learningHabit: null,
  digitalLiteracy: null,
  riskTolerance: null,
  hasBusinessPlan: null,
  planExecutionRate: null,
  pricingStrategy: null,
  differentiationLevel: null,
  investmentInDX: null,
  missionSharing: null,
  infoTransparency: null,
  psychologicalSafety: null,
  talentDevelopment: null,
  wageCompetitiveness: null,
};

const SECTION1_FIELDS: { key: keyof FormState; label: string; description: string }[] = [
  { key: "networkActivity", label: "異業種ネットワーク活動", description: "商工会議所・異業種交流会への参加頻度" },
  { key: "learningHabit", label: "学び直し・自己研鑽", description: "セミナー参加・書籍・オンライン学習の習慣" },
  { key: "digitalLiteracy", label: "デジタルリテラシー", description: "IT・デジタルツールの理解度と活用度" },
  { key: "riskTolerance", label: "挑戦・リスクテイク", description: "新規事業・新市場への挑戦意欲" },
];

const SECTION2_SCALE_FIELDS: { key: keyof FormState; label: string; description: string }[] = [
  { key: "planExecutionRate", label: "計画の実行度", description: "策定した計画をどの程度実行できているか" },
  { key: "pricingStrategy", label: "価格設定の戦略性", description: "コスト＋適正利益に基づく価格設定ができているか" },
  { key: "differentiationLevel", label: "差別化の度合い", description: "競合との明確な差別化ポイントがあるか" },
  { key: "investmentInDX", label: "DX投資の積極性", description: "デジタル化・IT投資への取り組み姿勢" },
];

const SECTION3_FIELDS: { key: keyof FormState; label: string; description: string }[] = [
  { key: "missionSharing", label: "経営理念の共有度", description: "社員が経営理念・ビジョンを理解しているか" },
  { key: "infoTransparency", label: "業績情報の共有度", description: "経営数値を社員と共有しているか" },
  { key: "psychologicalSafety", label: "心理的安全性", description: "社員が意見・提案を出しやすい環境か" },
  { key: "talentDevelopment", label: "人材育成の仕組み", description: "研修制度・キャリアパスが整備されているか" },
  { key: "wageCompetitiveness", label: "賃金の競争力", description: "同業他社・地域水準と比較した賃金水準" },
];

function isFormComplete(form: FormState): form is FormState & {
  networkActivity: ScaleValue;
  learningHabit: ScaleValue;
  digitalLiteracy: ScaleValue;
  riskTolerance: ScaleValue;
  hasBusinessPlan: boolean;
  planExecutionRate: ScaleValue;
  pricingStrategy: ScaleValue;
  differentiationLevel: ScaleValue;
  investmentInDX: ScaleValue;
  missionSharing: ScaleValue;
  infoTransparency: ScaleValue;
  psychologicalSafety: ScaleValue;
  talentDevelopment: ScaleValue;
  wageCompetitiveness: ScaleValue;
} {
  return Object.values(form).every((v) => v !== null);
}

export default function ManagementPowerPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [result, setResult] = useState<ManagementPowerResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!isFormComplete(form)) return;

    setAnalyzing(true);
    setResult(null);

    // Simulate analysis delay
    setTimeout(() => {
      const input: ManagementPowerInput = {
        networkActivity: form.networkActivity,
        learningHabit: form.learningHabit,
        digitalLiteracy: form.digitalLiteracy,
        riskTolerance: form.riskTolerance,
        hasBusinessPlan: form.hasBusinessPlan,
        planExecutionRate: form.planExecutionRate,
        pricingStrategy: form.pricingStrategy,
        differentiationLevel: form.differentiationLevel,
        investmentInDX: form.investmentInDX,
        missionSharing: form.missionSharing,
        infoTransparency: form.infoTransparency,
        psychologicalSafety: form.psychologicalSafety,
        talentDevelopment: form.talentDevelopment,
        wageCompetitiveness: form.wageCompetitiveness,
      };
      setResult(scoreManagementPower(input));
      setAnalyzing(false);
    }, 1500);
  }

  function handleReset() {
    setForm(INITIAL_STATE);
    setResult(null);
  }

  const allFilled = isFormComplete(form);

  return (
    <div className="min-h-screen bg-surface">
      <Header
        onBack={() => window.history.back()}
        currentPage="経営診断ツール"
        breadcrumb={[{ label: "経営診断ツール", href: "/#features" }, { label: "経営力スコア" }]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            <BarChart3 className="w-4 h-4" />
            中小企業白書2025準拠
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            経営力スコア診断
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            中小企業白書2025年版の「経営力」3軸フレームワークに基づき、
            貴社の経営力を多角的に診断します。
          </p>
        </div>

        {/* Analyzing Spinner */}
        {analyzing && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium text-text-primary">経営力を分析中...</p>
            <p className="text-sm text-text-secondary mt-1">3軸フレームワークで総合評価しています</p>
          </div>
        )}

        {/* Results */}
        {result && !analyzing && (
          <div className="space-y-8">
            {/* Grade & Total Score */}
            <div className="bg-white rounded-2xl border border-border p-8 text-center">
              <p className="text-sm text-text-secondary mb-2">総合グレード</p>
              <div
                className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl border-2 text-5xl font-black mb-4 ${GRADE_COLORS[result.grade]}`}
              >
                {result.grade}
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {result.totalScore}
                <span className="text-lg text-text-secondary font-normal">
                  {" "}/ {result.maxScore}点
                </span>
              </p>
            </div>

            {/* 3-Axis Bar Chart */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                3軸スコア
              </h2>
              <div className="space-y-6">
                {result.axes.map((axis, i) => {
                  const Icon = AXIS_ICONS[i];
                  return (
                    <div key={axis.name}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-text-secondary" />
                          <span className="font-medium text-text-primary">{axis.name}</span>
                        </div>
                        <span className="text-sm font-bold text-text-primary">
                          {axis.percentage}%
                          <span className="text-text-secondary font-normal ml-1">
                            ({axis.score}/{axis.maxScore})
                          </span>
                        </span>
                      </div>
                      <div className={`w-full h-4 rounded-full ${AXIS_BG_COLORS[i]}`}>
                        <div
                          className={`h-4 rounded-full transition-all duration-700 ${AXIS_COLORS[i]}`}
                          style={{ width: `${axis.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-Axis Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.axes.map((axis, i) => {
                const Icon = AXIS_ICONS[i];
                return (
                  <div key={axis.name} className="bg-white rounded-2xl border border-border p-5">
                    <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {axis.name}
                    </h3>
                    <ul className="space-y-3">
                      {axis.items.map((item) => (
                        <li key={item.name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-text-secondary">{item.name}</span>
                            <span className="font-medium text-text-primary">
                              {item.score}/{item.maxScore}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-gray-100">
                            <div
                              className={`h-2 rounded-full ${AXIS_COLORS[i]}`}
                              style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  強み
                </h2>
                <ul className="space-y-2">
                  {result.strengths.map((s) => (
                    <li
                      key={s}
                      className="flex items-start gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {result.improvements.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  改善ポイント
                </h2>
                <ul className="space-y-2">
                  {result.improvements.map((imp) => (
                    <li
                      key={imp}
                      className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-2.5"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Plan */}
            {result.actionPlan.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="text-lg font-bold text-text-primary mb-4">
                  アクションプラン
                </h2>
                <ol className="space-y-3">
                  {result.actionPlan.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm text-text-primary pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* CTA */}
            <div className="bg-primary/5 rounded-2xl border border-primary/20 p-8 text-center">
              <h2 className="text-xl font-bold text-text-primary mb-2">
                経営力をさらに高めたい方へ
              </h2>
              <p className="text-text-secondary mb-6">
                Cocreoの経営コンサルタントが、診断結果に基づいた具体的な改善策をご提案します。
              </p>
              <a
                href="/consulting"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
              >
                コンサルティングを相談する
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Reset */}
            <div className="text-center">
              <button
                onClick={handleReset}
                className="text-sm text-text-secondary underline hover:text-text-primary transition-colors"
              >
                もう一度診断する
              </button>
            </div>

            {/* Source */}
            <p className="text-xs text-text-secondary text-center">
              出典: 中小企業白書2025年版「経営力」分析フレームワーク
            </p>
          </div>
        )}

        {/* Form */}
        {!result && !analyzing && (
          <div className="space-y-8">
            {/* Section 1: 個人特性面 */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">個人特性面</h2>
                  <p className="text-sm text-text-secondary">経営者としての個人的資質・行動</p>
                </div>
              </div>
              <div className="space-y-6">
                {SECTION1_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-text-primary">
                      {field.label}
                    </label>
                    <p className="text-xs text-text-secondary mt-0.5">{field.description}</p>
                    <ScaleButtonGroup
                      value={form[field.key] as ScaleValue | null}
                      onChange={(v) => updateField(field.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: 戦略策定面 */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">戦略策定面</h2>
                  <p className="text-sm text-text-secondary">経営戦略の策定と実行力</p>
                </div>
              </div>
              <div className="space-y-6">
                {/* hasBusinessPlan: boolean field */}
                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    経営計画の有無
                  </label>
                  <p className="text-xs text-text-secondary mt-0.5">
                    文書化された経営計画（事業計画書）が存在するか
                  </p>
                  <BooleanButtonGroup
                    value={form.hasBusinessPlan}
                    onChange={(v) => updateField("hasBusinessPlan", v)}
                  />
                </div>
                {/* Scale fields */}
                {SECTION2_SCALE_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-text-primary">
                      {field.label}
                    </label>
                    <p className="text-xs text-text-secondary mt-0.5">{field.description}</p>
                    <ScaleButtonGroup
                      value={form[field.key] as ScaleValue | null}
                      onChange={(v) => updateField(field.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: 組織人材面 */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">組織人材面</h2>
                  <p className="text-sm text-text-secondary">組織体制と人材マネジメント</p>
                </div>
              </div>
              <div className="space-y-6">
                {SECTION3_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-text-primary">
                      {field.label}
                    </label>
                    <p className="text-xs text-text-secondary mt-0.5">{field.description}</p>
                    <ScaleButtonGroup
                      value={form[field.key] as ScaleValue | null}
                      onChange={(v) => updateField(field.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="text-center">
              <button
                onClick={handleSubmit}
                disabled={!allFilled}
                className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl text-lg font-bold transition-colors ${
                  allFilled
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                経営力を診断する
              </button>
              {!allFilled && (
                <p className="text-sm text-text-secondary mt-3">
                  すべての項目に回答してください
                </p>
              )}
            </div>

            {/* Source */}
            <p className="text-xs text-text-secondary text-center">
              出典: 中小企業白書2025年版「経営力」分析フレームワーク
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
