import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import db from '../database.js';
import { generateAgentDxPost, searchInsuranceNews, parseNewsItems, AGENTDX_NEWS_QUERIES } from '../services/claudeService.js';
import { tryClaudeOrEmitPrompt } from '../services/claudeFallback.js';
import { postTweet } from '../services/xService.js';

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

// 2026年下期の時流。転換系・固定ポスト投稿に「今この瞬間の空気」を1つ織り込み、
// 代理店の現場感に接続させる（生成のたびに1つ選ぶ）。
const TREND_ANGLES = [
  '2026年6月施行の保険業法改正対応が最終局面。体制整備・意向把握記録の運用が問われている',
  '人手不足と採用難で、事務員1人あたりの処理量が限界。定型業務のAI化が待ったなしになっている',
  '物価高・再保険料上昇を背景に火災保険・自動車保険の改定が続き、更改業務の負荷とお客様説明が増えている',
  '生成AIが一般業務に浸透し「AIを使えない代理店」との差が可視化され始めた',
  'サイバー保険・少額短期など新商品領域が広がり、比較推奨と説明責任の記録がより重くなっている',
  '大型化・合併が進む一方、中小専業代理店は「1人あたり生産性」で生き残りを図る局面に入っている',
  'FAX・紙・二重入力といったレガシー事務が、若手の定着率と直結する経営課題として再認識されている',
];
function pickTrendAngle() {
  return TREND_ANGLES[Math.floor(Math.random() * TREND_ANGLES.length)];
}

// 転換系（受注につなげる）投稿。ニュース系はこれ以外の全種別。
const CONVERSION_POST_TYPES = new Set(['efficiency_tips', 'app_demo', 'law_check', 'case_story', 'pinned_app']);
// 最新ニュース検索の対象になる種別（AGENTDX_NEWS_QUERIES にクエリを持つもの）
const NEWS_POST_TYPES = new Set(Object.keys(AGENTDX_NEWS_QUERIES));

// 自社サイトへのCTAリンクは既定でOFF。
// 開発実績が公開できる状態になるまで投稿にリンクを入れない方針のため、
// buildCtaUrl による自動生成は廃止した。UIから明示的にURLを渡したときだけ本文に入る。
function normalizeCtaUrl(value) {
  return typeof value === 'string' && /^https?:\/\/\S+$/.test(value.trim()) ? value.trim() : null;
}

const AGENTDX_SYSTEM_PROMPT = 'あなたは保険代理店の業務を深く理解する編集者です。業界ニュースを「いち早く」ではなく「現場への影響が一番わかりやすい形」に翻訳して発信し、代理店の実務に役立つ具体的な情報を届けます。出典に書かれた事実だけを使い、推測や記憶で情報を補わないことを最優先にします。読者は保険代理店の経営者・募集人・事務担当者です。';

function buildFallbackPrompt(contentType, label, extraContext, { sourceUrl = null, sourceText = null, ctaUrl = null, trendAngle = null } = {}) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const recentTag = `${y}年${m}月`;
  const trendLine = trendAngle ? `\n## 今の時流（この空気感を1文でも織り込む）\n${trendAngle}\n` : '';

  const isConversionType = CONVERSION_POST_TYPES.has(contentType);

  const translationRules = `## 日本語以外の記事の扱い
- 記事が英語など日本語以外の場合は、正確に日本語へ翻訳・要約したうえで投稿を作る（投稿文は必ず日本語）
- 専門用語は日本の保険業界で通じる語に置き換える（underwriting→引受、claims→保険金支払、broker/agent→代理店、
  premium→保険料、policyholder→契約者、loss ratio→損害率、InsurTech→インシュアテック、regulator→規制当局）
- 金額・単位は原文の通貨・単位のまま扱う（勝手に円換算しない）
- 原文にない情報は足さない。日本の制度への読み替えを断定しない
- 海外事例は「日本の代理店にとっての示唆」を1文で添える`;

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
${trendLine}${sourceText ? `\n## 素材・メモ\n${sourceText}\n` : ''}
## 投稿要件
- 保険代理店が「そのまま実行できる」実務的な内容にする（ニュース紹介ではない）
- 1行目は業務の痛みの提示、中盤に具体的な解決策・手順（数字を入れる）
- 本文はURL・ハッシュタグ込みで全角130文字以内（Xは全角1字=2単位・上限280単位・URLは23単位）
${ctaUrl
      ? `- 本文中に必ずこのリンクを入れる: ${ctaUrl}`
      : `- リンク・URLは一切入れない（自社サイトも含む）。「詳細はこちら」等のリンク前提の表現も使わない
- 締めはリンク無しで成立させる。(a) その場で試せる具体的な行動を1つ提案する、
  または (b) 読者に考えさせる問いかけで終える、のどちらかにする`}
