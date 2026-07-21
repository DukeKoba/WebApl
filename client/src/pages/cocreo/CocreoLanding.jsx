import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Code2,
  FileText,
  Building2,
  Shield,
  Zap,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  Mail,
  Rocket,
  Target,
  HeartHandshake,
  Gift,
} from 'lucide-react';

const SERVICES = [
  {
    icon: Code2,
    title: 'Webアプリ・業務ツール開発',
    tagline: 'Cocreo Studio',
    description:
      '中小企業の業務課題をAIで解決するWebアプリ・業務ツールを最短2週間で開発。従来のSIerの1/5の価格・1/3の期間で納品します。',
    features: [
      '受託開発: 30万円〜',
      'MVP開発: 2〜4週間',
      'AI統合（Claude/GPT）対応',
      '既存システムとの連携可能',
    ],
  },
  {
    icon: FileText,
    title: '補助金申請AI・活用支援',
    tagline: 'Cocreo Grant',
    description:
      '最大450万円の補助金を活用したAI・IT導入を、申請書ドラフト作成から実装まで一気通貫で支援。AIツールで申請書を3分で下書き作成。',
    features: [
      '1次締切: 2026年5月12日',
      '補助金申請書AI（無料体験可）',
      '採択率を高める戦略立案',
      'IT導入支援事業者として対応',
    ],
    highlight: true,
  },
  {
    icon: Building2,
    title: '中小企業向け業務コンサル',
    tagline: 'Cocreo Advisory',
    description:
      '大手コンサルティングファーム出身者が、中小企業の経営課題をAI活用視点で解決。月額顧問契約で継続的な伴走支援を提供します。',
    features: [
      '月額顧問: 15万円〜',
      'スポット診断: 5万円〜',
      '補助金活用で実質負担1/2',
      'AI経営診断（無料）',
    ],
  },
  {
    icon: Shield,
    title: '保険代理店向けAIアプリ開発',
    tagline: 'Cocreo for Insurance',
    description:
      '意向把握AI・商品比較・書類自動生成・コンプライアンスチェック。保険業法に準拠した保険代理店専用のAIツールを開発します。',
    features: [
      '意向把握AI自動化',
      '重要事項説明書の自動生成',
      'コンプライアンス自動チェック',
      '乗合代理店対応',
    ],
  },
];

const FREE_TOOLS = [
  {
    icon: HeartHandshake,
    title: '保険の家族共有シート',
    description:
      '加入している保険を1枚にまとめ、もしものとき家族が保険金を請求できるようにする無料ツール。証券の写真から読み取り、印刷・PDF保存して家族に渡せます。',
    href: '/family-sheet',
    tag: '登録不要・無料',
    badge: 'NEW',
  },
  {
    icon: FileText,
    title: '補助金申請書AI',
    description:
      'デジタル化・AI導入補助金2026の申請書ドラフトをAIが3分で自動生成。まずは無料でお試しいただけます。',
    to: '/cocreo/subsidy-generator',
    tag: '無料で使える',
  },
];

const PORTFOLIO = [
  {
    title: 'AI補助金申請書ジェネレーター',
    status: '公開中',
    description:
      'デジタル化・AI導入補助金2026の申請書ドラフトをAIが3分で自動生成するWebアプリ',
    to: '/cocreo/subsidy-generator',
    icon: FileText,
    tag: '無料で使える',
  },
  {
    title: 'OptimaLrn 英検AI学習アプリ',
    status: 'App Store公開中',
    description:
      'AIが個別最適化する英検学習アプリ。OptimaLrnブランドの英検対策アプリシリーズとして展開。',
    href: 'https://webapl-ycgb.onrender.com/optimalrn',
    icon: Rocket,
    tag: 'iOS',
  },
];

