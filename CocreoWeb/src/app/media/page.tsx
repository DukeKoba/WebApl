"use client";

import Link from "next/link";
import {
  ArrowRight,
  Globe2,
  Sparkles,
  Newspaper,
  Mail,
  Building2,
  Briefcase,
  Scale,
  Home as HomeIcon,
  GraduationCap,
  CheckCircle2,
  Clock,
  Radio,
  Bot,
  PenLine,
  ShieldCheck,
  TrendingUp,
  Languages,
  Layers,
  Send,
  Play,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const OVERSEAS_PLAYERS = [
  { region: "米ブローカー", names: "Marsh / Aon / Gallagher / WTW / Lockton / Hub International" },
  { region: "米独立代理店", names: "Goosehead / EverQuote / Insureon / PIA / Big I 加盟店" },
  { region: "英ブローカー", names: "Howden / Ardonagh / Gallagher UK / Aston Lark" },
  { region: "欧代理店SaaS", names: "Applied Systems / Vertafore / Acturis / Open GI" },
  { region: "アジア", names: "Policybazaar / Acko / Singlife / FWD / GoBear" },
  { region: "中国", names: "Ant Insurance / Ping An / ZhongAn（代理ネットワーク）" },
];

const PILLARS = [
  {
    icon: Globe2,
    title: "海外ブローカー・代理店のAI／業務改善事例",
    badge: "MUST・毎日更新",
    description:
      "Marsh、Aon、Gallagher、Goosehead、Howden、地域の独立代理店まで。海外の代理店現場で実際に動いているAIと業務改善を、24時間以内に日本語で。原典リンク＋日本の代理店向けの示唆を1行で。",
    accent: true,
  },
  {
    icon: Building2,
    title: "国内DX事例（代理店・保険会社）",
    badge: "週3-5本",
    description:
      "hokan・Salesforce FSC導入の生現場、東京海上・SOMPO・第一生命のDXプロジェクトを、現場の実装目線で深掘り。",
  },
  {
    icon: Layers,
    title: "専業・兼業の現場ノウハウ",
    badge: "週2-3本",
    description:
      "プロ代理店の業務改革、兼業（保険×不動産／相続／資産運用／士業／FP）の連携設計。専業・兼業どちらの経営者にも明日試せる実用知を。",
  },
  {
    icon: ShieldCheck,
    title: "規制・業法動向",
    badge: "随時",
    description:
      "金融庁・IAIS・英FCA・EU Solvency II。意向把握記録の電子証跡化など、買わざるを得ない追い風の解説。",
  },
  {
    icon: Play,
    title: "ウェビナー要約",
    badge: "週3-5本",
    description:
      "業界の公開ウェビナーをAIが要約。1時間の動画を3分で読める要点に。タイムコード付きで原典に戻れる。",
  },
  {
    icon: Bot,
    title: "AI実装ハウツー",
    badge: "週1-2本",
    description:
      "Cocreo for Insuranceの実装現場で得た知見を、明日から代理店の現場で試せる手順書として公開。",
  },
];

const SAMPLE_ARTICLES = [
  {
    tag: "海外ブローカー事例",
    region: "🇺🇸 US",
    title:
      "Marsh、商業保険ブローカー向け生成AIプラットフォーム「LenAI」全社展開。提案書ドラフト工数を平均73%削減",
    excerpt:
      "アンダーライター宛て提案書のドラフト、リスクサマリー、過去類似案件の自動引当をLLMで自動化。中堅プロ代理店の法人案件業務にも直接転用可能なワークフロー。",
    date: "2026/05/24",
  },
  {
    tag: "海外代理店事例",
    region: "🇺🇸 US",
    title:
      "Goosehead Insurance、見積比較AIで募集人1人あたり成約件数が月18件→27件に",
    excerpt:
      "顧客ヒアリングを音声入力 → 8社一括見積 → 最適3社をスコアリングするフローを自社開発。日本の乗合代理店の意向把握＋商品比較工程にそのまま応用できる構造。",
    date: "2026/05/24",
  },
  {
    tag: "海外ブローカー事例",
    region: "🇬🇧 UK",
    title:
      "Aon、リテンションAIで満期更改の解約率を11.3%→6.8%に低減",
    excerpt:
      "過去5年の更改データを学習させ、解約リスク高の顧客を90日前に検知。担当者の架電優先順位を自動生成。日本代理店の継続率改善KPIに直結する事例。",
    date: "2026/05/23",
  },
  {
    tag: "海外代理店SaaS",
    region: "🇪🇺 EU",
    title:
      "Applied Systems「Applied Epic」にClaude統合。代理店募集人の事務時間が週6.2時間減",
    excerpt:
      "顧客対応メールのドラフト、約款照会、コンプライアンスチェックを代理店管理システム上で完結。日本のhokan等が今後辿る道筋。",
    date: "2026/05/23",
  },
  {
    tag: "国内DX事例",
    region: "🇯🇵 JP",
    title:
      "中堅プロ代理店A社、海外事例を参考に音声→意向把握記録のAI自動化を3週間で内製",
    excerpt:
      "INSWAVEのMarsh事例記事を起点に、Cocreo for Insurance伴走で内製化。経営者インタビューで実装プロセスを公開。",
    date: "2026/05/22",
  },
  {
    tag: "ウェビナー要約",
    region: "🌐",
    title:
      "【3分要約】Hub International CTO講演「ブローカーはAIネイティブ仲介者に進化する」",
    excerpt:
      "60分のキーノートを編集部AIが要約。タイムコード付き原典リンクで該当発言にすぐ飛べる。",
    date: "2026/05/22",
  },
];

const READER_PERSONAS = [
  {
    icon: Briefcase,
    label: "専業プロ代理店の経営者・幹部",
    desc: "募集人10-50名／乗合プロ代理店。MarshやGooseheadの実務を自社の意向把握・満期更改に置きにいきたい。",
  },
  {
    icon: HomeIcon,
    label: "兼業プレイヤー（保険×不動産／相続／FP／士業）",
    desc: "保険を起点に隣接領域へ広げる経営者。海外ブローカーのクロスセル設計から学びたい。",
  },
  {
    icon: Building2,
    label: "保険会社・MGAのDX／企画担当",
    desc: "海外ブローカー・代理店の動向を社内提案の根拠素材にしたい。英語一次ソースの和訳工数を削減。",
  },
  {
    icon: GraduationCap,
    label: "保険テック関係者・研究者",
    desc: "国内外の代理店DX動向を体系的に追いたい。INSWAVEを一次スキャナーとして使う。",
  },
];

const WORKFLOW_STEPS = [
  {
    icon: Radio,
    title: "Step 1｜自動収集",
    time: "毎朝 6:00 JST",
    desc: "海外40-50＋国内20-30ソースをRSS／API／許諾範囲のクローラで横断スキャン。本日の候補150件を編集Slackへ。",
  },
  {
    icon: Sparkles,
    title: "Step 2｜AI一次選別・要約",
    time: "6:00 - 7:00",
    desc: "Claudeが重要度スコアリングで上位30件を選定。日本の代理店向け示唆を1行つけた一次原稿を生成。",
  },
  {
    icon: PenLine,
    title: "Step 3｜人間編集チェック",
    time: "7:00 - 7:30（編集者30秒〜2分／本）",
    desc: "ファクト・誤訳・業界用語ズレを編集者が修正。「明日試せる行動」を担保する最終ゲート。",
  },
  {
    icon: Send,
    title: "Step 4｜配信",
    time: "7:30 JST 朝刊",
    desc: "Web公開・メルマガ朝刊・X／LinkedIn同時配信。読者反応を翌日のAI選別ロジックへフィードバック。",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "¥0",
    priceNote: "永久無料",
    features: [
      "朝刊メルマガ（要約版）",
      "Web記事リード冒頭",
      "X／LinkedInフォロー",
    ],
    cta: "メルマガ登録",
    href: "#newsletter",
    primary: false,
  },
  {
    name: "Premium",
    price: "¥3,980",
    priceNote: "／月（個人）",
    features: [
      "朝刊全文＋週次レポート",
      "海外原典翻訳ダイジェスト",
      "海外事例 検索DB（タグ・フィルタ）",
      "月1回 限定ウェビナー",
      "Slackコミュニティ（兼業プレイヤー交流）",
    ],
    cta: "Premium登録",
    href: "#newsletter",
    primary: true,
  },
  {
    name: "Enterprise",
    price: "¥100,000〜",
    priceNote: "／月（法人・5アカウント〜）",
    features: [
      "全アカウント分のPremium機能",
      "社内回覧・社内勉強会利用OK",
      "海外動向レポートのカスタム調査（四半期1本）",
      "編集長ヒアリング枠（月1）",
    ],
    cta: "法人プラン相談",
    href: "/consulting",
    primary: false,
  },
];

export default function MediaLandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Header />

      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="eyebrow">INSWAVE · Insurance × AI Media</span>
              <h1 className="font-serif-jp text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mt-6">
                海外のブローカー・代理店が
                <br />
                どんなAIを使っているか。
              </h1>
              <p className="mt-6 text-lg text-text-secondary leading-relaxed">
                Marsh・Aon・Gallagher・Goosehead・Howden──海外の保険ブローカーと代理店が今日試している「AIと業務改善」を、24時間以内に日本語で。
                <br className="hidden lg:block" />
                専業も兼業も。日本の保険代理店現場のための、AI編集 × 人間編集ハイブリッドメディア。
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#newsletter"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors shadow-sm"
                >
                  <Mail className="w-4 h-4" />
                  朝刊メルマガを購読（無料）
                </a>
                <a
                  href="#latest"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-border text-text-primary rounded-lg font-medium hover:bg-surface-soft transition-colors"
                >
                  最新記事を見る
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  日刊配信
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  海外40+ソース横断
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  AI執筆 × 人間編集
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  兼業特化
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="hero-radiance aspect-square max-w-md mx-auto">
                <div className="hero-radiance-motes" />
              </div>
              <div className="absolute -bottom-6 -left-2 sm:-left-6 bg-white border border-border rounded-xl shadow-lg p-4 max-w-xs animate-float">
                <div className="flex items-center gap-2 text-xs text-primary font-medium">
                  <Globe2 className="w-3.5 h-3.5" />
                  本日配信 · 17本
                </div>
                <div className="mt-1.5 text-sm font-medium text-text-primary leading-snug">
                  Marsh、生成AI「LenAI」で提案書工数73%減
                </div>
                <div className="mt-1 text-xs text-text-muted">
                  🇺🇸 海外ブローカー事例 · 2分前
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ POSITIONING ============================ */}
      <section className="py-16 bg-surface-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="eyebrow">Why INSWAVE</span>
            <h2 className="font-serif-jp text-3xl sm:text-4xl font-bold mt-4">
              「海外ブローカー・代理店×AI×日刊×日本語」の空白を埋める。
            </h2>
            <p className="mt-5 text-text-secondary leading-relaxed">
              保険毎日新聞は速報性に強くても海外動向は薄い。海外メディアは英語の壁。研究所レポートは月次・四半期。
              そして「海外の代理店・ブローカーが現場で使っているAIと業務改善」を、専業・兼業の両方に向けて毎日届けるメディアは、これまで存在しなかった。
            </p>
          </div>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden bg-white">
              <thead className="bg-amber-50 text-text-primary">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">媒体</th>
                  <th className="text-left px-4 py-3 font-medium">海外ブローカー・代理店AI</th>
                  <th className="text-left px-4 py-3 font-medium">更新頻度</th>
                  <th className="text-left px-4 py-3 font-medium">専業＋兼業</th>
                  <th className="text-left px-4 py-3 font-medium">日本語</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 text-text-secondary">既存業界紙</td>
                  <td className="px-4 py-3 text-text-muted">薄い</td>
                  <td className="px-4 py-3 text-text-muted">週次</td>
                  <td className="px-4 py-3 text-text-muted">なし</td>
                  <td className="px-4 py-3 text-text-secondary">○</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-text-secondary">海外専門誌（Coverager等）</td>
                  <td className="px-4 py-3 text-text-secondary">◎</td>
                  <td className="px-4 py-3 text-text-secondary">日次</td>
                  <td className="px-4 py-3 text-text-muted">なし</td>
                  <td className="px-4 py-3 text-text-muted">英語のみ</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-text-secondary">研究所レポート</td>
                  <td className="px-4 py-3 text-text-secondary">○</td>
                  <td className="px-4 py-3 text-text-muted">月次／四半期</td>
                  <td className="px-4 py-3 text-text-muted">なし</td>
                  <td className="px-4 py-3 text-text-secondary">○</td>
                </tr>
                <tr className="bg-amber-50/50">
                  <td className="px-4 py-3 font-medium text-primary-dark">INSWAVE</td>
                  <td className="px-4 py-3 font-medium text-primary-dark">◎（MUST柱）</td>
                  <td className="px-4 py-3 font-medium text-primary-dark">日刊</td>
                  <td className="px-4 py-3 font-medium text-primary-dark">◎（独占）</td>
                  <td className="px-4 py-3 font-medium text-primary-dark">◎</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ============================ CONTENT PILLARS ============================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="eyebrow">Content Pillars</span>
            <h2 className="font-serif-jp text-3xl sm:text-4xl font-bold mt-4">
              6つの柱で、保険代理店×AIを網羅する。
            </h2>
            <p className="mt-5 text-text-secondary">
              中でも<strong>「海外ブローカー・代理店のAI／業務改善事例」</strong>はINSWAVEの背骨です。毎日5-10本、海外40+ソース（ブローカー・独立代理店・代理店SaaS）から漏れなく拾います。
            </p>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className={`p-6 rounded-xl border transition-all hover:shadow-md ${
                    pillar.accent
                      ? "border-primary bg-gradient-to-br from-amber-50 to-white"
                      : "border-border bg-white"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                      pillar.accent ? "bg-primary text-white" : "bg-amber-50 text-primary"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary">{pillar.title}</h3>
                  </div>
                  <span
                    className={`mt-2 inline-block text-xs px-2 py-0.5 rounded ${
                      pillar.accent
                        ? "bg-primary text-white"
                        : "bg-surface-soft text-text-secondary"
                    }`}
                  >
                    {pillar.badge}
                  </span>
                  <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Overseas players strip */}
          <div className="mt-12 p-6 rounded-xl bg-surface-dark text-white">
            <div className="flex items-start gap-3">
              <Globe2 className="w-5 h-5 text-amber-300 flex-none mt-1" />
              <div>
                <div className="text-sm font-medium text-amber-200">
                  毎日カバーする海外ブローカー・代理店（抜粋）
                </div>
                <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                  {OVERSEAS_PLAYERS.map((p) => (
                    <div key={p.region} className="flex gap-3">
                      <span className="text-amber-300 font-medium w-12 flex-none">{p.region}</span>
                      <span className="text-white/80">{p.names}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ SAMPLE ARTICLES ============================ */}
      <section id="latest" className="py-20 bg-surface-soft border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="eyebrow">Latest Issue</span>
              <h2 className="font-serif-jp text-3xl sm:text-4xl font-bold mt-4">
                朝刊サンプル｜本日の17本から
              </h2>
            </div>
            <div className="text-sm text-text-muted">
              ※ ローンチ前のサンプル表示。本番ローンチ時は実記事に差し替わります。
            </div>
          </div>

          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SAMPLE_ARTICLES.map((article, i) => (
              <article
                key={i}
                className="p-6 bg-white border border-border rounded-xl hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-primary-dark rounded font-medium">
                    {article.tag}
                  </span>
                  <span className="text-text-muted">{article.region}</span>
                </div>
                <h3 className="mt-3 font-serif-jp font-bold text-lg leading-snug text-text-primary group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                  {article.excerpt}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.date}
                  </span>
                  <span className="inline-flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    続きを読む
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ AI WORKFLOW ============================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="eyebrow">AI Editorial Workflow</span>
            <h2 className="font-serif-jp text-3xl sm:text-4xl font-bold mt-4">
              AI が書き、人間が責任を持つ。
            </h2>
            <p className="mt-5 text-text-secondary leading-relaxed">
              すべての記事に「原典リンク」を明示。AIは要約と翻訳と一次原稿を担当し、人間編集者がファクトと業界用語と"明日試せる1行"を担保します。
              訂正は迅速に、透明に。
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {WORKFLOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative p-6 rounded-xl border border-border bg-white">
                  <div className="w-11 h-11 rounded-lg bg-primary text-white flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="mt-4 font-semibold text-text-primary">{step.title}</div>
                  <div className="mt-1 text-xs text-primary font-medium">{step.time}</div>
                  <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 p-6 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-4">
            <Languages className="w-6 h-6 text-primary flex-none mt-0.5" />
            <div>
              <div className="font-semibold text-text-primary">
                編集ポリシー: AI執筆を隠さない。
              </div>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                INSWAVEは「AIが書いて、人間が編集する」ことを明示します。記事末尾に編集者名と原典リンクを置き、誤りは48時間以内に訂正告知する運用ポリシーで、AI媒体の信頼性をリードします。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ READER PERSONAS ============================ */}
      <section className="py-20 bg-surface-soft border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="eyebrow">For Whom</span>
            <h2 className="font-serif-jp text-3xl sm:text-4xl font-bold mt-4">
              こんな人に読まれるメディアです。
            </h2>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {READER_PERSONAS.map((persona) => {
              const Icon = persona.icon;
              return (
                <div
                  key={persona.label}
                  className="p-6 bg-white border border-border rounded-xl"
                >
                  <Icon className="w-7 h-7 text-primary" />
                  <h3 className="mt-4 font-semibold text-text-primary">{persona.label}</h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">{persona.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================ NEWSLETTER ============================ */}
      <section id="newsletter" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="eyebrow justify-center">Newsletter</span>
          <h2 className="font-serif-jp text-3xl sm:text-4xl font-bold mt-4">
            朝刊メルマガを購読する（無料）
          </h2>
          <p className="mt-5 text-text-secondary">
            毎朝 7:30 JST に、海外の保険×AI 5-10本＋国内DX動向を10分で読めるダイジェストでお届け。いつでも解除可能。
          </p>

          <form
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            onSubmit={(e) => {
              e.preventDefault();
              alert("メルマガ登録ありがとうございます！（プレローンチ受付）");
            }}
          >
            <input
              type="email"
              required
              placeholder="your-email@example.com"
              className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary bg-white"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors inline-flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              登録する
            </button>
          </form>
          <p className="mt-3 text-xs text-text-muted">
            プレローンチ受付中。正式配信は2026年Q3予定。
          </p>
        </div>
      </section>

      {/* ============================ PRICING ============================ */}
      <section className="py-20 bg-surface-soft border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="eyebrow">Plans</span>
            <h2 className="font-serif-jp text-3xl sm:text-4xl font-bold mt-4">
              個人にも、法人にも。
            </h2>
            <p className="mt-5 text-text-secondary">
              無料で始めて、深く読みたくなったらPremium。社内回覧したくなったらEnterprise。
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`p-7 rounded-xl border bg-white ${
                  plan.primary ? "border-primary shadow-lg scale-[1.02]" : "border-border"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif-jp text-xl font-bold text-text-primary">{plan.name}</h3>
                  {plan.primary && (
                    <span className="text-xs px-2 py-0.5 bg-primary text-white rounded font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-text-primary">{plan.price}</div>
                  <div className="text-sm text-text-muted">{plan.priceNote}</div>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-none mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-7 inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium transition-colors ${
                    plan.primary
                      ? "bg-primary text-white hover:bg-primary-dark"
                      : "bg-white border border-border text-text-primary hover:bg-surface-soft"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ LEAD TO COCREO ============================ */}
      <section className="py-20 bg-surface-dark text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs tracking-widest text-amber-300 uppercase">
                Cocreo for Insurance
              </span>
              <h2 className="font-serif-jp text-3xl sm:text-4xl font-bold mt-4 leading-snug">
                記事で読んだAIを、
                <br />
                あなたの代理店で実装する。
              </h2>
              <p className="mt-5 text-white/70 leading-relaxed">
                INSWAVEを運営するCocreoは、保険代理店向けAIアプリ開発・受託・顧問サービス
                <strong className="text-white"> Cocreo for Insurance </strong>
                を提供しています。「海外の事例を自社で再現したい」「申込書AI入力代行を導入したい」——記事を読んで終わりにせず、現場の業務に置きに行きます。
              </p>

              <div className="mt-8 grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <TrendingUp className="w-4 h-4 text-amber-300 flex-none" />
                  <span>初期実装 30〜80万円</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <TrendingUp className="w-4 h-4 text-amber-300 flex-none" />
                  <span>月額顧問 10〜35万円</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <TrendingUp className="w-4 h-4 text-amber-300 flex-none" />
                  <span>48時間プロトタイプ可</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <TrendingUp className="w-4 h-4 text-amber-300 flex-none" />
                  <span>業法準拠を前提に設計</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-7 border border-white/10">
              <div className="text-amber-300 text-sm font-medium">無料・5分</div>
              <h3 className="font-serif-jp text-2xl font-bold mt-2">
                代理店AI導入ポテンシャル診断
              </h3>
              <p className="mt-3 text-white/70 text-sm leading-relaxed">
                10問の質問で、あなたの代理店業務のうちAI化できる工程と、見込まれる時間削減量を可視化します。診断後に無料相談予約も可能。
              </p>
              <Link
                href="/consulting"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-amber-300 text-text-primary rounded-lg font-medium hover:bg-amber-200 transition-colors"
              >
                <Newspaper className="w-4 h-4" />
                無料診断を始める
              </Link>
              <div className="mt-3 text-xs text-white/50">
                ※ Cocreo for Insuranceのサービスに遷移します。
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ FOOTER ============================ */}
      <Footer />
    </div>
  );
}
