import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, ChevronDown, Menu, X,
  Apple, Sparkles, Building2, FileText, Lightbulb, ShieldCheck, Mail, Clock
} from 'lucide-react';

const stats = [
  { value: '1/5', label: '大手SIer比の価格' },
  { value: '2週間', label: 'MVP最短納品' },
  { value: '450万円', label: '2026年補助金活用額（最大）' },
  { value: '15万円〜', label: '月額顧問契約' },
];

const services = [
  {
    icon: Building2,
    title: 'Cocreo Studio',
    badge: '受託開発',
    badgeColor: 'bg-blue-100 text-blue-700',
    price: '30万円〜',
    desc: 'Webアプリ・業務ツールを大手SIer比1/5のコストで開発。MVPを最短2週間で納品します。',
    color: 'from-blue-600 to-indigo-700',
  },
  {
    icon: FileText,
    title: 'Cocreo Grant',
    badge: '補助金支援',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    price: '最大450万円活用',
    desc: '申請書をAIが3分でドラフト。2026年度補助金の活用をワンストップでサポートします。',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Lightbulb,
    title: 'Cocreo Advisory',
    badge: '経営コンサル',
    badgeColor: 'bg-amber-100 text-amber-700',
    price: 'スポット5万円〜',
    desc: '大手コンサル出身者による「戦略×実装」のワンストップ対応。スポット診断から月額顧問まで。',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: ShieldCheck,
    title: 'Cocreo for Insurance',
    badge: 'iOS App',
    badgeColor: 'bg-orange-100 text-orange-700',
    price: 'App Store近日公開',
    desc: '保険代理店向けAIアプリ「保険代理店 DX」。業務効率化・顧客管理をスマホ1台で完結。',
    color: 'from-orange-500 to-red-600',
    highlight: true,
  },
];

const steps = [
  { num: '01', title: '無料相談（60分）', desc: '平日9:00-21:00対応。初回は完全無料でご相談いただけます。' },
  { num: '02', title: '提案（2〜3営業日）', desc: '課題を整理し、最適なプランと見積もりをご提案します。' },
  { num: '03', title: '開発スタート', desc: '契約後すぐに開発着手。MVP納品まで最短2週間。' },
  { num: '04', title: '納品＆継続支援', desc: 'リリース後もサポートを継続。長期的な伴走パートナーとして。' },
];

const faqs = [
  { q: '「保険代理店 DX」アプリはいつ公開されますか？', a: 'App Store審査中です（iOS 1.01）。承認され次第公開予定です。今しばらくお待ちください。' },
  { q: '開発費用はどのくらいかかりますか？', a: 'Cocreo Studioは30万円〜対応しています。大手SIerと比較して1/5程度の価格設定です。まずは無料相談でお見積もりします。' },
  { q: '補助金は本当に使えますか？', a: '2026年度の補助金を活用すれば最大450万円の支援を受けられます。Cocreo Grantでは申請書のAI作成から申請サポートまで一貫して対応します。' },
  { q: '中小企業でもAI導入できますか？', a: 'Cocreoは中小企業のAI導入を専門としています。人手不足の現場でも即戦力になるツールを低コストで提供します。' },
  { q: '相談はどこからできますか？', a: 'contact@cocreo.jpへのメール、または下記CTAボタンからお問い合わせください。平日9:00-21:00、24時間以内に返信します。' },
];

