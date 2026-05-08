import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { generateTextFull, searchAiNews } from '../services/claudeService.js';
import { tryClaudeOrEmitPrompt } from '../services/claudeFallback.js';
import { postTweet } from '../services/xService.js';

const router = express.Router();

const CONTENT_TYPE_LABELS = {
  subsidy_news:   '補助金最新情報',
  subsidy_howto:  '補助金活用ノウハウ',
  ai_dx:          'AI業務改善事例',
  ai_smb:         '中小企業AI活用',
  ai_efficiency:  '業務効率化Tips',
  ai_tools:       'AIツール業務活用',
  claude_biz:     'Claude業務活用',
  chatgpt_biz:    'ChatGPT業務活用',
  insurance_ai:   '保険×AI活用',
  mvp:            'MVP開発事例',
  vibecoding:     'バイブコーディング',
  cocreo_voice:   'Cocreoの視点',
};

// Whether the content type relies on fresh news (and therefore must cite sources)
const NEWS_DRIVEN = new Set([
  'subsidy_news',
  'ai_dx',
  'ai_smb',
  'ai_tools',
  'claude_biz',
  'chatgpt_biz',
  'insurance_ai',
]);

const CONTENT_TYPE_CONTEXT = {
  subsidy_news: `中小企業向け補助金（AI・IT導入補助金2026、ものづくり補助金、事業再構築補助金、持続化補助金、省力化投資補助金など）の最新締切・公募要領・採択事例・制度変更を扱う。Cocreo Grantが申請伴走で支援できることを踏まえ、経営者が「自社も使えるかも」と感じる具体的な情報を発信する。`,
  subsidy_howto: `補助金申請の実務ノウハウ（事業計画書の書き方、加点項目、IT導入支援事業者の選び方、AI申請書ジェネレーター活用、採択率を上げるコツ等）を扱う。Cocreoは申請書AI（無料体験可）と伴走支援を提供しているため、その文脈で語ること。`,
  ai_dx: `中小企業のAI業務改善・DX事例を扱う。経理請求書処理、議事録自動化、顧客対応、営業資料作成、マーケコンテンツ生成、在庫予測など、現場で「効果が出た」具体例を、削減時間・コスト・人時で示す。`,
  ai_smb: `従業員数〜100名規模の中小企業がAIをどう導入したかのリアルな事例とロードマップ。「人手不足」「属人化」「ITリテラシー」など中小特有の課題に対する打ち手として語る。Cocreoの「AIで中小企業を元気に」という思想を反映。`,
  ai_efficiency: `中小企業の現場ですぐ試せるAI業務効率化Tips。Excel自動化、メール下書き、議事録要約、PDF読み取り、商品説明文生成など、明日から使える具体的なプロンプト例や手順を含める。`,
  ai_tools: `2026年時点で中小企業の業務に使えるAIツール（Claude / ChatGPT / Gemini / Notion AI / Dify / Zapier AI 等）の業務適用事例・比較・コスト感を扱う。導入ハードルの低さを意識した実用的な紹介をする。`,
  claude_biz: `Claude（Anthropic）を業務活用する実践Tips。長文ドキュメント要約、契約書チェック、コード生成、Claude Code・Projects・MCP活用、Artifactsでの業務ツール内製化など2026年最新の使い方を発信する。`,
  chatgpt_biz: `ChatGPTを中小企業の業務で活用する実践Tips。GPTs・カスタム指示・Advanced Voice・データ分析・Operator等、2026年最新機能を業務改善文脈で紹介する。`,
  insurance_ai: `保険代理店・保険会社向けAI活用。意向把握自動化、重要事項説明書の自動生成、コンプライアンスチェック、乗合代理店の商品比較、保険業法対応など、Cocreo for Insuranceの文脈で発信する。`,
  mvp: `2週間〜1ヶ月でMVPを開発した実例・手法。AI開発ツール（Claude Code / Cursor / v0 / Bolt 等）を駆使した爆速開発、従来SIer比1/5の価格感、内製化ノウハウなど、Cocreo Studioの強みを伝えるトピック。`,
  vibecoding: `バイブコーディング（Vibe Coding）— AIと対話しながら感覚的にコードを生成・改善する開発スタイル。Claude Code・Cursor・GitHub Copilot Workspaceなど2026年最新ツールの実践Tips、具体的なプロンプト例、ハマりやすい罠と対策を発信する。`,
  cocreo_voice: `Cocreoの世界観・哲学を発信する。「AIで中小企業を元気に」「戦略×実装のワンストップ」「共に創る」という思想、創業ストーリー、経営者との対話で見えた現場の声、コンサル×開発の融合などをエッセイ調で語る。`,
};

