import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/insurid/supabase";

export async function POST(request: NextRequest) {
  const { urls } = await request.json();
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({});
  }

  const { data, error } = await supabaseAdmin
    .from("ins_candidates")
    .select("url, state, draft_id, id")
    .in("url", urls);

  if (error) return NextResponse.json({});

  const map: Record<string, { state: string; draft_id?: string; id: string }> = {};
  for (const row of data ?? []) {
    map[row.url] = { state: row.state, draft_id: row.draft_id, id: row.id };
  }
  return NextResponse.json(map);
}