export default function CocreoLanding() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/95 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-orange-500 flex items-center justify-center shadow">
              <span className="text-white font-black text-xs leading-none">C</span>
            </div>
            <span className="font-bold text-lg text-white tracking-tight">Cocreo</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#services" className="hover:text-white transition-colors">サービス</a>
            <a href="#steps" className="hover:text-white transition-colors">導入の流れ</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="mailto:contact@cocreo.jp"
              className="text-sm bg-gradient-to-r from-blue-600 to-orange-500 text-white px-5 py-2 rounded-lg hover:opacity-90 transition-opacity font-bold flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" /> 無料相談する
            </a>
          </div>

          <button className="md:hidden p-1 text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-slate-950 border-t border-white/5 px-4 py-4 space-y-3 text-sm">
            {[['サービス', '#services'], ['導入の流れ', '#steps'], ['FAQ', '#faq']].map(([label, href]) => (
              <a key={href} href={href} className="block text-slate-300 hover:text-white py-1" onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <a href="mailto:contact@cocreo.jp" className="w-full block text-center bg-gradient-to-r from-blue-600 to-orange-500 text-white py-2 rounded-lg font-bold mt-2">
              無料相談する
            </a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-4 sm:px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-orange-500/15 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-7 border border-orange-500/20">
            <Sparkles className="w-3 h-3" /> AIで中小企業を元気に
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-orange-400 bg-clip-text text-transparent">
              大企業だけじゃない。
            </span>
            <br className="hidden sm:block" />
            中小企業こそ、AIで変わる。
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Cocreoは人手不足の中小企業向けにAI開発・補助金活用・経営コンサルを提供。
            大手SIer比1/5の価格でMVPを最短2週間で納品します。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:contact@cocreo.jp"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white px-8 py-4 rounded-xl font-bold text-base hover:opacity-90 transition-opacity shadow-xl"
            >
              <Mail className="w-5 h-5" /> 無料60分相談 <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#services"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-white/5 transition-colors"
            >
              サービスを見る
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {stats.map((s, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-5">
              <div className="text-2xl font-extrabold text-white mb-1">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">4つのサービス</h2>
            <p className="text-gray-500 text-sm">戦略から実装まで、ワンストップで対応します</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {services.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className={`bg-white rounded-2xl border-2 p-6 flex flex-col hover:shadow-lg transition-shadow ${s.highlight ? 'border-orange-300' : 'border-gray-200'}`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 shadow`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badgeColor}`}>
                          {s.badge}
                        </span>
                        {s.highlight && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">審査待ち</span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900">{s.title}</h3>
                      <p className="text-xs text-gray-400 font-semibold mt-0.5">{s.price}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{s.desc}</p>
                  {s.highlight && (
                    <div className="mt-4 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                      <Apple className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span className="text-xs text-orange-700 font-semibold">保険代理店 DX — iOS 1.01 審査待ち</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Cocreo */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Cocreoが選ばれる理由</h2>
            <p className="text-gray-500">単なるSIerではなく、経営者との共創パートナーです</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: '大手SIer比1/5の価格', desc: 'オーバーヘッドを徹底排除。高品質なAI開発を中小企業でも手の届く価格で提供します。' },
              { title: '最短2週間でMVP納品', desc: 'アジャイル開発で素早く検証。無駄な開発コストをかけず、市場の反応を早期に確認できます。' },
              { title: '戦略×実装のワンストップ', desc: '大手コンサル出身者が経営課題から開発まで一貫対応。二重発注・丸投げ不要です。' },
              { title: '補助金フル活用で負担軽減', desc: '2026年度の補助金を最大450万円活用。Cocreo Grantで申請書作成から採択まで伴走します。' },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 p-6 bg-slate-50 rounded-2xl hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center flex-shrink-0 shadow">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section id="steps" className="py-20 px-4 sm:px-6 bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">導入の流れ</h2>
          <p className="text-slate-400 mb-14">相談から開発スタートまで最短1週間。</p>
          <div className="grid sm:grid-cols-4 gap-6 relative">
            <div className="hidden sm:block absolute top-8 left-[12%] right-[12%] h-px bg-gradient-to-r from-blue-700 via-orange-500 to-blue-700 opacity-40" />
            {steps.map((s, i) => (
              <div key={i} className="relative z-10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {s.num}
                </div>
                <h3 className="font-bold text-white text-base mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">よくある質問</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">まずは無料で相談する</h2>
          <p className="text-slate-400 mb-2 text-base">初回60分・完全無料。平日9:00-21:00対応、24時間以内に返信。</p>
          <p className="text-slate-500 text-sm mb-8 flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" /> contact@cocreo.jp
            <span className="mx-2">·</span>
            <Clock className="w-4 h-4" /> 平日 9:00–21:00
          </p>
          <a
            href="mailto:contact@cocreo.jp"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white px-10 py-4 rounded-xl font-bold text-base hover:opacity-90 transition-opacity shadow-lg"
          >
            <Mail className="w-5 h-5" /> contact@cocreo.jp へ相談する <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 bg-slate-950 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-700 to-orange-500 flex items-center justify-center">
            <span className="text-white font-black text-xs">C</span>
          </div>
          <span className="font-bold text-white text-sm">Cocreo</span>
        </div>
        <p className="text-xs text-slate-600">© 2026 Cocreo. AIで中小企業を元気に。</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-xs text-slate-700 hover:text-slate-400 underline transition-colors"
        >
          ← アプリ一覧に戻る
        </button>
      </footer>
    </div>
  );
}
