import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { analyzeRamenImage, searchRestaurantReviews, searchRamenTypeReviews, convertImpressionToEnglish, translateInstagramPostToEnglish } from '../services/claudeService.js';
import { orchestrateAgents } from '../services/agentOrchestrator.js';
import { postPhoto } from '../services/instagramService.js';
import { extractExifData, reverseGeocode, findNearbyRestaurant } from '../services/photoLocationService.js';

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
  limits: { fileSize: 10 * 1024 * 1024 },
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
    // EXIF GPS 抽出と Claude Vision を並列実行（Vision は時間がかかるので他の処理を待たせない）
    const [analysis, exif] = await Promise.all([
      analyzeRamenImage(req.file.path),
      extractExifData(req.file.path),
    ]);

    let location = null;
    let restaurantFromGps = null;
    const hasGps = exif && exif.latitude != null && exif.longitude != null;

    if (hasGps) {
      // 近隣店舗と逆ジオコーディングを並列実行
      const [restaurantName, geo] = await Promise.all([
        findNearbyRestaurant(exif.latitude, exif.longitude),
        reverseGeocode(exif.latitude, exif.longitude),
      ]);
      restaurantFromGps = restaurantName;
      if (geo) location = geo.locationLabel;
    }

    // 店名は「画像内で検出できた看板」を優先し、なければ GPS 周辺から推定
    const detectedRestaurant = (analysis?.detected_restaurant_name || '').trim();
    const restaurantName = detectedRestaurant || restaurantFromGps || null;

    res.json({
      image_id: req.file.filename,
      image_url: `/uploads/${req.file.filename}`,
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
  const { restaurant_name, location } = req.body;
  if (!restaurant_name) return res.json({ reviews: null });
  try {
    const reviews = await searchRestaurantReviews(restaurant_name, location);
    res.json({ reviews: reviews || null });
  } catch {
    res.json({ reviews: null });
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
  const { text } = req.body;
  if (!text) return res.json({ english: null });
  try {
    const english = await translateInstagramPostToEnglish(text);
    res.json({ english: english || null });
  } catch {
    res.json({ english: null });
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

// POST /api/ramen/generate - Generate post via agent discussion (SSE)
router.post('/generate', async (req, res) => {
  const { image_id, image_analysis, restaurant_name, location, visit_date, impressions, web_reviews } = req.body;

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
    const imagePath = image_id ? path.join(uploadDir, image_id) : null;

    const task = {
      type: 'ramen',
      platform: 'instagram',
      imageAnalysis: image_analysis,
      restaurantName: restaurant_name,
      location,
      visitDate: visit_date,
      impressions,
      webReviews: web_reviews || null,
    };

    const messages = [];
    const { conversation, finalPost, japaneseTranslation } = await orchestrateAgents(task, (msg) => {
      sendEvent('agent_message', msg);
      messages.push(msg);
    });

    const metadata = { restaurant_name, location, visit_date, impressions };

    db.prepare(
      `INSERT INTO sns_posts (id, app_type, post_text, image_path, image_analysis, metadata, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(postId, 'ramen', finalPost, image_id || null, JSON.stringify(image_analysis), JSON.stringify(metadata), 'draft');

    db.prepare(`INSERT INTO agent_conversations (id, post_id) VALUES (?, ?)`).run(convId, postId);

    const insertMsg = db.prepare(
      `INSERT INTO agent_messages (id, conversation_id, agent_role, agent_name, round, content) VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const msg of messages) {
      insertMsg.run(uuidv4(), convId, msg.agent, msg.name, msg.round, msg.content);
    }

    sendEvent('final_post', { post_id: postId, post_text: finalPost, japanese_translation: japaneseTranslation, has_web_reviews: !!web_reviews });
    sendEvent('done', {});
  } catch (err) {
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
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
