import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Building2,
  Users,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Download,
  RotateCcw,
  Sparkles,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  INDUSTRY_OPTIONS,
  CHALLENGE_OPTIONS,
  TOOL_OPTIONS,
  generateSubsidyDraft,
} from '../../lib/cocreo/subsidyGenerator';

const INITIAL_FORM = {
  companyName: '',
  industry: '',
  employeeCount: '',
  annualRevenue: '',
  currentChallenges: [],
  desiredTools: [],
  customChallenge: '',
  customTool: '',
  processCount: '1',
  businessDescription: '',
};

export default function SubsidyGenerator() {
  const [step, setStep] = useState('input');
  const [form, setForm] = useState(INITIAL_FORM);
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState([]);

  function toggleArrayItem(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  }

  function validate() {
    const errs = [];
    if (!form.companyName.trim()) errs.push('会社名を入力してください');
    if (!form.industry) errs.push('業種を選択してください');
    if (!form.employeeCount) errs.push('従業員数を入力してください');
    if (!form.annualRevenue) errs.push('年商を入力してください');
    if (form.currentChallenges.length === 0 && !form.customChallenge.trim())
      errs.push('現在の課題を1つ以上選択してください');
    if (form.desiredTools.length === 0 && !form.customTool.trim())
      errs.push('導入したいツールを1つ以上選択してください');
    return errs;
  }

  function handleGenerate() {
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setStep('generating');
    setTimeout(() => {
      const result = generateSubsidyDraft(form);
      setDraft(result);
      setStep('result');
    }, 3000);
  }

  function handleReset() {
    setForm(INITIAL_FORM);
    setDraft(null);
    setStep('input');
    setErrors([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCopyAll() {
    if (!draft) return;
    const text = `【事業計画名】
${draft.projectTitle}

【事業概要】
${draft.businessOverview}

【現状の課題】
${draft.currentIssues}

【課題解決の方針】
${draft.proposedSolution}

【導入するITツール・AI】
${draft.toolsToIntroduce}

【導入スケジュール】
${draft.implementationSchedule}

【見込まれる効果】
${draft.expectedEffects}

【経費・補助金額の見積もり】
${draft.budgetEstimate}

【申請区分】${draft.subsidyCategory}
【補助金額】${draft.subsidyAmount}
【補助率】${draft.subsidyRate}`;

    navigator.clipboard.writeText(text);
    alert('申請書ドラフトをクリップボードにコピーしました');
  }

  const activeStep = step === 'input' ? 1 : step === 'generating' ? 2 : 3;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #f8fafc, #eff6ff)' }}>
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>AI補助金申請書ジェネレーター</h1>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>デジタル化・AI導入補助金 2026 対応</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="font-medium">1次締切: 2026年5月12日</span>
            </div>
            <Link to="/cocreo" className="hidden sm:block text-xs px-3 py-1.5 rounded-full border transition-colors" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
              ← Cocreo
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[
            { label: '情報入力', num: 1 },
            { label: 'AI生成', num: 2 },
            { label: 'ドラフト完成', num: 3 },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  activeStep === s.num
                    ? 'text-white'
                    : step === 'result' && s.num < 3
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
                style={activeStep === s.num ? { backgroundColor: 'var(--color-primary)' } : undefined}
              >
                {step === 'result' && s.num < 3 ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: activeStep === s.num ? 'var(--color-primary)' : '#94a3b8' }}
              >
                {s.label}
              </span>
              {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300 ml-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Input Form */}
        {step === 'input' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border p-8" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Building2 className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                会社情報
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                    会社名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="株式会社○○"
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                    業種 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm bg-white"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <option value="">選択してください</option>
                    {INDUSTRY_OPTIONS.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                    <Users className="w-4 h-4 inline mr-1" />
                    従業員数 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.employeeCount}
                    onChange={(e) => setForm({ ...form, employeeCount: e.target.value })}
                    placeholder="10"
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                    <Banknote className="w-4 h-4 inline mr-1" />
                    年商（売上高） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.annualRevenue}
                    onChange={(e) => setForm({ ...form, annualRevenue: e.target.value })}
                    placeholder="5,000万円"
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                  事業の簡単な説明（任意）
                </label>
                <textarea
                  value={form.businessDescription}
                  onChange={(e) => setForm({ ...form, businessDescription: e.target.value })}
                  placeholder="例: 地域密着型の建設会社として、住宅リフォームや小規模建築を手掛けている"
                  rows={2}
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm resize-none"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-8" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                現在の課題 <span className="text-red-500">*</span>
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                該当するものを全て選択してください（複数選択可）
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CHALLENGE_OPTIONS.map((ch) => (
                  <label
                    key={ch}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                    style={{
                      borderColor: form.currentChallenges.includes(ch) ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: form.currentChallenges.includes(ch) ? 'rgba(201,137,31,0.05)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.currentChallenges.includes(ch)}
                      onChange={() => toggleArrayItem('currentChallenges', ch)}
                      className="sr-only"
                    />
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: form.currentChallenges.includes(ch) ? 'var(--color-primary)' : '#d1d5db',
                        backgroundColor: form.currentChallenges.includes(ch) ? 'var(--color-primary)' : 'transparent',
                      }}
                    >
                      {form.currentChallenges.includes(ch) && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{ch}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  value={form.customChallenge}
                  onChange={(e) => setForm({ ...form, customChallenge: e.target.value })}
                  placeholder="その他の課題を自由に入力..."
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-8" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                導入したいツール・AI <span className="text-red-500">*</span>
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                導入を検討しているものを選択してください
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TOOL_OPTIONS.map((tool) => (
                  <label
                    key={tool}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                    style={{
                      borderColor: form.desiredTools.includes(tool) ? '#10b981' : 'var(--color-border)',
                      backgroundColor: form.desiredTools.includes(tool) ? '#f0fdf4' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.desiredTools.includes(tool)}
                      onChange={() => toggleArrayItem('desiredTools', tool)}
                      className="sr-only"
                    />
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: form.desiredTools.includes(tool) ? '#10b981' : '#d1d5db',
                        backgroundColor: form.desiredTools.includes(tool) ? '#10b981' : 'transparent',
                      }}
                    >
                      {form.desiredTools.includes(tool) && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{tool}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  value={form.customTool}
                  onChange={(e) => setForm({ ...form, customTool: e.target.value })}
                  placeholder="その他のツール・AIを自由に入力..."
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-8" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>改善する業務プロセス数</h2>
              <div className="flex gap-4 items-center">
                <select
                  value={form.processCount}
                  onChange={(e) => setForm({ ...form, processCount: e.target.value })}
                  className="px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm bg-white"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <option key={n} value={n}>{n}プロセス</option>
                  ))}
                </select>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {parseInt(form.processCount) >= 4 ? (
                    <span className="text-green-700 font-medium">→ 補助上限額: 150万〜450万円</span>
                  ) : (
                    <span>→ 補助上限額: 5万〜150万円</span>
                  )}
                </div>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                  <AlertCircle className="w-5 h-5" />
                  入力内容を確認してください
                </div>
                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                  {errors.map((err) => <li key={err}>{err}</li>)}
                </ul>
              </div>
            )}

            <button
              onClick={handleGenerate}
              className="w-full py-4 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Sparkles className="w-6 h-6" />
              AIで申請書ドラフトを生成する
            </button>

            <p className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              ※ 生成されるドラフトはあくまで参考資料です。実際の申請にはIT導入支援事業者との連携が必要です。
            </p>
          </div>
        )}

        {/* Step 2: Generating */}
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: 'rgba(201,137,31,0.2)' }} />
              <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>AIが申請書を生成中...</h2>
            <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <p>✓ 会社情報を分析中</p>
              <p>✓ 補助金要件とのマッチング中</p>
              <p className="animate-pulse">⟳ 申請書ドラフトを作成中...</p>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && draft && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-bold text-green-900">申請書ドラフトが完成しました</h2>
                <p className="text-sm text-green-700 mt-1">
                  以下の内容をベースに、IT導入支援事業者と相談しながら申請書を完成させてください。
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">申請区分</span>
              </div>
              {draft.subsidyCategory}｜補助金額: {draft.subsidyAmount}｜補助率: {draft.subsidyRate}
            </div>

            {[
              { title: '事業計画名', content: draft.projectTitle },
              { title: '事業概要', content: draft.businessOverview },
              { title: '現状の課題', content: draft.currentIssues },
              { title: '課題解決の方針', content: draft.proposedSolution },
              { title: '導入するITツール・AI', content: draft.toolsToIntroduce },
              { title: '導入スケジュール', content: draft.implementationSchedule },
              { title: '見込まれる効果', content: draft.expectedEffects },
              { title: '経費・補助金額の見積もり', content: draft.budgetEstimate },
            ].map((section) => (
              <div key={section.title} className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  <FileText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  {section.title}
                </h3>
                <div className="text-sm whitespace-pre-wrap leading-relaxed rounded-lg p-4 border" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface-soft)', borderColor: 'var(--color-border)' }}>
                  {section.content}
                </div>
              </div>
            ))}

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleCopyAll}
                className="flex-1 py-3.5 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Download className="w-5 h-5" />
                全文をコピー
              </button>
              <button
                onClick={handleReset}
                className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                やり直す
              </button>
            </div>

            <div className="rounded-xl p-6 mt-4 border" style={{ backgroundColor: 'rgba(201,137,31,0.05)', borderColor: 'rgba(201,137,31,0.2)' }}>
              <h3 className="font-bold mb-2" style={{ color: 'var(--color-primary)' }}>次のステップ</h3>
              <ol className="text-sm space-y-2 list-decimal list-inside" style={{ color: 'var(--color-text-secondary)' }}>
                <li>このドラフトをもとにIT導入支援事業者を探す</li>
                <li>支援事業者と一緒に申請内容を詳細化する</li>
                <li className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  2026年5月12日 17:00 までに申請を完了する
                </li>
              </ol>
              <div className="mt-4 pt-4 border-t text-sm" style={{ borderColor: 'rgba(201,137,31,0.2)', color: 'var(--color-text-secondary)' }}>
                <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  AIツールの導入・開発もお手伝いできます
                </p>
                <p className="mt-1">
                  補助金を活用したAI導入のご相談は Cocreo まで →{' '}
                  <a href="mailto:contact@cocreo.jp" className="underline" style={{ color: 'var(--color-primary)' }}>contact@cocreo.jp</a>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 mt-16" style={{ backgroundColor: 'var(--color-surface-dark)' }}>
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-white/50">
          <p>© 2026 Kagary Project. AI補助金申請書ジェネレーター</p>
          <p className="mt-1 text-xs text-white/30">
            ※ 本ツールが生成する内容はドラフト（下書き）です。実際の採択を保証するものではありません。
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            <Link to="/cocreo" className="text-white/40 hover:text-white/60 transition-colors">← Cocreoトップ</Link>
            <Link to="/cocreo/consulting" className="text-white/40 hover:text-white/60 transition-colors">AIコンサルを試す →</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
