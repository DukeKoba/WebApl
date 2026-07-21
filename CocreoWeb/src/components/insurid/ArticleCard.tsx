import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import { type Article, CATEGORY_LABELS } from "@/lib/insurid/mock-articles";
import RegionFlag from "./RegionFlag";

interface ArticleCardProps {
  article: Article;
  variant?: "hero" | "list" | "compact";
  rank?: number;
  imageUrl?: string;   // regular ~1080px
  smallUrl?: string;   // small ~400px
  thumbUrl?: string;   // thumb ~150px (compact用)
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit", timeZone: "Asia/Tokyo" });
}

const ACCENT_BG: Record<string, string> = {
  broker:     "bg-blue-600",
  insurer:    "bg-purple-600",
  market:     "bg-amber-600",
  claims:     "bg-orange-600",
  regulation: "bg-red-600",
  strategy:   "bg-teal-600",
  howto:      "bg-indigo-600",
};

const ACCENT_TEXT: Record<string, string> = {
  broker:     "text-blue-600",
  insurer:    "text-purple-600",
  market:     "text-amber-600",
  claims:     "text-orange-600",
  regulation: "text-red-600",
  strategy:   "text-teal-600",
  howto:      "text-indigo-600",
};

const FALLBACK_BG: Record<string, string> = {
  broker:     "bg-blue-100",
  insurer:    "bg-purple-100",
  market:     "bg-amber-100",
  claims:     "bg-orange-100",
  regulation: "bg-red-100",
  strategy:   "bg-teal-100",
  howto:      "bg-indigo-100",
};

export default function ArticleCard({
  article,
  variant = "list",
  rank,
  imageUrl: imageUrlProp,
  smallUrl: smallUrlProp,
  thumbUrl: thumbUrlProp,
}: ArticleCardProps) {
  // 記事自身のOG画像をフォールバックとして使用
  const imageUrl = imageUrlProp || article.imageUrl;
  const smallUrl = smallUrlProp || article.imageUrl;
  const thumbUrl = thumbUrlProp || article.imageUrl;
  const href = `/insurid/articles/${article.slug}`;
  const isPremium = article.paywall !== "none";
  const accentBg  = ACCENT_BG[article.category]   ?? "bg-slate-600";
  const accentTxt = ACCENT_TEXT[article.category]  ?? "text-slate-600";
  const fallback  = FALLBACK_BG[article.category]  ?? "bg-slate-100";

  /* ── HERO ─────────────────────────────────────────────────────────── */
  if (variant === "hero") {
    return (
      <Link href={href} className="group block bg-white hover:shadow-xl transition-shadow duration-300">
        {/* Image — テキストオーバーレイなし */}
        <div className="relative w-full h-56 sm:h-80 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={article.title}
              fill
              priority
              unoptimized
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          ) : (
            <div className={`absolute inset-0 ${fallback} flex items-end`}>
              <div className="w-full h-1/2 bg-gradient-to-t from-slate-200/60 to-transparent" />
            </div>
          )}
          {isPremium && (
            <div className="absolute top-3 left-3 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-primary text-white font-semibold">
              <Lock className="w-2.5 h-2.5" /> Premium
            </div>
          )}
        </div>

        {/* Text below — CNBC style */}
        <div className="pt-3 pb-4">
          {/* Category + region */}
          <div className="flex items-center gap-2 mb-2">
            {article.isOriginal && (
              <span className="text-[9px] font-black tracking-widest uppercase bg-primary text-white px-1.5 py-0.5 rounded-sm">
                INSURID独自
              </span>
            )}
            <span className={`text-[11px] font-black tracking-[0.15em] uppercase ${accentTxt}`}>
              {CATEGORY_LABELS[article.category]}
            </span>
            <span className="text-slate-300">|</span>
            <RegionFlag region={article.region} />
          </div>

          {/* Headline — large, below image */}
          <h2 className={`font-serif-jp text-[22px] sm:text-[26px] font-bold leading-[1.3] text-slate-900 group-hover:${accentTxt} transition-colors mb-3`}>
            {article.title}
          </h2>

          <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 mb-3">
            {article.leadExcerpt}
          </p>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>{formatDate(article.publishedAt)}</span>
            <span>·</span>
            <span>{article.viewCount.toLocaleString()} views</span>
          </div>
        </div>
      </Link>
    );
  }

  /* ── COMPACT (Top 5 / sidebar) ────────────────────────────────────── */
  if (variant === "compact") {
    return (
      <Link
        href={href}
        className="group flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
      >
        {/* Rank number */}
        {rank !== undefined && (
          <span className={`text-[20px] font-black leading-none w-7 shrink-0 tabular-nums mt-0.5 ${rank === 1 ? accentTxt : "text-slate-200"}`}>
            {rank}
          </span>
        )}

        {/* Thumbnail */}
        {(thumbUrl || imageUrl) && (
          <div className="relative w-16 h-12 shrink-0 overflow-hidden rounded">
            <Image
              src={(thumbUrl ?? imageUrl)!}
              alt={article.title}
              fill
              unoptimized
              className="object-cover"
              sizes="64px"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <span className={`text-[10px] font-black tracking-[0.12em] uppercase ${accentTxt} block mb-0.5`}>
            {CATEGORY_LABELS[article.category]}
          </span>
          <p className="text-[13px] font-semibold text-slate-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {article.title}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{formatDate(article.publishedAt)}</span>
        </div>

        {isPremium && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
      </Link>
    );
  }

  /* ── LIST (vertical card — CNBC grid style) ───────────────────────── */
  return (
    <Link href={href} className="group block bg-white hover:shadow-md transition-shadow duration-200">
      {/* Image top */}
      <div className="relative w-full aspect-video overflow-hidden mb-3">
        {(smallUrl ?? thumbUrl) ? (
          <Image
            src={(smallUrl ?? thumbUrl)!}
            alt={article.title}
            fill
            unoptimized
            className="object-cover group-hover:scale-[1.03] transition-transform duration-400"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className={`absolute inset-0 ${fallback}`} />
        )}
        {isPremium && (
          <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary text-white font-semibold">
            <Lock className="w-2.5 h-2.5" /> Premium
          </div>
        )}
      </div>

      {/* Text below */}
      <div className="flex items-center gap-2 mb-1.5">
        {article.isOriginal && (
          <span className="text-[9px] font-black tracking-widest uppercase bg-primary text-white px-1.5 py-0.5 rounded-sm shrink-0">
            独自解説
          </span>
        )}
        <span className={`text-[10px] font-black tracking-[0.12em] uppercase ${accentTxt}`}>
          {CATEGORY_LABELS[article.category]}
        </span>
        <span className="text-slate-200 text-xs">|</span>
        <RegionFlag region={article.region} showLabel={false} />
      </div>

      <h3 className="font-serif-jp text-[15px] font-bold text-slate-900 leading-[1.4] mb-2 group-hover:text-primary transition-colors line-clamp-3">
        {article.title}
      </h3>

      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <span>{formatDate(article.publishedAt)}</span>
        <span>·</span>
        <span>{article.viewCount.toLocaleString()} views</span>
      </div>
    </Link>
  );
}
