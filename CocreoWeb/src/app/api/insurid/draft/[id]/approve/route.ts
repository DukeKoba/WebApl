import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/insurid/supabase";
import { v4 as uuidv4 } from "uuid";

interface Props { params: Promise<{ id: string }> }

function slugify(title: string): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `${base || "article"}-${date}`;
}

export async function POST(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { paywall = "none", scheduled_at } = body;

  // Fetch draft with candidate
  const { data: draft, error: dErr } = await supabaseAdmin
    .from("ins_drafts")
    .select("*, candidate:ins_candidates(*)")
    .eq("id", id)
    .single();

  if (dErr || !draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const publishAt = scheduled_at ?? new Date().toISOString();
  const slug = slugify(draft.title_jp);

  // Build source links from candidate URL
  const sourceLinks = draft.candidate
    ? [{ outlet: new URL(draft.candidate.url).hostname, url: draft.candidate.url }]
    : [];

  const articleId = uuidv4();

  const { data: article, error: aErr } = await supabaseAdmin
    .from("ins_articles")
    .insert({
      id: articleId,
      slug,
      title: draft.title_jp,
      lead_excerpt: draft.summary_jp,
      body_md: draft.body_jp,
      category: draft.category,
      region: draft.region,
      tags: draft.tags,
      player_ids: draft.related_player_ids ?? [],
      ai_draft_id: id,
      source_links: sourceLinks,
      paywall,
      published_at: publishAt,
      status: "published",
      view_count: 0,
    })
    .select()
    .single();

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  // Update draft and candidate state
  await supabaseAdmin.from("ins_drafts").update({ state: "approved" }).eq("id", id);
  if (draft.candidate_id) {
    await supabaseAdmin
      .from("ins_candidates")
      .update({ state: "published" })
      .eq("id", draft.candidate_id);
  }

  return NextResponse.json(article, { status: 201 });
}
