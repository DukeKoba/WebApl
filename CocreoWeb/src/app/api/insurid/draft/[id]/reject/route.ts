import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/insurid/supabase";

interface Props { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: Props) {
  const { id } = await params;

  const { data: draft, error: dErr } = await supabaseAdmin
    .from("ins_drafts")
    .select("candidate_id")
    .eq("id", id)
    .single();

  if (dErr || !draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  await supabaseAdmin.from("ins_drafts").update({ state: "rejected" }).eq("id", id);
  if (draft.candidate_id) {
    await supabaseAdmin
      .from("ins_candidates")
      .update({ state: "rejected" })
      .eq("id", draft.candidate_id);
  }

  return NextResponse.json({ ok: true });
}