function buildAiEduPrompt(contentType, newsContext, sources, hasSourceUrl) {
  const label = CONTENT_TYPE_LABELS[contentType] || contentType;
  const extraContext = CONTENT_TYPE_CONTEXT[contentType] || '';
  const isNewsDriven = NEWS_DRIVEN.has(contentType);

  const sourceLines = (sources || []).map((s, i) => `[${i + 1}] ${s.title || ''} ${s.url}`.trim()).join('\n');
  const newsSection = newsContext
    ? `\n【今日Web検索で取得した最新情報（直近90日以内に絞ってあります）】\n${newsContext}\n${sourceLines ? `\n【参照可能なソースURL】\n${sourceLines}\n` : ''}\n上記の中から、できるだけ公開日が新しい1トピックを選び、X投稿にしてください。古いトピック（90日以上前）は使わないでください。`
    : '';

  const charLimit = hasSourceUrl
    ? '本文は240文字以内（出典URLは別途末尾にシステムが追加するため、本文中にはURLを書かないこと）'
    : 'URL・ハッシュタグ込みで合計280文字以内';

  const sourceRule = isNewsDriven
    ? `- ニュース・統計・事例を参照する場合は、上記Web検索結果に基づいて事実ベースで書くこと。本文中にURLは書かない（システムが末尾に1つ自動付与する）。
- ソースが取得できていない場合は、断定的なニュース表現は避け、一般論として語ること。`
    : `- 具体的なニュース・数字を引用する場合は、必ず上記Web検索結果に基づくこと。本文中にURLは書かない。`;

  return `あなたはCocreo（コクリオ）のX公式アカウントの中の人です。
Cocreoは「AIで中小企業を元気に」を掲げ、AI業務改善・補助金申請支援・受託開発・コンサルを提供しています。
Xでの発信目的は、中小企業の経営者・現場リーダー・士業・個人事業主に、AI活用と補助金活用の具体的価値を伝え、無料相談や補助金申請AIへの導線を作ることです。
現在は2026年4月。ターゲットは中小企業経営者・バックオフィス担当・士業・コンサル志望者です。

コンテンツタイプ: ${label}
${extraContext ? `\n背景情報: ${extraContext}\n` : ''}${newsSection}

【投稿の要件】
- 日本語で、${charLimit}を厳守
- 1行目で「えっ」と止める引きを作る（数字・対比・具体名のいずれか）
- 中小企業の現場で「明日試せる」「申請してみよう」と思える実用情報を入れる
- 上から目線にならず、読者と並走する温度感（Cocreo＝共に創る）
- 絵文字は1〜3個までさりげなく
- 末尾にハッシュタグ2〜3個（例: #AI業務改善 #補助金 #中小企業DX #Cocreo）
${sourceRule}

【出力形式】
投稿文のみを出力してください。前後に説明文・見出し・コードブロックは入れないでください。`;
}

const AIEDU_SYSTEM_PROMPT = 'あなたはCocreoのX公式アカウントの中の人で、AI業務改善と補助金活用の専門家です。中小企業に伝わる言葉で、実用的でバズる日本語投稿を作ります。';

// POST /api/aiedu/generate - Direct single-call generation (SSE)
router.post('/generate', async (req, res) => {
  const { contentType = 'subsidy_news', prompt_only = false } = req.body;

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

    // Step 1: Web search for recent news (skipped in prompt-only mode)
    let newsContext = null;
    let sourceUrl = null;
    let sources = [];
    if (!prompt_only) {
      try {
        sendEvent('status', { message: `${label}の最新情報を検索中...` });
        const result = await searchAiNews(contentType, label);
        newsContext = result?.summary || null;
        sourceUrl = result?.sourceUrl || null;
        sources = result?.sources || [];
      } catch {
        // search failure is non-fatal — fall back to no news context
      }
    }

    // Step 2: Generate post (or emit fallback prompt)
    sendEvent('status', { message: '投稿を生成中...' });
    const userPrompt = buildAiEduPrompt(contentType, newsContext, sources, !!sourceUrl);

    const promptInfo = [{
      label: `${label} 投稿生成プロンプト`,
      system: AIEDU_SYSTEM_PROMPT,
      user: userPrompt + (newsContext ? '' : '\n\n※ プロンプトのみモードのため最新Web検索は省略しています。最新情報が必要であれば、外部AIにWeb検索を依頼してから本プロンプトを実行してください。'),
    }];

    const generated = await tryClaudeOrEmitPrompt(
      promptInfo,
      () => generateTextFull(AIEDU_SYSTEM_PROMPT, userPrompt, { maxTokens: 600 }),
      sendEvent,
      prompt_only,
    );

    if (generated == null) {
      // Fallback emitted — frontend will save via /save-manual
      sendEvent('done', {});
      return;
    }

    let postText = generated.trim();
    if (sourceUrl) postText = `${postText}\n${sourceUrl}`;

    db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
      postId,
      'aiedu',
      postText,
      JSON.stringify({ contentType, had_news_context: !!newsContext, sourceUrl, sources }),
      'draft',
    );

    sendEvent('final_post', {
      post_id: postId,
      post_text: postText,
      had_news_context: !!newsContext,
      sources: sources || [],
    });
    sendEvent('done', {});
  } catch (err) {
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

// POST /api/aiedu/save-manual - Save manually-generated post text (used in prompt-only mode)
router.post('/save-manual', (req, res) => {
  const { contentType, post_text } = req.body;
  if (!post_text?.trim()) return res.status(400).json({ error: 'post_text is required' });
  const postId = uuidv4();
  db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
    postId,
    'aiedu',
    post_text.trim(),
    JSON.stringify({ contentType, manual: true }),
    'draft',
  );
  res.json({ post_id: postId, post_text: post_text.trim() });
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
