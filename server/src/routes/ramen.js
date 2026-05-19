import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { analyzeRamenImage, searchRestaurantReviews, searchRamenTypeReviews, convertImpressionToEnglish, translateInstagramPostToEnglish } from '../services/claudeService.js';
import { orchestrateAgents } from '../services/agentOrchestrator.js';
import { tryClaudeOrEmitPrompt } from '../services/claudeFallback.js';
import { postPhoto } from '../services/instagramService.js';
import { extractExifData, reverseGeocode, findNearbyRestaurant, normalizeImage } from '../services/photoLocationService.js';

const SLURP_APP_URL = 'https://apps.apple.com/app/id6761906850';

// Build a single consolidated prompt for ramen Japanese caption generation.
// Used in prompt-only / fallback mode (skips the multi-agent discussion).
function buildRamenSinglePrompt({ restaurantName, location, ramenType, visitDate, impressions, webReviews, imageAnalysis, previousPosts }) {
  const reviewBlock = webReviews
    ? `\n【取得済みWeb口コミ（このラーメンの実態を表す一次情報。架空の表現は使わない）】\n${webReviews}\n`
    : '\n（Web口コミ未取得。下記の店舗情報・感想のみで判断してください。架空・誇張は禁止）\n';

  let imageBlock = '';
  if (imageAnalysis) {
    const lines = [];
    if (imageAnalysis.ramen_type) lines.push(`- スタイル: ${imageAnalysis.ramen_type}`);
    if (Array.isArray(imageAnalysis.toppings) && imageAnalysis.toppings.length > 0) {
      lines.push(`- トッピング: ${imageAnalysis.toppings.join('、')}`);
    }
    if (imageAnalysis.appearance) lines.push(`- 見た目: ${imageAnalysis.appearance}`);
    if (imageAnalysis.atmosphere) lines.push(`- 雰囲気: ${imageAnalysis.atmosphere}`);
    if (imageAnalysis.notable_features) lines.push(`- 特筆点: ${imageAnalysis.notable_features}`);
    if (imageAnalysis.japanese_description) lines.push(`- AIによる説明: ${imageAnalysis.japanese_description}`);
    if (lines.length > 0) {
      imageBlock = `\n【写真のAI解析結果（実際にユーザーが食べた一杯の客観的描写）】\n${lines.join('\n')}\n`;
    }
  }

  const previousPostsBlock = previousPosts?.length
    ? `\n【この店の過去投稿（必ず異なる切り口・表現・構成で書くこと。同じフレーズや冒頭を繰り返さない）】\n${previousPosts.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n`
    : '';

  return `あなたはラーメン専門のInstagramコピーライターです。下記情報をもとに、Instagram用の日本語キャプションを作成してください。

【店舗・ラーメン情報】
- 店舗: ${restaurantName || '不明'}
- 場所: ${location || '不明'}
- ラーメンの種類: ${ramenType || '不明'}
- 訪問日: ${visitDate || '不明'}
- ユーザーの感想: ${impressions || ''}
${imageBlock}${reviewBlock}${previousPostsBlock}
【要件】
- 食欲をそそる日本語キャプション（本文200〜300文字、ハッシュタグ除く）
- 1行目で読者の手を止める引き（具体的な味の表現・店名・特徴）
- 口コミ・感想に基づき、架空の情報は入れない
- 絵文字を効果的に使用
- 末尾付近に「📲 Slurpでもっとラーメン情報をチェック！ ${SLURP_APP_URL}」を自然に挿入
- 1行空けて、ハッシュタグを最大5個（最も関連性の高いものを厳選）：
  - #ラーメン を必ず含める
  - ${ramenType ? `#${ramenType}` : 'ラーメンの種類に合ったタグ'}
  - ${location ? `#${location.replace(/[\s,]/g, '')}` : '場所タグ'}
  - あと2個を口コミ・特徴から厳選（重複しないこと）

【出力形式】
キャプション本文（SlurpのURLを含む一文を含む）＋空行＋ハッシュタグの順で出力してください。前後に説明文は不要です。`;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const router = express.Router();

// POST /api/ramen/upload - Upload photo + Claude Vision analysis + EXIF GPS → location & restaurant name
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image found' });

  try {
    // EXIF must be read from the original (sharp strips metadata on output)
    const exif = await extractExifData(req.file.path);

    // HEIC・巨大JPEG・wide gamutなどClaude Visionが弾く形式を全てsRGB JPEGへ正規化
    let normalized;
    try {
      normalized = await normalizeImage(req.file.path);
    } catch (e) {
      console.error('[ramen/upload] normalizeImage failed:', {
        message: e.message,
        stack: e.stack,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
      return res.status(400).json({
        error: `画像を読み込めませんでした (${req.file.mimetype || 'unknown'}): ${e.message}`,
      });
    }

    const hasGps = exif && exif.latitude != null && exif.longitude != null;

    const [analysis, restaurantFromGps, geo] = await Promise.all([
      analyzeRamenImage(normalized.path),
      hasGps ? findNearbyRestaurant(exif.latitude, exif.longitude) : Promise.resolve(null),
      hasGps ? reverseGeocode(exif.latitude, exif.longitude) : Promise.resolve(null),
    ]);

    const location = geo?.locationLabel || null;

    // 店名は「画像内で検出できた看板」を優先し、なければ GPS 周辺から推定
    const detectedRestaurant = (analysis?.detected_restaurant_name || '').trim();
    const restaurantName = detectedRestaurant || restaurantFromGps || null;

    res.json({
      image_id: normalized.filename,
      image_url: `/uploads/${normalized.filename}`,
      analysis,
      detected: {
        restaurant_name: restaurantName,
        location,
        taken_at: exif?.takenAt ? new Date(exif.takenAt).toISOString().slice(0, 10) : null,
        gps: hasGps ? { latitude: exif.latitude, longitude: exif.longitude } : null,
        sources: {
          restaurant: detectedRestaurant ? 'image' : (restaurantFromGps ? 'gps' : null),
          location: location ? 'gps' : null,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ramen/search-reviews - Search web reviews for a restaurant
router.post('/search-reviews', async (req, res) => {
  const { restaurant_name, location, ramen_type, prompt_only = false } = req.body;
  if (!restaurant_name) return res.json({ reviews: null });

  if (prompt_only) {
    // Return search query + fetch instructions for the user to run externally
    const parts = [restaurant_name];
    if (location) parts.push(location);
    if (ramen_type) parts.push(ramen_type);
    parts.push('ラーメン 口コミ');
    const query = parts.join(' ');
    return res.json({
      reviews: null,
      fallback_prompt: {
        prompts: [{
          label: '口コミ検索プロンプト（外部AIまたはGoogle検索で実行）',
          system: 'あなたは日本のラーメン口コミに詳しいリサーチャーです。',
          user: `「${query}」について食べログ・Googleマップ・Rettyなどで口コミを検索し、以下を日本語でまとめてください：
・スープの特徴・味わい（具体的に）
・麺の種類・食感
・人気メニュー・おすすめ
・トッピングの特徴
・雰囲気・価格帯
・実際の口コミコメント（具体的な表現を引用）

検索クエリ例: ${query}`,
        }],
      },
    });
  }

  try {
    const reviews = await searchRestaurantReviews(restaurant_name, location, ramen_type);
    res.json({ reviews: reviews || null });
  } catch (err) {
    res.json({ reviews: null, error: err.message });
  }
});

// POST /api/ramen/search-ramen-reviews - Search web reviews by ramen type
router.post('/search-ramen-reviews', async (req, res) => {
  const { ramen_type, location } = req.body;
  if (!ramen_type) return res.json({ reviews: null });
  try {
    const reviews = await searchRamenTypeReviews(ramen_type, location);
    res.json({ reviews: reviews || null });
  } catch {
    res.json({ reviews: null });
  }
});

// POST /api/ramen/translate-to-english - Translate Japanese Instagram post to English
router.post('/translate-to-english', async (req, res) => {
  const { text, prompt_only = false } = req.body;
  if (!text) return res.json({ english: null });

  if (prompt_only) {
    return res.json({
      english: null,
      fallback_prompt: {
        prompts: [{
          label: '英語Instagramキャプション翻訳プロンプト',
          system: `You are a creative food writer specializing in Japanese ramen culture, crafting captions for an international Instagram audience. Your goal is a vivid food story — not a literal translation, but an authentic experience.

Rules:
1. STORYTELLING: Write as if sharing a personal food discovery. Use sensory language (aroma, texture, depth of flavor). Make readers feel they must visit.
2. RAMEN TERMS: Naturally explain Japanese terms inline (e.g., "shoyu — a clear, soy-seasoned broth", "chashu — melt-in-your-mouth braised pork", "tsukemen — thick noodles served for dipping").
3. HASHTAGS: Replace ALL Japanese hashtags with English equivalents that international users actually search. Use: #ramen #ramennoodles #japanesefood #foodie #tokyofood (adjust location/type to English). Never keep Japanese-script hashtags.
4. SLURP LINE: The line starting with "📲 Slurp" must become: "📲 Discover more ramen spots on Slurp! [keep the original URL]"
5. LENGTH: Total output MUST be 2200 characters or fewer. Condense if needed.
6. OUTPUT: Caption body + one blank line + hashtags only. No explanation.`,
          user: `Craft an English Instagram caption from this Japanese ramen post. Follow all rules in the system prompt exactly.

[Japanese post]
${text}`,
        }],
      },
    });
  }

  try {
    const english = await translateInstagramPostToEnglish(text);
    res.json({ english: english || null });
  } catch (err) {
    res.json({ english: null, error: err.message });
  }
});

// POST /api/ramen/convert-impression - Convert Japanese impression to English
router.post('/convert-impression', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.json({ english: null });
  try {
    const english = await convertImpressionToEnglish(text);
    res.json({ english: english || null });
  } catch {
    res.json({ english: null });
  }
});

// POST /api/ramen/generate - Generate Japanese caption via agent discussion (SSE)
router.post('/generate', async (req, res) => {
  const {
    image_id,
    image_analysis,
    restaurant_name,
    location,
    ramen_type,
    visit_date,
    impressions,
    web_reviews,
    prompt_only = false,
  } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const postId = uuidv4();
    const convId = uuidv4();

    const previousPosts = restaurant_name
      ? db.prepare(
          `SELECT post_text FROM sns_posts WHERE app_type = 'ramen' AND json_extract(metadata, '$.restaurant_name') = ? ORDER BY created_at DESC LIMIT 3`
        ).all(restaurant_name).map(r => r.post_text)
      : [];

    const task = {
      type: 'ramen',
      platform: 'instagram',
      imageAnalysis: image_analysis || null,
      restaurantName: restaurant_name,
      location,
      ramenType: ramen_type,
      visitDate: visit_date,
      impressions,
      webReviews: web_reviews || null,
      previousPosts,
    };

    // Build a consolidated single prompt for prompt-only / fallback mode
    // (skips multi-agent discussion, gets the same final result via one shot)
    const singlePromptInfo = [{
      label: '日本語Instagramキャプション生成プロンプト（一括実行用）',
      system: 'あなたはラーメン専門のInstagramコピーライターです。日本語で食欲をそそる魅力的なキャプションを書きます。',
      user: buildRamenSinglePrompt({
        restaurantName: restaurant_name,
        location,
        ramenType: ramen_type,
        visitDate: visit_date,
        impressions,
        webReviews: web_reviews,
        imageAnalysis: image_analysis,
        previousPosts,
      }),
    }];

    const messages = [];
    const result = await tryClaudeOrEmitPrompt(
      singlePromptInfo,
      async () => {
        const r = await orchestrateAgents(task, (msg) => {
          sendEvent('agent_message', msg);
          messages.push(msg);
        });
        return r.finalPost;
      },
      sendEvent,
      prompt_only,
    );

    if (result == null) {
      sendEvent('done', {});
      return;
    }

    const finalPost = result;
    const metadata = { restaurant_name, location, ramen_type, visit_date, impressions };

    db.prepare(
      `INSERT INTO sns_posts (id, app_type, post_text, image_path, image_analysis, metadata, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      postId,
      'ramen',
      finalPost,
      image_id || null,
      image_analysis ? JSON.stringify(image_analysis) : null,
      JSON.stringify(metadata),
      'draft',
    );

    if (messages.length > 0) {
      db.prepare(`INSERT INTO agent_conversations (id, post_id) VALUES (?, ?)`).run(convId, postId);
      const insertMsg = db.prepare(
        `INSERT INTO agent_messages (id, conversation_id, agent_role, agent_name, round, content) VALUES (?, ?, ?, ?, ?, ?)`
      );
      for (const msg of messages) {
        insertMsg.run(uuidv4(), convId, msg.agent, msg.name, msg.round, msg.content);
      }
    }

    sendEvent('final_post', { post_id: postId, post_text: finalPost, has_web_reviews: !!web_reviews });
    sendEvent('done', {});
  } catch (err) {
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

// POST /api/ramen/save-manual - Save manually-pasted Japanese caption as a draft
router.post('/save-manual', (req, res) => {
  const { post_text, restaurant_name, location, ramen_type, visit_date, impressions, image_id, image_analysis } = req.body;
  if (!post_text?.trim()) return res.status(400).json({ error: 'post_text is required' });
  const postId = uuidv4();
  const metadata = { restaurant_name, location, ramen_type, visit_date, impressions, manual: true };
  db.prepare(
    `INSERT INTO sns_posts (id, app_type, post_text, image_path, image_analysis, metadata, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    postId,
    'ramen',
    post_text.trim(),
    image_id || null,
    image_analysis ? JSON.stringify(image_analysis) : null,
    JSON.stringify(metadata),
    'draft',
  );
  res.json({ post_id: postId, post_text: post_text.trim() });
});

// POST /api/ramen/posts/:id/finalize-japanese - Lock in user-edited Japanese
router.post('/posts/:id/finalize-japanese', (req, res) => {
  const { post_text } = req.body;
  if (!post_text) return res.status(400).json({ error: 'post_text is required' });
  db.prepare(`UPDATE sns_posts SET post_text = ? WHERE id = ? AND app_type = 'ramen'`).run(post_text, req.params.id);
  res.json({ success: true });
});

// GET /api/ramen/posts
router.get('/posts', (req, res) => {
  const posts = db.prepare(
    `SELECT * FROM sns_posts WHERE app_type = 'ramen' ORDER BY created_at DESC`
  ).all();
  res.json(posts.map(p => ({
    ...p,
    metadata: JSON.parse(p.metadata || '{}'),
    image_analysis: p.image_analysis ? JSON.parse(p.image_analysis) : null,
    image_url: p.image_path ? `/uploads/${p.image_path}` : null,
  })));
});

// GET /api/ramen/posts/:id
router.get('/posts/:id', (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'ramen'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const conversation = db.prepare(`SELECT * FROM agent_conversations WHERE post_id = ?`).get(post.id);
  const messages = conversation
    ? db.prepare(`SELECT * FROM agent_messages WHERE conversation_id = ? ORDER BY round, created_at`).all(conversation.id)
    : [];

  res.json({
    ...post,
    metadata: JSON.parse(post.metadata || '{}'),
    image_analysis: post.image_analysis ? JSON.parse(post.image_analysis) : null,
    image_url: post.image_path ? `/uploads/${post.image_path}` : null,
    messages,
  });
});

// PUT /api/ramen/posts/:id
router.put('/posts/:id', (req, res) => {
  const { post_text } = req.body;
  db.prepare(`UPDATE sns_posts SET post_text = ? WHERE id = ? AND app_type = 'ramen'`).run(post_text, req.params.id);
  res.json({ success: true });
});

// POST /api/ramen/posts/:id/publish
router.post('/posts/:id/publish', async (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'ramen'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  try {
    const baseUrl = process.env.SERVER_BASE_URL || 'http://localhost:3001';
    const imageUrl = post.image_path ? `${baseUrl}/uploads/${post.image_path}` : null;

    if (!imageUrl) {
      return res.status(400).json({ error: 'An image is required' });
    }

    const result = await postPhoto(imageUrl, post.post_text);
    db.prepare(
      `UPDATE sns_posts SET status = 'posted', social_post_id = ?, social_posted_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(result.id, post.id);
    res.json({ success: true, post_id: result.id });
  } catch (err) {
    db.prepare(`UPDATE sns_posts SET status = 'failed', error_message = ? WHERE id = ?`).run(err.message, post.id);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/ramen/posts/:id
router.delete('/posts/:id', (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'ramen'`).get(req.params.id);
  if (post?.image_path) {
    const filePath = path.join(uploadDir, post.image_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare(`DELETE FROM sns_posts WHERE id = ? AND app_type = 'ramen'`).run(req.params.id);
  res.status(204).end();
});

export default router;
