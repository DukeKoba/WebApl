import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

export async function searchAiNews(contentType, label) {
  // Recency window: today, last 30 days, current year (computed at call time)
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const recent = `${y}年${m}月`;          // e.g. "2026年4月"
  const prevM = m === 1 ? `${y - 1}年12月` : `${y}年${m - 1}月`;
  const recencyTag = `${recent} OR ${prevM} 直近 最新`;

  const queries = {
    subsidy_news:   `AI IT導入補助金 ものづくり補助金 中小企業 ${recencyTag} 公募 締切 採択`,
    subsidy_howto:  `補助金 申請 採択率 事業計画書 書き方 中小企業 ${recencyTag}`,
    ai_dx:          `中小企業 AI業務改善 DX 事例 効果 ${recencyTag}`,
    ai_smb:         `中小企業 生成AI 導入事例 ROI 効果 ${recencyTag}`,
    ai_efficiency:  `生成AI 業務効率化 バックオフィス 自動化 事例 ${recencyTag}`,
    ai_tools:       `AIツール 業務活用 中小企業 新機能 リリース ${recencyTag}`,
    claude_biz:     `Claude Anthropic 業務活用 新機能 アップデート ${recencyTag}`,
    chatgpt_biz:    `ChatGPT OpenAI 業務活用 新機能 GPTs アップデート ${recencyTag}`,
    insurance_ai:   `保険代理店 AI 意向把握 コンプライアンス DX 事例 ${recencyTag}`,
    mvp:            `AI MVP 開発 内製化 Claude Code Cursor 事例 ${recencyTag}`,
    vibecoding:     `バイブコーディング Vibe Coding AI開発 ${recencyTag}`,
    cocreo_voice:   `中小企業 AI 業務改善 補助金 経営 トレンド ${recencyTag}`,
  };
  const query = queries[contentType] || `${label} 中小企業 AI 補助金 ${recencyTag}`;

  // Compute "no older than" boundary: 90 days ago
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
  const todayStr = `${y}-${String(m).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
      messages: [{
        role: 'user',
        content: `今日は ${todayStr} です。「${query}」で最新ニュース・公募情報・事例をWeb検索してください。

【厳守ルール】
- 公開日が ${cutoffStr} 以降（直近90日以内）の記事のみ採用すること。それより古い記事は採用せず、必要なら検索キーワードを変えて再検索すること（最大5回まで検索可）。
- 1回目の検索結果が古ければ、「${recent}」「直近」「最新」「today」などの語を加えて再検索すること。
- 各記事の公開日（YYYY-MM-DD）を必ず本文に明記すること。日付不明な記事は採用しないこと。

【出力形式】
X（Twitter）投稿のネタになりそうなトピックを3〜5件、箇条書きで日本語にまとめてください。各項目に以下を含めてください：
- 公開日（YYYY-MM-DD）
- 具体的な数字・金額・締切・ツール名・企業名・補助金名
- 出典URL

最後に、最もバズりそうなトピックの出典URLを1件「SOURCE_URL: https://...」の形式で必ず記載してください。
直近90日の記事が見つからない場合は「情報なし」とだけ返してください。`,
      }],
    });

    // Aggregate text + collect citations.
    // Prefer URLs the model actually cited (text-block citations) over raw search hits,
    // because the model has filtered for recency per the prompt rules above.
    let text = '';
    const cited = [];
    const citedSeen = new Set();
    const fallback = [];
    const fallbackSeen = new Set();

    for (const block of response.content || []) {
      if (block.type === 'text') {
        text += (text ? '\n' : '') + (block.text || '');
        for (const c of block.citations || []) {
          const url = c.url;
          if (!url || citedSeen.has(url)) continue;
          citedSeen.add(url);
          cited.push({ url, title: c.title || '' });
        }
      } else if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
        for (const item of block.content) {
          const url = item.url;
          if (!url || fallbackSeen.has(url)) continue;
          fallbackSeen.add(url);
          fallback.push({ url, title: item.title || '' });
        }
      }
    }

    if (!text || text.includes('情報なし')) return { summary: null, sourceUrl: null, sources: [] };

    // Extract a single best source URL (for character-limited X post embedding)
    const urlMatch = text.match(/SOURCE_URL:\s*(https?:\/\/\S+)/);
    const sourceUrl = urlMatch ? urlMatch[1] : (cited[0]?.url || fallback[0]?.url || null);
    const summary = text.replace(/SOURCE_URL:\s*https?:\/\/\S+/g, '').trim();
    const sources = (cited.length ? cited : fallback).slice(0, 5);
    return { summary, sourceUrl, sources };
  } catch {
    return { summary: null, sourceUrl: null, sources: [] };
  }
}

export async function searchAgentDxNews(contentType, label) {
  const queries = {
    dx_trend:     '保険代理店 DX デジタル化 最新動向 2025 2026',
    insurtech:    'InsurTech インシュアテック 最新 国内 2025 2026',
    compliance:   '保険業法 金融庁 規制 ガイドライン 2025 2026',
    customer_mgmt:'保険代理店 CRM 顧客管理 デジタル化 2025 2026',
    digital_sales: '保険 デジタル営業 LINE SNS Web集客 2025 2026',
    ai_usecase:   '保険代理店 AI 活用事例 導入 2025 2026',
    paperless:    '保険 電子化 ペーパーレス 電子署名 2025 2026',
    remote_meeting:'保険 オンライン商談 リモート 2025 2026',
    subsidy:      'IT導入補助金 小規模事業者 保険代理店 2025 2026',
    case_study:   '保険代理店 DX 成功事例 2025 2026',
  };
  const query = queries[contentType] || `保険代理店 ${label} 最新 2025 2026`;
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `「${query}」で最新のニュースや情報を検索してください。保険代理店向けX投稿のネタになりそうなトピックを3〜5件、箇条書きで日本語にまとめてください。各項目は具体的な数字・サービス名・事例を含めてください。最後に、最もバズりそうなトピックの出典URLを1件「SOURCE_URL: https://...」の形式で必ず記載してください。情報が見つからない場合は「情報なし」と返してください。`,
      }],
    });
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    if (!text || text.includes('情報なし')) return { summary: null, sourceUrl: null };
    const urlMatch = text.match(/SOURCE_URL:\s*(https?:\/\/\S+)/);
    const sourceUrl = urlMatch ? urlMatch[1] : null;
    const summary = text.replace(/SOURCE_URL:\s*https?:\/\/\S+/g, '').trim();
    return { summary, sourceUrl };
  } catch {
    return { summary: null, sourceUrl: null };
  }
}

