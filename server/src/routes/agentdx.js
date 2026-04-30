import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { generateTextFull, searchAgentDxNews } from '../services/claudeService.js';
import { postTweet } from '../services/xService.js';

const router = express.Router();

const CONTENT_TYPE_LABELS = {
  dx_trend: 'DXトレンド',
  insurtech: 'InsurTech動向',
  compliance: 'コンプライアンス・規制',
  customer_mgmt: '顧客管理DX',
  digital_sales: 'デジタル営業',
  ai_usecase: 'AI活用事例',
  paperless: 'ペーパーレス化',
  remote_meeting: 'リモート商談',
  subsidy: '補助金・助成金',
  case_study: '成功事例・ノウハウ',
};

const CONTENT_TYPE_CONTEXT = {
  dx_trend: `保険代理店のDX推進に関する最新トレンド。金融庁の方針、SBI・楽天など大手のデジタル戦略、中小代理店のデジタル化実態など2025〜2026年の動向を発信する。`,
  insurtech: `InsurTech（インシュアテック）の最新動向。AI査定・デジタル保険商品・ブロックチェーン活用・APIエコノミーなど国内外の最新事例を発信する。`,
  compliance: `保険業法・金融庁ガイドライン・意向把握義務・比較推奨規制など保険代理店が押さえるべき最新のコンプライアンス情報を分かりやすく発信する。`,
  customer_mgmt: `保険代理店向けの顧客管理DX。CRM導入・顧客データ活用・ライフイベント通知・継続管理自動化など実践的なノウハウを発信する。`,
  digital_sales: `保険代理店のデジタル営業手法。LINE活用・Web集客・SNS運用・オンライン見積もりツール・動画活用など最新の営業DX事例を発信する。`,
  ai_usecase: `保険代理店へのAI活用事例。意向把握AI・書類自動生成・チャットボット・音声解析・商品比較AIなど実際に使えるAIツールの情報を発信する。`,
  paperless: `保険代理店のペーパーレス化・電子化。電子署名・クラウド書類管理・PDF自動生成・郵送レス化など具体的な導入方法とメリットを発信する。`,
  remote_meeting: `保険代理店のリモート商談・オンライン対応。Zoom活用・画面共有での説明技法・オンライン契約の流れ・顧客満足度向上のコツを発信する。`,
  subsidy: `保険代理店が活用できる補助金・助成金情報。IT導入補助金・小規模事業者持続化補助金・DX投資促進税制など申請のポイントと活用事例を発信する。`,
  case_study: `保険代理店のDX成功事例・ノウハウ。実際にDXで業績を伸ばした代理店の取り組み、失敗談と教訓、明日から使えるTipsを発信する。`,
};

function buildAgentDxPrompt(contentType, newsContext, hasSourceUrl) {
  const label = CONTENT_TYPE_LABELS[contentType] || contentType;
  const extraContext = CONTENT_TYPE_CONTEXT[contentType] || '';
  const newsSection = newsContext
    ? `\n【今日の最新ニュース・トレンド（Web検索結果）】\n${newsContext}\n\n上記の最新トピックの中から最もバズりそうな内容を1つ選んでX投稿にしてください。\n`
    : '';
  const charLimit = hasSourceUrl ? '240文字以内（URLは別途末尾に追加するため本文は240文字以内に収める）' : '280文字以内';
  return `保険代理店のDX・デジタル化に関するニュース・情報をXに日本語で投稿します。ターゲットは保険代理店の経営者・担当者、FinTech・InsurTech関係者です。現在は2026年4月です。

コンテンツタイプ: ${label}
${extraContext ? `\n背景情報: ${extraContext}\n` : ''}${newsSection}
以下の要件で投稿文を1つ作成してください：

【要件】
- X（Twitter）の${charLimit}（ハッシュタグ含む）
- 保険代理店の実務担当者が「保存・シェアしたい」と思える具体的な情報
- 読者がすぐに行動・活用できる実践的な内容（${label}に関するTipsや事例）
- 2025〜2026年現在の最新情報を使用
- 絵文字を効果的に使用
- ハッシュタグは末尾に2〜3個（例: #保険代理店DX #InsurTech #保険業界）

【出力形式】
投稿文のみを出力してください。前後に説明文を入れないでください。`;
}

router.post('/generate', async (req, res) => {
  const { contentType = 'dx_trend' } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const postId = uuidv4();
    const label = CONTENT_TYPE_LABELS[contentType] || contentType;

    sendEvent('status', { message: `${label}の最新ニュースを検索中...` });
    const { summary: newsContext, sourceUrl } = await searchAgentDxNews(contentType, label);

    sendEvent('status', { message: '投稿を生成中...' });
    const prompt = buildAgentDxPrompt(contentType, newsContext, !!sourceUrl);

    let postText = (await generateTextFull(
      'あなたは保険代理店のDX推進とInsurTechの専門家です。代理店経営者に役立つ実践的な情報をXで発信します。',
      prompt,
      { maxTokens: 600 }
    )).trim();

    if (sourceUrl) postText = `${postText}\n${sourceUrl}`;

    db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
      postId, 'agentdx', postText, JSON.stringify({ contentType, had_news_context: !!newsContext, sourceUrl }), 'draft'
    );

    sendEvent('final_post', { post_id: postId, post_text: postText });
    sendEvent('done', {});
  } catch (err) {
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

router.get('/posts', (req, res) => {
  const posts = db.prepare(
    `SELECT * FROM sns_posts WHERE app_type = 'agentdx' ORDER BY created_at DESC`
  ).all();
  res.json(posts.map(p => ({ ...p, metadata: JSON.parse(p.metadata || '{}') })));
});

router.get('/posts/:id', (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'agentdx'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json({ ...post, metadata: JSON.parse(post.metadata || '{}') });
});

router.put('/posts/:id', (req, res) => {
  const { post_text } = req.body;
  db.prepare(`UPDATE sns_posts SET post_text = ? WHERE id = ? AND app_type = 'agentdx'`).run(post_text, req.params.id);
  res.json({ success: true });
});

router.post('/posts/:id/publish', async (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'agentdx'`).get(req.params.id);
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

router.delete('/posts/:id', (req, res) => {
  db.prepare(`DELETE FROM sns_posts WHERE id = ? AND app_type = 'agentdx'`).run(req.params.id);
  res.status(204).end();
});

export default router;
