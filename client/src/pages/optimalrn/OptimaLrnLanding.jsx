import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, ChevronDown, Menu, X,
  Shield, Sparkles, Apple, TrendingUp, Target, Zap, BarChart2
} from 'lucide-react';

const products = [
  {
    id: 'eiken-jun2',
    name: 'AI英検準２級 Pass',
    sub: 'P2',
    badge: '配信中',
    badgeStyle: 'bg-emerald-500 text-white',
    desc: '頻出単語と文法を、AIが弱点だけ集中出題。高校在学レベルを最短で突破。',
    available: true,
    href: 'https://apps.apple.com/jp/app/id6762229086',
  },
  {
    id: 'eiken-jun2plus',
    name: 'AI英検準２級プラス Pass',
    sub: 'P2+',
    badge: '配信中',
    badgeStyle: 'bg-emerald-500 text-white',
    desc: '2級へつながる長文と語彙に、少しずつ慣れる。準2級合格者の次のステップ。',
    available: true,
    href: 'https://apps.apple.com/jp/app/id6762537264',
  },
  {
    id: 'eiken-2',
    name: 'AI英検２級 Pass',
    sub: '2',
    badge: '配信中',
    badgeStyle: 'bg-emerald-500 text-white',
    desc: '過去問演習×AI分析で、弱点を最短ルートで攻略。大学入試・就活に直結。',
    available: true,
    href: 'https://apps.apple.com/jp/app/id6761838561',
  },
  {
    id: 'eiken-1',
    name: 'AI英検準１級 Pass',
    sub: 'P1',
    badge: '配信中',
    badgeStyle: 'bg-emerald-500 text-white',
    desc: '難単語と長文読解を、AIで効率よく対策。語彙・長文・英作文まで網羅。',
    available: true,
    href: 'https://apps.apple.com/jp/app/id6762535365',
  },
  {
    id: 'itpassport',
    name: 'AI ITPassport Pass',
    sub: 'IT',
    badge: '近日公開',
    badgeStyle: 'bg-orange-500 text-white',
    desc: 'ストラテジ・マネジメント・テクノロジ系の3分野をAIが効率よくカバー。',
    available: false,
    href: '',
  },
];

const features = [
  {
    icon: TrendingUp,
    title: 'AIが弱点を即特定',
    desc: '解答ログをリアルタイム分析。苦手な単元だけを重点的に出題し、無駄な反復をゼロにします。',
  },
  {
    icon: Target,
    title: '最短ルートを提示',
    desc: '目標・習熟度・残り時間から最適な学習順序を自動生成。ゴールへの最短距離を走れます。',
  },
  {
    icon: Zap,
    title: 'スキマ時間に最適化',
    desc: '5分でも30分でも、その日の空き時間に合わせた問題セットを即時生成します。',
  },
  {
    icon: BarChart2,
    title: '成長が数字で見える',
    desc: '習熟度スコア・正答率・学習ストリークをダッシュボードで一覧。モチベーションが続きます。',
  },
];

const faqs = [
  { q: 'どのデバイスで使えますか？', a: 'iPhone / iPad に対応しています。App Storeからダウンロードいただけます。' },
  { q: '各アプリは独立していますか？', a: 'はい、各資格ごとに独立したアプリです。目標の試験に合わせてお選びください。' },
  { q: 'AI ITPassport Passはいつ配信されますか？', a: '現在提出準備中です。近日中に審査申請予定です。リリースをお楽しみに。' },
  { q: '問題数はどのくらいですか？', a: '各アプリとも数百問以上を収録。AIが学習履歴に基づき最適な問題を選んで出題します。' },
];

function AppIcon({ sub }) {
  return (
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-lg border border-white/10 flex-shrink-0 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent" />
      <div className="relative flex flex-col items-center justify-center">
        <Shield className="w-7 h-7 text-orange-400" strokeWidth={1.5} />
        <span className="absolute text-[6px] font-black text-orange-300 top-3 leading-none">{sub}</span>
      </div>
    </div>
  );
}

