"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { personas, Persona } from "@/lib/personas";
import {
  simulatePricePassThrough,
  diagnoseWageCapacity,
  scoreSuccession,
  scoreManagementPower,
  PricePassThroughResult,
  WageCapacityResult,
  SuccessionResult,
  ManagementPowerResult,
} from "@/lib/sme-challenges";
import {
  generateFinancialAnalysis,
  FinancialAnalysisResult,
} from "@/lib/financial-analysis";
import {
  Users,
  TrendingUp,
  Building2,
  BarChart3,
  Shield,
  Brain,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Play,
} from "lucide-react";

// 全診断結果の型
interface ScenarioResult {
  persona: Persona;
  wageCapacity: WageCapacityResult;
  pricePassThrough: PricePassThroughResult;
  financial: FinancialAnalysisResult;
  succession: SuccessionResult;
  managementPower: ManagementPowerResult;
}

// ステータスバッジ
function StatusBadge({
  status,
  label,
}: {
  status: "good" | "warning" | "danger" | "critical";
  label: string;
}) {
  const colors = {
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    critical: "bg-red-100 text-red-800 border-red-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status]}`}
    >
      {label}
    </span>
  );
}

// スコアバー
function ScoreBar({
  score,
  max,
  color,
}: {
  score: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((score / max) * 100, 100);
  return (
    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

// 個別診断結果カード
function DiagnosisCard({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-sm">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && <div className="px-4 pb-4 border-t border-border pt-3">{children}</div>}
    </div>
  );
}

// ペルソナ選択カード
function PersonaCard({
  persona,
  selected,
  onClick,
}: {
  persona: Persona;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? "border-primary bg-blue-50 shadow-md"
          : "border-border bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{persona.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm">{persona.companyName}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: persona.color + "15",
                color: persona.color,
              }}
            >
              {persona.industry}
            </span>
          </div>
          <p className="text-xs text-text-secondary mb-2">
            {persona.name} ({persona.prefecture}) / 従業員{persona.employeeCount}
            名 / 年商{persona.annualRevenue}
          </p>
          <p className="text-xs text-text-secondary line-clamp-2">
            {persona.description}
          </p>
        </div>
      </div>
    </button>
  );
}

// メインページ
export default function ScenarioTestPage() {
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedPersona, setExpandedPersona] = useState<string | null>(null);

  const togglePersona = (id: string) => {
    setSelectedPersonas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedPersonas.length === personas.length) {
      setSelectedPersonas([]);
    } else {
      setSelectedPersonas(personas.map((p) => p.id));
    }
  };

  const runAnalysis = () => {
    setAnalyzing(true);
    setResults([]);

    setTimeout(() => {
      const newResults: ScenarioResult[] = selectedPersonas.map((id) => {
        const persona = personas.find((p) => p.id === id)!;
        return {
          persona,
          wageCapacity: diagnoseWageCapacity(persona.wageCapacity),
          pricePassThrough: simulatePricePassThrough(persona.pricePassThrough),
          financial: generateFinancialAnalysis(
            persona.financial.pl,
            persona.financial.bs,
            persona.industryKey
          ),
          succession: scoreSuccession(persona.succession),
          managementPower: scoreManagementPower(persona.managementPower),
        };
      });
      setResults(newResults);
      setAnalyzing(false);
      if (newResults.length > 0) {
        setExpandedPersona(newResults[0].persona.id);
      }
    }, 2000);
  };

  const getOverallHealth = (r: ScenarioResult) => {
    let score = 0;
    let total = 0;

    // 労働分配率
    if (r.wageCapacity.laborShareStatus === "healthy") score += 2;
    else if (r.wageCapacity.laborShareStatus === "warning") score += 1;
    total += 2;

    // 賃上げ余力
    if (r.wageCapacity.affordability === "affordable") score += 2;
    else if (r.wageCapacity.affordability === "stretch") score += 1;
    total += 2;

    // 財務（弱みの数で判定）
    if (r.financial.weaknesses.length === 0) score += 2;
    else if (r.financial.weaknesses.length <= 2) score += 1;
    total += 2;

    // 承継
    if (r.succession.urgencyLevel === "low") score += 2;
    else if (r.succession.urgencyLevel === "medium") score += 1;
    total += 2;

    // 経営力
    const mgPct = (r.managementPower.totalScore / r.managementPower.maxScore) * 100;
    if (mgPct >= 70) score += 2;
    else if (mgPct >= 40) score += 1;
    total += 2;

    const pct = (score / total) * 100;
    if (pct >= 70) return { status: "good" as const, label: "良好" };
    if (pct >= 40) return { status: "warning" as const, label: "要改善" };
    return { status: "danger" as const, label: "要対策" };
  };

  return (
    <div className="min-h-screen bg-surface">
      <Header
        currentPage="シナリオ検証"
        breadcrumb={[
          { label: "ホーム", href: "/" },
          { label: "シナリオ検証" },
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* タイトル */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            業種別シナリオ検証
          </h1>
          <p className="text-sm text-text-secondary">
            5業種の経営者ペルソナを使って、全診断ツール（賃上げ余力・価格転嫁・PL/BS分析・事業承継・経営力スコア）を一括実行し、業種ごとの課題と改善策を比較検証します。
          </p>
        </div>

        {/* ペルソナ選択 */}
        {results.length === 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">
                検証するペルソナを選択
              </h2>
              <button
                onClick={selectAll}
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                {selectedPersonas.length === personas.length
                  ? "全解除"
                  : "全選択"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personas.map((p) => (
                <PersonaCard
                  key={p.id}
                  persona={p}
                  selected={selectedPersonas.includes(p.id)}
                  onClick={() => togglePersona(p.id)}
                />
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={runAnalysis}
                disabled={selectedPersonas.length === 0 || analyzing}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {analyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    {selectedPersonas.length}件のペルソナで一括診断
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* 分析中 */}
        {analyzing && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-lg font-semibold text-text-primary mb-2">
              全診断ツールを実行中...
            </p>
            <p className="text-sm text-text-secondary">
              {selectedPersonas.length}件のペルソナ x 5つの診断ツール ={" "}
              {selectedPersonas.length * 5}件の分析を実行しています
            </p>
          </div>
        )}

        {/* 結果 */}
        {results.length > 0 && !analyzing && (
          <>
            {/* サマリーテーブル */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">
                  総合サマリー
                </h2>
                <button
                  onClick={() => {
                    setResults([]);
                    setExpandedPersona(null);
                  }}
                  className="text-sm text-primary hover:text-primary-dark font-medium"
                >
                  ペルソナ選択に戻る
                </button>
              </div>
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-border">
                        <th className="text-left px-4 py-3 font-semibold text-text-secondary">
                          企業
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-text-secondary">
                          総合
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-text-secondary">
                          賃上げ余力
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-text-secondary">
                          価格転嫁
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-text-secondary">
                          財務健全性
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-text-secondary">
                          事業承継
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-text-secondary">
                          経営力
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => {
                        const overall = getOverallHealth(r);
                        const mgGrade = r.managementPower.grade;
                        return (
                          <tr
                            key={r.persona.id}
                            className="border-b border-border last:border-b-0 hover:bg-gray-50 cursor-pointer"
                            onClick={() =>
                              setExpandedPersona(
                                expandedPersona === r.persona.id
                                  ? null
                                  : r.persona.id
                              )
                            }
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span>{r.persona.icon}</span>
                                <div>
                                  <div className="font-medium text-text-primary">
                                    {r.persona.companyName}
                                  </div>
                                  <div className="text-xs text-text-secondary">
                                    {r.persona.industry}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="text-center px-3 py-3">
                              <StatusBadge
                                status={overall.status}
                                label={overall.label}
                              />
                            </td>
                            <td className="text-center px-3 py-3">
                              <StatusBadge
                                status={
                                  r.wageCapacity.affordability === "affordable"
                                    ? "good"
                                    : r.wageCapacity.affordability === "stretch"
                                    ? "warning"
                                    : "danger"
                                }
                                label={
                                  r.wageCapacity.affordability === "affordable"
                                    ? "余力あり"
                                    : r.wageCapacity.affordability === "stretch"
                                    ? "要工夫"
                                    : "困難"
                                }
                              />
                            </td>
                            <td className="text-center px-3 py-3">
                              <span className="text-sm font-medium">
                                {r.pricePassThrough.requiredPriceIncrease.toFixed(
                                  1
                                )}
                                %
                              </span>
                            </td>
                            <td className="text-center px-3 py-3">
                              <StatusBadge
                                status={
                                  r.financial.weaknesses.length === 0
                                    ? "good"
                                    : r.financial.weaknesses.length <= 2
                                    ? "warning"
                                    : "danger"
                                }
                                label={`弱み${r.financial.weaknesses.length}件`}
                              />
                            </td>
                            <td className="text-center px-3 py-3">
                              <StatusBadge
                                status={
                                  r.succession.urgencyLevel === "low"
                                    ? "good"
                                    : r.succession.urgencyLevel === "medium"
                                    ? "warning"
                                    : r.succession.urgencyLevel === "high"
                                    ? "danger"
                                    : "critical"
                                }
                                label={
                                  r.succession.urgencyLevel === "low"
                                    ? "低リスク"
                                    : r.succession.urgencyLevel === "medium"
                                    ? "中リスク"
                                    : r.succession.urgencyLevel === "high"
                                    ? "高リスク"
                                    : "緊急"
                                }
                              />
                            </td>
                            <td className="text-center px-3 py-3">
                              <span
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                  mgGrade === "S" || mgGrade === "A"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : mgGrade === "B"
                                    ? "bg-blue-100 text-blue-700"
                                    : mgGrade === "C"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {mgGrade}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 詳細結果 */}
            {results.map((r) => (
              <section
                key={r.persona.id}
                className={`mb-6 ${
                  expandedPersona === r.persona.id ? "" : "hidden"
                }`}
              >
                <div className="bg-white rounded-xl border border-border p-5 mb-4">
                  <div className="flex items-start gap-4 mb-4">
                    <span className="text-3xl">{r.persona.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-text-primary">
                        {r.persona.companyName} - {r.persona.name}
                      </h3>
                      <p className="text-sm text-text-secondary mt-1">
                        {r.persona.industry} / {r.persona.prefecture} /
                        従業員{r.persona.employeeCount}名 / 年商
                        {r.persona.annualRevenue}
                      </p>
                      <p className="text-sm text-text-secondary mt-2">
                        {r.persona.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {r.persona.challenges.map((c, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* 賃上げ余力 */}
                  <DiagnosisCard
                    title="賃上げ余力診断"
                    icon={
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    }
                    defaultOpen
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-text-secondary">
                          労働分配率
                        </p>
                        <p className="text-lg font-bold">
                          {r.wageCapacity.laborShareRate.toFixed(1)}%
                        </p>
                        <StatusBadge
                          status={
                            r.wageCapacity.laborShareStatus === "healthy"
                              ? "good"
                              : r.wageCapacity.laborShareStatus === "warning"
                              ? "warning"
                              : "danger"
                          }
                          label={
                            r.wageCapacity.laborShareStatus === "healthy"
                              ? "健全"
                              : r.wageCapacity.laborShareStatus === "warning"
                              ? "注意"
                              : "危険"
                          }
                        />
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">
                          賃上げ総額
                        </p>
                        <p className="text-lg font-bold">
                          {(r.wageCapacity.totalRaiseCost / 10000).toFixed(0)}
                          万円
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">
                          賃上げ後利益
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            r.wageCapacity.profitAfterRaise < 0
                              ? "text-red-600"
                              : ""
                          }`}
                        >
                          {(r.wageCapacity.profitAfterRaise / 10000).toFixed(0)}
                          万円
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">判定</p>
                        <StatusBadge
                          status={
                            r.wageCapacity.affordability === "affordable"
                              ? "good"
                              : r.wageCapacity.affordability === "stretch"
                              ? "warning"
                              : "danger"
                          }
                          label={
                            r.wageCapacity.affordability === "affordable"
                              ? "余力あり"
                              : r.wageCapacity.affordability === "stretch"
                              ? "工夫次第"
                              : "実施困難"
                          }
                        />
                      </div>
                    </div>
                    {r.wageCapacity.recommendations.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-text-secondary mb-2">
                          主な提案
                        </p>
                        <ul className="space-y-1">
                          {r.wageCapacity.recommendations
                            .slice(0, 3)
                            .map((rec, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-xs text-text-secondary"
                              >
                                <ArrowRight className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </DiagnosisCard>

                  {/* 価格転嫁 */}
                  <DiagnosisCard
                    title="価格転嫁シミュレーション"
                    icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-text-secondary">
                          自社負担額
                        </p>
                        <p className="text-lg font-bold">
                          {(
                            r.pricePassThrough.currentAbsorption / 10000
                          ).toFixed(0)}
                          万円
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">
                          利益回復額
                        </p>
                        <p className="text-lg font-bold text-emerald-600">
                          {(
                            r.pricePassThrough.profitRecovery / 10000
                          ).toFixed(0)}
                          万円
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">
                          必要値上げ幅
                        </p>
                        <p className="text-lg font-bold">
                          {r.pricePassThrough.requiredPriceIncrease.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">
                          損益分岐転嫁率
                        </p>
                        <p className="text-lg font-bold">
                          {r.pricePassThrough.breakEvenPassThrough.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    {r.pricePassThrough.strategies.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-text-secondary mb-2">
                          推奨戦略
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {r.pricePassThrough.strategies
                            .slice(0, 4)
                            .map((s, i) => (
                              <div
                                key={i}
                                className="p-2 bg-gray-50 rounded-lg"
                              >
                                <p className="text-xs font-medium">
                                  {s.title}
                                </p>
                                <div className="flex gap-2 mt-1">
                                  <span className="text-[10px] text-text-secondary">
                                    難易度:{s.difficulty}
                                  </span>
                                  <span className="text-[10px] text-text-secondary">
                                    効果:{s.impact}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </DiagnosisCard>

                  {/* PL/BS分析 */}
                  <DiagnosisCard
                    title="PL/BS財務分析"
                    icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
                  >
                    <div className="mb-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-[10px] text-text-secondary">
                            売上総利益率
                          </p>
                          <p className="text-sm font-bold">
                            {r.financial.pl.grossProfit && r.financial.pl.revenue
                              ? (
                                  (r.financial.pl.grossProfit /
                                    r.financial.pl.revenue) *
                                  100
                                ).toFixed(1)
                              : "-"}
                            %
                          </p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-[10px] text-text-secondary">
                            営業利益率
                          </p>
                          <p className="text-sm font-bold">
                            {r.financial.pl.operatingProfit != null &&
                            r.financial.pl.revenue
                              ? (
                                  (r.financial.pl.operatingProfit /
                                    r.financial.pl.revenue) *
                                  100
                                ).toFixed(1)
                              : "-"}
                            %
                          </p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-[10px] text-text-secondary">
                            強み
                          </p>
                          <p className="text-sm font-bold text-emerald-600">
                            {r.financial.strengths.length}件
                          </p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-[10px] text-text-secondary">
                            弱み
                          </p>
                          <p className="text-sm font-bold text-red-600">
                            {r.financial.weaknesses.length}件
                          </p>
                        </div>
                      </div>
                      {r.financial.weaknessDetails.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-text-secondary mb-2">
                            主な弱みと改善案
                          </p>
                          {r.financial.weaknessDetails
                            .slice(0, 2)
                            .map((wd, i) => (
                              <div key={i} className="mb-2 p-2 bg-red-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                  <span className="text-xs font-medium text-red-700">
                                    {wd.weakness}
                                  </span>
                                  <StatusBadge
                                    status={
                                      wd.severity === "high"
                                        ? "danger"
                                        : wd.severity === "medium"
                                        ? "warning"
                                        : "good"
                                    }
                                    label={wd.severity}
                                  />
                                </div>
                                {wd.improvements.slice(0, 2).map((imp, j) => (
                                  <p
                                    key={j}
                                    className="text-[10px] text-text-secondary ml-5"
                                  >
                                    {imp.action}（{imp.timeframe}）
                                  </p>
                                ))}
                              </div>
                            ))}
                        </div>
                      )}
                      {r.financial.cashFlowWarning && (
                        <div className="p-2 bg-amber-50 rounded-lg flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5" />
                          <p className="text-xs text-amber-700">
                            {r.financial.cashFlowWarning}
                          </p>
                        </div>
                      )}
                    </div>
                  </DiagnosisCard>

                  {/* 事業承継 */}
                  <DiagnosisCard
                    title="事業承継スコアリング"
                    icon={<Shield className="w-5 h-5 text-orange-600" />}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-text-secondary">
                          総合スコア
                        </p>
                        <p className="text-lg font-bold">
                          {r.succession.totalScore}/{r.succession.maxScore}
                        </p>
                        <ScoreBar
                          score={r.succession.totalScore}
                          max={r.succession.maxScore}
                          color={
                            r.succession.urgencyLevel === "low"
                              ? "#10b981"
                              : r.succession.urgencyLevel === "medium"
                              ? "#f59e0b"
                              : "#ef4444"
                          }
                        />
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">
                          緊急度
                        </p>
                        <StatusBadge
                          status={
                            r.succession.urgencyLevel === "low"
                              ? "good"
                              : r.succession.urgencyLevel === "medium"
                              ? "warning"
                              : r.succession.urgencyLevel === "high"
                              ? "danger"
                              : "critical"
                          }
                          label={
                            r.succession.urgencyLevel === "low"
                              ? "低"
                              : r.succession.urgencyLevel === "medium"
                              ? "中"
                              : r.succession.urgencyLevel === "high"
                              ? "高"
                              : "緊急"
                          }
                        />
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">
                          推定期間
                        </p>
                        <p className="text-lg font-bold">
                          {r.succession.estimatedTimelineMonths}ヶ月
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">
                          リスク
                        </p>
                        <p className="text-lg font-bold text-red-600">
                          {r.succession.risks.length}件
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      {r.succession.categories.map((cat, i) => (
                        <div key={i} className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-[10px] text-text-secondary">
                            {cat.name}
                          </p>
                          <p className="text-sm font-bold">
                            {cat.score}/{cat.maxScore}
                          </p>
                          <ScoreBar
                            score={cat.score}
                            max={cat.maxScore}
                            color={
                              cat.status === "good"
                                ? "#10b981"
                                : cat.status === "warning"
                                ? "#f59e0b"
                                : "#ef4444"
                            }
                          />
                        </div>
                      ))}
                    </div>
                    {r.succession.recommendations.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-text-secondary mb-2">
                          推奨アクション
                        </p>
                        <ul className="space-y-1">
                          {r.succession.recommendations.slice(0, 3).map((rec, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-text-secondary"
                            >
                              <CheckCircle2 className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </DiagnosisCard>

                  {/* 経営力スコア */}
                  <DiagnosisCard
                    title="経営力スコア"
                    icon={<Brain className="w-5 h-5 text-indigo-600" />}
                  >
                    <div className="flex items-center gap-6 mb-4">
                      <div className="text-center">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                            r.managementPower.grade === "S" ||
                            r.managementPower.grade === "A"
                              ? "bg-emerald-100 text-emerald-700"
                              : r.managementPower.grade === "B"
                              ? "bg-blue-100 text-blue-700"
                              : r.managementPower.grade === "C"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {r.managementPower.grade}
                        </div>
                        <p className="text-xs text-text-secondary mt-1">
                          {r.managementPower.totalScore}/{r.managementPower.maxScore}点
                        </p>
                      </div>
                      <div className="flex-1 space-y-2">
                        {r.managementPower.axes.map((axis, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-text-secondary">
                                {axis.name}
                              </span>
                              <span className="font-medium">
                                {axis.score}/{axis.maxScore} (
                                {axis.percentage.toFixed(0)}%)
                              </span>
                            </div>
                            <ScoreBar
                              score={axis.score}
                              max={axis.maxScore}
                              color={
                                axis.percentage >= 70
                                  ? "#10b981"
                                  : axis.percentage >= 40
                                  ? "#3b82f6"
                                  : "#ef4444"
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {r.managementPower.actionPlan.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-text-secondary mb-2">
                          改善アクションプラン
                        </p>
                        <ul className="space-y-1">
                          {r.managementPower.actionPlan.slice(0, 3).map((a, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-text-secondary"
                            >
                              <ArrowRight className="w-3 h-3 mt-0.5 text-indigo-500 flex-shrink-0" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </DiagnosisCard>
                </div>
              </section>
            ))}

            {/* 業種間比較 */}
            {results.length >= 2 && (
              <section className="mt-8">
                <h2 className="text-lg font-bold text-text-primary mb-4">
                  業種間比較分析
                </h2>
                <div className="bg-white rounded-xl border border-border p-5">
                  <div className="space-y-4">
                    {/* 労働分配率比較 */}
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary mb-2">
                        労働分配率
                      </h3>
                      {results.map((r) => (
                        <div
                          key={r.persona.id}
                          className="flex items-center gap-3 mb-2"
                        >
                          <span className="text-sm w-28 truncate">
                            {r.persona.icon} {r.persona.companyName}
                          </span>
                          <div className="flex-1">
                            <ScoreBar
                              score={r.wageCapacity.laborShareRate}
                              max={100}
                              color={
                                r.wageCapacity.laborShareStatus === "healthy"
                                  ? "#10b981"
                                  : r.wageCapacity.laborShareStatus === "warning"
                                  ? "#f59e0b"
                                  : "#ef4444"
                              }
                            />
                          </div>
                          <span className="text-xs font-medium w-14 text-right">
                            {r.wageCapacity.laborShareRate.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 経営力スコア比較 */}
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary mb-2">
                        経営力スコア
                      </h3>
                      {results.map((r) => {
                        const pct =
                          (r.managementPower.totalScore /
                            r.managementPower.maxScore) *
                          100;
                        return (
                          <div
                            key={r.persona.id}
                            className="flex items-center gap-3 mb-2"
                          >
                            <span className="text-sm w-28 truncate">
                              {r.persona.icon} {r.persona.companyName}
                            </span>
                            <div className="flex-1">
                              <ScoreBar
                                score={pct}
                                max={100}
                                color={
                                  pct >= 70
                                    ? "#10b981"
                                    : pct >= 40
                                    ? "#3b82f6"
                                    : "#ef4444"
                                }
                              />
                            </div>
                            <span className="text-xs font-medium w-14 text-right">
                              {r.managementPower.grade} ({pct.toFixed(0)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* 事業承継スコア比較 */}
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary mb-2">
                        事業承継準備度
                      </h3>
                      {results.map((r) => (
                        <div
                          key={r.persona.id}
                          className="flex items-center gap-3 mb-2"
                        >
                          <span className="text-sm w-28 truncate">
                            {r.persona.icon} {r.persona.companyName}
                          </span>
                          <div className="flex-1">
                            <ScoreBar
                              score={r.succession.totalScore}
                              max={r.succession.maxScore}
                              color={
                                r.succession.urgencyLevel === "low"
                                  ? "#10b981"
                                  : r.succession.urgencyLevel === "medium"
                                  ? "#f59e0b"
                                  : "#ef4444"
                              }
                            />
                          </div>
                          <span className="text-xs font-medium w-14 text-right">
                            {r.succession.totalScore}/{r.succession.maxScore}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
