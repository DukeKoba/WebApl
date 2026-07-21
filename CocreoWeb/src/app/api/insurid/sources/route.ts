import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/insurid/supabase";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("ins_sources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, url, kind = "manual", region = "global", language = "en", trust_score = 3 } = body;

  if (!name?.trim() || !url?.trim()) {
    return NextResponse.json({ error: "name and url are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("ins_sources")
    .insert({
      id: uuidv4(),
      name: name.trim(),
      url: url.trim(),
      kind,
      region,
      language,
      trust_score,
      active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
