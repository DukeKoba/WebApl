import React, { useMemo, useState } from 'react';
import { CalendarDays, Clock3, Download, ExternalLink, Pin, Target, TrendingUp } from 'lucide-react';

// 週次プラン。転換系（制作実況・事例）を主役にし、ニュース系は3種に絞った。
// 時間帯は 7:30-8:00 をメイン枠、12:00-12:30 と 21:00-22:00 をサブ枠として運用する。
const WEEKLY_PLAN = [
  { day: 1, label: '月', time: '7:45', type: 'law_check', title: '業法・制度セルフチェック', goal: 'スクショされ社内共有される', format: '型B：□チェック3つ＋判定' },
  { day: 2, label: '火', time: '12:10', type: 'efficiency_tips', title: '実務Tips', goal: '保存される実務投稿を作る', format: '型A：数字→換算→手順1・2・3' },
  { day: 3, label: '水', time: '7:45', type: 'app_demo', title: '制作実況（最重要枠）', goal: '返信で要望を集める', format: '型D：現場の一言→作った→Before/After', key: true },
  { day: 4, label: '木', time: '12:10', type: 'quote_post', title: '引用ポスト', goal: '業界ニュースに自分の解釈を足す', format: '解釈1〜2行＋引用元URL' },
  { day: 5, label: '金', time: '7:45', type: 'case_story', title: '事例・作ったもの', goal: '相談・受注へつなげる', format: '型D：課題→作った→削減時間→依頼', key: true },
  { day: 6, label: '土', time: '7:45', type: 'global_ins', title: '海外ニュース翻訳', goal: '一次情報の翻訳者として認知される', format: '型C：事実＋日本の代理店への効き方' },
  { day: 0, label: '日', time: '21:30', type: 'fail_story', title: '週次まとめ・失敗談', goal: '人柄への共感とフォロー継続', format: '型D：やったこと／失敗／来週の問い' },
];

const TREND_FOCUS = [
  {
    title: '「規模」より業務品質',
    body: '手数料・評価の話は、顧客サービスと法令遵守にどうつながるかまで翻訳する。',
    href: 'https://www.fsa.go.jp/common/law/guide/ins/02d.html',
  },
  {
    title: '顧客情報・委託先管理',
    body: 'AI導入は便利さだけでなく、入力データ、再委託、モニタリングをセットで扱う。',
    href: 'https://www.fsa.go.jp/common/law/guide/ins/02d.html',
  },
  {
    title: '人手不足×AI省力化',
    body: '「AIがすごい」ではなく、誰の何分を減らし、何に時間を戻せるかを数字で示す。',
    href: 'https://www.meti.go.jp/press/2026/04/20260424005/20260424005.html',
  },
];

function tokyoDay() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })).getDay();
}