const WHY_US = [
  {
    icon: Target,
    title: '大手コンサル出身の構想力',
    description:
      '大手コンサルティングファーム・外資系金融機関出身の現役コンサルタントが、現場を丁寧にヒアリングした上で、御社の文脈に沿ったAIの活用可能業務を構想。経営課題の本質から逆算し、実装可能な打ち手までつなげます。',
  },
  {
    icon: Rocket,
    title: 'AI活用の爆速開発',
    description:
      '最新のAI開発ツールを駆使し、従来の5〜10倍の生産性。2週間でMVP、1ヶ月で本番稼働が可能です。',
  },
  {
    icon: Zap,
    title: '戦略×実装のワンストップ',
    description:
      '「助言だけ」のコンサルでも「開発だけ」のエンジニアでもない。経営課題の特定から動くプロダクトまで1人で完結。',
  },
  {
    icon: Users,
    title: '中小企業と「共に創る」姿勢',
    description:
      '一方的に教えるのではなく、経営者と対話しながら一緒に最適解を作り上げる。Cocreo＝「共に創る」が原点。',
  },
];

const STATS = [
  { value: '1/5', label: '大手SIer比の価格', sub: '受託開発' },
  { value: '2週間', label: 'MVP納品までの期間', sub: '最短' },
  { value: '最大450万', label: '補助金活用額', sub: '2026年度' },
  { value: '15万円〜', label: '月額顧問契約', sub: '継続支援' },
];

