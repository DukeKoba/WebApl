"use client";

import { useState } from "react";
import {
  Building2,
  MapPin,
  Users,
  Target,
  ArrowRight,
  Sparkles,
  FileText,
} from "lucide-react";
import { ProjectCase, CASE_TEMPLATES } from "@/lib/cases";

interface CaseIntakeFormProps {
  onSubmit: (projectCase: ProjectCase) => void;
}

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県",
  "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const INDUSTRIES = [
  "食品・飲食","製造業","小売・卸売","農林水産","観光・宿泊",
  "建設・不動産","医療・福祉","教育","IT・通信","運輸・物流",
  "サービス業","伝統工芸","その他",
];

const CHALLENGE_TYPES = [
  { value: "EC・販路拡大", label: "EC事業の立ち上げ・販路拡大", icon: "🛒" },
  { value: "採用・人材確保", label: "人材の採用・確保", icon: "👥" },
  { value: "商品開発・新規事業", label: "新商品開発・新規事業", icon: "💡" },
  { value: "DX・業務効率化", label: "DX推進・業務デジタル化", icon: "💻" },
  { value: "SNS・マーケティング", label: "SNS・デジタルマーケティング", icon: "📱" },
  { value: "経営戦略・資金調達", label: "経営戦略・補助金活用", icon: "📊" },
  { value: "価格転嫁・値上げ", label: "価格転嫁・適正価格設定", icon: "💰" },
  { value: "賃上げ・人件費", label: "賃上げ・人材定着", icon: "📈" },
  { value: "事業承継・後継者", label: "事業承継・後継者育成", icon: "🔄" },
];

export default function CaseIntakeForm({ onSubmit }: CaseIntakeFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    prefecture: "",
    employeeCount: "",
    annualRevenue: "",
    challengeType: "",
    challengeDetail: "",
    goals: "",
    constraints: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    const projectCase: ProjectCase = {
      id: `case-${Date.now()}`,
      companyName: form.companyName,
      industry: form.industry,
      region: form.prefecture,
      prefecture: form.prefecture,
      employeeCount: parseInt(form.employeeCount) || 5,
      annualRevenue: form.annualRevenue,
      challengeType: form.challengeType,
      challengeDetail: form.challengeDetail,
      goals: form.goals.split("\n").filter(Boolean),
      constraints: form.constraints.split("\n").filter(Boolean),
      status: "intake",
      assignedAgents: [],
      createdAt: new Date(),
    };
    onSubmit(projectCase);
  };

  const steps = [
    {
      title: "企業情報",
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">企業名 *</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              placeholder="例：株式会社やまがた食品"
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">業種 *</label>
              <select
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
              >
                <option value="">選択してください</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">所在地 *</label>
              <select
                value={form.prefecture}
                onChange={(e) => update("prefecture", e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
              >
                <option value="">都道府県を選択</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">従業員数</label>
              <input
                type="number"
                value={form.employeeCount}
                onChange={(e) => update("employeeCount", e.target.value)}
                placeholder="例：15"
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">年商（概算）</label>
              <select
                value={form.annualRevenue}
                onChange={(e) => update("annualRevenue", e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white"
              >
                <option value="">選択してください</option>
                <option value="3000万円未満">3,000万円未満</option>
                <option value="3000万〜1億円">3,000万〜1億円</option>
                <option value="1億〜5億円">1億〜5億円</option>
                <option value="5億〜10億円">5億〜10億円</option>
                <option value="10億円以上">10億円以上</option>
              </select>
            </div>
          </div>
        </div>
      ),
      isValid: form.companyName && form.industry && form.prefecture,
    },
    {
      title: "お悩み・課題",
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-3">
              最も解決したい課題は何ですか？ *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHALLENGE_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => update("challengeType", ct.value)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    form.challengeType === ct.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ct.icon}</span>
                    <span className="text-sm font-medium">{ct.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              課題の詳細を教えてください *
            </label>
            <textarea
              value={form.challengeDetail}
              onChange={(e) => update("challengeDetail", e.target.value)}
              placeholder="例：地元で30年以上愛されているソースの味を全国に届けたい。EC販売を始めたいが、サイト構築や物流の知識がなく、何から始めればいいか分からない。"
              rows={4}
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none"
            />
          </div>
        </div>
      ),
      isValid: form.challengeType && form.challengeDetail,
    },
    {
      title: "目標・条件",
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              達成したい目標（1行に1つずつ）
            </label>
            <textarea
              value={form.goals}
              onChange={(e) => update("goals", e.target.value)}
              placeholder={"例：\n半年以内にECサイトを開設したい\n月間売上50万円を目指したい\nSNSのフォロワーを1000人にしたい"}
              rows={4}
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              制約条件・ご要望があれば（1行に1つずつ）
            </label>
            <textarea
              value={form.constraints}
              onChange={(e) => update("constraints", e.target.value)}
              placeholder={"例：\n月額の予算は5万円まで\nITに詳しいスタッフがいない\nまずは小さく始めたい"}
              rows={4}
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none"
            />
          </div>
        </div>
      ),
      isValid: true,
    },
  ];

  return (
    <div className="flex-1 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            オーダーメイドAIコンサルティング
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            あなたの企業専用の<br />コンサル提案書を作成します
          </h1>
          <p className="text-text-secondary text-sm">
            3ステップの簡単な入力で、AIエージェントチームが御社に最適な施策を提案
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.title} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i === currentStep
                    ? "bg-primary text-white"
                    : i < currentStep
                    ? "bg-secondary text-white"
                    : "bg-gray-200 text-text-secondary"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`ml-2 text-sm hidden sm:inline ${
                  i === currentStep ? "text-primary font-medium" : "text-text-secondary"
                }`}
              >
                {s.title}
              </span>
              {i < steps.length - 1 && (
                <div className="w-8 sm:w-12 h-0.5 bg-gray-200 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            {currentStep === 0 && <Building2 className="w-5 h-5 text-primary" />}
            {currentStep === 1 && <Target className="w-5 h-5 text-primary" />}
            {currentStep === 2 && <FileText className="w-5 h-5 text-primary" />}
            {steps[currentStep].title}
          </h2>

          {steps[currentStep].content}

          <div className="flex justify-between mt-8">
            {currentStep > 0 ? (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-2.5 border border-border rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                戻る
              </button>
            ) : (
              <div />
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!steps[currentStep].isValid}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                次へ
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!form.challengeType || !form.challengeDetail}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                AIに分析してもらう
              </button>
            )}
          </div>
        </div>

        {/* Case examples */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-text-secondary mb-3 text-center">
            こんな案件に対応しています
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CASE_TEMPLATES.slice(0, 4).map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  update("challengeType", t.tags[0]);
                  update("challengeDetail", t.challenge);
                  setCurrentStep(1);
                }}
              >
                <div className="text-sm font-medium mb-1">{t.title}</div>
                <div className="text-xs text-text-secondary">{t.challenge}</div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {t.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-primary/5 text-primary rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
