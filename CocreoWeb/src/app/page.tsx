"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Apple,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  ExternalLink,
  Handshake,
  Mail,
  PenTool,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const SERVICES = [
  {
    icon: PenTool,
    number: "01",
    title: "信頼をつくるWebサイト",
    description:
      "代理店の強みや対応方針を整理し、相談前の不安を減らす情報設計へ。制作物ではなく、問い合わせにつながる営業基盤として設計します。",
    deliverables: ["顧客目線の情報設計", "スマホ・SEO対応", "公開後の改善設計"],
  },
  {
    icon: Workflow,
    number: "02",
    title: "現場で使われる業務アプリ",
    description:
      "意向把握書の作成、乗合先商品の比較推奨、事故受付の初動記録など、時間がかかる業務を整理。小さな試作から始め、現場で確かめながら仕組みにします。",
    deliverables: ["業務フローの可視化", "AI・自動化の試作", "運用ルールまで整備"],
  },
  {
    icon: TrendingUp,
    number: "03",
    title: "続けられる集客・発信",
    description:
      "Web、記事、メール、SNSを別々に運用せず、一つの顧客導線として設計。下書きと運用ルールを整えます（募集文書の最終考査・使用承認は各保険会社の基準に従い、貴社の判断で確定いただきます）。",
    deliverables: ["テーマ・導線設計", "コンテンツ制作支援", "数値を見た月次改善"],
  },
];

const IOS_APPS = [
  {
    title: "AI英検準1級 Pass",
    category: "英検準1級",
    href: "https://apps.apple.com/jp/app/id6762535365",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/70/ae/a5/70aea53a-6e63-fc71-874a-e9b1f3172a33/AppIcon-0-0-1x_U007ephone-0-1-85-220.png/512x512bb.jpg",
  },
  {
    title: "AI英検2級 Pass",
    category: "英検2級",
    href: "https://apps.apple.com/jp/app/id6761838561",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/47/23/95/47239519-8268-981e-b351-cbea7f369b74/AppIcon-0-0-1x_U007ephone-0-1-85-220.png/512x512bb.jpg",
  },
  {
    title: "ITパスポート - AI Pass",
    category: "ITパスポート",
    href: "https://apps.apple.com/jp/app/id6763835091",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/9b/21/75/9b2175d6-8ef3-0105-8c68-7ac965f89206/AppIcon-0-0-1x_U007ephone-0-1-85-220.png/512x512bb.jpg",
  },
];

const COMPARISON = [
  { label: "相談の起点", consulting: "経営戦略", vendor: "決まった要件", cocreo: "現場の困りごと" },
  { label: "主な成果物", consulting: "提案書", vendor: "システム", cocreo: "使われる業務の仕組み" },
  { label: "実装後", consulting: "別途支援", vendor: "保守中心", cocreo: "計測・改善まで伴走" },
  { label: "進め方", consulting: "調査して提案", vendor: "要件定義して開発", cocreo: "小さく試して共に育てる" },
];

const FAQS = [
  {
    question: "どこまで無料ですか？",
    answer:
      "初回60分の相談、課題の整理、取り組み方の初期提案までは無料です。お試し制作の範囲と、その後の実装・運用費用は内容に応じて事前に明示します。目安として、初期実装30〜80万円、月額顧問10〜35万円です。",
  },
  {
    question: "まだ要件が決まっていなくても相談できますか？",
    answer:
      "はい。むしろ『何から手を付けるべきか分からない』段階を想定しています。業務と経営課題を一緒に整理し、AIを使わない選択肢も含めて優先順位を決めます。",
  },
  {
    question: "相談時に顧客情報は必要ですか？",
    answer:
      "初回相談で顧客の個人情報は必要ありません。実装段階でデータを扱う場合は、利用目的・権限・保存方法を要件に合わせて個別に設計します。",
  },
  {
    question: "募集文書や法令への対応は任せられますか？",
    answer:
      "AIはあくまで下書き支援であり、そのまま募集文書として使用することは推奨していません。公開前に各保険会社の考査（事前審査）を経ることを前提に設計します。",
  },
  {
    question: "乗合代理店です。比較推奨販売の理由説明の準備が負担になっています。相談できますか？",
    answer:
      "はい、よくあるご相談です。各社の商品情報や手数料体系を整理し、理由説明資料の下書きを効率化する仕組みを一緒に設計します。ただし、比較推奨の説明内容そのものは、貴社のコンプライアンス基準と各保険会社の考査基準に沿って最終的に貴社にご判断いただく前提で進めます。",
  },
  {
    question: "今の制作会社やシステムから乗り換えても大丈夫ですか？",
    answer:
      "現状のドメイン・記事・顧客データを精査した上で移行計画を提示します。既存契約の解約時期に合わせて進められるため、今すぐ切り替える必要はありません。",
  },
];

