import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { generateTextFull } from '../services/claudeService.js';
import { postTweet } from '../services/xService.js';

const router = express.Router();

const QUESTION_TYPE_LABELS = {
  vocabulary: '語彙',
  grammar: '文法',
  reading: '読解',
  writing: 'ライティング',
  listening: 'リスニング',
  interview: '面接Tips',
};

const LEVEL_CONFIG = {
  pre1: {
    label: '準1級',
    target: '大学生・社会人（TOEIC600点相当、上級英語力を目指す学習者）',
    hook: '準1級合格で英語力を証明したいという向上心に響く冒頭フック',
    hashtags: '#英検準1級 #英語学習 #TOEIC',
  },
  '2': {
    label: '2級',
    target: '高校生（推薦・一般入試で英検2級を目指している学生）',
    hook: '高校生が「推薦のために英検2級を取りたい」という動機に響く冒頭フック',
    hashtags: '#英検2級 #英語学習 #大学受験',
  },
  pre2: {
    label: '準2級',
    target: '中高生（高校入試や英語の基礎固めを目指す学習者）',
    hook: '準2級で英語に自信をつけたい中高生に響く冒頭フック',
    hashtags: '#英検準2級 #英語学習 #高校受験',
  },
  '3': {
    label: '3級',
    target: '中学生（英検3級取得を目指す学習者）',
    hook: '中学生が英検3級に挑戦する動機に響く冒頭フック',
    hashtags: '#英検3級 #英語学習 #中学英語',
  },
  '4': {
    label: '4級',
    target: '小中学生（英検4級を目指す学習者）',
    hook: '英語の基礎を楽しく学びたい小中学生に響く冒頭フック',
    hashtags: '#英検4級 #英語学習 #小学英語',
  },
  '5': {
    label: '5級',
    target: '小学生・英語初心者（英検5級にチャレンジする学習者）',
    hook: '英語を初めて学ぶ子どもや保護者に響く冒頭フック',
    hashtags: '#英検5級 #英語学習 #英語初心者',
  },
};

function buildEikenPrompt(questionType, level) {
  const typeLabel = QUESTION_TYPE_LABELS[questionType] || questionType;
  const lv = LEVEL_CONFIG[level] || LEVEL_CONFIG['2'];

  return `英検${lv.label}の学習コンテンツをXに投稿します。ターゲットは**${lv.target}**です。

問題タイプ: ${typeLabel}

【厳守事項】
URLはXが自動で23文字に短縮されます。
文字数カウント方法：（本文の文字数）＋23（URL）＋ハッシュタグ文字数 ≤ 280文字
本文＋ハッシュタグは**最大250文字以内**に収めること。

以下の要件で投稿文を1つ作成してください：

【要件】
- ${lv.hook}
- 英検${lv.label}の${typeLabel}に関するTipsまたは短い例文を1つ含める
- クイズ形式の場合は選択肢を2つだけ（①②）にして短く
- 末尾に「📲 AI英検Passで詳しく解説 → アプリをチェック！ https://apps.apple.com/jp/app/ai%E8%8B%B1%E6%A4%9Cpass-%EF%BC%92%E7%B4%9A/id6761838561」を入れる
- ハッシュタグは末尾に3個（例: ${lv.hashtags}）
- 絵文字は最小限に

【出力形式】
投稿文のみを出力してください。前後に説明文を入れないでください。`;
}

// POST /api/eiken/generate - Direct single-call generation (SSE)
router.post('/generate', async (req, res) => {
  const { questionType = 'vocabulary', level = '2' } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const postId = uuidv4();
    const prompt = buildEikenPrompt(questionType, level);

    const postText = await generateTextFull(
      'あなたはSNSマーケティングと英語教育の専門家です。高校生向けに英検2級学習コンテンツをXに投稿します。',
      prompt,
      { maxTokens: 600 }
    );

    db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
      postId, 'eiken', postText.trim(), JSON.stringify({ questionType, level }), 'draft'
    );

    sendEvent('final_post', { post_id: postId, post_text: postText.trim() });
    sendEvent('done', {});
  } catch (err) {
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

// POST /api/eiken/generate-script - TikTok/Reels script generation
router.post('/generate-script', async (req, res) => {
  const { questionType = 'vocabulary', level = '2' } = req.body;
  const lv = LEVEL_CONFIG[level] || LEVEL_CONFIG['2'];
  const typeLabel = QUESTION_TYPE_LABELS[questionType] || questionType;

  const prompt = `英検${lv.label}の学習コンテンツのTikTok・Instagram Reels用動画台本を作成してください。
ターゲット: ${lv.target}
問題タイプ: ${typeLabel}

【台本の構成（約30秒）】
以下のセクション構成で台本を作成してください：

■ フック（0〜3秒）
画面テキスト: （大きく表示する文字）
ナレーション: （話す言葉）

■ 問題提示（3〜15秒）
画面テキスト: （英検${lv.label}の${typeLabel}問題または重要Tips）
ナレーション: （話す言葉）

■ 考える間（15〜20秒）
画面テキスト: （「考えてみて！」など）
ナレーション: （話す言葉）

■ 正解・解説（20〜27秒）
画面テキスト: （正解と簡単な解説）
ナレーション: （話す言葉）

■ CTA（27〜30秒）
画面テキスト: 「AI英検Passで詳しく解説！」
ナレーション: （アプリへ誘導する言葉）

【要件】
- 高校生が最初の3秒で止まりたくなるフック
- 実際の英検${lv.label}レベルのサンプル問題を使う
- ナレーションは話し言葉で自然に
- 画面テキストは短く大きく

台本のみを出力してください。前後に説明文を入れないでください。`;

  try {
    const script = await generateTextFull(
      'あなたはTikTok・Instagram Reelsの動画制作と英語教育の専門家です。高校生に刺さる短尺動画の台本を作成します。',
      prompt,
      { maxTokens: 1000 }
    );
    res.json({ script: script.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/eiken/posts
router.get('/posts', (req, res) => {
  const posts = db.prepare(
    `SELECT * FROM sns_posts WHERE app_type = 'eiken' ORDER BY created_at DESC`
  ).all();
  res.json(posts.map(p => ({ ...p, metadata: JSON.parse(p.metadata || '{}') })));
});

// GET /api/eiken/posts/:id
router.get('/posts/:id', (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'eiken'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const conversation = db.prepare(`SELECT * FROM agent_conversations WHERE post_id = ?`).get(post.id);
  const messages = conversation
    ? db.prepare(`SELECT * FROM agent_messages WHERE conversation_id = ? ORDER BY round, created_at`).all(conversation.id)
    : [];

  res.json({ ...post, metadata: JSON.parse(post.metadata || '{}'), messages });
});

// PUT /api/eiken/posts/:id
router.put('/posts/:id', (req, res) => {
  const { post_text } = req.body;
  db.prepare(`UPDATE sns_posts SET post_text = ? WHERE id = ? AND app_type = 'eiken'`).run(post_text, req.params.id);
  res.json({ success: true });
});

// POST /api/eiken/posts/:id/publish
router.post('/posts/:id/publish', async (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'eiken'`).get(req.params.id);
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

// DELETE /api/eiken/posts/:id
router.delete('/posts/:id', (req, res) => {
  db.prepare(`DELETE FROM sns_posts WHERE id = ? AND app_type = 'eiken'`).run(req.params.id);
  res.status(204).end();
});

export default router;
