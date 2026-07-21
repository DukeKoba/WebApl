import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/insurid/supabase";
import { generateDraft } from "@/lib/insurid/gemini";
import { v4 as uuidv4 } from "uuid";

// HTMLタグを除去してプレーンテキストを取得
async function fetchArticleText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "INSURID-Bot/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    // scriptとstyleを除去してからタグを除去
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 4000);
  } catch {
    return "";
  }
}

function slugify(title: string): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `${base || "article"}-${date}-${uuidv4().slice(0, 6)}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { candidate_id, auto_publish = false } = body;

  if (!candidate_id) {
    return NextResponse.json({ error: "candidate_id is required" }, { status: 400 });
  }

  // Fetch candidate
  const { data: candidate, error: cErr } = await supabaseAdmin
    .from("ins_candidates")
    .select("*")
    .eq("id", candidate_id)
    .single();

  if (cErr || !candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  // 元記事を取得して品質向上
  const articleText = await fetchArticleText(candidate.url);

  // Generate draft with Gemini
  let draftOutput;
  try {
    draftOutput = await generateDraft(
      candidate.url,
      candidate.title_original ?? "",
      candidate.excerpt_original ?? "",
      articleText
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gemini API error" },
      { status: 500 }
    );
  }

  const draftId = uuidv4();

  // Insert draft
  const { data: draft, error: dErr } = await supabaseAdmin
    .from("ins_drafts")
    .insert({
      id: draftId,
      candidate_id,
      title_jp: draftOutput.title_jp,
      summary_jp: draftOutput.summary_jp,
      body_jp: draftOutput.body_jp,
      category: draftOutput.category,
      region: draftOutput.region,
      tags: draftOutput.tags,
      related_player_ids: [],
      ai_model: "gemini-2.5-flash",
      generated_at: new Date().toISOString(),
      state: auto_publish ? "approved" : "pending",
    })
    .select()
    .single();

  if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });

  // Update candidate state
  await supabaseAdmin
    .from("ins_candidates")
    .update({ state: auto_publish ? "published" : "drafted", draft_id: draftId, importance_score: draftOutput.importance_score })
    .eq("id", candidate_id);

  // auto_publish: そのまま ins_articles に挿入
  if (auto_publish && draft) {
    const slug = slugify(draftOutput.title_jp);
    const sourceLinks = candidate.url
      ? [{ outlet: new URL(candidate.url).hostname, url: candidate.url }]
      : [];

    await supabaseAdmin.from("ins_articles").insert({
      id: uuidv4(),
      slug,
      title: draftOutput.title_jp,
      lead_excerpt: draftOutput.summary_jp,
      body_md: draftOutput.body_jp,
      category: draftOutput.category,
      region: draftOutput.region,
      tags: draftOutput.tags,
      player_ids: [],
      ai_draft_id: draftId,
      source_links: sourceLinks,
      paywall: "none",
      published_at: new Date().toISOString(),
      status: "published",
      view_count: 0,
    });
  }

  return NextResponse.json({ ...draft, candidate }, { status: 201 });
}
