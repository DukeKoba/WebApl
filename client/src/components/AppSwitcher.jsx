import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, BookOpen, Camera, Brain, ShieldCheck, Shield, Building2, Landmark, HeartHandshake } from 'lucide-react';

const apps = [
  {
    path: '/shiftsync',
    icon: Calendar,
    title: 'ShiftSync',
    description: 'シフト管理・スケジュール最適化プラットフォーム',
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-600',
    badge: 'シフト管理',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    path: '/eiken',
    icon: BookOpen,
    title: '英検コンテンツ生成',
    description: 'サンプル問題・学習TipsをAIエージェントチームが日本語でX投稿',
    color: 'from-green-500 to-emerald-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconBg: 'bg-green-600',
    badge: 'X (Twitter)',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    path: '/ramen',
    icon: Camera,
    title: 'Ramen Instagram Post',
    description: 'Upload a photo — AI agents auto-detect the restaurant & location and craft the English caption',
    color: 'from-orange-400 to-pink-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconBg: 'bg-gradient-to-br from-orange-400 to-pink-600',
    badge: 'Instagram',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  {
    path: '/aiedu',
    icon: Brain,
    title: 'Cocreo X投稿',
    description: 'AI業務改善・補助金活用・中小企業DX事例など、Cocreoの世界観でX投稿を生成',
    color: 'from-violet-500 to-purple-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    iconBg: 'bg-violet-600',
    badge: 'X (Twitter)',
    badgeColor: 'bg-violet-100 text-violet-700',
  },
  {
    path: '/itpass',
    icon: ShieldCheck,
    title: 'ITパスポート X投稿',
    description: 'マーケ×IT講師チーム監修。過去問チラ見せ・ゴロ・勉強法でアプリDLを誘発',
    color: 'from-cyan-500 to-sky-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    iconBg: 'bg-cyan-600',
    badge: 'X (Twitter)',
    badgeColor: 'bg-cyan-100 text-cyan-700',
  },
  {
    path: '/optimalrn',
    icon: Shield,
    title: 'OptimaLrn',
    description: 'AI英検・ITパスポート合格アプリシリーズのマーケティングページ',
    color: 'from-amber-500 to-yellow-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-500',
    badge: 'iOS App',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    path: '/agentdx',
    icon: Landmark,
    title: '代理店DX X投稿',
    description: '保険代理店のDX推進・InsurTech・AI活用など代理店経営者向けニュースをX投稿',
    color: 'from-indigo-500 to-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    iconBg: 'bg-indigo-600',
    badge: 'X (Twitter)',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  {
    path: '/cocreo',
    icon: Building2,
    title: 'Cocreo',
    description: 'AIで中小企業を元気に。保険代理店DX・業務ツール開発・補助金活用支援',
    color: 'from-blue-700 to-orange-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-gradient-to-br from-blue-700 to-orange-500',
    badge: 'iOS App',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  {
    path: '/family-sheet',
    icon: HeartHandshake,
    title: '保険の家族共有シート',
    description: '証券を撮るだけで家族に渡せる保険一覧シートを作成（無料公開ツール・ログイン不要）',
    color: 'from-emerald-700 to-amber-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconBg: 'bg-gradient-to-br from-emerald-700 to-amber-500',
    badge: '公開ツール',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
];

export default function AppSwitcher() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">WebApl</h1>
        <p className="text-gray-500">アプリを選択してください</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {apps.map(app => {
          const Icon = app.icon;
          return (
            <Link
              key={app.path}
              to={app.path}
              className={`group ${app.bg} ${app.border} border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1`}
            >
              <div className={`w-12 h-12 ${app.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${app.badgeColor}`}>
                {app.badge}
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-2 mb-1">{app.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{app.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <p className="text-xs text-gray-400">Powered by Claude AI</p>
      </div>
    </div>
  );
}
