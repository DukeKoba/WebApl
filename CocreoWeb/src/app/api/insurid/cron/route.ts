import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Vercel Cron は Authorization: Bearer {CRON_SECRET} を付与する
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${request.headers.get("host")}`;

  try {
    // 翻訳ニュース収集
    const collectRes = await fetch(`${baseUrl}/api/insurid/auto-collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ max_per_feed: 15 }),
      signal: AbortSignal.timeout(240000),
    });
    const collectData = await collectRes.json().catch(() => ({}));

    // オリジナル解説記事を1本生成（1日数回の実行で積み上げる）
    const origRes = await fetch(`${baseUrl}/api/insurid/generate-original`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: 3 }),
      signal: AbortSignal.timeout(60000),
    });
    const origData = await origRes.json().catch(() => ({}));

    return NextResponse.json({
      ok: true,
      collected: collectData.processed ?? 0,
      originals: origData.generated ?? 0,
      errors: (collectData.errors ?? 0) + (origData.errors ?? 0),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
