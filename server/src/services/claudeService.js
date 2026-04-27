import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

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
