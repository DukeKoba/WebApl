"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  Users,
  Target,
  TrendingDown,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Briefcase,
  Clock,
  ChevronDown,
  ChevronUp,
  Share2,
  Megaphone,
  Building2,
  UserPlus,
  Zap,
} from "lucide-react";
import {
  planHiringStrategy,
  HiringStrategyInput,
  HiringStrategyResult,
} from "@/lib/sme-challenges";

type Step = "input" | "analyzing" | "result";

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
      <label className="block text-sm font-medium text-text-primary mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder || "0"}
          className="w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">
          {unit}
        </span>
      </div>
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
      <label className="block text-sm font-medium text-text-primary mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleInput({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 p-3 bg-white border border-border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
      />
      <span className="text-sm text-text-primary">{label}</span>
    </label>
  );
}

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

function CollapsibleSection({
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
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-bold text-sm">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4">{children}</div>
      )}
    </div>
  );
}

const industries = [
  "食品・飲食", "製造業", "小売・卸売", "IT・通信", "建設・不動産",
  "医療・福祉", "観光・宿泊", "サービス業", "教育", "運輸・物流",
  "農林水産", "伝統工芸", "その他",
];

const regions = ["北海道", "東北", "関東", "中部", "関西", "中国", "四国", "九州・沖縄"];