const INQUIRY_TYPES = ["ホームページ", "業務改善・アプリ", "集客・マーケティング", "何から始めるか相談"];

function BrandMark({ light = false }: { light?: boolean }) {
  if (light) {
    // Dark backgrounds: the logo file has an opaque white canvas, so it
    // sits on a small white plate rather than being placed directly on ink.
    return (
      <span className="inline-flex items-center rounded-xl bg-white px-3 py-1.5 shadow-sm" aria-label="Cocreo">
        <Image src="/cocreo-logo.png" alt="Cocreo" width={221} height={55} priority className="h-[26px] w-auto" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center" aria-label="Cocreo">
      <Image src="/cocreo-logo.png" alt="Cocreo" width={221} height={55} priority className="h-[30px] w-auto" />
    </span>
  );
}

function TrackedAnchor({
  href,
  event,
  location,
  className,
  children,
}: {
  href: string;
  event: string;
  location: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => trackEvent(event, { location })}
    >
      {children}
    </a>
  );
}

export default function Home() {
  const [inquiryType, setInquiryType] = useState(INQUIRY_TYPES[0]);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [message, setMessage] = useState("");

  const handleInquiry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    trackEvent("generate_lead", { inquiry_type: inquiryType, location: "contact_form" });

    const subject = `【Cocreo無料相談】${inquiryType}について`;
    const body = [
      `会社・代理店名：${companyName}`,
      `お名前：${contactName}`,
      `ご相談テーマ：${inquiryType}`,
      "",
      "ご相談内容：",
      message,
    ].join("\n");

    window.location.href = `mailto:contact@cocreo.jp?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-white text-[var(--color-text-primary)]">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Cocreo ホーム">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-7 text-[13px] font-medium text-[var(--color-text-secondary)] lg:flex" aria-label="メインナビゲーション">
            <a href="#services" className="transition-colors hover:text-[var(--color-primary)]">支援領域</a>
            <a href="#difference" className="transition-colors hover:text-[var(--color-primary)]">選ばれる理由</a>
            <a href="#proof" className="transition-colors hover:text-[var(--color-primary)]">iOSアプリ</a>
            <a href="#faq" className="transition-colors hover:text-[var(--color-primary)]">よくある質問</a>
          </nav>
          <TrackedAnchor
            href="#contact"
            event="select_contact"
            location="header"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[var(--color-primary)] sm:px-5 sm:text-[13px]"
          >
            60分の無料相談 <ArrowRight className="h-3.5 w-3.5" />
          </TrackedAnchor>
        </div>
      </header>

      <main>
        <section className="hero-grid relative overflow-hidden border-b border-[var(--color-border)]">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-28">
            <div className="relative z-10 animate-slide-up">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white px-3.5 py-2 text-[11px] font-bold tracking-[0.12em] text-[var(--color-text-secondary)]">
                <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
                保険代理店に特化した AI・DX伴走
              </div>
              <h1 className="font-serif-jp max-w-[780px] text-[40px] font-bold leading-[1.32] tracking-[0.01em] sm:text-[54px] lg:text-[64px]">
                「AIで何ができるか」で終わらせない。
                <br />
                <span className="text-[var(--color-primary)]">意向把握も、乗合の比較も</span>、現場が回る仕組みへ。
              </h1>
              <p className="mt-7 max-w-2xl text-[15px] leading-[2] text-[var(--color-text-secondary)] sm:text-[17px]">
                Cocreoは、保険代理店の経営課題を整理し、Web・業務アプリ・集客施策として実装する伴走パートナーです。
                提案書を渡して終わりにせず、自社のエンジニアが実際に手を動かして形にします。
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <TrackedAnchor
                  href="#contact"
                  event="select_contact"
                  location="hero"
                  className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-7 text-[14px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(216,87,27,0.75)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)]"
                >
                  課題を無料で整理する
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </TrackedAnchor>
                <TrackedAnchor
                  href="#proof"
                  event="view_proof"
                  location="hero"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white px-7 text-[14px] font-bold transition-colors hover:border-[var(--color-ink)]"
                >
                  実際のプロダクトを見る
                </TrackedAnchor>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[12px] font-medium text-[var(--color-text-secondary)]">
                {["初回相談 60分無料", "24時間以内に初回返信", "オンライン・全国対応"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-[var(--color-primary)]" /> {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative animate-fade-in lg:pl-3">
              <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-[var(--color-primary)]/12 blur-3xl" />
              <div className="relative overflow-hidden rounded-[30px] border-[8px] border-white bg-white shadow-[0_32px_80px_-34px_rgba(20,33,31,0.55)]">
                <Image
                  src="/cocreo-collaboration-hero.png"
                  alt="保険代理店の経営者とCocreoの担当者が一緒に業務改善を考えている様子"
                  width={1717}
                  height={916}
                  priority
                  className="h-auto w-full"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--color-ink)]/80 to-transparent px-6 pb-5 pt-16 text-white">
                  <p className="text-[12px] font-bold sm:text-[13px]">一緒に考え、一緒につくる。</p>
                  <p className="mt-1 text-[10px] text-white/65 sm:text-[11px]">現場の言葉から始まる、Cocreoの伴走スタイル</p>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-2 hidden items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 shadow-xl sm:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary-soft)]"><Sparkles className="h-4 w-4 text-[var(--color-primary)]" /></span>
                <div><p className="text-[10px] text-[var(--color-text-muted)]">Cocreo method</p><p className="text-[12px] font-bold">対話 → 試作 → 改善</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:px-8 lg:grid-cols-4 lg:px-12">
            {[
              { value: "保険代理店", label: "業界を絞った支援" },
              { value: "戦略 × 実装", label: "一気通貫で担当" },
              { value: "小さく試す", label: "初期リスクを抑える" },
              { value: "App Store", label: "iOSアプリを公開・運用" },
            ].map((item, index) => (
              <div key={item.value} className={`px-3 py-8 text-center sm:py-10 ${index % 2 === 0 ? "border-r" : ""} ${index < 2 ? "border-b lg:border-b-0" : ""} lg:border-r lg:last:border-r-0 border-[var(--color-border)]`}>
                <p className="font-serif-jp text-[20px] font-bold sm:text-[24px]">{item.value}</p>
                <p className="mt-1.5 text-[11px] text-[var(--color-text-muted)]">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="services" className="scroll-mt-24 bg-white py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <span className="eyebrow">What we solve</span>
                <h2 className="font-serif-jp mt-5 text-[32px] font-bold leading-[1.45] sm:text-[42px]">
                  ツールではなく、
                  <br />経営課題から始める。
                </h2>
                <p className="mt-5 text-[14px] leading-[2] text-[var(--color-text-secondary)]">
                  「AIで何ができるか」ではなく、「何が経営を止めているか」から整理します。必要な手段だけを組み合わせます。
                </p>
              </div>
              <div className="grid gap-4">
                {SERVICES.map((service) => {
                  const Icon = service.icon;
                  return (
                    <article key={service.number} className="group grid gap-5 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-6 transition-all hover:border-[var(--color-border-strong)] hover:bg-white hover:shadow-[0_24px_60px_-42px_rgba(20,33,31,0.55)] sm:grid-cols-[58px_1fr] sm:p-8">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[var(--color-primary)] shadow-sm">
                        <Icon className="h-6 w-6" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="text-[20px] font-bold sm:text-[23px]">{service.title}</h3>
                          <span className="text-[11px] font-bold tracking-[0.18em] text-[var(--color-primary)]">{service.number}</span>
                        </div>
                        <p className="mt-3 text-[14px] leading-[1.9] text-[var(--color-text-secondary)]">{service.description}</p>
                        <ul className="mt-5 flex flex-wrap gap-2">
                          {service.deliverables.map((item) => (
                            <li key={item} className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-secondary)]">{item}</li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="difference" className="scroll-mt-24 bg-[var(--color-ink)] py-20 text-white md:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="max-w-3xl">
              <span className="eyebrow eyebrow-light">Difference</span>
              <h2 className="font-serif-jp mt-5 text-[32px] font-bold leading-[1.45] sm:text-[42px]">
                コンサルの視点と、
                <br />開発会社の実行力を、一つに。
              </h2>
              <p className="mt-5 text-[14px] leading-[2] text-white/60 sm:text-[15px]">
                提案書を渡して終わりでも、決められたものを作るだけでもありません。経営と現場の間に入り、成果が出るまで同じ目線で改善します。
              </p>
            </div>

            <div className="mt-12 overflow-x-auto rounded-[22px] border border-white/10">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[0.8fr_1fr_1fr_1.15fr] border-b border-white/10 bg-white/[0.04] text-[12px] font-bold">
                  <div className="p-5 text-white/35">比較</div>
                  <div className="p-5 text-white/55">戦略コンサル</div>
                  <div className="p-5 text-white/55">開発会社</div>
                  <div className="border-l border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 p-5 text-[var(--color-primary-light)]">Cocreo</div>
                </div>
                {COMPARISON.map((row) => (
                  <div key={row.label} className="grid grid-cols-[0.8fr_1fr_1fr_1.15fr] border-b border-white/10 text-[13px] last:border-b-0">
                    <div className="p-5 font-bold text-white/75">{row.label}</div>
                    <div className="p-5 text-white/45">{row.consulting}</div>
                    <div className="p-5 text-white/45">{row.vendor}</div>
                    <div className="flex items-center gap-2 border-l border-[var(--color-primary)]/40 bg-[var(--color-primary)]/[0.07] p-5 font-bold text-white">
                      <CheckCircle2 className="h-4 w-4 flex-none text-[var(--color-primary-light)]" /> {row.cocreo}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { icon: BriefcaseBusiness, title: "保険代理店を理解する", text: "意向把握・乗合対応・手数料体系まで、代理店特有の制約を前提に設計します。" },
                { icon: Code2, title: "自分たちで実装する", text: "企画から試作、公開までを分断せず、意思決定の速度を保ちます。" },
                { icon: Handshake, title: "一緒に運用する", text: "納品をゴールにせず、現場の反応と数値を見ながら改善します。" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
                    <Icon className="h-5 w-5 text-[var(--color-primary-light)]" />
                    <h3 className="mt-4 text-[16px] font-bold">{item.title}</h3>
                    <p className="mt-2 text-[12px] leading-[1.8] text-white/50">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="proof" className="scroll-mt-24 bg-[var(--color-surface-soft)] py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <span className="eyebrow">Proven execution</span>
                <h2 className="font-serif-jp mt-5 text-[32px] font-bold leading-[1.45] sm:text-[42px]">
                  提案するだけでなく、
                  <br />保険代理店向けアプリも自社開発。
                </h2>
              </div>
              <p className="max-w-md text-[13px] leading-[1.9] text-[var(--color-text-secondary)]">
                企画、設計、開発、リリース後の改善まで自ら実践します。教育アプリは、Cocreoとは異なるブランドイメージの「OptimaLrn」で展開しています。
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-[26px] border border-[var(--color-border-strong)] bg-white shadow-[0_30px_70px_-40px_rgba(20,33,31,0.45)]">
              <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center">
                <Image
                  src="/cocreo-agent-dx-icon.png"
                  alt="Cocreo代理店DX アプリアイコン"
                  width={96}
                  height={96}
                  className="h-20 w-20 flex-none rounded-[22px] shadow-md sm:h-24 sm:w-24"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary-dark)]">
                      自社開発・保険代理店向け
                    </span>
                    <span className="rounded-full border border-[var(--color-border-strong)] px-3 py-1 text-[10px] font-bold text-[var(--color-text-secondary)]">
                      App Store 公開準備中
                    </span>
                  </div>
                  <h3 className="mt-3 text-[22px] font-bold sm:text-[26px]">Cocreo代理店DX</h3>
                  <p className="mt-2 max-w-2xl text-[13px] leading-[1.9] text-[var(--color-text-secondary)] sm:text-[14px]">
                    保険代理店の毎日の情報収集と業務改善を、無料・ログイン不要で支援するiOSアプリです。Cocreoが自ら企画から開発、リリース後の運用改善までを一気通貫で手がけています。
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {["保険関連ニュース", "生保・損保 商品比較", "業務改善チェック", "Office時短レシピ"].map((feature) => (
                      <li key={feature} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                    <Link href="/support" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-dark)]">
                      サポートページを見る <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link href="/privacy" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]">
                      プライバシーポリシー <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="optima-brand mt-5 flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg"><Apple className="h-5 w-5" /></span>
                <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-500">Learning app brand</p><p className="text-[24px] font-black tracking-[-0.04em] text-slate-950">OptimaLrn</p></div>
              </div>
              <p className="max-w-lg text-[12px] leading-[1.8] text-slate-500">「努力を科学する」を軸に、英検・資格学習のiOSアプリを展開する独立ブランドです。保険領域とは別事業ですが、企画からリリース・運用までを自社で継続してきた実績の証明として、一部を抜粋して掲載しています。</p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {IOS_APPS.map((app) => {
                return (
                  <a
                    key={app.title}
                    href={app.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent("select_content", { content_name: app.title, location: "ios_apps" })}
                    className="group flex items-center gap-4 rounded-[22px] border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_22px_50px_-38px_rgba(15,23,42,0.55)] sm:p-5"
                  >
                    <img src={app.artwork} alt="" className="h-16 w-16 flex-none rounded-[16px] shadow-md sm:h-[72px] sm:w-[72px]" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-500">{app.category}</p>
                      <h3 className="mt-1 line-clamp-2 text-[14px] font-bold leading-snug text-slate-950 sm:text-[15px]">{app.title}</h3>
                      <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500">App Storeで見る <ExternalLink className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
            <div>
              <span className="eyebrow">First step</span>
              <h2 className="font-serif-jp mt-5 text-[32px] font-bold leading-[1.45] sm:text-[42px]">小さく確かめてから、決める。</h2>
              <p className="mt-5 text-[14px] leading-[2] text-[var(--color-text-secondary)]">
                無料相談の目的は契約を急ぐことではなく、取り組む価値がある課題かを見極めることです。
              </p>
            </div>
            <ol className="space-y-3">
              {[
                { step: "01", title: "60分の無料相談", text: "現状、目標、制約を伺い、優先すべき課題を一緒に整理します。" },
                { step: "02", title: "初期提案・お試し", text: "成果指標、進め方、お試し制作の範囲、継続時の費用を明示します。" },
                { step: "03", title: "実装と運用", text: "合意した範囲から小さく始め、現場の反応を見ながら改善します。" },
              ].map((item) => (
                <li key={item.step} className="grid grid-cols-[46px_1fr] gap-5 rounded-2xl border border-[var(--color-border)] p-5 sm:p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-ink)] text-[11px] font-bold text-white">{item.step}</span>
                  <div>
                    <h3 className="text-[16px] font-bold">{item.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-[1.8] text-[var(--color-text-secondary)]">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 border-y border-[var(--color-border)] bg-[var(--color-surface-soft)] py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <div className="text-center">
              <span className="eyebrow">FAQ</span>
              <h2 className="font-serif-jp mt-5 text-[32px] font-bold sm:text-[42px]">相談前のよくある質問</h2>
            </div>
            <div className="mt-10 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {FAQS.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[15px] font-bold sm:text-[16px]">
                    <span className="flex items-start gap-3"><span className="text-[var(--color-primary)]">Q.</span>{faq.question}</span>
                    <ChevronRight className="h-4 w-4 flex-none transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="ml-7 mt-4 pr-8 text-[13px] leading-[1.9] text-[var(--color-text-secondary)] sm:text-[14px]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 bg-white py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
            <div className="overflow-hidden rounded-[28px] bg-[var(--color-ink)] text-white shadow-[0_38px_90px_-50px_rgba(20,33,31,0.7)]">
              <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
                <div className="border-b border-white/10 p-8 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-primary-light)]">Free consultation</span>
                  <h2 className="font-serif-jp mt-5 text-[32px] font-bold leading-[1.45] sm:text-[40px]">
                    いまの課題を、
                    <br />60分で整理します。
                  </h2>
                  <p className="mt-5 text-[13px] leading-[1.9] text-white/60 sm:text-[14px]">
                    依頼内容が決まっていなくても大丈夫です。相談テーマを選び、分かる範囲でお聞かせください。
                  </p>
                  <div className="mt-8 space-y-3 text-[12px] text-white/70">
                    {["オンライン・全国対応", "初回返信は24時間以内", "相談時に顧客の個人情報は不要"].map((item) => (
                      <p key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--color-primary-light)]" />{item}</p>
                    ))}
                  </div>
                  <div className="mt-10 border-t border-white/10 pt-6">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Direct email</p>
                    <a
                      href="mailto:contact@cocreo.jp"
                      onClick={() => trackEvent("select_contact", { location: "direct_email" })}
                      className="mt-2 inline-flex items-center gap-2 text-[14px] font-bold hover:text-[var(--color-primary-light)]"
                    >
                      <Mail className="h-4 w-4" /> contact@cocreo.jp
                    </a>
                  </div>
                </div>

                <form onSubmit={handleInquiry} className="bg-white p-8 text-[var(--color-text-primary)] sm:p-10 lg:p-12">
                  <div>
                    <p className="text-[12px] font-bold">相談したいテーマ</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {INQUIRY_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setInquiryType(type)}
                          aria-pressed={inquiryType === type}
                          className={`rounded-xl border px-3 py-3 text-left text-[11px] font-bold transition-colors sm:text-[12px] ${inquiryType === type ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]" : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="text-[12px] font-bold">
                      会社・代理店名 <span className="text-[var(--color-primary)]">*</span>
                      <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="contact-input mt-2" autoComplete="organization" placeholder="例）○○保険代理店" />
                    </label>
                    <label className="text-[12px] font-bold">
                      お名前 <span className="text-[var(--color-primary)]">*</span>
                      <input required value={contactName} onChange={(e) => setContactName(e.target.value)} className="contact-input mt-2" autoComplete="name" placeholder="例）山田 太郎" />
                    </label>
                  </div>
                  <label className="mt-4 block text-[12px] font-bold">
                    ご相談内容 <span className="font-normal text-[var(--color-text-muted)]">（任意）</span>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="contact-input mt-2 min-h-28 resize-y" placeholder="いま困っていることや、実現したいことをご記入ください。" />
                  </label>
                  <button type="submit" className="group mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 text-[14px] font-bold text-white transition-all hover:bg-[var(--color-primary-dark)]">
                    入力内容をメールで送る
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <p className="mt-3 text-center text-[10px] leading-relaxed text-[var(--color-text-muted)]">
                    ボタンを押すと、入力内容を反映したメール作成画面が開きます。
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[var(--color-surface-dark)] py-12 text-white/55">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid gap-9 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <BrandMark light />
              <p className="mt-4 max-w-sm text-[12px] leading-[1.9]">保険代理店の経営課題を、現場で使われる仕組みへ。対話から実装、運用改善まで伴走します。</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Service</p>
              <div className="mt-4 space-y-2.5 text-[12px]">
                <a href="#services" className="block hover:text-white">支援領域</a>
                <a href="#difference" className="block hover:text-white">Cocreoの違い</a>
                <a href="#proof" className="block hover:text-white">iOSアプリ</a>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Information</p>
              <div className="mt-4 space-y-2.5 text-[12px]">
                <a href="mailto:contact@cocreo.jp" className="block hover:text-white">contact@cocreo.jp</a>
                <Link href="/privacy" className="block hover:text-white">プライバシーポリシー</Link>
                <Link href="/support" className="block hover:text-white">サポート</Link>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-[10px] sm:flex-row">
            <span>© 2026 Cocreo. All rights reserved.</span>
            <span>Cocreo — Strategy to implementation.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