- 末尾にハッシュタグ1〜2個（#保険代理店 を基本に）

## 出力形式
投稿文のみを出力してください。前後に説明文は不要です。`;
  }

  if (sourceUrl || sourceText) {
    return `あなたは保険代理店の業務を深く理解する編集者です。

## 根拠にする記事
${sourceUrl ? `URL: ${sourceUrl}（この記事の内容を確認してください。海外メディアの記事でも構いません）` : ''}
${sourceText ? `\n${sourceText}` : ''}

## 手順
上記の記事「だけ」を根拠に、保険代理店向けのX投稿を1件作成してください。
記事に書かれていない事実・数字・制度名は書かないでください。

## テーマ
${label}（${extraContext}）

${translationRules}

${formatRules}

## 出力形式
投稿文とSOURCE_URLのみ出力してください。前後に説明文は不要です。`;
  }

  const query = `${AGENTDX_NEWS_QUERIES[contentType] || `保険代理店 ${label}`} ${recentTag} 最新`;

  return `あなたは保険代理店の業務を深く理解する編集者です。

## 手順

1. **Web検索**: 「${query}」で検索し、直近3ヶ月以内の最新ニュースを3〜5件ピックアップしてください
2. **記事選定**: 保険代理店の担当者が最も注目すべき記事を1件選ぶ
3. **X投稿を執筆**: 検索結果に書かれている事実「だけ」を使って投稿文を1件作成する

## テーマ
${label}（${extraContext}）

${translationRules}

${formatRules}

## 出力形式
投稿文とSOURCE_URLのみ出力してください。前後に説明文は不要です。`;
}

// 最新ニュース検索用のプロンプト（APIキーが無い環境ではこれを外部AIで実行してもらう）
function buildNewsSearchPrompt(contentType, label) {
  const now = new Date();
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 90);
  const query = `${AGENTDX_NEWS_QUERIES[contentType] || `保険代理店 ${label}`} ${now.getFullYear()}年${now.getMonth() + 1}月 最新`;

  return `今日は ${iso(now)} です。Web検索を使って「${query}」を調べ、
保険代理店の実務担当者が知るべきニュースを3〜5件集めてください。

## 厳守ルール
- 公開日が ${iso(cutoff)} 以降（直近90日以内）の記事のみ採用する
- 公開日が確認できない記事は採用しない
- 記事に書かれていない事実・数字・制度名を足さない
- 記事が英語など日本語以外でも採用してよい。ただし title・summary は必ず正確な日本語に翻訳して書く。
  専門用語は日本の保険業界で通じる語に置き換える（underwriting→引受、claims→保険金支払、broker/agent→代理店、
  premium→保険料、policyholder→契約者、InsurTech→インシュアテック）。原文にない情報は補わない

## 出力形式
説明文を書かず、次のJSON配列だけを \`\`\`json のコードブロックで出力してください。
[
  {
    "date": "YYYY-MM-DD",
    "title": "日本語の見出し（40字以内）",
    "summary": "日本語の要約2〜3文。数字・企業名・制度名を残す",
    "impact": "保険代理店の現場への影響を1文で",
    "url": "https://...",
    "language": "ja / en など原文の言語コード"
  }
]`;
}

// 最新ニュースを取得して要約する（リポスト機能の置き換え）。
// APIキーが無い環境では fallback_prompt を返し、外部AIの結果を貼り戻して使えるようにする。
router.post('/news-search', async (req, res) => {
  const contentType = NEWS_POST_TYPES.has(req.body?.contentType) ? req.body.contentType : 'ins_news';
  const label = CONTENT_TYPE_LABELS[contentType] || contentType;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent('status', { message: `${label}の最新ニュースを検索中...` });

    const promptInfo = {
      label: `${label} 最新ニュース検索プロンプト`,
      system: AGENTDX_SYSTEM_PROMPT,
      user: buildNewsSearchPrompt(contentType, label),
    };

    const result = await tryClaudeOrEmitPrompt(
      promptInfo,
      () => searchInsuranceNews(contentType, label),
      sendEvent,
    );

    if (result == null) {
      sendEvent('done', {});
      return;
    }

    sendEvent('news_items', { items: result.items || [], sources: result.sources || [] });
    sendEvent('done', {});
  } catch (err) {
    console.error('[agentdx] news-search error:', err);
    sendEvent('error', { message: `最新ニュースを取得できませんでした: ${err.message}` });
  } finally {
    res.end();
  }
});

