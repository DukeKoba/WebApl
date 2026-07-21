import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ExternalLink, Lock, ArrowRight, Share2 } from "lucide-react";
import { getArticleBySlugDb, getArticlesByCategory, dbArticleToArticle, incrementViewCount } from "@/lib/insurid/articles-db";
import ArticleCard from "@/components/insurid/ArticleCard";
import CategoryBadge from "@/components/insurid/CategoryBadge";
import RegionFlag from "@/components/insurid/RegionFlag";
import AuthorByline from "@/components/insurid/AuthorByline";
import NewsletterInline from "@/components/insurid/NewsletterInline";
import BookmarkButton from "@/components/insurid/BookmarkButton";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return []; // 動的レンダリング（SSR）
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dbArticle = await getArticleBySlugDb(slug);
  if (!dbArticle) return {};
  return {
    title: dbArticle.title,
    description: dbArticle.lead_excerpt,
  };
}

function normalizeBodyMd(md: string): string {
  return md
    .replace(/([^\n])(#{2,3} )/g, "$1\n\n$2")
    .replace(/\n{3,}/g, "\n\n");
}

function renderMarkdown(md: string) {
  const lines = normalizeBodyMd(md).split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="font-serif-jp text-xl font-bold text-text-primary mt-8 mb-3 pb-2 border-b border-border">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-base font-bold text-text-primary mt-6 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={key++} className="border-l-4 border-primary/40 pl-4 my-3 text-text-secondary italic text-sm leading-relaxed">
          {line.slice(2)}
        </blockquote>
      );
    } else if (line.startsWith("| ")) {
      // simple table: collect rows
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("| ")) {
        const cells = lines[i].split("|").map((c) => c.trim()).filter(Boolean);
        if (!cells.every((c) => c.match(/^[-:]+$/))) {
          rows.push(cells);
        }
        i++;
      }
      elements.push(
        <div key={key++} className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-surface-soft">
                {rows[0]?.map((cell, ci) => (
                  <th key={ci} className="text-left px-3 py-2 font-medium text-text-primary border border-border">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri} className="even:bg-surface-soft/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-text-secondary border border-border">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    } else if (/^\d+\. /.test(line) || line.startsWith("- ")) {
      const isOrdered = /^\d+\. /.test(line);
      const items: string[] = [];
      while (i < lines.length && ((/^\d+\. /.test(lines[i]) || lines[i].startsWith("- ")))) {
        items.push(lines[i].replace(/^\d+\. /, "").replace(/^- /, ""));
        i++;
      }
      const Tag = isOrdered ? "ol" : "ul";
      elements.push(
        <Tag key={key++} className={`my-3 pl-5 space-y-1 text-sm text-text-secondary leading-relaxed ${isOrdered ? "list-decimal" : "list-disc"}`}>
          {items.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
          ))}
        </Tag>
      );
      continue;
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={key++} className="text-sm font-semibold text-text-primary mt-3">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    } else if (line.trim() !== "") {
      elements.push(
        <p
          key={key++}
          className="text-base text-text-primary leading-[1.85] my-3"
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }}
        />
      );
    }
    i++;
  }
  return elements;
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const dbArticle = await getArticleBySlugDb(slug);
  if (!dbArticle) notFound();
  const article = dbArticleToArticle(dbArticle);

  await incrementViewCount(slug);

  const relatedDb = await getArticlesByCategory(article.category as import("@/lib/insurid/types").Category, 4);
  const related = relatedDb
    .filter((a) => a.slug !== slug)
    .slice(0, 2)
    .map(dbArticleToArticle);

  const isPremium = article.paywall !== "none";

  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-10">

        {/* Main content */}
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-text-muted mb-5">
            <Link href="/insurid" className="hover:text-primary transition-colors">INSURID</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/insurid/articles" className="hover:text-primary transition-colors">記事一覧</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/insurid/category/${article.category}`} className="hover:text-primary transition-colors">
              <CategoryBadge category={article.category} size="sm" />
            </Link>
          </nav>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <CategoryBadge category={article.category} />
            <RegionFlag region={article.region} />
            {article.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded bg-surface-soft border border-border text-text-muted">
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-serif-jp text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary leading-snug mb-5">
            {article.title}
          </h1>

          {/* Author byline */}
          <AuthorByline
            aiModel={article.aiModel}
            editorName={article.editorName}
            publishedAt={article.publishedAt}
            updatedAt={article.updatedAt}
          />

          {/* Source links */}
          {article.sourceLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {article.sourceLinks.map((src) => (
                <a
                  key={src.url}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-dark border border-primary/20 rounded px-2 py-0.5 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> {src.outlet}
                </a>
              ))}
            </div>
          )}

          {/* Lead (always visible) */}
          <p className="mt-6 text-base text-text-primary leading-[1.85] font-medium bg-surface-soft border-l-4 border-primary/30 pl-4 py-3 rounded-r-lg">
            {article.leadExcerpt}
          </p>

          {/* Body */}
          {isPremium ? (
            <div className="mt-6">
              <div className="relative">
                <div className="blur-[3px] opacity-60 pointer-events-none select-none">
                  {renderMarkdown(article.bodyMd.split("\n").slice(0, 8).join("\n"))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white" />
              </div>
              <div className="mt-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 text-center">
                <Lock className="w-8 h-8 text-amber-600 mx-auto mb-3" />
                <p className="font-bold text-text-primary mb-1">この記事の続きはPremiumで読めます</p>
                <p className="text-sm text-text-secondary mb-4">月額¥3,980で全記事の全文＋週次レポートが読み放題。</p>
                <Link
                  href="/insurid/pricing"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
                >
                  Premiumに登録 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6">{renderMarkdown(article.bodyMd)}</div>
          )}

          {/* Cocreo CTA */}
          <div className="mt-10 bg-gradient-to-br from-primary/5 to-secondary/20 border border-primary/15 rounded-2xl p-5 sm:p-6">
            <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">あなたの代理店で試すなら</p>
            <h4 className="font-serif-jp text-lg font-bold text-text-primary mb-2">
              この事例を自社に実装したい方へ
            </h4>
            <p className="text-sm text-text-secondary mb-4">
              Cocreo for Insuranceでは、記事で紹介した事例の自社実装をサポートしています。AI提案書補助・更新管理自動化など、代理店向けAI開発の無料診断を受け付けています。
            </p>
            <Link
              href="/media"
              className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
            >
              無料診断を受ける <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Related articles */}
          {related.length > 0 && (
            <section className="mt-10">
              <h3 className="font-bold text-text-primary mb-4">関連記事</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {related.map((a) => (
                  <ArticleCard key={a.slug} article={a} variant="list" />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-6 mt-14">
          {/* Actions */}
          <div className="flex gap-2">
            <BookmarkButton articleSlug={article.slug} articleTitle={article.title} />
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-surface-soft transition-colors">
              <Share2 className="w-4 h-4" /> シェア
            </button>
          </div>

          {/* Newsletter */}
          <NewsletterInline variant="banner" />

          {/* Related tags */}
          <div className="bg-white border border-border rounded-xl p-4">
            <h4 className="text-sm font-bold text-text-primary mb-3">タグ</h4>
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 rounded bg-surface-soft border border-border text-text-muted hover:text-primary cursor-pointer transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white border border-border rounded-xl p-4 text-sm">
            <p className="text-text-muted text-xs mb-1">この記事の閲覧数</p>
            <p className="font-bold text-text-primary text-xl">{article.viewCount.toLocaleString()}</p>
          </div>
        </aside>
      </div>
    </article>
  );
}
