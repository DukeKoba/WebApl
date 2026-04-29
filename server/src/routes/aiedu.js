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
  aitips: '生成AI活用トピック',
  vibecoding: 'バイブコーディングTips',
};

const CONTENT_TYPE_CONTEXT = {
  aitips: `Claude・ChatGPT・Geminiなど最新の生成AIツールを日常業務・学習・創作に活かす実践的な活用事例やコツ。プロンプトエンジニアリング、マルチモーダル活用、AIエージェント連携など2025〜2026年の最新トレンドを含む生成AI活用のリアルな知見を発信する。`,
  vibecoding: `バイブコーディング（Vibe Coding）とは、AIと対話しながら感覚的にコードを生成・改善する新しい開発スタイル。Claude Code・Cursor・GitHub Copilot Workspaceなど2025〜2026年の最新ツールを使った実践的なTips、具体的なプロンプト例、ハマりやすい罠と対策など初心者にも役立つ内容を発信する。`,
  news: `2025〜2026年の最新AI動向を発信する。Claude 4・GPT-5・Gemini 2.0などの最新モデル、エージェントAI・マルチモーダルの普及、AIコーディングツールの進化など直近のトピックを扱うこと。2024年以前の古い話題（DevDay 2024等）は使わない。`,
};

function buildAiEduPrompt(contentType) {
  const label = CONTENT_TYPE_LABELS[contentType] || contentType;
  const extraContext = CONTENT_TYPE_CONTEXT[contentType] || '';
  return `AI教育コンテンツをXに日本語で投稿します。ターゲットはAIに興味があるエンジニア・学生・ビジネスパーソンです。現在は2026年4月です。

コンテンツタイプ: ${label}
${extraContext ? `\n背景情報: ${extraContext}\n` : ''}
以下の要件で投稿文を1つ作成してください：

【要件】
- X（Twitter）の280文字以内を厳守（ハッシュタグ含む）
- 読者がすぐに試せる・役立つ実用的な内容（${label}に関するTipsや知識）
- 読者が「保存・シェアしたい」と思える価値ある情報
- 2025〜2026年現在の最新情報を使用し、古い情報（2024年以前の具体的なイベント名等）は避ける
- 絵文字を効果的に使用
- ハッシュタグは末尾に2〜3個（例: #生成AI #Claude #AI活用）

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
      'あなたはAI・生成AI・バイブコーディングの専門家です。AIに関する実践的な知識や活用事例をXで日本語で発信します。',
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