// 外部AI（プロンプト方式）で取得したニュース一覧のJSONを候補リストに変換する
router.post('/news-parse', (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.slice(0, 40000) : '';
  const items = parseNewsItems(text);
  if (!items.length) {
    return res.status(400).json({ error: 'ニュース候補を読み取れませんでした。JSON配列を含む結果を貼り付けてください。' });
  }
  res.json({ items });
});

router.post('/generate', async (req, res) => {
  const { contentType = 'ins_news', sourceUrl: rawSourceUrl, sourceText: rawSourceText, ctaUrl: rawCtaUrl } = req.body;
  if (!CONTENT_TYPE_LABELS[contentType]) {
    return res.status(400).json({ error: '不明なコンテンツ種別です。' });
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
    // 既定はリンク無し。UIから明示的にURLが渡されたときだけ本文に入る
    const ctaUrl = normalizeCtaUrl(rawCtaUrl);
    // 時流を織り込む（転換系＋固定ポスト）。出典に忠実にしたいニュース系ソースがある場合は付けない
    const trendAngle = !sourceUrl ? pickTrendAngle() : null;
    const sourceOptions = { sourceUrl, sourceText, ctaUrl, trendAngle };

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

const CARD_PALETTES = {
  violet: ['#17112c', '#6d28d9', '#a78bfa'],
  blue: ['#071b2e', '#0369a1', '#38bdf8'],
  emerald: ['#06251d', '#047857', '#34d399'],
};

const JP_FONT = 'Hiragino Sans, Noto Sans JP, sans-serif';

// 折り返し（全角maxChars想定）。SVGのtext要素配列を返す
function wrapSvgText(text, { x, startY, size, weight = '700', color = '#ffffff', lineH, maxChars = 20, maxLines = 4, opacity = 1 }) {
  const chars = Array.from(String(text || '').replace(/\r/g, ''));
  const lines = [];
  let cur = '';
  for (const ch of chars) {
    if (ch === '\n' || Array.from(cur).length >= maxChars) {
      lines.push(cur); cur = ch === '\n' ? '' : ch;
    } else { cur += ch; }
    if (lines.length >= maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines.map((line, i) =>
    `<text x="${x}" y="${startY + i * lineH}" font-family="${JP_FONT}" font-size="${size}" font-weight="${weight}" fill="${color}" fill-opacity="${opacity}">${escapeXml(line)}</text>`
  ).join('');
}

function cardFrame(background, primary, light, inner, badge = 'COCREO  |  INSURANCE DX') {
  return `<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${background}"/><stop offset="1" stop-color="${primary}"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="${light}" stop-opacity=".55"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1200" height="675" rx="32" fill="url(#bg)"/>
    <circle cx="1060" cy="110" r="310" fill="url(#glow)"/>
    <text x="84" y="88" font-family="${JP_FONT}" font-size="24" font-weight="700" letter-spacing="4" fill="${light}">${escapeXml(badge)}</text>
    <rect x="84" y="112" width="110" height="6" rx="3" fill="${light}"/>
    ${inner}
    <text x="1012" y="610" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#ffffff">Cocreo</text>
  </svg>`;
}

// 4テンプレート対応の図解カード。数字・Before/After・チェックリストは代理店B2Bで刺さる形式。
function socialCardSvg({ headline, kicker, accent = 'violet', template = 'quote', fields = {} }) {
  const [background, primary, light] = CARD_PALETTES[accent] || CARD_PALETTES.violet;

  if (template === 'number') {
    const big = String(fields.bigNumber || compactHeadline(headline)).slice(0, 16);
    // 数字が長い場合は1040px幅に収まるようフォントを自動縮小（全角混在を0.62係数で近似）
    const numSize = Math.max(60, Math.min(150, Math.floor(1040 / Math.max(Array.from(big).length, 1) / 0.62)));
    const inner = `
      <text x="84" y="205" font-family="${JP_FONT}" font-size="30" font-weight="700" fill="${light}">${escapeXml(fields.eyebrow || '保険代理店の事務コスト')}</text>
      <text x="80" y="360" font-family="${JP_FONT}" font-size="${numSize}" font-weight="800" fill="#ffffff">${escapeXml(big)}</text>
      ${wrapSvgText(fields.caption || kicker || '', { x: 84, startY: 440, size: 40, weight: '600', color: '#e2e8f0', lineH: 56, maxChars: 26, maxLines: 2 })}
      <text x="84" y="600" font-family="${JP_FONT}" font-size="24" font-weight="500" fill="#ffffff" fill-opacity=".55">${escapeXml(fields.footnote || '')}</text>`;
    return cardFrame(background, primary, light, inner);
  }

  if (template === 'beforeafter') {
    const inner = `
      <text x="84" y="205" font-family="${JP_FONT}" font-size="30" font-weight="700" fill="${light}">${escapeXml(fields.eyebrow || '申込書の入力業務')}</text>
      <rect x="84" y="248" width="470" height="330" rx="24" fill="#e11d48" fill-opacity=".16"/>
      <rect x="84" y="248" width="470" height="66" rx="24" fill="#e11d48"/>
      <text x="319" y="292" text-anchor="middle" font-family="${JP_FONT}" font-size="34" font-weight="800" fill="#ffffff">${escapeXml(fields.beforeLabel || '今')}</text>
      ${wrapSvgText(fields.beforeText || '', { x: 114, startY: 372, size: 34, weight: '600', color: '#fecdd3', lineH: 50, maxChars: 13, maxLines: 4 })}
      <text x="600" y="430" text-anchor="middle" font-family="${JP_FONT}" font-size="80" font-weight="800" fill="${light}">→</text>
      <rect x="646" y="248" width="470" height="330" rx="24" fill="#059669" fill-opacity=".18"/>
      <rect x="646" y="248" width="470" height="66" rx="24" fill="#059669"/>
      <text x="881" y="292" text-anchor="middle" font-family="${JP_FONT}" font-size="34" font-weight="800" fill="#ffffff">${escapeXml(fields.afterLabel || 'AI導入後')}</text>
      ${wrapSvgText(fields.afterText || '', { x: 676, startY: 372, size: 34, weight: '600', color: '#a7f3d0', lineH: 50, maxChars: 13, maxLines: 4 })}`;
    return cardFrame(background, primary, light, inner);
  }

  if (template === 'checklist') {
    const items = String(fields.items || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 4);
    const rows = items.map((item, i) => {
      const y = 320 + i * 84;
      return `<rect x="84" y="${y - 38}" width="46" height="46" rx="10" fill="none" stroke="${light}" stroke-width="4"/>
        <path d="M95 ${y - 14} l11 11 l20 -30" fill="none" stroke="${light}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        ${wrapSvgText(item, { x: 158, startY: y, size: 36, weight: '600', color: '#e2e8f0', lineH: 46, maxChars: 26, maxLines: 1 })}`;
    }).join('');
    const inner = `
      <text x="84" y="200" font-family="${JP_FONT}" font-size="30" font-weight="700" fill="${light}">${escapeXml(fields.eyebrow || '2026年 保険業法改正')}</text>
      <text x="84" y="262" font-family="${JP_FONT}" font-size="56" font-weight="800" fill="#ffffff">${escapeXml(fields.title || '対応できていますか？')}</text>
      ${rows}`;
    return cardFrame(background, primary, light, inner);
  }

  // quote（既定・従来レイアウト）
  const lines = headlineLines(compactHeadline(headline));
  const textNodes = lines.map((line, index) =>
    `<text x="84" y="${250 + (index * 82)}" font-family="${JP_FONT}" font-size="58" font-weight="800" fill="#ffffff">${escapeXml(line)}</text>`
  ).join('');
  const inner = `
    <circle cx="1080" cy="560" r="190" fill="none" stroke="#ffffff" stroke-opacity=".14" stroke-width="2"/>
    ${textNodes}
    <text x="84" y="590" font-family="${JP_FONT}" font-size="25" font-weight="600" fill="#ffffff" fill-opacity=".82">${escapeXml(kicker || 'AIで、代理店の現場を前へ。')}</text>`;
  return cardFrame(background, primary, light, inner);
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
      template: req.body?.template || 'quote',
      fields: req.body?.fields || {},
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
    // xService.postTweet は base64 の `image` を受け取る（`mediaPath` は解釈されない）
    let image;
    if (post.image_path) {
      image = await fs.readFile(post.image_path, { encoding: 'base64' }).catch(() => undefined);
    }
    const result = await postTweet(post.post_text, { image });
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
