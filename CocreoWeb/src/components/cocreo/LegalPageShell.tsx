import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail } from "lucide-react";

function CocreoLogo() {
  return (
    <span className="inline-flex items-center" aria-label="Cocreo">
      <Image src="/cocreo-logo.png" alt="Cocreo" width={221} height={55} className="h-[28px] w-auto" />
    </span>
  );
}

export default function LegalPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center" aria-label="Cocreo トップへ戻る">
            <CocreoLogo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>トップへ戻る</span>
          </Link>
        </div>
      </header>

      <main>
        <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="font-serif-jp mt-6 text-[32px] font-medium leading-[1.45] text-[var(--color-text-primary)] md:text-[42px]">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-[14px] leading-[2] text-[var(--color-text-secondary)] md:text-[15px]">
              {description}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 md:py-16">
          {children}
        </div>
      </main>

      <footer className="bg-[var(--color-surface-dark)] py-10 text-white/60">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-5 text-[12px] sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <span>© 2026 Cocreo. All rights reserved.</span>
            <p className="mt-1 text-white/40">Cocreo — Strategy to implementation.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="transition-colors hover:text-[var(--color-primary-light)]">
              プライバシーポリシー
            </Link>
            <Link href="/support" className="transition-colors hover:text-[var(--color-primary-light)]">
              アプリサポート
            </Link>
            <a
              href="mailto:contact@cocreo.jp"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--color-primary-light)]"
            >
              <Mail className="h-3.5 w-3.5" />
              contact@cocreo.jp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
