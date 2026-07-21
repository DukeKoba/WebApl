import { supabaseAdmin } from "@/lib/insurid/supabase";
import QueueClient from "./QueueClient";
import type { Draft } from "@/lib/insurid/types";

async function getPendingDrafts(): Promise<Draft[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("ins_drafts")
      .select("*, candidate:ins_candidates(*)")
      .in("state", ["pending", "edited"])
      .order("generated_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Draft[];
  } catch {
    // Supabase not configured yet — return empty for UI preview
    return [];
  }
}

export default async function QueuePage() {
  const drafts = await getPendingDrafts();
  return <QueueClient initialDrafts={drafts} />;
}
