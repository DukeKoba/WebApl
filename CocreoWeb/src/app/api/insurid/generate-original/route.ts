import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/insurid/supabase";
import { generateOriginal } from "@/lib/insurid/gemini";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60;

// Evergreen topics that are always relevant for Japanese insurance agents
const EVERGREEN_TOPICS = [
  "How US independent brokers are using AI to automate policy renewals and client communications",
  "Parametric insurance: how overseas brokers offer instant payouts and what Japanese agents can learn",
  "InsurTech startups disrupting the traditional broker model in the US and UK",
  "Cyber insurance market surge: opportunities for Japanese brokers in SME coverage",
  "Climate risk pricing revolution: how global insurers are changing catastrophe models",
  "Usage-based insurance (UBI) expansion and implications for Japanese auto insurance agents",
  "Embedded insurance growth: how non-insurance companies are becoming distribution channels",
  "How top US brokers structure their fees and move away from commission-only models",
  "AI underwriting tools transforming small business insurance — lessons for Japanese agents",
  "Global reinsurance market trends and their impact on primary insurance pricing in Japan",
];

function slugify(title: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const base = title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 50);
  return `original-${base || "article"}-${date}-${uuidv4().slice(0, 6)}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const count: number = Math.min(body.count ?? 3, 5);
  const customTopic: string | undefined = body.topic;

  // Fetch recent translated articles for context
  const { data: recentRows } = await supabaseAdmin
    .from("ins_articles")
    .select("title")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(10);

  const recentTitles: string[] = (recentRows ?? []).map((r: { title: string }) => r.title);

  // Pick topics: custom → or cycle through evergreen list
  const { data: existingOriginals } = await supabaseAdmin
    .from("ins_articles")
    .select("tags")
    .eq("status", "published")
    .filter("source_links", "eq", "[]");

  const usedTopicCount = (existingOriginals ?? []).length;

  const topics: string[] = customTopic
    ? [customTopic]
    : Array.from({ length: count }, (_, i) =>
        EVERGREEN_TOPICS[(usedTopicCount + i) % EVERGREEN_TOPICS.length]
      );

  const results: { title: string; status: "ok" | "error"; error?: string }[] = [];

  await Promise.allSettled(
    topics.map(async (topic) => {
      try {
        const draft = await generateOriginal(topic, recentTitles);
        const slug = slugify(draft.title_jp);

        await supabaseAdmin.from("ins_articles").insert({
          id: uuidv4(),
          slug,
          title: draft.title_jp,
          lead_excerpt: draft.summary_jp,
          body_md: draft.body_jp,
          category: draft.category,
          region: draft.region,
          tags: [...draft.tags, "INSURID独自解説"],
          player_ids: [],
          ai_draft_id: null,
          source_links: [],       // empty = original article
          paywall: "none",
          published_at: new Date().toISOString(),
          status: "published",
          view_count: 0,
        });

        results.push({ title: draft.title_jp, status: "ok" });
      } catch (err) {
        results.push({
          title: topic.slice(0, 50),
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })
  );

  const okCount = results.filter((r) => r.status === "ok").length;
  return NextResponse.json({
    message: `${okCount}件のオリジナル記事を生成・公開しました`,
    generated: okCount,
    errors: results.filter((r) => r.status === "error").length,
    details: results,
  });
}
