import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import db from '../database.js';
import { generateAgentDxPost } from '../services/claudeService.js';
import { tryClaudeOrEmitPrompt } from '../services/claudeFallback.js';
import { postTweet, repostPost, searchRecentPosts } from '../services/xService.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imageDir = path.join(__dirname, '..', '..', 'uploads', 'agentdx');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

const CONTENT_TYPE_LABELS = {
  // ニュース系（集客）
  ins_news:      '保険業界ニュース',
  law_reform:    '法改正・規制動向',
  new_products:  '新商品・金融商品',
  market_data:   '市場動向・統計',
  disaster_risk: '災害・リスク情報',
  agency_ops:    '代理店経営・運営',
  consumer_trend:'顧客・消費者動向',
  global_ins:    'グローバル・海外動向',
  // 転換系（受注につなげる投稿）
  efficiency_tips:'業務効率化Tips',
  app_demo:       'アプリ実演・制作実況',
  law_check:      '業法対応チェック',
  trend_watch:    '代理店DXトレンド',
  case_story:     '業務改善ミニ事例',
  pinned_app:     '固定ポスト・アプリ訴求',
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
  efficiency_tips:`保険代理店の定型業務（申込書・告知書の転記、満期更改の管理、意向把握記録、保全業務、手数料計算など）をAI・デジタルツールで効率化する具体的な手順やコツ。「自動車の設計書作成は1件30〜60分」「満期更改は月50〜200件」といった業務実態を踏まえ、削減できる時間を数字で示す。`,
  app_demo:       `Cocreoが開発する保険代理店向けAIツール（申込書AI読取・転記コスト計算・業務自動化）の実演紹介。デモ動画やBefore/After画像を添付する前提で、「手入力なら12分の作業がAIなら38秒」のように効果を数字で見せる。売り込み口調にせず「作ってみた・試せます」のトーンで。`,
  law_check:      `2026年施行の保険業法改正への対応チェック。意向把握の記録・乗合比較推奨の理由書面・高齢者募集ルール・体制整備義務など、代理店が自社の対応状況を確認すべき観点を1投稿1論点で問いかける。法的助言ではなく「確認のきっかけ」を提供するトーンで。`,
  trend_watch:    `保険代理店に影響する直近90日のトレンドを、①業務品質を重視した代理店評価、②顧客情報・委託先管理、③人手不足を補うAI活用、④顧客本位の比較推奨・意向把握、の優先順で扱う。必ず一次情報を根拠にし、「代理店が今週確認すること」を1つ示す。`,
  case_story:     `保険代理店の業務改善ミニ事例。課題、実装した小さな仕組み、削減時間、現場の変化の順に、誇張せず具体的に示す。最後は無料相談への自然な問いかけで終える。`,
  pinned_app:     `プロフィール固定用のアプリ訴求投稿。対象業務、利用メリット、無料または試用可能であること、ダウンロードURLを簡潔に伝える。`,
};

const X_SEARCH_QUERIES = {
  ins_news:      '(保険業界 OR 生命保険 OR 損害保険) lang:ja has:links -is:retweet -is:reply',
  law_reform:    '(保険業法 OR 金融庁 OR 監督指針 OR 比較推奨) lang:ja has:links -is:retweet -is:reply',
  new_products:  '(保険 新商品 OR 商品改定) lang:ja has:links -is:retweet -is:reply',
  market_data:   '(保険市場 OR 保険料収入 OR 加入率 OR 保険 統計) lang:ja has:links -is:retweet -is:reply',
  disaster_risk: '(災害 保険 OR サイバー保険 OR 地震保険 OR 水災) lang:ja has:links -is:retweet -is:reply',
  agency_ops:    '(保険代理店 OR 乗合代理店) (経営 OR 業務品質 OR 手数料) lang:ja has:links -is:retweet -is:reply',
  consumer_trend:'(保険 意識調査 OR 保険 消費者動向 OR 保険 ニーズ) lang:ja has:links -is:retweet -is:reply',
  global_ins:    '(InsurTech OR インシュアテック OR 海外 保険) lang:ja has:links -is:retweet -is:reply',
  trend_watch:   '(保険代理店 DX OR 保険代理店 AI OR 保険代理店 業務改善) lang:ja has:links -is:retweet -is:reply',
};
const ORIGINAL_POST_TYPES = new Set(['efficiency_tips', 'app_demo', 'law_check', 'case_story', 'pinned_app']);

function xSearchUrl(query) {
  return `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`;
}

