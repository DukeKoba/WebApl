import { supabaseAdmin } from "@/lib/insurid/supabase";
import SourcesClient from "./SourcesClient";
import type { Source } from "@/lib/insurid/types";

async function getSources(): Promise<Source[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("ins_sources")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Source[];
  } catch {
    return [];
  }
}

export default async function SourcesPage() {
  const sources = await getSources();
  return <SourcesClient initialSources={sources} />;
}
