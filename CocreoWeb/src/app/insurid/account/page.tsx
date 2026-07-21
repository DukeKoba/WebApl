import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser, getServerProfile, createSupabaseServerClient } from "@/lib/insurid/supabase-server";
import AccountClient from "./AccountClient";

export const metadata: Metadata = { title: "マイページ" };

export default async function AccountPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/insurid/login?next=/insurid/account");
  }

  const profile = await getServerProfile(user.id);

  // Fetch bookmarks
  let bookmarks: { article_slug: string; article_title: string; created_at: string }[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("bookmarks")
      .select("article_slug, article_title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    bookmarks = data ?? [];
  } catch {
    bookmarks = [];
  }

  return (
    <AccountClient
      user={{ id: user.id, email: user.email ?? "" }}
      profile={profile}
      bookmarks={bookmarks}
    />
  );
}
