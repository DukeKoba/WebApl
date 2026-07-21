import { getSupabaseAdmin } from "./supabase";
import type { DbArticle, Category } from "./types";
import type { Article } from "./mock-articles";

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !url.includes("xxxxxxxxxxxx") && url.startsWith("https://");
}

export async function getPublishedArticles(limit = 30): Promise<DbArticle[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("ins_articles")
    .select("*")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as DbArticle[];
}

export async function getArticleBySlugDb(slug: string): Promise<DbArticle | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("ins_articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return (data as DbArticle) ?? null;
}

export async function getArticlesByCategory(category: Category, limit = 20): Promise<DbArticle[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("ins_articles")
    .select("*")
    .eq("status", "published")
    .eq("category", category)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as DbArticle[];
}

export function dbArticleToArticle(a: DbArticle): Article {
  const sourceLinks = (a.source_links as { outlet: string; url: string }[]) ?? [];
  return {
    slug: a.slug,
    title: a.title,
    leadExcerpt: a.lead_excerpt,
    bodyMd: a.body_md,
    category: a.category,
    region: a.region,
    tags: a.tags,
    playerSlugs: [],
    aiModel: "gemini-2.5-flash",
    editorName: "INSURID編集部",
    sourceLinks,
    paywall: a.paywall,
    publishedAt: a.published_at ?? a.updated_at ?? new Date().toISOString(),
    updatedAt: a.updated_at ?? undefined,
    viewCount: a.view_count,
    importanceScore: 80,
    isOriginal: sourceLinks.length === 0,
    imageUrl: a.image_url ?? undefined,
  };
}

export async function incrementViewCount(slug: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const sb = getSupabaseAdmin();
  await sb.rpc("increment_view_count", { article_slug: slug });
}
