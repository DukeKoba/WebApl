import type { Metadata } from "next";
import { CATEGORY_LABELS, type Category } from "@/lib/insurid/mock-articles";
import { getPublishedArticles, dbArticleToArticle } from "@/lib/insurid/articles-db";
import ArticleCard from "@/components/insurid/ArticleCard";
import CategoryBadge from "@/components/insurid/CategoryBadge";
import Link from "next/link";

export const metadata: Metadata = { title: "全記事アーカイブ — INSURID" };

export const revalidate = 300;

export default async function ArticlesPage() {
  const dbArticles = await getPublishedArticles(200);
  const sorted = dbArticles.map(dbArticleToArticle).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const categories = Object.keys(CATEGORY_LABELS) as Category[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-serif-jp text-2xl sm:text-3xl font-bold text-text-primary mb-4">全記事アーカイブ</h1>

        <div className="flex flex-wrap gap-2">
          <Link href="/insurid/articles" className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary text-white">
            すべて
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/insurid/category/${cat}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              {CATEGORY_LABELS[cat]}
            </Link>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <p className="text-base font-medium mb-2">まだ記事がありません</p>
          <p className="text-sm">管理画面の「今すぐ収集」ボタンでInsurance Journalなどから記事を取得できます。</p>
          <Link href="/admin/insurid/queue" className="inline-block mt-4 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg">
            管理画面へ →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((article) => (
              <ArticleCard key={article.slug} article={article} variant="list" />
            ))}
          </div>
          <p className="text-center text-sm text-text-muted mt-10">
            {sorted.length}件を表示 — Insurance Journal等から自動収集・AI翻訳済み
          </p>
        </>
      )}
    </div>
  );
}
