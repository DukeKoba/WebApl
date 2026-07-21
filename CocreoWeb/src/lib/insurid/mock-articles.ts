export type Category =
  | "broker"
  | "insurer"
  | "market"
  | "claims"
  | "regulation"
  | "strategy"
  | "howto";

export type Region = "us" | "uk" | "eu" | "asia" | "jp" | "global";

export type Paywall = "none" | "premium" | "enterprise";

export interface Article {
  slug: string;
  title: string;
  leadExcerpt: string;
  bodyMd: string;
  category: Category;
  region: Region;
  tags: string[];
  playerSlugs: string[];
  aiModel: string;
  editorName: string;
  sourceLinks: { outlet: string; url: string }[];
  paywall: Paywall;
  publishedAt: string;
  updatedAt?: string;
  viewCount: number;
  importanceScore: number;
  isOriginal?: boolean;
  imageUrl?: string;
}

export const MOCK_ARTICLES: Article[] = [];

export const CATEGORY_LABELS: Record<Category, string> = {
  broker:     "海外ブローカー",
  insurer:    "AI・テクノロジー",
  market:     "市場・料率動向",
  claims:     "損害・クレーム",
  regulation: "規制・業法",
  strategy:   "経営・M&A",
  howto:      "実務ガイド",
};

export const REGION_LABELS: Record<Region, string> = {
  us: "🇺🇸 米国",
  uk: "🇬🇧 英国",
  eu: "🇪🇺 欧州",
  asia: "🌏 アジア",
  jp: "🇯🇵 日本",
  global: "🌐 グローバル",
};

export function getArticleBySlug(slug: string): Article | undefined {
  return MOCK_ARTICLES.find((a) => a.slug === slug);
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  return MOCK_ARTICLES.filter(
    (a) =>
      a.slug !== article.slug &&
      (a.category === article.category ||
        a.tags.some((t) => article.tags.includes(t)))
  ).slice(0, limit);
}
