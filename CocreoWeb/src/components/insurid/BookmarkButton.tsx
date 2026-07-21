"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/insurid/supabase-browser";

interface Props {
  articleSlug: string;
  articleTitle: string;
}

export default function BookmarkButton({ articleSlug, articleTitle }: Props) {
  const [bookmarked, setBookmarked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      setUserId(session.user.id);
      const { data } = await supabase
        .from("bookmarks")
        .select("article_slug")
        .eq("user_id", session.user.id)
        .eq("article_slug", articleSlug)
        .maybeSingle();
      setBookmarked(!!data);
    });
  }, [articleSlug]);

  const toggle = useCallback(async () => {
    if (!userId) {
      window.location.href = `/insurid/login?next=/insurid/articles/${articleSlug}`;
      return;
    }
    const supabase = getSupabaseBrowser();
    setLoading(true);
    if (bookmarked) {
      await supabase.from("bookmarks").delete()
        .eq("user_id", userId).eq("article_slug", articleSlug);
      setBookmarked(false);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("bookmarks") as any).insert({
        user_id: userId,
        article_slug: articleSlug,
        article_title: articleTitle,
      });
      setBookmarked(true);
    }
    setLoading(false);
  }, [userId, bookmarked, articleSlug, articleTitle]);

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={bookmarked ? "ブックマーク解除" : "ブックマーク"}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 border rounded-lg text-sm transition-colors ${
        bookmarked
          ? "border-primary bg-primary/5 text-primary"
          : "border-border text-text-secondary hover:bg-surface-soft"
      }`}
    >
      <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-primary" : ""}`} />
      {bookmarked ? "保存済み" : "保存"}
    </button>
  );
}