export default function HiringStrategyPage() {
  const [step, setStep] = useState<Step>("input");
  const [result, setResult] = useState<HiringStrategyResult | null>(null);

  const [input, setInput] = useState<HiringStrategyInput>({
    industry: "製造業",
    region: "関東",
    employeeCount: 15,
    annualRevenue: 80000000,
    openPositions: 3,
    monthlyApplications: 5,
    hiringBudgetMonthly: 200000,
    avgCostPerHire: 500000,
    avgTimeToHire: 60,
    turnoverRate: 18,
    channels: {
      agencies: true,
      jobBoards: true,
      helloWork: true,
      referral: false,
      sns: false,
      directRecruit: false,
    },
    hasEmployerBrand: false,
    hasCareerPath: false,
    hasTrainingProgram: false,
    hasRemoteWork: false,
    wageCompetitiveness: 2,
    targetAgeGroup: "young",
  });

  const updateInput = <K extends keyof HiringStrategyInput>(
    key: K,
    value: HiringStrategyInput[K]
  ) => setInput((prev) => ({ ...prev, [key]: value }));

  const updateChannel = (key: keyof HiringStrategyInput["channels"], value: boolean) =>
    setInput((prev) => ({
      ...prev,
      channels: { ...prev.channels, [key]: value },
    }));

  const loadSample = () => {
    setInput({
      industry: "製造業",
      region: "中部",
      employeeCount: 25,
      annualRevenue: 150000000,
      openPositions: 4,
      monthlyApplications: 8,
      hiringBudgetMonthly: 300000,
      avgCostPerHire: 450000,
      avgTimeToHire: 75,
      turnoverRate: 22,
      channels: {
        agencies: true,
        jobBoards: true,
        helloWork: true,
        referral: false,
        sns: false,
        directRecruit: false,
      },
      hasEmployerBrand: false,
      hasCareerPath: false,
      hasTrainingProgram: true,
      hasRemoteWork: false,
      wageCompetitiveness: 3,
      targetAgeGroup: "young",
    });
  };

  const runAnalysis = () => {
    setStep("analyzing");
    setTimeout(() => {
      setResult(planHiringStrategy(input));
      setStep("result");
    }, 2000);
  };

  const impactColor = (v: string) =>
    v === "high" ? "text-emerald-600" : v === "medium" ? "text-blue-600" : "text-gray-500";
  const difficultyLabel = (v: string) =>
    v === "easy" ? "簡単" : v === "medium" ? "普通" : "難しい";

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header
        currentPage="採用戦略プランナー"
        breadcrumb={[
          { label: "ホーム", href: "/" },
          { label: "採用戦略プランナー" },
        ]}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-4">
            <UserPlus className="w-4 h-4" />
            AI採用戦略
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">採用戦略プランナー</h1>
          <p className="text-text-secondary text-sm">
            採用状況・チャネル・組織データを入力すると、AIが最適な採用戦略とアクションプランを提案します
          </p>
        </div>

        {/* 入力フォーム */}
        {step === "input" && (
          <div className="space-y-6 animate-fade-in">
            {/* 基本情報 */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  基本情報
                </h2>
                <button onClick={loadSample} className="text-xs text-primary hover:underline">
                  サンプルデータを入力
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectInput
                  label="業種"
                  value={input.industry}
                  onChange={(v) => updateInput("industry", v)}
                  options={industries.map((i) => ({ value: i, label: i }))}
                />
                <SelectInput
                  label="地域"
                  value={input.region}
                  onChange={(v) => updateInput("region", v)}
                  options={regions.map((r) => ({ value: r, label: r }))}
                />
                <NumberInput
                  label="従業員数"
                  value={input.employeeCount}
                  onChange={(v) => updateInput("employeeCount", v)}
                  unit="名"
                />
                <NumberInput
                  label="年商"
                  value={input.annualRevenue}
                  onChange={(v) => updateInput("annualRevenue", v)}
                  unit="円"
                />
              </div>
            </div>

            {/* 採用状況 */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                現在の採用状況
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NumberInput
                  label="募集中ポジション数"
                  value={input.openPositions}
                  onChange={(v) => updateInput("openPositions", v)}
                  unit="件"
                />
                <NumberInput
                  label="月間応募数"
                  value={input.monthlyApplications}
                  onChange={(v) => updateInput("monthlyApplications", v)}
                  unit="件/月"
                />
                <NumberInput
                  label="月間採用予算"
                  value={input.hiringBudgetMonthly}
                  onChange={(v) => updateInput("hiringBudgetMonthly", v)}
                  unit="円"
                />
                <NumberInput
                  label="一人あたり採用コスト"
                  value={input.avgCostPerHire}
                  onChange={(v) => updateInput("avgCostPerHire", v)}
                  unit="円"
                />
                <NumberInput
                  label="平均採用期間"
                  value={input.avgTimeToHire}
                  onChange={(v) => updateInput("avgTimeToHire", v)}
                  unit="日"
                />
                <NumberInput
                  label="離職率"
                  value={input.turnoverRate}
                  onChange={(v) => updateInput("turnoverRate", v)}
                  unit="%"
                />
              </div>
            </div>

            {/* 採用チャネル */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                利用中の採用チャネル
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ToggleInput label="人材紹介エージェント" checked={input.channels.agencies} onChange={(v) => updateChannel("agencies", v)} />
                <ToggleInput label="求人サイト（Indeed等）" checked={input.channels.jobBoards} onChange={(v) => updateChannel("jobBoards", v)} />
                <ToggleInput label="ハローワーク" checked={input.channels.helloWork} onChange={(v) => updateChannel("helloWork", v)} />
                <ToggleInput label="社員紹介（リファラル）" checked={input.channels.referral} onChange={(v) => updateChannel("referral", v)} />
                <ToggleInput label="SNS採用（Instagram/X等）" checked={input.channels.sns} onChange={(v) => updateChannel("sns", v)} />
                <ToggleInput label="ダイレクトリクルーティング" checked={input.channels.directRecruit} onChange={(v) => updateChannel("directRecruit", v)} />
              </div>
            </div>

            {/* 組織状態 */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                組織・制度
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <ToggleInput label="採用ブランディングがある" checked={input.hasEmployerBrand} onChange={(v) => updateInput("hasEmployerBrand", v)} />
                <ToggleInput label="キャリアパス制度がある" checked={input.hasCareerPath} onChange={(v) => updateInput("hasCareerPath", v)} />
                <ToggleInput label="研修制度がある" checked={input.hasTrainingProgram} onChange={(v) => updateInput("hasTrainingProgram", v)} />
                <ToggleInput label="リモートワーク可" checked={input.hasRemoteWork} onChange={(v) => updateInput("hasRemoteWork", v)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    賃金競争力
                  </label>
                  <select
                    value={input.wageCompetitiveness}
                    onChange={(e) =>
                      updateInput("wageCompetitiveness", Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value={1}>1 - かなり低い</option>
                    <option value={2}>2 - やや低い</option>
                    <option value={3}>3 - 平均的</option>
                    <option value={4}>4 - やや高い</option>
                    <option value={5}>5 - 高い</option>
                  </select>
                </div>
                <SelectInput
                  label="ターゲット年齢層"
                  value={input.targetAgeGroup}
                  onChange={(v) => updateInput("targetAgeGroup", v as "young" | "mid" | "senior" | "all")}
                  options={[
                    { value: "young", label: "若手（20〜30代）" },
                    { value: "mid", label: "中堅（30〜40代）" },
                    { value: "senior", label: "ベテラン（50代〜）" },
                    { value: "all", label: "全年齢" },
                  ]}
                />
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={runAnalysis}
                className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2 mx-auto shadow-lg"
              >
                <Zap className="w-5 h-5" />
                AIで採用戦略を立案
              </button>
            </div>
          </div>
        )}

        {/* 分析中 */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-lg font-semibold text-text-primary mb-2">
              採用データを分析中...
            </p>
            <p className="text-sm text-text-secondary">
              業界ベンチマークとの比較・最適チャネル分析を実行しています
            </p>
          </div>
        )}

        {/* 結果表示 */}
        {step === "result" && result && (
          <div className="space-y-6 animate-fade-in">
            {/* 総合スコア */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center gap-6 mb-6">
                <div className="text-center">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${
                      result.grade === "S" || result.grade === "A"
                        ? "bg-emerald-100 text-emerald-700"
                        : result.grade === "B"
                        ? "bg-blue-100 text-blue-700"
                        : result.grade === "C"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {result.grade}
                  </div>
                  <p className="text-sm text-text-secondary mt-2">
                    {result.overallScore}/100点
                  </p>
                </div>
                <div className="flex-1 space-y-3">
                  {result.categories.map((cat, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary font-medium">{cat.name}</span>
                        <span className="font-bold">
                          {cat.score}/{cat.maxScore}
                        </span>
                      </div>
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
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        {cat.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* コスト効率 */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                採用コスト分析
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl text-center">
                  <p className="text-[10px] text-text-secondary mb-1">現在の採用単価</p>
                  <p className="text-lg font-bold">
                    {(result.costEfficiency.currentCostPerHire / 10000).toFixed(0)}万円
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl text-center">
                  <p className="text-[10px] text-text-secondary mb-1">業界平均</p>
                  <p className="text-lg font-bold">
                    {(result.costEfficiency.industryAvgCostPerHire / 10000).toFixed(0)}万円
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl text-center">
                  <p className="text-[10px] text-text-secondary mb-1">削減ポテンシャル</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {(result.costEfficiency.potentialSavings / 10000).toFixed(0)}万円
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl text-center">
                  <p className="text-[10px] text-text-secondary mb-1">効率評価</p>
                  <p className={`text-lg font-bold ${
                    result.costEfficiency.costEfficiencyRating === "good"
                      ? "text-emerald-600"
                      : result.costEfficiency.costEfficiencyRating === "average"
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}>
                    {result.costEfficiency.costEfficiencyRating === "good"
                      ? "効率的"
                      : result.costEfficiency.costEfficiencyRating === "average"
                      ? "平均的"
                      : "要改善"}
                  </p>
                </div>
              </div>
            </div>

            {/* チャネル分析 */}
            <CollapsibleSection
              title="チャネル最適化レポート"
              icon={<Share2 className="w-5 h-5 text-blue-600" />}
              defaultOpen
            >
              <div className="space-y-3">
                {result.channelAnalysis.map((ch, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${ch.currentlyUsed ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${ch.currentlyUsed ? "bg-blue-500" : "bg-gray-300"}`} />
                        <span className="text-sm font-medium">{ch.channel}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          ch.effectiveness === "high" ? "bg-emerald-100 text-emerald-700" :
                          ch.effectiveness === "medium" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          効果: {ch.effectiveness === "high" ? "高" : ch.effectiveness === "medium" ? "中" : "低"}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          ch.costLevel === "low" ? "bg-emerald-100 text-emerald-700" :
                          ch.costLevel === "medium" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          コスト: {ch.costLevel === "low" ? "低" : ch.costLevel === "medium" ? "中" : "高"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary">{ch.recommendation}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* 戦略提案 */}
            <CollapsibleSection
              title={`推奨戦略（${result.strategies.length}件）`}
              icon={<Target className="w-5 h-5 text-emerald-600" />}
              defaultOpen
            >
              <div className="space-y-3">
                {result.strategies.map((s, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-bold text-text-primary">{s.title}</h4>
                      <span className={`text-xs font-medium ${impactColor(s.impact)}`}>
                        効果: {s.impact === "high" ? "大" : s.impact === "medium" ? "中" : "小"}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mb-2">{s.description}</p>
                    <div className="flex gap-3 text-[10px] text-text-secondary">
                      <span>難易度: {difficultyLabel(s.difficulty)}</span>
                      <span>期間: {s.timeframe}</span>
                      <span className="text-emerald-600 font-medium">
                        コスト削減: 約{s.estimatedCostReduction}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* 改善ロードマップ */}
            <CollapsibleSection
              title="改善ロードマップ"
              icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
            >
              <div className="space-y-4">
                {result.improvementPlan.map((phase) => (
                  <div key={phase.phase} className="relative pl-8">
                    <div className="absolute left-0 top-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {phase.phase}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold">{phase.name}</h4>
                        <span className="text-[10px] text-text-secondary bg-white px-2 py-0.5 rounded-full">
                          {phase.duration}
                        </span>
                      </div>
                      <ul className="space-y-1 mb-2">
                        {phase.actions.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                            <CheckCircle2 className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-emerald-600 font-medium">
                        期待効果: {phase.expectedOutcome}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* KPI目標 */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                KPI目標
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-text-secondary font-medium">指標</th>
                      <th className="text-center py-2 text-text-secondary font-medium">現在</th>
                      <th className="text-center py-2 text-text-secondary font-medium">目標</th>
                      <th className="text-center py-2 text-text-secondary font-medium">達成目安</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.kpis.map((kpi, i) => (
                      <tr key={i} className="border-b border-border last:border-b-0">
                        <td className="py-2 font-medium">{kpi.name}</td>
                        <td className="py-2 text-center">{kpi.current}</td>
                        <td className="py-2 text-center text-emerald-600 font-medium">
                          {kpi.target}
                        </td>
                        <td className="py-2 text-center text-text-secondary">{kpi.timeline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* リスク */}
            {result.risks.length > 0 && (
              <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  検出されたリスク
                </h3>
                <ul className="space-y-2">
                  {result.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* やり直し */}
            <div className="text-center">
              <button
                onClick={() => {
                  setStep("input");
                  setResult(null);
                }}
                className="px-6 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors"
              >
                条件を変更して再分析
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