export default function OptimaLrnLanding() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <img
            src="/optimalrn-logo.png"
            alt="OptimaLrn"
            className="h-8 w-auto object-contain"
          />

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#apps" className="hover:text-black transition-colors">アプリ</a>
            <a href="#features" className="hover:text-black transition-colors">特徴</a>
            <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
          </div>

          <a
            href="#apps"
            className="hidden md:flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors"
          >
            <Apple className="w-3.5 h-3.5" /> App Storeで見る
          </a>

          <button className="md:hidden text-black" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3 text-sm">
            {[['アプリ', '#apps'], ['特徴', '#features'], ['FAQ', '#faq']].map(([label, href]) => (
              <a key={href} href={href} className="block text-gray-700 hover:text-black py-1" onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <a href="#apps" className="block text-center bg-orange-500 text-white py-2.5 rounded-lg font-bold mt-2">
              App Storeで見る
            </a>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="pt-24 pb-24 px-4 sm:px-6 bg-white text-black relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-8">
            <img
              src="/optimalrn-logo.png"
              alt="OptimaLrn — 努力を科学する"
              className="h-20 sm:h-28 w-auto object-contain"
            />
          </div>

          <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-orange-200">
            <Sparkles className="w-3 h-3" /> AI × 資格合格アプリシリーズ
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 text-black">
            <span className="text-orange-500">AIが選ぶ問題</span>だけを解いて、<br className="hidden sm:block" />
            最短合格。
          </h1>

          <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
            英検・ITパスポートに特化したAI学習アプリシリーズ。
            解答履歴から弱点を自動検出し、今日やるべき問題だけをお届けします。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#apps"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 rounded-xl font-bold text-base transition-colors shadow-xl shadow-orange-900/20"
            >
              <Apple className="w-5 h-5" /> アプリを選ぶ <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 text-black px-8 py-4 rounded-xl font-semibold text-base hover:bg-gray-50 transition-colors"
            >
              特徴を見る
            </a>
          </div>

          <p className="text-xs text-gray-400 mt-5">努力を科学する</p>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-orange-500 py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 text-center text-white">
          {[
            { value: '5', label: 'アプリラインナップ' },
            { value: 'AI搭載', label: '弱点分析エンジン' },
            { value: 'iOS', label: 'App Store配信' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-2xl sm:text-3xl font-extrabold">{s.value}</div>
              <div className="text-xs text-orange-100 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── App lineup ── */}
      <section id="apps" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-black mb-3">アプリラインナップ</h2>
            <p className="text-gray-500 text-sm">目標の試験に合わせてお選びください</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <div
                key={p.id}
                className={`rounded-2xl border p-6 flex flex-col transition-shadow hover:shadow-lg ${p.available ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <AppIcon sub={p.sub} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.badgeStyle}`}>
                      {p.badge}
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug mt-1.5">{p.name}</h3>
                  </div>
                </div>

                <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-5">{p.desc}</p>

                {p.available ? (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors"
                  >
                    <Apple className="w-4 h-4" /> App Storeで入手
                  </a>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-400 py-2.5 rounded-xl text-sm font-semibold cursor-default">
                    近日公開
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-5 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />配信中</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />審査待ち</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />近日公開</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-gray-50 text-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-black mb-3">なぜ OptimaLrn なのか</h2>
            <p className="text-gray-500">普通の問題集アプリとは、ここが違います。</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex gap-4 p-6 bg-white rounded-2xl border border-gray-200 hover:border-orange-500/40 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black mb-1">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4 sm:px-6 bg-orange-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">3ステップで始まる</h2>
          <p className="text-orange-100 mb-14">ダウンロードから学習開始まで3分。</p>
          <div className="grid sm:grid-cols-3 gap-8 relative">
            <div className="hidden sm:block absolute top-8 left-1/4 right-1/4 h-px bg-white/30" />
            {[
              { num: '01', title: 'アプリをDL', desc: 'App Storeで目標の試験アプリをダウンロード。' },
              { num: '02', title: 'AIが診断', desc: '初回テストで現在地を把握し、専用プランを即生成。' },
              { num: '03', title: '毎日最適問題', desc: '日々更新されるAI厳選問題でスコアが着実にアップ。' },
            ].map((s, i) => (
              <div key={i} className="relative z-10">
                <div className="w-16 h-16 rounded-full bg-white text-orange-500 text-xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {s.num}
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-orange-100">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-black">よくある質問</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
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

      {/* ── Final CTA ── */}
      <section className="py-20 px-4 sm:px-6 bg-white text-black text-center">
        <div className="max-w-2xl mx-auto">
          <img
            src="/optimalrn-logo.png"
            alt="OptimaLrn"
            className="h-16 sm:h-20 w-auto object-contain mx-auto mb-8"
          />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black mb-4">努力を、科学しよう。</h2>
          <p className="text-gray-600 mb-8 text-base">目標の試験アプリを選んでダウンロード。</p>
          <a
            href="#apps"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-10 py-4 rounded-xl font-bold text-base transition-colors shadow-lg shadow-orange-900/20"
          >
            <Apple className="w-5 h-5" /> アプリ一覧を見る <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-4 sm:px-6 bg-white border-t border-gray-200 text-center">
        <img
          src="/optimalrn-logo.png"
          alt="OptimaLrn"
          className="h-6 w-auto object-contain mx-auto mb-3 opacity-50"
        />
        <p className="text-xs text-gray-500">© 2026 OptimaLrn. Powered by Claude AI.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-3 text-xs text-gray-500 hover:text-gray-800 underline transition-colors"
        >
          ← アプリ一覧に戻る
        </button>
      </footer>
    </div>
  );
}