function CocreoLogo({ className = '' }) {
  return (
    <div className={`relative overflow-hidden aspect-[4/1] ${className}`}>
      <img
        src="/cocreo-logo.png"
        alt="Cocreo"
        className="absolute inset-0 w-full h-full object-cover object-center"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}

export default function CocreoLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 h-24 flex items-center justify-between">
          <Link to="/cocreo" className="flex items-center">
            <CocreoLogo className="h-16 md:h-20" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[13px] tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
            <a href="#services" className="hover:text-[var(--color-primary)] transition-colors">サービス</a>
            <a href="#free-tools" className="hover:text-[var(--color-primary)] transition-colors">無料ツール</a>
            <a href="#portfolio" className="hover:text-[var(--color-primary)] transition-colors">実績</a>
            <a href="#why-us" className="hover:text-[var(--color-primary)] transition-colors">私たちについて</a>
            <a href="#contact" className="hover:text-[var(--color-primary)] transition-colors">お問い合わせ</a>
          </nav>
          <a
            href="#contact"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2 border text-[13px] font-medium rounded-full transition-all hover:text-white"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--color-primary)'; }}
          >
            無料相談
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white pt-16 md:pt-20 pb-0">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-12 lg:py-20">
            <div className="animate-slide-up">
              <h1 className="font-serif-jp text-[44px] sm:text-[56px] lg:text-[64px] leading-[1.25] font-medium mb-10" style={{ color: 'var(--color-text-primary)' }}>
                AIで中小企業を
                <br />
                元気に<span style={{ color: 'var(--color-primary)' }}>。</span>
              </h1>

              <div className="space-y-5 text-[15px] md:text-[16px] leading-[2] max-w-xl" style={{ color: 'var(--color-text-secondary)' }}>
                <p>AIの恩恵を受けるのは大企業だけではなく、人手が足りない中小企業こそ、AIで変わる必要があります。</p>
                <p>実際に手を動かしてAIを現場に落とし込む。</p>
                <p>ずっと会社に根付き、育てていけるものを一緒に作っていきたい。</p>
                <p>そんな思いで事業を始めています。</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-12">
                <a
                  href="#contact"
                  className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 text-white text-[14px] font-medium tracking-wide rounded-full transition-all shadow-sm hover:shadow-md"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <span>無料相談を申し込む</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <Link
                  to="/cocreo/subsidy-generator"
                  className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 border text-[14px] font-medium tracking-wide rounded-full transition-all"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  <FileText className="w-4 h-4" />
                  <span>補助金申請書AIを試す</span>
                </Link>
              </div>
            </div>

            <div className="relative animate-fade-in">
              <div className="hero-radiance aspect-[5/4] lg:aspect-[4/3] w-full">
                <div className="hero-radiance-motes" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className={`py-10 px-6 text-center ${i < STATS.length - 1 ? 'md:border-r' : ''} ${i < STATS.length - 2 ? 'border-b md:border-b-0' : ''}`}
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="font-serif-jp text-3xl md:text-4xl font-medium mb-2 tracking-tight" style={{ color: 'var(--color-primary)' }}>{s.value}</div>
                  <div className="text-[12px] tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>{s.label}</div>
                  <div className="text-[10px] mt-1 tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 lg:py-32" style={{ backgroundColor: 'var(--color-surface-soft)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl mb-16">
            <span className="eyebrow mb-5">Services</span>
            <h2 className="font-serif-jp text-[32px] md:text-[42px] leading-[1.45] font-medium mt-5 mb-6" style={{ color: 'var(--color-text-primary)' }}>
              経営者と共に創る、<br />4つのサービス。
            </h2>
            <p className="text-[15px] leading-[2]" style={{ color: 'var(--color-text-secondary)' }}>
              「教える」のでも「作るだけ」でもありません。戦略から実装まで一気通貫で、現場に根付くAI活用を一緒に育てていきます。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className={`relative bg-white rounded-sm p-9 transition-all hover:-translate-y-0.5 ${
                    s.highlight
                      ? 'border border-[var(--color-primary)] shadow-[0_20px_50px_-20px_rgba(201,137,31,0.35)]'
                      : 'border hover:shadow-[0_20px_50px_-30px_rgba(201,137,31,0.25)]'
                  }`}
                  style={{ borderColor: s.highlight ? undefined : 'var(--color-border)' }}
                >
                  {s.highlight && (
                    <div className="absolute -top-2.5 left-8 px-3 py-1 text-white text-[10px] tracking-[0.2em] font-medium rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}>
                      DEADLINE
                    </div>
                  )}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-secondary-light)' }}>
                      <Icon className="w-5 h-5" style={{ color: 'var(--color-primary-dark)' }} />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-[11px] tracking-[0.22em] uppercase mb-1.5" style={{ color: 'var(--color-primary)' }}>{s.tagline}</p>
                      <h3 className="font-serif-jp text-[22px] leading-tight font-medium" style={{ color: 'var(--color-text-primary)' }}>{s.title}</h3>
                    </div>
                  </div>
                  <p className="text-[14px] leading-[1.95] mb-6" style={{ color: 'var(--color-text-secondary)' }}>{s.description}</p>
                  <ul className="space-y-2.5 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    {s.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-[13px]" style={{ color: 'var(--color-text-primary)' }}>
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Free Tools */}
      <section id="free-tools" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl mb-16">
            <span className="eyebrow mb-5 inline-flex items-center gap-2">
              <Gift className="w-3.5 h-3.5" />Free Tools
            </span>
            <h2 className="font-serif-jp text-[32px] md:text-[42px] leading-[1.45] font-medium mt-5 mb-6" style={{ color: 'var(--color-text-primary)' }}>
              登録不要で、<br />いますぐ使える無料ツール。
            </h2>
            <p className="text-[15px] leading-[2]" style={{ color: 'var(--color-text-secondary)' }}>
              Cocreoが無料で公開している業務支援ツールです。ログイン不要・その場で使えます。「まず触れて役に立つ」ことを大切に、現場で本当に使えるものだけをお届けします。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 max-w-4xl">
            {FREE_TOOLS.map((t) => {
              const Icon = t.icon;
              const sharedClass = 'group block rounded-sm p-7 border transition-all hover:bg-white';
              const sharedStyle = { backgroundColor: 'var(--color-surface-soft)', borderColor: 'var(--color-border)' };
              const cardContent = (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-secondary-light)' }}>
                      <Icon className="w-5 h-5" style={{ color: 'var(--color-primary-dark)' }} />
                    </div>
                    <div className="flex items-center gap-2">
                      {t.badge && (
                        <span className="text-[10px] tracking-[0.2em] uppercase font-medium px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                          {t.badge}
                        </span>
                      )}
                      <span className="text-[10px] tracking-[0.2em] uppercase font-medium px-2.5 py-1 rounded-full bg-white border" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-secondary)' }}>
                        {t.tag}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-serif-jp text-[20px] leading-snug font-medium mb-3 group-hover:text-[var(--color-primary)] transition-colors" style={{ color: 'var(--color-text-primary)' }}>{t.title}</h3>
                  <p className="text-[13.5px] leading-[1.95] mb-6" style={{ color: 'var(--color-text-secondary)' }}>{t.description}</p>
                  <div className="flex items-center gap-1.5 text-[12px] tracking-wider uppercase font-medium group-hover:gap-3 transition-all" style={{ color: 'var(--color-primary)' }}>
                    使ってみる
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </>
              );
              return t.href ? (
                <a key={t.title} href={t.href} className={sharedClass} style={sharedStyle}>
                  {cardContent}
                </a>
              ) : (
                <Link key={t.title} to={t.to} className={sharedClass} style={sharedStyle}>
                  {cardContent}
                </Link>
              );
            })}
          </div>
          <p className="mt-8 text-[13px] max-w-4xl" style={{ color: 'var(--color-text-muted)' }}>
            ＊ 保険代理店・士業・地域の事業者の方へ: これらの無料ツールをお客様サービスとしてご活用いただけます。共同提供・ロゴ掲載などもご相談ください。
          </p>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="py-24 lg:py-32" style={{ backgroundColor: 'var(--color-surface-soft)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl mb-16">
            <span className="eyebrow mb-5">Portfolio</span>
            <h2 className="font-serif-jp text-[32px] md:text-[42px] leading-[1.45] font-medium mt-5 mb-6" style={{ color: 'var(--color-text-primary)' }}>
              実際に動いている、<br />プロダクト。
            </h2>
            <p className="text-[15px] leading-[2]" style={{ color: 'var(--color-text-secondary)' }}>
              AI活用で短期間に作り上げた実動プロダクト。同じ品質・スピードでお客様のプロジェクトにも対応します。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 max-w-4xl">
            {PORTFOLIO.map((p) => {
              const Icon = p.icon;
              const sharedClass = "group block rounded-sm p-7 border transition-all hover:shadow-[0_20px_50px_-30px_rgba(201,137,31,0.25)]";
              const sharedStyle = { backgroundColor: 'white', borderColor: 'var(--color-border)' };
              const cardContent = (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-secondary-light)' }}>
                      <Icon className="w-5 h-5" style={{ color: 'var(--color-primary-dark)' }} />
                    </div>
                    <span className="text-[10px] tracking-[0.2em] uppercase font-medium px-2.5 py-1 rounded-full border" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-secondary)', backgroundColor: 'var(--color-surface-soft)' }}>
                      {p.tag}
                    </span>
                  </div>
                  <div className="mb-3">
                    <span className="text-[11px] tracking-[0.22em] uppercase font-medium flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-primary)' }} />
                      {p.status}
                    </span>
                  </div>
                  <h3 className="font-serif-jp text-[20px] leading-snug font-medium mb-3 group-hover:text-[var(--color-primary)] transition-colors" style={{ color: 'var(--color-text-primary)' }}>{p.title}</h3>
                  <p className="text-[13.5px] leading-[1.95] mb-6" style={{ color: 'var(--color-text-secondary)' }}>{p.description}</p>
                  <div className="flex items-center gap-1.5 text-[12px] tracking-wider uppercase font-medium group-hover:gap-3 transition-all" style={{ color: 'var(--color-primary)' }}>
                    View Detail
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </>
              );
              return p.href ? (
                <a key={p.title} href={p.href} target="_blank" rel="noopener noreferrer" className={sharedClass} style={sharedStyle}>
                  {cardContent}
                </a>
              ) : (
                <Link key={p.title} to={p.to} className={sharedClass} style={sharedStyle}>
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section id="why-us" className="relative py-24 lg:py-32 text-white overflow-hidden" style={{ backgroundColor: 'var(--color-surface-dark)' }}>
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full pointer-events-none opacity-40"
             style={{ background: 'radial-gradient(circle, #C9891F 0%, rgba(201,137,31,0) 65%)' }} />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl mb-16">
            <span className="eyebrow mb-5" style={{ color: '#EFC979' }}>Why Cocreo</span>
            <h2 className="font-serif-jp text-[32px] md:text-[42px] leading-[1.45] font-medium mt-5 mb-6">
              「戦略コンサル」でも<br />「IT会社」でもない。
            </h2>
            <p className="text-[15px] leading-[2] text-white/70">
              経営者と共に創る、第3の選択肢。助言だけでも、開発だけでもない、現場に根付くAI活用のパートナーです。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10">
            {WHY_US.map((w) => {
              const Icon = w.icon;
              return (
                <div
                  key={w.title}
                  className="p-9 lg:p-10 hover:bg-white/[0.04] transition-colors"
                  style={{ backgroundColor: 'var(--color-surface-dark)' }}
                >
                  <div className="w-11 h-11 rounded-full border flex items-center justify-center mb-6" style={{ borderColor: 'var(--color-primary-light)' }}>
                    <Icon className="w-5 h-5" style={{ color: 'var(--color-primary-light)' }} />
                  </div>
                  <h3 className="font-serif-jp text-[22px] leading-snug font-medium mb-4">{w.title}</h3>
                  <p className="text-white/65 text-[14px] leading-[1.95]">{w.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 lg:py-32" style={{ backgroundColor: 'var(--color-surface-soft)' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl mb-16">
            <span className="eyebrow mb-5">Process</span>
            <h2 className="font-serif-jp text-[32px] md:text-[42px] leading-[1.45] font-medium mt-5 mb-6" style={{ color: 'var(--color-text-primary)' }}>
              お問い合わせから、<br />共創のはじまりまで。
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-2 bottom-2 w-px hidden md:block" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="space-y-0">
              {[
                { step: '01', title: '無料相談（オンライン60分）', desc: '課題・要件をヒアリング。その場で実現可能性と概算見積を提示します。', duration: '即日対応' },
                { step: '02', title: '提案書・見積書の提出', desc: 'AIを活用した解決アプローチ、開発スケジュール、費用を明記した提案書を提出。', duration: '2〜3営業日' },
                { step: '03', title: '契約・共創スタート', desc: '合意後、すぐに開発・実装を開始。経営者と対話しながら一緒に作り上げます。', duration: '契約翌日〜' },
                { step: '04', title: '納品・継続伴走', desc: '納品後も月額保守や継続的な改善支援が可能。補助金活用の支援も対応。', duration: '継続' },
              ].map((p) => (
                <div
                  key={p.step}
                  className="relative flex gap-6 md:gap-10 py-8 border-b last:border-b-0"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="relative flex-shrink-0 w-16 flex items-start justify-center">
                    <span className="relative z-10 inline-flex w-10 h-10 items-center justify-center rounded-full bg-white border font-serif-jp text-[14px] font-medium" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                      {p.step}
                    </span>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-serif-jp text-[20px] leading-snug font-medium" style={{ color: 'var(--color-text-primary)' }}>{p.title}</h3>
                      <span className="text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 bg-white rounded-full font-medium flex items-center gap-1.5 border" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-secondary)' }}>
                        <Clock className="w-3 h-3" />
                        {p.duration}
                      </span>
                    </div>
                    <p className="text-[14px] leading-[1.95]" style={{ color: 'var(--color-text-secondary)' }}>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="relative py-24 lg:py-32 bg-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[520px] h-[520px] pointer-events-none opacity-60 -translate-y-24 translate-x-24"
             style={{ background: 'radial-gradient(circle, #FAEBC8 0%, rgba(250,235,200,0) 70%)' }} />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="rounded-sm p-10 lg:p-16 border" style={{ backgroundColor: 'var(--color-surface-soft)', borderColor: 'var(--color-border)' }}>
            <div className="text-center mb-12">
              <span className="eyebrow mb-5">Contact</span>
              <h2 className="font-serif-jp text-[30px] md:text-[40px] leading-[1.45] font-medium mt-5 mb-5" style={{ color: 'var(--color-text-primary)' }}>
                まずはお話を、<br />聞かせてください。
              </h2>
              <p className="text-[15px] leading-[2]" style={{ color: 'var(--color-text-secondary)' }}>
                初回60分のオンライン相談は無料です。お気軽にご連絡ください。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px mb-10 border" style={{ backgroundColor: 'var(--color-border)', borderColor: 'var(--color-border)' }}>
              {[
                { icon: TrendingUp, label: '対応時間', value: '平日 9:00-21:00' },
                { icon: Clock, label: '初回返信', value: '24時間以内' },
                { icon: CheckCircle2, label: '初回相談', value: '無料（60分）' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="text-center p-6 bg-white">
                    <Icon className="w-5 h-5 mx-auto mb-3" style={{ color: 'var(--color-primary)' }} />
                    <div className="text-[10px] tracking-[0.22em] uppercase mb-1.5" style={{ color: 'var(--color-text-muted)' }}>{item.label}</div>
                    <div className="font-serif-jp text-[16px]" style={{ color: 'var(--color-text-primary)' }}>{item.value}</div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-3">
              <a
                href="mailto:contact@cocreo.jp?subject=Cocreo%20無料相談のお問い合わせ"
                className="w-full inline-flex items-center justify-center gap-3 py-5 text-white font-medium tracking-wide rounded-full transition-colors shadow-sm hover:shadow-md"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Mail className="w-4 h-4" />
                メールで相談する
              </a>
              <Link
                to="/cocreo/subsidy-generator"
                className="w-full inline-flex items-center justify-center gap-3 py-4 bg-white font-medium tracking-wide rounded-full transition-colors border"
                style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
              >
                <FileText className="w-4 h-4" />
                先に補助金申請書AIを試してみる
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white/60 py-16" style={{ backgroundColor: 'var(--color-surface-dark)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="mb-5 bg-white/95 inline-flex px-3 py-2 rounded-sm">
                <CocreoLogo className="h-14" />
              </div>
              <p className="text-[13px] leading-[1.95] mb-4">
                AIで中小企業を元気に。経営者と共に創り、育てていくパートナーです。
              </p>
              <p className="text-[11px] tracking-[0.18em] uppercase text-white/40">Kagary Project</p>
            </div>
            <div>
              <h4 className="text-white mb-5 text-[11px] uppercase tracking-[0.22em]">Services</h4>
              <ul className="space-y-2.5 text-[13px]">
                <li><a href="#services" className="hover:text-[var(--color-primary-light)] transition-colors">Cocreo Studio</a></li>
                <li><a href="#services" className="hover:text-[var(--color-primary-light)] transition-colors">Cocreo Grant</a></li>
                <li><a href="#services" className="hover:text-[var(--color-primary-light)] transition-colors">Cocreo Advisory</a></li>
                <li><a href="#services" className="hover:text-[var(--color-primary-light)] transition-colors">Cocreo for Insurance</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-5 text-[11px] uppercase tracking-[0.22em]">Products</h4>
              <ul className="space-y-2.5 text-[13px]">
                <li><a href="/family-sheet" className="hover:text-[var(--color-primary-light)] transition-colors">保険の家族共有シート</a></li>
                <li><Link to="/cocreo/subsidy-generator" className="hover:text-[var(--color-primary-light)] transition-colors">補助金申請書AI</Link></li>
                <li><Link to="/cocreo/consulting" className="hover:text-[var(--color-primary-light)] transition-colors">AIコンサル</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-5 text-[11px] uppercase tracking-[0.22em]">Contact</h4>
              <ul className="space-y-2.5 text-[13px]">
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  contact@cocreo.jp
                </li>
                <li><a href="#contact" className="hover:text-[var(--color-primary-light)] transition-colors">無料相談フォーム</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] tracking-wider">
            <span>© 2026 Kagary Project. All rights reserved.</span>
            <button
              onClick={() => navigate('/')}
              className="text-white/40 hover:text-white/60 transition-colors"
            >
              ← アプリ一覧に戻る
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