export default function AgentDxStrategyPanel({ onSelectContentType, onCreatePinned, isSavingPinned }) {
  const today = useMemo(() => WEEKLY_PLAN.find(item => item.day === tokyoDay()) || WEEKLY_PLAN[0], []);
  const [appName, setAppName] = useState('Cocreo for Insurance');
  const [appUrl, setAppUrl] = useState(import.meta.env.VITE_AGENTDX_APP_URL || '');
  const [benefit, setBenefit] = useState('申込書・意向把握・転記業務をAIで効率化');

  const createPinned = () => {
    if (!appUrl.trim()) return;
    // ハッシュタグは付けない（Xでは検索到達に寄与せず、業者感が出てフォロー率を下げるため）。
    // 固定ポストは例外的に本文へアプリURLを1本だけ入れる。
    const text = `保険代理店の手入力を、顧客対応の時間へ。\n\n${benefit.trim()}「${appName.trim()}」を作りました。\n\nまずは触ってみてください。\n${appUrl.trim()}\n\nどの業務がいちばん重いか、よければ教えてください。`;
    onCreatePinned(text);
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-950 to-violet-900 text-white">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-200"><CalendarDays className="h-4 w-4" />今日の推奨投稿</p>
              <h2 className="text-lg font-bold">{today.title}</h2>
              <p className="mt-1 text-sm text-indigo-100">{today.goal}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-3 py-2 text-center backdrop-blur">
              <span className="block text-xs text-indigo-200">推奨時刻</span>
              <span className="text-xl font-bold">{today.time}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-indigo-100">
            <span className="rounded-full bg-white/10 px-2.5 py-1">{today.format}</span>
            {today.key && <span className="rounded-full bg-amber-300/90 px-2.5 py-1 font-bold text-amber-950">最重要枠</span>}
            <button onClick={() => onSelectContentType(today.type)} className="ml-auto rounded-lg bg-white px-3 py-2 font-semibold text-indigo-700 hover:bg-indigo-50">このテーマで作る</button>
          </div>
        </div>
      </section>

      <details className="rounded-xl border border-gray-200 bg-white" open>
        <summary className="cursor-pointer list-none p-4 font-semibold text-gray-900">
          <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-indigo-500" />週間投稿ガイダンス</span>
        </summary>
        <div className="border-t border-gray-100 px-4 pb-4">
          {WEEKLY_PLAN.map(item => (
            <button key={item.day} onClick={() => onSelectContentType(item.type)} className={`grid w-full grid-cols-[42px_54px_1fr] items-start gap-2 border-b border-gray-100 py-3 text-left last:border-0 ${item.day === today.day ? 'bg-indigo-50/60' : ''}`}>
              <span className="rounded-md bg-gray-900 px-2 py-1 text-center text-xs font-bold text-white">{item.label}</span>
              <span className="pt-1 text-xs font-semibold text-indigo-600">{item.time}</span>
              <span><strong className="block text-sm text-gray-800">{item.title}{item.key && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">最重要</span>}</strong><span className="text-xs text-gray-500">{item.goal}｜{item.format}</span></span>
            </button>
          ))}
          <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
            メイン枠は7:30-8:00、サブ枠は12:00-12:30と21:00-22:00です。Xアナリティクスの反応を月1回確認し、±30分で調整してください。
            全型に共通して、ハッシュタグは付けず、本文にリンクを入れず、最終行は読者への問いかけで終えます。
          </p>
        </div>
      </details>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-950"><TrendingUp className="h-4 w-4" />今の代理店市場で反応を取りやすい3軸</h3>
        <div className="space-y-2">
          {TREND_FOCUS.map(item => (
            <a key={item.title} href={item.href} target="_blank" rel="noreferrer" className="block rounded-lg border border-amber-200 bg-white p-3 hover:border-amber-400">
              <span className="flex items-center gap-1 text-xs font-bold text-amber-900">{item.title}<ExternalLink className="h-3 w-3" /></span>
              <span className="mt-1 block text-xs leading-relaxed text-gray-600">{item.body}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-emerald-200 bg-white p-5">
        <h3 className="flex items-center gap-2 font-bold text-gray-900"><Pin className="h-4 w-4 text-emerald-600" />固定ポスト用アプリ導線</h3>
        <p className="mt-1 text-xs text-gray-500">プロフィール訪問者に「誰向けの何のアプリか」を伝え、ダウンロードへ案内します。</p>
        <div className="mt-4 space-y-3">
          <input value={appName} onChange={event => setAppName(event.target.value)} placeholder="アプリ名" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          <input value={benefit} onChange={event => setBenefit(event.target.value)} placeholder="一番伝えたいメリット" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          <input type="url" value={appUrl} onChange={event => setAppUrl(event.target.value)} placeholder="App Storeまたは配布ページのURL" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          <button onClick={createPinned} disabled={!appUrl.trim() || isSavingPinned} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300">
            {isSavingPinned ? '作成中...' : <><Download className="h-4 w-4" />固定ポスト案を作成・保存</>}
          </button>
          <p className="flex items-start gap-1 text-[11px] text-gray-400"><Target className="mt-0.5 h-3 w-3 shrink-0" />投稿後、Xの投稿メニューから「プロフィールに固定」を選択してください。本文にURLを入れるのは、この固定ポストと引用ポストだけです（通常投稿はリンク0本・ハッシュタグ0個）。</p>
        </div>
      </section>
    </div>
  );
}
