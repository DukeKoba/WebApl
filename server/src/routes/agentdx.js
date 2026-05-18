import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { generateTextFull, searchAgentDxNews } from '../services/claudeService.js';
import { tryClaudeOrEmitPrompt } from '../services/claudeFallback.js';
import { postTweet } from '../services/xService.js';

const router = express.Router();

const CONTENT_TYPE_LABELS = {
  ins_news:      '保険業界ニュース',
  law_reform:    '法改正・規制動向',
  new_products:  '新商品・金融商品',
  market_data:   '市場動向・統計',
  disaster_risk: '災害・リスク情報',
  agency_ops:    '代理店経営・運営',
  consumer_trend:'顧客・消費者動向',
  global_ins:    'グローバル・海外動向',
};

const CONTENT_TYPE_CONTEXT = {
  ins_news:      `保険業界全般の直近ニュース。各社の新戦略・業績発表・提携・経営ニュース・業界団体の動きなど2025〜2026年の最新情報を取り上げる。`,
  law_reform:    `保険業法改正・金融庁ガイドライン・監督指針・意向把握義務・比較推奨規制など、代理店が即座に対応すべき法令・規制の最新動向を分かりやすく伝える。`,
  new_products:  `生命保険・損害保険・第三分野・投資型保険・金融商品の新商品情報。各社の新商品発売・改定内容・販売戦略など代理店担当者が押さえるべき商品ニュースを発信する。`,
  market_data:   `保険市場の統計データ・調査結果・ランキング。契約件数・保険料収入・解約率・加入率トレンドなど業界全体の市場動向を数字とともに伝える。`,
  disaster_risk: `自然災害・事故・リスク情報と保険への影響。台風・地震・水害の保険金支払い実績、新たなリスク領域（サイバー・気候変動）と保険商品の関連情報を発信する。`,
  agency_ops:    `保険代理店の経営・運営に直結する情報。手数料体系の変更・乗合申請・登録要件・監査対応・人材確保など代理店経営者が気になる最新トピックを伝える。`,
  consumer_trend:`顧客・消費者の保険に対する意識・行動変化。加入動機・解約理由・比較サイト利用実態・SNSでの口コミ傾向など、代理店の営業戦略に活きる消費者インサイトを発信する。`,
  global_ins:    `海外の保険業界・InsurTechの最新動向。欧米アジアの規制変化・グローバル大手の戦略・国際的なInsurTechトレンドで国内市場への示唆を発信する。`,
};

function buildAgentDxPrompt(contentType, newsContext, hasSourceUrl) {
  const label = CONTENT_TYPE_LABELS[contentType] || contentType;
  const extraContext = CONTENT_TYPE_CONTEXT[contentType] || '';
  const newsSection = newsContext
    ? `\n【直近の最新ニュース・情報（Web検索結果）】\n${newsContext}\n\n上記の最新トピックの中から最もインパクトのある内容を1つ選んでX投稿にしてください。\n`
    : '';
  const charLimit = hasSourceUrl ? '240文字以内（URLは別途末尾に追加するため本文は240文字以内に収める）' : '280文字以内';
  return `保険代理店に関わる最新ニュース・法改正・新商品情報などをXに日本語で投稿します。ターゲットは保険代理店の経営者・担当者です。現在は2026年5月です。

コンテンツタイプ: ${label}
${extraContext ? `\n背景情報: ${extraContext}\n` : ''}${newsSection}
以下の要件で投稿文を1つ作成してください：

【要件】
- X（Twitter）の${charLimit}（ハッシュタグ含む）
- 保険代理店の担当者が「知らなかった、シェアしたい」と感じる最新ニュース・情報
- ニュースの要点を分かりやすく整理し、代理店実務への影響・対応ポイントも一言添える
- 2025〜2026年の直近情報を優先して使用
- 絵文字を効果的に使用
- ハッシュタグは末尾に2〜3個（例: #保険代理店 #保険業界 #法改正）

【出力形式】
投稿文のみを出力してください。前後に説明文を入れないでください。`;
}

const AGENTDX_SYSTEM_PROMPT = 'あなたは保険業界の最新動向に精通したアナリストです。保険代理店の経営者・担当者に向けて、直近ニュース・法改正・新商品情報をXで分かりやすく発信します。';

router.post('/generate', async (req, res) => {
  const { contentType = 'dx_trend', prompt_only = false } = req.body;

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

    let newsContext = null;
    let sourceUrl = null;
    if (!prompt_only) {
      try {
        sendEvent('status', { message: `${label}の最新ニュースを検索中...` });
        const result = await searchAgentDxNews(contentType, label);
        newsContext = result?.summary || null;
        sourceUrl = result?.sourceUrl || null;
      } catch {}
    }

    sendEvent('status', { message: '投稿を生成中...' });
    const userPrompt = buildAgentDxPrompt(contentType, newsContext, !!sourceUrl);

    const promptInfo = [{
      label: `${label} 投稿生成プロンプト`,
      system: AGENTDX_SYSTEM_PROMPT,
      user: userPrompt + (newsContext ? '' : '\n\n※ プロンプトのみモードのためWeb検索は省略しています。最新情報が必要であれば、外部AIで先にWeb検索してから本プロンプトを実行してください。'),
    }];

    const generated = await tryClaudeOrEmitPrompt(
      promptInfo,
      () => generateTextFull(AGENTDX_SYSTEM_PROMPT, userPrompt, { maxTokens: 600 }),
      sendEvent,
      prompt_only,
    );

    if (generated == null) {
      sendEvent('done', {});
      return;
    }

    let postText = generated.trim();
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

router.post('/save-manual', (req, res) => {
  const { contentType, post_text } = req.body;
  if (!post_text?.trim()) return res.status(400).json({ error: 'post_text is required' });
  const postId = uuidv4();
  db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
    postId, 'agentdx', post_text.trim(), JSON.stringify({ contentType, manual: true }), 'draft'
  );
  res.json({ post_id: postId, post_text: post_text.trim() });
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