export async function searchRamenTypeReviews(ramenType, location) {
  if (!ramenType) return null;
  try {
    const locationPart = location ? ` ${location}` : '';
    const query = `${ramenType}ラーメン${locationPart} 口コミ 特徴 おすすめ`;
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `「${query}」について食べログ・Googleマップ・Rettyなどで口コミを検索してください。以下を日本語でまとめてください：
・このラーメンスタイル（${ramenType}）の特徴・味わい
・スープの特徴（具体的に）
・麺の種類・食感
・人気のトッピング・食べ方
・実際の口コミコメント（具体的な表現を引用）
実際に見つかった情報のみ使用してください。情報が見つからない場合は「口コミ情報なし」と返してください。`,
      }],
    });
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    return text && !text.includes('口コミ情報なし') ? text : null;
  } catch {
    return null;
  }
}

export async function convertImpressionToEnglish(japaneseText) {
  try {
    return await generateTextFull(
      'You are a food writer specializing in Japanese ramen. Convert the user\'s impression into vivid, engaging English suitable for an Instagram caption. Keep it natural and enthusiastic, 1-3 sentences. Output only the English text, no explanation.',
      `以下の感想を、Instagramキャプション向けの自然な英語に変換してください：\n\n${japaneseText}`,
      { maxTokens: 300 }
    );
  } catch {
    return null;
  }
}

const INSTAGRAM_CAPTION_LIMIT = 2200;

