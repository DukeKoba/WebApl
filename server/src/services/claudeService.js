import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

export async function searchAiNews(contentType, label) {
  const queries = {
    subsidy_news:   'AI IT導入補助金 ものづくり補助金 事業再構築補助金 中小企業 2026 公募 締切',
    subsidy_howto:  '補助金 申請 採択率 事業計画書 書き方 中小企業 2026',
    ai_dx:          '中小企業 AI業務改善 DX 事例 効果 2026',
    ai_smb:         '中小企業 生成AI 導入事例 ROI 効果 2026',
    ai_efficiency:  '生成AI 業務効率化 バックオフィス 自動化 事例 2026',
    ai_tools:       'AIツール 業務活用 中小企業 比較 新機能 2026',
    claude_biz:     'Claude Anthropic 業務活用 新機能 2026',
    chatgpt_biz:    'ChatGPT OpenAI 業務活用 新機能 GPTs 2026',
    insurance_ai:   '保険代理店 AI 意向把握 コンプライアンス DX 事例 2026',
    mvp:            'AI MVP 開発 内製化 Claude Code Cursor 2026',
    vibecoding:     'バイブコーディング Vibe Coding AI開発 最新 2026',
    cocreo_voice:   '中小企業 AI 業務改善 補助金 経営 トレンド 2026',
  };
  const query = queries[contentType] || `${label} 中小企業 AI 補助金 2026`;
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `「${query}」で最新のニュース・公募情報・事例を検索してください。X（Twitter）投稿のネタになりそうなトピックを3〜5件、箇条書きで日本語にまとめてください。
各項目は以下を含めてください：
- 具体的な数字・金額・締切・ツール名・企業名・補助金名
- 出典のURL（必ず）
情報が見つからない場合は「情報なし」と返してください。`,
      }],
    });

    // Aggregate text + collect citations (deduped)
    let text = '';
    const seen = new Set();
    const sources = [];

    for (const block of response.content || []) {
      if (block.type === 'text') {
        text += (text ? '\n' : '') + (block.text || '');
        for (const c of block.citations || []) {
          const url = c.url;
          if (!url || seen.has(url)) continue;
          seen.add(url);
          sources.push({ url, title: c.title || '' });
        }
      } else if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
        for (const item of block.content) {
          const url = item.url;
          if (!url || seen.has(url)) continue;
          seen.add(url);
          sources.push({ url, title: item.title || '' });
        }
      }
    }

    if (!text || text.includes('情報なし')) return null;
    return { text, sources: sources.slice(0, 5) };
  } catch {
    return null;
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

export async function searchRestaurantReviews(restaurantName, location) {
  if (!restaurantName) return null;
  try {
    const query = location ? `${restaurantName} ${location} ラーメン` : `${restaurantName} ラーメン`;
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `「${query}」について食べログ・Googleマップ・Rettyなどで口コミを検索してください。以下を日本語でまとめてください：
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

export async function translateToJapanese(englishText) {
  try {
    return await generateTextFull(
      'あなたは翻訳の専門家です。英語のInstagram投稿文を自然な日本語に翻訳してください。ハッシュタグはそのまま維持してください。',
      `以下の英語投稿文を日本語に翻訳してください（参考用）:\n\n${englishText}`,
      { maxTokens: 1024 }
    );
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
          text: `Analyze the ramen in this photo in detail. Return ONLY JSON (no prose) in the following exact shape:
{
  "ramen_type": "ramen style in English (Miso / Shoyu / Tonkotsu / Shio / Tsukemen / Other)",
  "toppings": ["topping 1 in English", "topping 2 in English"],
  "appearance": "visual characteristics in English (broth color, noodle thickness, plating)",
  "atmosphere": "overall vibe in English (casual / upscale / local / trendy)",
  "notable_features": "any standout points in English",
  "english_description": "A vivid 1-2 sentence English description suitable for an Instagram caption",
  "detected_restaurant_name": "If a restaurant name is clearly visible on signage, menu, chopstick sleeve, bowl, or receipt in the photo, return the exact name in Latin characters (transliterate from Japanese if needed). If no restaurant name is visible, return an empty string."
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
