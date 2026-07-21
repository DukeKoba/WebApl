#!/usr/bin/env node
// Run: node --env-file=.env.local scripts/seed-articles.mjs
// or:  npx dotenv -e .env.local -- node scripts/seed-articles.mjs

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { randomUUID } from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GEMINI_API_KEY) {
  console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const FEEDS = [
  { name: "Insurance Journal",     url: "https://www.insurancejournal.com/feed/", region: "us" },
  { name: "Coverager",             url: "https://coverager.com/feed/", region: "global" },
  { name: "Carrier Management",    url: "https://carriermanagement.com/feed/", region: "us" },
  { name: "Risk & Insurance",      url: "https://riskandinsurance.com/feed/", region: "us" },
];

const MAX_PER_FEED = 3;

const MEDIA_GUIDELINES = `あなたはINSURIDの編集者です。海外保険業界の記事を日本の保険代理店向けに翻訳・編集します。
読者: 日本の保険代理店経営者・担当者（保険業界歴5〜20年）
トーン: 専門的かつ実務的。
構成: 必ず「## 何が起きたか」「## どんな仕組みか」「## 日本の代理店にとっての示唆」の3節
本文字数: 600〜1,200字（日本語）
リード: 120〜200字の要点凝縮
示唆セクション: 日本の代理店が今すぐ実践できるアクションを必ず述べる
タイトル: 40字以内`;

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title_jp: { type: SchemaType.STRING },
    summary_jp: { type: SchemaType.STRING },
    body_jp: { type: SchemaType.STRING },
    category: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["broker", "insurer", "domestic", "niche", "regulation", "webinar", "howto"],
    },
    region: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["us", "uk", "eu", "asia", "jp", "global"],
    },
    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    importance_score: { type: SchemaType.NUMBER },
  },
  required: ["title_jp", "summary_jp", "body_jp", "category", "region", "tags", "importance_score"],
};

function stripCdata(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}
function getTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  return m ? stripCdata(m[1]).replace(/<[^>]+>/g, "").trim() : "";
}
function getLinkTag(xml) {
  const a = xml.match(/<link[^>]+href="([^"]+)"/i);
  if (a) return a[1];
  const b = xml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  return b ? stripCdata(b[1]).trim() : "";
}
function slugify(title) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const base = title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);
  return `${base || "article"}-${date}-${randomUUID().slice(0, 6)}`;
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "INSURID-RSS-Reader/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [];
    const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRe.exec(xml)) !== null && items.length < MAX_PER_FEED) {
      const b = match[1];
      const title   = getTag(b, "title");
      const url     = getLinkTag(b) || getTag(b, "link");
      const excerpt = getTag(b, "description") || getTag(b, "summary");
      const pubDate = getTag(b, "pubDate") || "";
      if (title && url) items.push({ title, url, excerpt: excerpt.slice(0, 300), pubDate, source: feed.name, region: feed.region });
    }
    console.log(`  ${feed.name}: ${items.length}件取得`);
    return items;
  } catch (e) {
    console.log(`  ${feed.name}: 取得失敗 (${e.message})`);
    return [];
  }
}

async function generateDraft(url, title, excerpt) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: MEDIA_GUIDELINES,
    generationConfig: { responseMimeType: "application/json", responseSchema },
  });
  const prompt = `元記事URL: ${url}\n元タイトル: ${title}\n元要約: ${excerpt || "（なし）"}\n\n日本の保険代理店向けに翻訳・編集してください。`;
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

async function main() {
  console.log("=== INSURID 記事シード開始 ===\n");

  // 1. RSSフィードを並列取得
  console.log("RSSフィードを取得中...");
  const feedResults = await Promise.allSettled(FEEDS.map(fetchFeed));
  const allItems = feedResults.flatMap((r) => r.status === "fulfilled" ? r.value : []);
  console.log(`合計 ${allItems.length}件のアイテムを取得\n`);

  // 2. すでにDBにあるURLを除外
  const urls = allItems.map((i) => i.url);
  const { data: existing } = await supabase.from("ins_candidates").select("url").in("url", urls);
  const existingUrls = new Set((existing ?? []).map((r) => r.url));
  const newItems = allItems.filter((i) => !existingUrls.has(i.url));
  console.log(`新規アイテム: ${newItems.length}件（${allItems.length - newItems.length}件は既存）\n`);

  if (newItems.length === 0) {
    console.log("処理すべき新規アイテムがありません。");
    return;
  }

  // 3. 並列でGemini生成 + DB挿入
  console.log("Gemini AIで日本語記事を生成中...");
  let ok = 0, errors = 0;

  await Promise.allSettled(newItems.map(async (item) => {
    try {
      process.stdout.write(`  処理中: ${item.title.slice(0, 50)}...`);

      const { data: candidate, error: cErr } = await supabase
        .from("ins_candidates")
        .insert({
          id: randomUUID(),
          url: item.url,
          title_original: item.title,
          excerpt_original: item.excerpt,
          fetched_at: new Date().toISOString(),
          state: "new",
        })
        .select()
        .single();

      if (cErr || !candidate) throw new Error(cErr?.message ?? "candidate insert failed");

      const draft = await generateDraft(item.url, item.title, item.excerpt);
      const draftId = randomUUID();
      const slug = slugify(draft.title_jp);

      await supabase.from("ins_drafts").insert({
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

      await supabase.from("ins_articles").insert({
        id: randomUUID(),
        slug,
        title: draft.title_jp,
        lead_excerpt: draft.summary_jp,
        body_md: draft.body_jp,
        category: draft.category,
        region: draft.region,
        tags: draft.tags,
        player_ids: [],
        ai_draft_id: draftId,
        source_links: [{ outlet: item.source, url: item.url }],
        paywall: "none",
        published_at: new Date().toISOString(),
        status: "published",
        view_count: 0,
      });

      await supabase
        .from("ins_candidates")
        .update({ state: "published", draft_id: draftId, importance_score: draft.importance_score })
        .eq("id", candidate.id);

      ok++;
      console.log(` ✓ "${draft.title_jp.slice(0, 30)}..."`);
    } catch (err) {
      errors++;
      console.log(` ✗ ${err.message}`);
    }
  }));

  console.log(`\n=== 完了: ${ok}件成功 / ${errors}件エラー ===`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
