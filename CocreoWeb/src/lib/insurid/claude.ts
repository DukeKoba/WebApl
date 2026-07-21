import Anthropic from "@anthropic-ai/sdk";
import type { Category, Region } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Cached system prompt — sent with cache_control so it stays in Anthropic's cache
// across requests (5 min TTL). Saves ~300 input tokens per draft.
const MEDIA_GUIDELINES = `あなたはINSURIDの編集者です。海外保険業界の記事を日本の保険代理店向けに翻訳・編集します。

【媒体ガイドライン】
- 読者: 日本の保険代理店経営者・担当者（保険業界歴5〜20年）
- トーン: 専門的かつ実務的。難解な保険用語は補足説明を添える
- 構成: 必ず「## 何が起きたか」「## どんな仕組みか」「## 日本の代理店にとっての示唆」の3節で書く
- 本文字数: 600〜1,200字（日本語）
- リード: 120〜200字の要点凝縮（本文とは別に作成）
- スタイル: 事実ベース。推測は「〜と見られる」「〜が予想される」と明示
- 示唆セクション: 日本の代理店が今すぐ実践できるアクションか注目ポイントを必ず述べる
- Cocreoへの言及は示唆セクション末尾に1行のみ（任意）
- タイトル: 40字以内、体言止めで数値を含むと良い`;

export interface DraftOutput {
  title_jp: string;
  summary_jp: string;
  body_jp: string;
  category: Category;
  region: Region;
  tags: string[];
  importance_score: number;
}

export async function generateDraft(
  sourceUrl: string,
  titleOriginal: string,
  excerptOriginal: string
): Promise<DraftOutput> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: MEDIA_GUIDELINES,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: "create_article_draft",
        description: "保険業界記事の日本語ドラフトを構造化データで出力する",
        input_schema: {
          type: "object" as const,
          properties: {
            title_jp: {
              type: "string",
              description: "日本語タイトル（40字以内、数値があれば含める）",
            },
            summary_jp: {
              type: "string",
              description: "リード文（120〜200字。本文とは独立した要点凝縮）",
            },
            body_jp: {
              type: "string",
              description:
                "本文Markdown（## 何が起きたか / ## どんな仕組みか / ## 日本の代理店にとっての示唆 の3節必須）",
            },
            category: {
              type: "string",
              enum: ["broker", "insurer", "market", "claims", "regulation", "strategy", "howto"],
              description: "broker=海外ブローカー insurer=AIテクノロジー market=市場料率動向 claims=損害クレーム regulation=規制 strategy=経営MA howto=実務ガイド",
            },
            region: {
              type: "string",
              enum: ["us", "uk", "eu", "asia", "jp", "global"],
              description: "記事の主な地域",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "検索タグ（3〜6個、日本語）",
            },
            importance_score: {
              type: "number",
              description: "代理店にとっての重要度スコア 1〜100",
            },
          },
          required: ["title_jp", "summary_jp", "body_jp", "category", "region", "tags", "importance_score"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "create_article_draft" },
    messages: [
      {
        role: "user",
        content: `以下の記事情報を元に日本語ドラフトを作成してください。

元記事URL: ${sourceUrl}
元タイトル: ${titleOriginal || "（タイトル不明）"}
元要約: ${excerptOriginal || "（要約なし）"}

URLと元情報から内容を推測・補完し、日本の保険代理店向けに編集してください。`,
      },
    ],
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return expected tool use output");
  }

  return toolUse.input as DraftOutput;
}
