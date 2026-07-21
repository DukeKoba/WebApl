"use client";

import { ArrowRight, AppWindow } from "lucide-react";
import Link from "next/link";

interface HeroSectionProps {
  onStart: () => void;
}

const stats = [
  { value: "1/5", label: "大手SIer比の価格" },
  { value: "2週間", label: "MVP納品までの期間" },
  { value: "App Store", label: "iOSアプリ公開・運用" },
  { value: "9,800円〜", label: "月額顧問契約" },
];

export default function HeroSection({ onStart }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Decorative orange gradient — top-right corner only */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-bl from-orange-100 via-orange-50 to-transparent opacity-70 rounded-bl-full" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 pt-24 pb-0">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-500 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
            中小企業と共に創るAI・DXブランド
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center font-black leading-tight tracking-tight mb-6">
          <span className="block text-5xl md:text-6xl lg:text-7xl text-text-primary">
            AIで、
          </span>
          <span className="block text-5xl md:text-6xl lg:text-7xl text-primary">
            中小企業を元気に。
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-center text-base md:text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
          Webアプリ開発・業務コンサル・保険代理店向けSaaS。<br className="hidden md:block" />
          大手コンサル出身 × AI活用で、経営者と共に創り、共に成長する。
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/consulting"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-sm text-base"
          >
            無料相談を申し込む
            <ArrowRight className="w-5 h-5" />
          </Link>
          <button
            onClick={onStart}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-300 text-text-primary font-medium rounded-xl hover:border-primary hover:text-primary transition-colors text-base bg-white"
          >
            <AppWindow className="w-4 h-4" />
            公開中のiOSアプリを見る
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="relative border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`py-8 px-6 text-center ${i < stats.length - 1 ? "border-r border-gray-100" : ""}`}
              >
                <div className="text-3xl md:text-4xl font-black text-primary mb-1 tracking-tight">
                  {s.value}
                </div>
                <div className="text-xs text-text-secondary">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
