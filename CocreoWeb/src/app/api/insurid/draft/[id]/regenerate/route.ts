import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/insurid/supabase";
import { generateDraft } from "@/lib/insurid/claude";

interface Props { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const { instruction } = await request.json().catch(() => ({}));

  const { data: draft, error: dErr } = await supabaseAdmin
    .from("ins_drafts")
    .select("*, candidate:ins_candidates(*)")
    .eq("id", id)
    .single();

  if (dErr || !draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const candidate = draft.candidate;
  const excerpt = instruction
    ? `${candidate?.excerpt_original ?? ""}\n\n編集者指示: ${instruction}`
    : (candidate?.excerpt_original ?? "");

  let output;
  try {
    output = await generateDraft(
      candidate?.url ?? "",
      candidate?.title_original ?? "",
      excerpt
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Claude API error" },
      { status: 500 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("ins_drafts")
    .update({
      title_jp: output.title_jp,
      summary_jp: output.summary_jp,
      body_jp: output.body_jp,
      category: output.category,
      region: output.region,
      tags: output.tags,
      ai_model: "claude-sonnet-4-6",
      generated_at: new Date().toISOString(),
      state: "pending",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, candidate });
}
