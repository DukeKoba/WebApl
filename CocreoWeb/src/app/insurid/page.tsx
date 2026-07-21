import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { CATEGORY_LABELS, type Category } from "@/lib/insurid/mock-articles";
import { getPublishedArticles, dbArticleToArticle } from "@/lib/insurid/articles-db";
import { fetchCategoryPhotos, pickPhoto } from "@/lib/insurid/unsplash";
import ArticleCard from "@/components/insurid/ArticleCard";
import NewsletterInline from "@/components/insurid/NewsletterInline";

export const metadata: Metadata = {
  title: "INSURID — 保険代理店のためのAI×海外情報メディア",
};

const PICKUP_CATEGORIES: Category[] = ["broker", "insurer", "market", "claims", "regulation", "howto"];

const CATEGORY_NAV: { cat: Category; label: string }[] = [
  { cat: "broker",     label: "海外ブローカー" },
  { cat: "insurer",    label: "AI・テクノロジー" },
  { cat: "market",     label: "市場・料率動向" },
  { cat: "claims",     label: "損害・クレーム" },
  { cat: "regulation", label: "規制・業法" },
  { cat: "strategy",   label: "経営・M&A" },
  { cat: "howto",      label: "実務ガイド" },
];

export default async function InsuridTopPage() {
  const dbArticles = await getPublishedArticles(200);
  const sorted = dbArticles.map(dbArticleToArticle).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const hero   = sorted[0];
  const sub1   = sorted[1];
  const top5   = sorted.slice(0, 5);

  const originals = sorted.filter((a) => a.isOriginal).slice(0, 6);
  const allCategories = [...new Set(sorted.map((a) => a.category))] as Category[];
  const photos = await fetchCategoryPhotos(allCategories);

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div>
      {/* ── CNBC style section header ────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-400 mb-1">保険業界ニュース</p>
          <h1 className="text-[32px] sm:text-[40px] font-black tracking-tight text-slate-900">INSURID</h1>
          {/* Gold separator — CNBC signature */}
          <div className="mt-4 h-[3px] bg-primary w-full" />
        </div>

        {/* ── Subcategory tab nav ───────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-0 overflow-x-auto scrollbar-none py-3 -mb-px">
            {CATEGORY_NAV.map((item, i) => (
              <span key={item.cat} className="flex items-center shrink-0">
                {i > 0 && <span className="text-slate-200 mx-3 select-none">|</span>}
                <Link
                  href={`/insurid/category/${item.cat}`}
                  className="text-[11px] font-black tracking-[0.1em] uppercase text-slate-500 hover:text-primary transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-14">

        {/* ── Hero section ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-black text-white bg-red-500 px-2.5 py-1 rounded-sm uppercase tracking-widest">
              本日の朝刊
            </span>
            <span className="text-[11px] text-slate-400">{today}</span>
          </div>

          {!hero ? (
            /* Empty state */
            <div className="border border-dashed border-slate-300 rounded-xl py-20 text-center text-slate-500">
              <p className="font-bold text-base mb-2">まだ記事がありません</p>
              <p className="text-sm mb-4">管理画面から「今すぐ収集」を実行するとInsurance Journal等のリアルニュースが表示されます。</p>
              <Link href="/admin/insurid/queue" className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg">
                管理画面へ <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            /* CNBC grid: large hero left, sidebar right */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-8">

              {/* Large hero (left 2/3) */}
              <div className="lg:col-span-2 lg:border-r lg:border-slate-200 lg:pr-8">
                <ArticleCard
                  article={hero}
                  variant="hero"
                  imageUrl={pickPhoto(photos, hero.category, 0)?.url}
                />
              </div>

              {/* Sidebar: sub-hero + top list (right 1/3) */}
              <div className="mt-8 lg:mt-0 space-y-6">
                {sub1 && (
                  <div className="pb-6 border-b border-slate-200">
                    <ArticleCard
                      article={sub1}
                      variant="list"
                      smallUrl={pickPhoto(photos, sub1.category, 1)?.smallUrl}
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 flex items-center gap-1.5 mb-3">
                    <TrendingUp className="w-3 h-3" /> 注目ランキング
                  </h2>
                  {top5.slice(2).map((article, i) => (
                    <ArticleCard
                      key={article.slug}
                      article={article}
                      variant="compact"
                      rank={i + 1}
                      smallUrl={pickPhoto(photos, article.category, i + 2)?.smallUrl}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── INSURID オリジナル解説 ───────────────────────────────── */}
        {originals.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[11px] font-black tracking-[0.2em] uppercase text-slate-800 flex items-center gap-2">
                <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-sm font-black tracking-widest">INSURID独自</span>
                編集部オリジナル解説
              </h2>
              <Link href="/insurid/articles" className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5">
                もっと見る <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="h-[2px] bg-primary mb-5" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {originals.map((article, i) => (
                <ArticleCard key={article.slug} article={article} variant="list"
                  smallUrl={pickPhoto(photos, article.category, i)?.smallUrl} />
              ))}
            </div>
          </section>
        )}

        {/* ── Newsletter CTA ────────────────────────────────────────── */}
        <NewsletterInline variant="card" />

        {/* ── Category pickups — CNBC grid style ───────────────────── */}
        {PICKUP_CATEGORIES.map((cat) => {
          const catArticles = sorted.filter((a) => a.category === cat).slice(0, 6);
          if (catArticles.length === 0) return null;

          return (
            <section key={cat}>
              {/* Section header — CNBC style */}
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[11px] font-black tracking-[0.2em] uppercase text-slate-800">
                  {CATEGORY_LABELS[cat]}
                </h2>
                <Link
                  href={`/insurid/category/${cat}`}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
                >
                  もっと見る <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {/* Amber separator line */}
              <div className="h-[2px] bg-primary mb-5" />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {catArticles.map((article, i) => (
                  <ArticleCard
                    key={article.slug}
                    article={article}
                    variant="list"
                    smallUrl={pickPhoto(photos, cat, i)?.smallUrl}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* ── Cocreo CTA ───────────────────────────────────────────── */}
        <section className="border-t-2 border-primary pt-8">
          <p className="text-[10px] font-black tracking-[0.25em] uppercase text-primary mb-2">
            あなたの代理店で同じことを始めるなら
          </p>
          <h3 className="font-serif-jp text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            海外の最先端事例を、自社の実務に。
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-5 max-w-xl">
            記事で紹介した事例を自社に実装したい方に、Cocreoがサポートします。AI提案書補助・更新管理自動化・クレーム対応ボットなど、代理店向けAIツールの設計・開発を承っています。
          </p>
          <Link
            href="/media"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded hover:bg-primary-dark transition-colors"
          >
            Cocreo for Insurance 無料診断 <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

      </div>
    </div>
  );
}
