import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

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
