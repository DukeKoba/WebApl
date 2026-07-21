import type { Category, Region } from "./types";

const GEMINI_API_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title_jp:        { type: "STRING" },
    summary_jp:      { type: "STRING" },
    body_jp:         { type: "STRING" },
    category:        { type: "STRING", enum: ["broker","insurer","market","claims","regulation","strategy","howto"] },
    region:          { type: "STRING", enum: ["us","uk","eu","asia","jp","global"] },
    tags:            { type: "ARRAY", items: { type: "STRING" } },
    importance_score:{ type: "INTEGER" },
  },
  required: ["title_jp","summary_jp","body_jp","category","region","tags","importance_score"],
};

export interface DraftOutput {
  title_jp: string;
  summary_jp: string;
  body_jp: string;
  category: Category;
  region: Region;
  tags: string[];
  importance_score: number;
}

async function callGemini(prompt: string): Promise<DraftOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
  });

  const res = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini returned empty response");
  return JSON.parse(text) as DraftOutput;
}

// Translates an overseas news article into Japanese for insurance agents
export async function generateDraft(
  sourceUrl: string,
  titleOriginal: string,
  excerptOriginal: string,
  articleText = ""
): Promise<DraftOutput> {
  const articleSection = articleText
    ? `\nArticle body excerpt:\n${articleText.slice(0, 3000)}`
    : "\nNote: Full article body unavailable. Infer from title and excerpt.";

  const prompt = [
    "You are an editor for INSURID, a Japanese insurance industry news site.",
    "Translate and summarize the following overseas insurance news for Japanese insurance agents.",
    "Output ONLY valid JSON. Keys:",
    "  title_jp: Japanese title (under 40 chars, factual)",
    "  summary_jp: Japanese lead (120-200 chars, what happened)",
    "  body_jp: Japanese body Markdown with 3 sections:",
    "    ## 何が起きたか",
    "    ## どんな仕組みか",
    "    ## 日本の代理店にとっての示唆",
    "    (600-1200 chars total)",
    '  category: one of ["broker","insurer","market","claims","regulation","strategy","howto"]',
    '  region: one of ["us","uk","eu","asia","jp","global"]',
    "  tags: 3-6 Japanese tags",
    "  importance_score: 1-100",
    "",
    `Source URL: ${sourceUrl}`,
    `Title: ${titleOriginal || "(unknown)"}`,
    `Excerpt: ${excerptOriginal || "(none)"}`,
    articleSection,
  ].join("\n");

  return callGemini(prompt);
}

// Writes an original analysis/column article for Japanese insurance agents
export async function generateOriginal(
  topic: string,
  recentTitles: string[] = []
): Promise<DraftOutput> {
  const context = recentTitles.length > 0
    ? `\nRecent overseas news context:\n${recentTitles.slice(0, 8).map((t, i) => `${i + 1}. ${t}`).join("\n")}`
    : "";

  const prompt = [
    "You are a senior editor at INSURID, a media outlet for Japanese insurance agents.",
    "Write an ORIGINAL analysis article (not a translation) about the following topic.",
    "Your perspective: a knowledgeable advisor helping Japanese agents understand global trends.",
    "Output ONLY valid JSON. Keys:",
    "  title_jp: Compelling Japanese title (under 40 chars, can be opinionated)",
    "  summary_jp: Japanese hook paragraph (120-200 chars, why this matters NOW)",
    "  body_jp: Original Japanese analysis in Markdown with these sections:",
    "    ## 注目すべき背景 (Why this matters now — 200 chars)",
    "    ## 海外の最前線 (What's happening globally — 400 chars)",
    "    ## 日本の代理店への提言 (Concrete advice for Japanese agents — 400 chars)",
    "    ## まとめ (Key takeaway — 150 chars)",
    "    (1200-2000 chars total, original analysis not translation)",
    '  category: one of ["broker","insurer","market","claims","regulation","strategy","howto"]',
    '  region: one of ["us","uk","eu","asia","jp","global"]',
    "  tags: 3-6 Japanese tags",
    "  importance_score: 1-100",
    "",
    `Topic: ${topic}`,
    context,
  ].join("\n");

  return callGemini(prompt);
}