export async function translateInstagramPostToEnglish(japanesePost) {
  try {
    let english = await generateTextFull(
      'You are a creative food writer specializing in Japanese cuisine. Translate this Japanese Instagram ramen post into natural, engaging English. Keep hashtags as-is. The English should be vivid, appetizing, and authentic — not a literal translation. CRITICAL: The total output (caption body + hashtags + emojis + spaces, everything) MUST be 2200 characters or fewer — Instagram\'s hard limit. If it would be longer, condense the body and trim less-essential hashtags so the final output is at or under 2200. Output only the translated post text, no explanation.',
      `以下の日本語Instagram投稿を、英語圏のフォロワーに響く自然な英語に翻訳してください（直訳でなく意訳でOK）。

【最重要・絶対遵守】出力全体を**2200文字以内**に収めること（Instagramキャプションのハード上限）。本文を削ってでもハッシュタグを減らしてでも、必ず2200文字以下に収める。出力前に文字数を数えて確認すること。

【出力】翻訳結果のみ（本文＋空行＋ハッシュタグ）。説明文不要。

【日本語投稿】
${japanesePost}`,
      { maxTokens: 1500 }
    );

    if (!english) return null;
    english = english.trim();

    // Safety net: if the model still went over, retry once asking it to compress.
    if (english.length > INSTAGRAM_CAPTION_LIMIT) {
      const retry = await generateTextFull(
        'You compress Instagram captions to fit Instagram\'s 2200-character limit while preserving voice and hashtags. Output only the compressed caption.',
        `次の英語Instagramキャプションは${english.length}文字あり、Instagram上限の2200文字を超えています。意味・トーン・主要なハッシュタグを保ったまま、必ず2200文字以下に収めてください。本文を圧縮し、優先度の低いハッシュタグを削ってください。出力は圧縮後のキャプションのみ：\n\n${english}`,
        { maxTokens: 1500 }
      );
      if (retry && retry.trim().length <= INSTAGRAM_CAPTION_LIMIT) {
        english = retry.trim();
      }
    }

    return english;
  } catch {
    return null;
  }
}

export async function searchRestaurantReviews(restaurantName, location, ramenType) {
  if (!restaurantName) return null;
  try {
    const parts = [restaurantName];
    if (location) parts.push(location);
    if (ramenType) parts.push(ramenType);
    parts.push('ラーメン');
    const query = parts.join(' ');
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `「${query}」について食べログ・Googleマップ・Rettyなどで口コミを検索してください。${ramenType ? `特に「${ramenType}」スタイルのラーメンに関する記述を優先して拾ってください。` : ''}以下を日本語でまとめてください：
・スープの特徴・味わい（具体的に）
・麺の種類・食感
・人気メニュー・おすすめ
・トッピングの特徴
・雰囲気・価格帯
・実際の口コミコメント（具体的な表現を引用）
実際に見つかった情報のみ使用してください。情報が見つからない場合は「口コミ情報なし」と返してください。`,
      }],
    });
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    return text && !text.includes('口コミ情報なし') ? text : null;
  } catch {
    return null;
  }
}


export async function generateText(systemPrompt, userMessage, options = {}) {
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: options.maxTokens || 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  return stream;
}

export async function generateTextFull(systemPrompt, userMessage, options = {}) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: options.maxTokens || 1024,
    temperature: options.temperature ?? 1.0,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  return response.content[0].text;
}

export async function analyzeRamenImage(imagePath) {
  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString('base64');
  const ext = imagePath.split('.').pop().toLowerCase();
  const mimeTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
  const mimeType = mimeTypes[ext] || 'image/jpeg';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: base64 },
        },
        {
          type: 'text',
          text: `この写真のラーメンを詳しく分析してください。以下の形式のJSONのみを返してください（説明文なし）：
{
  "ramen_type": "ラーメンのスタイル（醤油/味噌/豚骨/塩/つけ麺/その他）",
  "toppings": ["トッピング1", "トッピング2"],
  "appearance": "見た目の特徴（スープの色、麺の太さ、盛り付けなど）",
  "atmosphere": "雰囲気（カジュアル/高級/地元の名店/トレンド系）",
  "notable_features": "特筆すべき点",
  "japanese_description": "Instagramキャプション向けの魅力的な日本語説明文（1〜2文）",
  "detected_restaurant_name": "写真内の看板・メニュー・箸袋・丼・レシートなどに店名が明確に見える場合はラテン文字表記（日本語の場合はローマ字化）で返す。見えない場合は空文字列。"
}`,
        },
      ],
    }],
  });

  const text = response.content[0].text.trim();
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { english_description: text };
  } catch {
    return { english_description: text };
  }
}
