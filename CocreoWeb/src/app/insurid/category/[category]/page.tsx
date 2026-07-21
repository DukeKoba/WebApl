import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CATEGORY_LABELS, type Category } from "@/lib/insurid/mock-articles";
import { getArticlesByCategory, dbArticleToArticle } from "@/lib/insurid/articles-db";
import ArticleCard from "@/components/insurid/ArticleCard";
import CategoryBadge from "@/components/insurid/CategoryBadge";

interface Props {
  params: Promise<{ category: string }>;
}

const VALID_CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!VALID_CATEGORIES.includes(category as Category)) return {};
  return { title: CATEGORY_LABELS[category as Category] };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!VALID_CATEGORIES.includes(category as Category)) notFound();

  const cat = category as Category;
  const dbArticles = await getArticlesByCategory(cat);
  const articles = dbArticles.map(dbArticleToArticle).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-1 text-xs text-text-muted mb-5">
        <Link href="/insurid" className="hover:text-primary transition-colors">INSURID</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/insurid/articles" className="hover:text-primary transition-colors">記事一覧</Link>
        <ChevronRight className="w-3 h-3" />
        <CategoryBadge category={cat} size="sm" />
      </nav>

      <div className="mb-6 flex items-center gap-3">
        <CategoryBadge category={cat} />
        <h1 className="font-serif-jp text-2xl font-bold text-text-primary">
          {CATEGORY_LABELS[cat]}
        </h1>
      </div>

      {articles.length === 0 ? (
        <p className="text-text-muted text-sm">このカテゴリの記事はまだありません。</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} variant="list" />
          ))}
        </div>
      )}
    </div>
  );
}
