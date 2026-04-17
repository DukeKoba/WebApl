import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { generateTextFull } from '../services/claudeService.js';
import { postTweet } from '../services/xService.js';

const router = express.Router();

const CONTENT_TYPE_LABELS = {
  basics: 'AI基礎知識',
  ml: '機械学習',
  prompt: 'プロンプト技法',
  chatgpt: 'ChatGPT活用',
  tools: 'AIツール紹介',
  ethics: 'AI倫理・社会',
  news: 'AI最新動向',
  coding: 'AIコーディング',
  business: 'AIビジネス活用',
};

function buildAiEduPrompt(contentType) {
  const label = CONTENT_TYPE_LABELS[contentType] || contentType;
  return `AI教育コンテンツをXに日本語で投稿します。ターゲットはAIに興味があるエンジニア・学生・ビジネスパーソンです。

コンテンツタイプ: ${label}

以下の要件で投稿文を1つ作成してください：

【要件】
- X（Twitter）の280文字以内を厳守（ハッシュタグ含む）
- 読者がすぐに試せる・役立つ実用的な内容（${label}に関するTipsや知識）
- 読者が「保存・シェアしたい」と思える価値ある情報
- 絵文字を効果的に使用
- ハッシュタグは末尾に2〜3個（例: #生成AI #ChatGPT #AI活用）

【出力形式】
投稿文のみを出力してください。前後に説明文を入れないでください。`;
}

// POST /api/aiedu/generate - Direct single-call generation (SSE)
router.post('/generate', async (req, res) => {
  const { contentType = 'basics' } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const postId = uuidv4();
    const prompt = buildAiEduPrompt(contentType);

    const postText = await generateTextFull(
      'あなたはAI教育とSNSマーケティングの専門家です。AIに関する実用的な知識をXで発信します。',
      prompt,
      { maxTokens: 600 }
    );

    db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
      postId, 'aiedu', postText.trim(), JSON.stringify({ contentType }), 'draft'
    );

    sendEvent('final_post', { post_id: postId, post_text: postText.trim() });
    sendEvent('done', {});
  } catch (err) {
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

// GET /api/aiedu/posts
router.get('/posts', (req, res) => {
  const posts = db.prepare(
    `SELECT * FROM sns_posts WHERE app_type = 'aiedu' ORDER BY created_at DESC`
  ).all();
  res.json(posts.map(p => ({ ...p, metadata: JSON.parse(p.metadata || '{}') })));
});

// GET /api/aiedu/posts/:id
router.get('/posts/:id', (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'aiedu'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const conversation = db.prepare(`SELECT * FROM agent_conversations WHERE post_id = ?`).get(post.id);
  const messages = conversation
    ? db.prepare(`SELECT * FROM agent_messages WHERE conversation_id = ? ORDER BY round, created_at`).all(conversation.id)
    : [];

  res.json({ ...post, metadata: JSON.parse(post.metadata || '{}'), messages });
});

// PUT /api/aiedu/posts/:id
router.put('/posts/:id', (req, res) => {
  const { post_text } = req.body;
  db.prepare(`UPDATE sns_posts SET post_text = ? WHERE id = ? AND app_type = 'aiedu'`).run(post_text, req.params.id);
  res.json({ success: true });
});

// POST /api/aiedu/posts/:id/publish
router.post('/posts/:id/publish', async (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'aiedu'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  try {
    const result = await postTweet(post.post_text);
    db.prepare(
      `UPDATE sns_posts SET status = 'posted', social_post_id = ?, social_posted_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(result.id, post.id);
    res.json({ success: true, tweet_id: result.id });
  } catch (err) {
    db.prepare(`UPDATE sns_posts SET status = 'failed', error_message = ? WHERE id = ?`).run(err.message, post.id);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/aiedu/posts/:id
router.delete('/posts/:id', (req, res) => {
  db.prepare(`DELETE FROM sns_posts WHERE id = ? AND app_type = 'aiedu'`).run(req.params.id);
  res.status(204).end();
});

export default router;
