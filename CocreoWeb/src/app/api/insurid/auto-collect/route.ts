import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/insurid/supabase";
import { generateDraft } from "@/lib/insurid/gemini";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60;

const FEEDS = [
  { name: "Coverager",             url: "https://coverager.com/feed/", region: "global" },
  { name: "Risk & Insurance",      url: "https://riskandinsurance.com/feed/", region: "us" },
  { name: "Insurance Business AU", url: "https://www.insurancebusiness.com.au/rss/news", region: "asia" },
  { name: "Insurance Business CA", url: "https://www.insurancebusiness.ca/rss/news", region: "global" },
  { name: "Insurance Business UK", url: "https://www.insurancebusiness.co.uk/rss/news", region: "uk" },
  { name: "Insurance Business NZ", url: "https://www.insurancebusiness.co.nz/rss/news", region: "asia" },
  { name: "Reinsurance News",      url: "https://www.reinsurancene.ws/feed/", region: "global" },
  { name: "PropertyCasualty360",   url: "https://www.propertycasualty360.com/feed/", region: "us" },
  { name: "Insurance Journal",     url: "https://www.insurancejournal.com/feed/", region: "us" },
  { name: "Carrier Management",    url: "https://carriermanagement.com/feed/", region: "us" },
  { name: "Digital Insurance",     url: "https://www.dig-in.com/rss/articles", region: "us" },
  { name: "Claims Journal",        url: "https://www.claimsjournal.com/feed/", region: "us" },
  { name: "Insurtech Insights",    url: "https://www.insurtechinsights.com/feed/", region: "global" },
  { name: "The Insurer",           url: "https://www.theinsurer.com/feed/", region: "global" },
  { name: "AM Best News",          url: "https://news.ambest.com/rss/newsrss.aspx", region: "global" },
];

interface RssItem {
  title: string;
  url: string;
  excerpt: string;
  pubDate: string;
  source: string;
}

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function getTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  return m ? stripCdata(m[1]).replace(/<[^>]+>/g, "").trim() : "";
}

function getLinkTag(xml: string): string {
  const atomLink = xml.match(/<link[^>]+href="([^"]+)"/i);
  if (atomLink) return atomLink[1];
  const rssLink = xml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  return rssLink ? stripCdata(rssLink[1]).trim() : "";
}

async function fetchFeed(feed: { name: string; url: string; region: string }): Promise<RssItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "INSURID-RSS-Reader/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: RssItem[] = [];
    const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRe.exec(xml)) !== null && items.length < 10) {
      const block = match[1];
      const title   = getTag(block, "title");
      const url     = getLinkTag(block) || getTag(block, "link");
      const excerpt = getTag(block, "description") || getTag(block, "summary");
      const pubDate = getTag(block, "pubDate") || getTag(block, "published") || "";
      if (title && url) {
        items.push({ title, url, excerpt: excerpt.slice(0, 300), pubDate, source: feed.name });
      }
    }
    return items;
  } catch {
    return [];
  }
}

async function fetchArticleContent(url: string): Promise<{ text: string; imageUrl: string }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "INSURID-Bot/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { text: "", imageUrl: "" };
    const html = await res.text();

    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const imageUrl = ogMatch?.[1]?.trim() ?? "";

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);

    return { text, imageUrl };
  } catch {
    return { text: "", imageUrl: "" };
  }
}

function slugify(title: string): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const base = title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);
  return `${base || "article"}-${date}-${uuidv4().slice(0, 6)}`;
}


export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const maxPerFeed: number = body.max_per_feed ?? 10;

  // 1. Fetch all RSS feeds in parallel
  const feedResults = await Promise.allSettled(FEEDS.map(fetchFeed));
  const allItems: RssItem[] = feedResults.flatMap((r) => r.status === "fulfilled" ? r.value : []);

  if (allItems.length === 0) {
    return NextResponse.json({ error: "No RSS items fetched" }, { status: 502 });
  }

  // 2. Filter out URLs already successfully published
  const urls = allItems.map((i) => i.url);
  const { data: existing } = await supabaseAdmin
    .from("ins_candidates")
    .select("url")
    .in("url", urls)
    .eq("state", "published");

  const existingUrls = new Set((existing ?? []).map((r: { url: string }) => r.url));
  const newItems = allItems.filter((i) => !existingUrls.has(i.url)).slice(0, maxPerFeed * FEEDS.length);

  if (newItems.length === 0) {
    return NextResponse.json({ message: "No new items to process", processed: 0 });
  }

  // 3. Process each new item in parallel: create candidate → generate draft → auto-publish
  async function processItem(item: RssItem): Promise<{ url: string; title: string; status: "ok" | "error"; error?: string }> {
    let step = "start";
    try {
      // Upsert candidate (in case prior run inserted it but failed before publishing)
      step = "upsert_candidate";
      const { data: candidate, error: cErr } = await supabaseAdmin
        .from("ins_candidates")
        .upsert(
          {
            id: uuidv4(),
            url: item.url,
            title_original: item.title,
            excerpt_original: item.excerpt,
            fetched_at: new Date().toISOString(),
            state: "new",
          },
          { onConflict: "url", ignoreDuplicates: false }
        )
        .select()
        .single();

      if (cErr || !candidate) throw new Error(cErr?.message ?? "candidate insert failed");

      step = "fetch_article";
      const { text: articleText, imageUrl } = await fetchArticleContent(item.url);
      step = "generate_draft";
      const draft = await generateDraft(item.url, item.title, item.excerpt, articleText);

      const draftId = uuidv4();
      const slug = slugify(draft.title_jp);
      const sourceLinks = [{ outlet: item.source, url: item.url }];

      await supabaseAdmin.from("ins_drafts").insert({
        id: draftId,
        candidate_id: candidate.id,
        title_jp: draft.title_jp,
        summary_jp: draft.summary_jp,
        body_jp: draft.body_jp,
        category: draft.category,
        region: draft.region,
        tags: draft.tags,
        related_player_ids: [],
        ai_model: "gemini-2.5-flash",
        generated_at: new Date().toISOString(),
        state: "approved",
      });

      await supabaseAdmin.from("ins_articles").insert({
        id: uuidv4(),
        slug,
        title: draft.title_jp,
        lead_excerpt: draft.summary_jp,
        body_md: draft.body_jp,
        category: draft.category,
        region: draft.region,
        tags: draft.tags,
        player_ids: [],
        ai_draft_id: draftId,
        source_links: sourceLinks,
        paywall: "none",
        published_at: new Date().toISOString(),
        status: "published",
        view_count: 0,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });

      await supabaseAdmin
        .from("ins_candidates")
        .update({ state: "published", draft_id: draftId, importance_score: draft.importance_score })
        .eq("id", candidate.id);

      return { url: item.url, title: draft.title_jp, status: "ok" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        url: item.url,
        title: item.title,
        status: "error",
        error: `[step:${step}] ${msg.slice(0, 300)}`,
      };
    }
  }

  const settled = await Promise.allSettled(newItems.map(processItem));
  const results = settled.map((r) => r.status === "fulfilled" ? r.value : { url: "", title: "", status: "error" as const, error: String(r.reason) });

  const okCount = results.filter((r) => r.status === "ok").length;
  return NextResponse.json({
    message: `${okCount}件の記事を生成・公開しました`,
    processed: okCount,
    errors: results.filter((r) => r.status === "error").length,
    details: results,
  });
}