router.post('/x-search', async (req, res) => {
  const contentType = req.body?.contentType || 'ins_news';
  const customQuery = typeof req.body?.query === 'string' ? req.body.query.trim().slice(0, 300) : '';
  const query = customQuery || X_SEARCH_QUERIES[contentType] || X_SEARCH_QUERIES.ins_news;
  const searchUrl = xSearchUrl(query);

  try {
    const posts = await searchRecentPosts(query, 20);
    res.json({ query, search_url: searchUrl, posts });
  } catch (err) {
    if (err.code === 'X_SEARCH_NOT_CONFIGURED') {
      return res.json({ query, search_url: searchUrl, posts: [], fallback: true, message: err.message });
    }
    res.status(502).json({ error: err.message, query, search_url: searchUrl });
  }
});

router.post('/repost/:postId', async (req, res) => {
  try {
    const result = await repostPost(req.params.postId);
    res.json({ success: true, data: result.data || result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 転換系投稿に入れるCTAリンク。/insurance LP・計算機が公開されたらパスを差し替える
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || 'https://webapl-ycgb.onrender.com';
const CTA_PATHS = {
  efficiency_tips: '/cocreo',
  app_demo:        '/cocreo',
  law_check:       '/cocreo',
  case_story:      '/cocreo',
};

function buildCtaUrl(contentType) {
  const path = CTA_PATHS[contentType];
  if (!path) return null;
  return `${PUBLIC_SITE_URL}${path}?utm_source=x&utm_medium=social&utm_content=${contentType}`;
}

const AGENTDX_SYSTEM_PROMPT = 'あなたは保険代理店の業務を深く理解する編集者です。業界ニュースを「いち早く」ではなく「現場への影響が一番わかりやすい形」に翻訳して発信し、代理店の実務に役立つ具体的な情報を届けます。出典に書かれた事実だけを使い、推測や記憶で情報を補わないことを最優先にします。読者は保険代理店の経営者・募集人・事務担当者です。';

function buildFallbackPrompt(contentType, label, extraContext, { sourceUrl = null, sourceText = null, ctaUrl = null } = {}) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const recentTag = `${y}年${m}月`;

  const isConversionType = ['efficiency_tips', 'app_demo', 'law_check', 'case_story', 'pinned_app'].includes(contentType);

  const formatRules = `## 投稿の型（この構造・順序を厳守）
- 1行目: 数字か意外性のあるフック
- 2〜3行目: 事実の要約（出典に書かれていることだけ。推測で補わない）
- 次の行: 「▼代理店の現場では」+ 実務への影響・やるべきこと1つ
- 末尾: ハッシュタグ1〜2個（#保険代理店 を基本に）

## 文字数・体裁
- 本文はURL・ハッシュタグ込みで全角135文字以内（Xは全角1字=2単位・上限280単位・URLは23単位）
- 絵文字は0〜1個
- 最後の行に「SOURCE_URL: https://...」形式で出典を記載`;

  if (isConversionType) {
    return `あなたは保険代理店の業務を深く理解する編集者です。

## テーマ
${label}（${extraContext}）
${sourceText ? `\n## 素材・メモ\n${sourceText}\n` : ''}
## 投稿要件
- 保険代理店が「そのまま実行できる」実務的な内容にする（ニュース紹介ではない）
- 1行目は業務の痛みの提示、中盤に具体的な解決策・手順（数字を入れる）
- 本文はURL・ハッシュタグ込みで全角130文字以内（Xは全角1字=2単位・上限280単位・URLは23単位）
${ctaUrl ? `- 本文中に必ずこのリンクを入れる: ${ctaUrl}` : '- リンクは入れない'}
- 末尾にハッシュタグ1〜2個（#保険代理店 を基本に）

## 出力形式
投稿文のみを出力してください。前後に説明文は不要です。`;
  }

  if (sourceUrl || sourceText) {
    return `あなたは保険代理店の業務を深く理解する編集者です。

## 根拠にする記事
${sourceUrl ? `URL: ${sourceUrl}（この記事の内容を確認してください）` : ''}
${sourceText ? `\n${sourceText}` : ''}

## 手順
上記の記事「だけ」を根拠に、保険代理店向けのX投稿を1件作成してください。
記事に書かれていない事実・数字・制度名は書かないでください。

## テーマ
${label}（${extraContext}）

${formatRules}

## 出力形式
投稿文とSOURCE_URLのみ出力してください。前後に説明文は不要です。`;
  }

  const queries = {
    ins_news:      `保険業界 ニュース 経営 提携 ${recentTag}`,
    law_reform:    `保険業法 改正 金融庁 規制 ${recentTag}`,
    new_products:  `保険 新商品 発売 生命保険 損害保険 ${recentTag}`,
    market_data:   `保険市場 統計 加入率 ${recentTag}`,
    disaster_risk: `自然災害 保険金支払い サイバーリスク ${recentTag}`,
    agency_ops:    `保険代理店 手数料 乗合 経営 ${recentTag}`,
    consumer_trend:`保険 消費者 加入動向 意識調査 ${recentTag}`,
    global_ins:    `海外保険業界 InsurTech グローバル ${recentTag}`,
    trend_watch:   `site:fsa.go.jp 保険代理店 業務品質 情報管理 AI ${recentTag}`,
  };
  const query = queries[contentType] || `保険代理店 ${label} 最新 ${recentTag}`;

  return `あなたは保険代理店の業務を深く理解する編集者です。

## 手順

1. **Web検索**: 「${query}」で検索し、直近3ヶ月以内の最新ニュースを3〜5件ピックアップしてください
2. **記事選定**: 保険代理店の担当者が最も注目すべき記事を1件選ぶ
3. **X投稿を執筆**: 検索結果に書かれている事実「だけ」を使って投稿文を1件作成する

## テーマ
${label}（${extraContext}）

${formatRules}

## 出力形式
投稿文とSOURCE_URLのみ出力してください。前後に説明文は不要です。`;
}

router.post('/generate', async (req, res) => {
  const { contentType = 'ins_news', sourceUrl: rawSourceUrl, sourceText: rawSourceText } = req.body;
  if (!ORIGINAL_POST_TYPES.has(contentType)) {
    return res.status(400).json({ error: 'ニュース系はXの候補検索から元投稿をリポストしてください。' });
  }

  // 出典URLはhttp(s)のみ許可。テキストは長すぎる貼り付けを切り詰める
  const sourceUrl = typeof rawSourceUrl === 'string' && /^https?:\/\/\S+$/.test(rawSourceUrl.trim())
    ? rawSourceUrl.trim()
    : null;
  const sourceText = typeof rawSourceText === 'string' && rawSourceText.trim()
    ? rawSourceText.trim().slice(0, 8000)
    : null;

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
    const extraContext = CONTENT_TYPE_CONTEXT[contentType] || '';
    const ctaUrl = buildCtaUrl(contentType);
    const sourceOptions = { sourceUrl, sourceText, ctaUrl };

    sendEvent('status', {
      message: sourceUrl
        ? '指定された記事を読み込んで編集中...'
        : `${label}の投稿を作成中...`,
    });

    const promptInfo = {
      label: `${label} 投稿プロンプト`,
      system: AGENTDX_SYSTEM_PROMPT,
      user: buildFallbackPrompt(contentType, label, extraContext, sourceOptions),
    };

    const result = await tryClaudeOrEmitPrompt(
      promptInfo,
      () => generateAgentDxPost(contentType, label, extraContext, AGENTDX_SYSTEM_PROMPT, sourceOptions),
      sendEvent,
    );

    if (result == null) {
      sendEvent('done', {});
      return;
    }

    let postText = result.postText;
    if (result.sourceUrl && !postText.includes(result.sourceUrl)) {
      postText = `${postText}\n${result.sourceUrl}`;
    }

    db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
      postId, 'agentdx', postText,
      JSON.stringify({ contentType, sourceUrl: result.sourceUrl, groundedOn: sourceUrl ? 'url' : (sourceText ? 'text' : 'search') }),
      'draft'
    );

    sendEvent('final_post', { post_id: postId, post_text: postText });
    sendEvent('done', {});
  } catch (err) {
    console.error('[agentdx] generate error:', err);
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

function escapeXml(value = '') {
  return String(value).replace(/[<>&"']/g, char => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  })[char]);
}

function compactHeadline(text = '') {
  const firstLine = String(text).split('\n').find(line => line.trim()) || '代理店業務を、もっとシンプルに。';
  return firstLine.replace(/https?:\/\/\S+/g, '').replace(/[#*_`]/g, '').trim().slice(0, 44);
}

function headlineLines(text, maxChars = 14) {
  const chars = Array.from(text);
  const lines = [];
  while (chars.length && lines.length < 3) lines.push(chars.splice(0, maxChars).join(''));
  return lines.length ? lines : ['代理店業務を、', 'もっとシンプルに。'];
}

function socialCardSvg({ headline, kicker, accent = 'violet' }) {
  const palettes = {
    violet: ['#17112c', '#6d28d9', '#a78bfa'],
    blue: ['#071b2e', '#0369a1', '#38bdf8'],
    emerald: ['#06251d', '#047857', '#34d399'],
  };
  const [background, primary, light] = palettes[accent] || palettes.violet;
  const lines = headlineLines(compactHeadline(headline));
  const textNodes = lines.map((line, index) =>
    `<text x="84" y="${250 + (index * 82)}" font-family="Hiragino Sans, Noto Sans JP, sans-serif" font-size="58" font-weight="800" fill="#ffffff">${escapeXml(line)}</text>`
  ).join('');

  return `<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${background}"/><stop offset="1" stop-color="${primary}"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="${light}" stop-opacity=".55"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1200" height="675" rx="32" fill="url(#bg)"/>
    <circle cx="1060" cy="110" r="310" fill="url(#glow)"/>
    <circle cx="1080" cy="560" r="190" fill="none" stroke="#ffffff" stroke-opacity=".14" stroke-width="2"/>
    <text x="84" y="92" font-family="Hiragino Sans, Noto Sans JP, sans-serif" font-size="25" font-weight="700" letter-spacing="5" fill="${light}">COCREO  |  INSURANCE DX</text>
    <rect x="84" y="132" width="118" height="7" rx="4" fill="${light}"/>
    ${textNodes}
    <text x="84" y="590" font-family="Hiragino Sans, Noto Sans JP, sans-serif" font-size="25" font-weight="600" fill="#ffffff" fill-opacity=".82">${escapeXml(kicker || 'AIで、代理店の現場を前へ。')}</text>
    <text x="1010" y="610" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#ffffff">Cocreo</text>
  </svg>`;
}

function imageUrlFor(post) {
  return post?.image_path ? `/uploads/agentdx/${path.basename(post.image_path)}` : null;
}

router.post('/posts/:id/image/generate', async (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'agentdx'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  try {
    await fs.mkdir(imageDir, { recursive: true });
    const imagePath = path.join(imageDir, `${post.id}.png`);
    const svg = socialCardSvg({
      headline: req.body?.headline || post.post_text,
      kicker: req.body?.kicker,
      accent: req.body?.accent,
    });
    await sharp(Buffer.from(svg)).png({ quality: 92 }).toFile(imagePath);
    db.prepare(`UPDATE sns_posts SET image_path = ? WHERE id = ?`).run(imagePath, post.id);
    res.json({ image_url: imageUrlFor({ image_path: imagePath }) });
  } catch (err) {
    res.status(500).json({ error: `画像生成に失敗しました: ${err.message}` });
  }
});

router.post('/posts/:id/image/upload', upload.single('image'), async (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'agentdx'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!req.file) return res.status(400).json({ error: '画像ファイルを選択してください。' });

  try {
    await fs.mkdir(imageDir, { recursive: true });
    const imagePath = path.join(imageDir, `${post.id}.png`);
    await sharp(req.file.buffer).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).png({ quality: 92 }).toFile(imagePath);
    db.prepare(`UPDATE sns_posts SET image_path = ? WHERE id = ?`).run(imagePath, post.id);
    res.json({ image_url: imageUrlFor({ image_path: imagePath }) });
  } catch (err) {
    res.status(500).json({ error: `画像添付に失敗しました: ${err.message}` });
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
  res.json({ ...post, image_url: imageUrlFor(post), metadata: JSON.parse(post.metadata || '{}') });
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
    const result = await postTweet(post.post_text, { mediaPath: post.image_path || undefined });
    db.prepare(
      `UPDATE sns_posts SET status = 'posted', social_post_id = ?, social_posted_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(result.id, post.id);
    res.json({ success: true, tweet_id: result.id });
  } catch (err) {
    db.prepare(`UPDATE sns_posts SET status = 'failed', error_message = ? WHERE id = ?`).run(err.message, post.id);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/posts/:id', async (req, res) => {
  const post = db.prepare(`SELECT image_path FROM sns_posts WHERE id = ? AND app_type = 'agentdx'`).get(req.params.id);
  db.prepare(`DELETE FROM sns_posts WHERE id = ? AND app_type = 'agentdx'`).run(req.params.id);
  if (post?.image_path) await fs.rm(post.image_path, { force: true }).catch(() => {});
  res.status(204).end();
});

export default router;
