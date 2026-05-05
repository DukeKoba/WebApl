import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

export async function searchAiNews(contentType, label) {
  const queries = {
    aitips:      '生成AI 活用事例 最新 2025 2026',
    vibecoding:  'バイブコーディング Vibe Coding AI開発 最新 2025 2026',
    news:        'AI 最新ニュース 技術動向 2025 2026',
    coding:      'AIコーディング ツール 新機能 2025 2026',
    tools:       'AIツール 新リリース 機能追加 2025 2026',
    chatgpt:     'ChatGPT OpenAI 新機能 アップデート 2025 2026',
    ml:          '機械学習 深層学習 最新研究 論文 2025 2026',
    prompt:      'プロンプトエンジニアリング 最新テクニック 2025 2026',
    business:    'AI ビジネス活用 企業導入事例 2025 2026',
    ethics:      'AI倫理 規制 ガイドライン 2025 2026',
    basics:      'AI入門 基礎知識 最新トレンド 2025 2026',
  };
  const query = queries[contentType] || `${label} AI 最新 2025 2026`;
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `「${query}」で最新のニュースやトレンドを検索してください。X（Twitter）投稿のネタになりそうなトピックを3〜5件、箇条書きで日本語にまとめてください。各項目は具体的な数字・ツール名・事例を含めてください。最後に、最もバズりそうなトピックの出典URLを1件「SOURCE_URL: https://...」の形式で必ず記載してください。情報が見つからない場合は「情報なし」と返してください。`,
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

export async function translateInstagramPostToEnglish(japanesePost) {
  try {
    return await generateTextFull(
      'You are a creative food writer specializing in Japanese cuisine. Translate this Japanese Instagram ramen post into natural, engaging English. Keep hashtags as-is. The English should be vivid, appetizing, and authentic — not a literal translation. Output only the translated post text, no explanation.',
      `以下の日本語Instagram投稿を、英語圏のフォロワーに響く自然な英語に翻訳してください（直訳でなく意訳でOK）:\n\n${japanesePost}`,
      { maxTokens: 1024 }
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
