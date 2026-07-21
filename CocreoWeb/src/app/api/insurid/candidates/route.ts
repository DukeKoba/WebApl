import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/insurid/supabase";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("ins_candidates")
    .select("*")
    .order("fetched_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url, title_original = "", excerpt_original = "", source_id } = body;

  if (!url?.trim()) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // URLが既存なら既存レコードを返す（重複防止）
  const { data: existing } = await supabaseAdmin
    .from("ins_candidates")
    .select("*")
    .eq("url", url.trim())
    .maybeSingle();

  if (existing) return NextResponse.json(existing, { status: 200 });

  const { data, error } = await supabaseAdmin
    .from("ins_candidates")
    .insert({
      id: uuidv4(),
      url: url.trim(),
      title_original: title_original.trim(),
      excerpt_original: excerpt_original.trim(),
      source_id: source_id ?? null,
      fetched_at: new Date().toISOString(),
      state: "new",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
