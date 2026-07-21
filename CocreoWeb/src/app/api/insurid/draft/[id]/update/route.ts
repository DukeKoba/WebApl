import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/insurid/supabase";

interface Props { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await request.json();
  const { title_jp, summary_jp, body_jp, category, region, tags, paywall } = body;

  const updates: Record<string, unknown> = { state: "edited" };
  if (title_jp !== undefined) updates.title_jp = title_jp;
  if (summary_jp !== undefined) updates.summary_jp = summary_jp;
  if (body_jp !== undefined) updates.body_jp = body_jp;
  if (category !== undefined) updates.category = category;
  if (region !== undefined) updates.region = region;
  if (tags !== undefined) updates.tags = tags;
  if (paywall !== undefined) updates.paywall = paywall;

  const { data, error } = await supabaseAdmin
    .from("ins_drafts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
