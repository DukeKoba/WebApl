import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/insurid/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("ins_drafts")
    .select("*, candidate:ins_candidates(*)")
    .in("state", ["pending", "edited"])
    .order("generated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
