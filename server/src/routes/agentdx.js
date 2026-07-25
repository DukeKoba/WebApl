import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import db from '../database.js';
import {
  generateAgentDxPost,
  generateQuotePostComment,
  searchInsuranceNews,
  parseNewsItems,
  resolveArchetype,
  buildPostFormatRules,
  sanitizePostBody,
  AGENTDX_NEWS_QUERIES,
} from '../services/claudeService.js';
import { xWeightedLength, X_MAX_WEIGHTED } from '../services/xText.js';
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
  // ニュース系（集客）※9種→3種に統合。比率を転換系に寄せる
  ins_news:      '保険業界ニュース',
  law_reform:    '法改正・規制動向',
  global_ins:    'グローバル・海外動向',
  // 転換系（受注につなげる投稿）
  case_story:     '事例・作ったもの',
  app_demo:       'アプリ実演・制作実況',
  efficiency_tips:'業務効率化Tips',
  law_check:      '業法対応チェック',
  fail_story:     '失敗談・週次まとめ',
  pinned_app:     '固定ポスト・アプリ訴求',
  // 引用ポスト（リポストの置き換え）
  quote_post:     '引用ポスト',
};

const CONTENT_TYPE_CONTEXT = {
  ins_news:      `保険業界全般の直近ニュース。各社の新戦略・業績発表・提携・経営ニュース、手数料体系や市場統計、災害と保険金支払いなど、代理店の経営・実務に効くものを1件だけ取り上げる。`,
  law_reform:    `保険業法改正・金融庁ガイドライン・監督指針・意向把握義務・比較推奨規制など、代理店が即座に対応すべき法令・規制の最新動向を分かりやすく伝える。`,
  global_ins:    `海外の保険業界・InsurTechの最新動向。欧米アジアの規制変化・グローバル大手の戦略・国際的なInsurTechトレンド。必ず「日本の代理店の実務にどう効くか」まで翻訳する。`,
  efficiency_tips:`保険代理店の定型業務（申込書・告知書の転記、満期更改の管理、意向把握記録、保全業務、手数料計算など）をAI・デジタルツールで効率化する具体的な手順やコツ。「自動車の設計書作成は1件30〜60分」「満期更改は月50〜200件」といった業務実態を踏まえ、削減できる時間を数字で示す。`,
  app_demo:       `自分が作った保険代理店向けAIツール（申込書AI読取・転記コスト計算・業務自動化）の制作実況。誰のどんな一言から作り始めたか、Before/Afterの時間、何をやめただけなのか、を素直に書く。売り込み口調にしない。`,
  law_check:      `2026年施行の保険業法改正への対応チェック。意向把握の記録・乗合比較推奨の理由書面・高齢者募集ルール・体制整備義務など、代理店が自社の対応状況を確認すべき観点をチェックリスト形式にする。法的助言ではなく「確認のきっかけ」を提供するトーンで。`,
  case_story:     `保険代理店の業務改善ミニ事例／自分が作ったものの話。現場で言われた一言、作った小さな仕組み、削減時間、種明かしの順に、誇張せず具体的に書く。`,
  fail_story:     `今週やってみたこと・うまくいかなかったことの共有。失敗の内容と、そこから分かったことを正直に書く。かっこつけない。最後は読者に「同じ失敗をした人はいるか」を聞く。`,
  pinned_app:     `プロフィール固定用のアプリ訴求投稿。対象業務、利用メリット、無料または試用可能であることを簡潔に伝える。`,
  quote_post:     `業界ニュースや他アカウントの投稿に、自分の解釈を1〜2行だけ足して引用する。`,
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
const CONVERSION_POST_TYPES = new Set(['efficiency_tips', 'app_demo', 'law_check', 'case_story', 'fail_story', 'pinned_app']);
// 最新ニュース検索の対象になる種別（AGENTDX_NEWS_QUERIES にクエリを持つもの）
const NEWS_POST_TYPES = new Set(Object.keys(AGENTDX_NEWS_QUERIES));

// 自社サイトへのCTAリンクは既定でOFF。
// 開発実績が公開できる状態になるまで投稿にリンクを入れない方針のため、
// buildCtaUrl による自動生成は廃止した。UIから明示的にURLを渡したときだけ本文に入る。
function normalizeCtaUrl(value) {
  return typeof value === 'string' && /^https?:\/\/\S+$/.test(value.trim()) ? value.trim() : null;
}

// 人格: 中立的な「編集者」をやめ、一人称の個人開発者にする。
// 誰でも書ける文章ではなく「この人が書いている」と分かる投稿にするため。
// ただし保険業界で誤報は致命的なので、事実の正確性ルールは人格より上位に置く。
const AGENTDX_SYSTEM_PROMPT = `あなたは、保険代理店の業務を実際に理解している個人開発者です。フリーの立場で、代理店の事務作業を減らすツールを自分で作っています。

【あなたという人】
- 申込書の転記、満期更改の一覧作成、意向把握の記録、手数料計算といった業務が、現場で何分かかり誰の時間を奪っているかを具体的に知っている
- 大企業の中の人でもコンサルでもない。自分で手を動かしてツールを作り、うまくいかなかったことも普通にある
- 一人称は「私」。断定しすぎず、しかし遠慮もしない。読者を「代理店の皆様」と呼ばない
- 売り込まない。「作ってみた」「聞いたので作った」「これは失敗した」という実況の口調で書く
- バズ狙いの煽り、意識高い言い回し、コンサル用語（DX推進・シナジー・ソリューション等）を使わない

【事実と解釈の分離：これは人格より優先する最重要ルール】
- 事実は厳密に。出典・素材に書かれた事実だけを使い、推測や記憶で情報を補わない。
  数字・制度名・施行日・企業名を、確認できていない状態で書くことは絶対にしない
- 解釈は一人称で。「私はこう読んだ」「代理店の現場ではこうなる」という形で、事実と明確に区別して書く
- 事実部分に自分の解釈を混ぜて断定しない。保険業界では誤報が致命的だという前提を常に持つ
- 根拠が足りなければ、書かずに「NO_POST: 理由」と返す方を選ぶ

読者は保険代理店の経営者・募集人・事務担当者です。`;

function buildFallbackPrompt(contentType, label, extraContext, { sourceUrl = null, sourceText = null, ctaUrl = null, trendAngle = null, sourceLanguage = null } = {}) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const recentTag = `${y}年${m}月`;
  const trendLine = trendAngle ? `\n## 今の時流（この空気感を1文でも織り込む）\n${trendAngle}\n` : '';

  const isConversionType = CONVERSION_POST_TYPES.has(contentType);
  const archetype = resolveArchetype(contentType, { sourceLanguage, sourceUrl });

  const translationRules = `## 日本語以外の記事の扱い
- 記事が英語など日本語以外の場合は、正確に日本語へ翻訳・要約したうえで投稿を作る（投稿文は必ず日本語）
- 専門用語は日本の保険業界で通じる語に置き換える（underwriting→引受、claims→保険金支払、broker/agent→代理店、
  premium→保険料、policyholder→契約者、loss ratio→損害率、InsurTech→インシュアテック、regulator→規制当局）
- 金額・単位は原文の通貨・単位のまま扱う（勝手に円換算しない）
- 原文にない情報は足さない。日本の制度への読み替えを断定しない
- 海外事例は「日本の代理店にとっての示唆」を1〜2行で添える`;

  if (isConversionType) {
    return `## テーマ
${label}（${extraContext}）
${trendLine}${sourceText ? `\n## 素材・メモ（これを最優先の材料にする）\n${sourceText}\n` : ''}
## 投稿要件
- 保険代理店が「そのまま実行できる」内容にする（ニュース紹介ではない）
- 素材に書かれていない事実・数字は作らない

${buildPostFormatRules(archetype, { ctaUrl })}

## 出力形式
投稿文のみを出力してください。前後に説明文は不要です。`;
  }

  if (sourceUrl || sourceText) {
    return `## 根拠にする記事
${sourceUrl ? `URL: ${sourceUrl}（この記事の内容を確認してください。海外メディアの記事でも構いません）` : ''}
${sourceText ? `\n${sourceText}` : ''}

## 手順
上記の記事「だけ」を根拠に、保険代理店向けのX投稿を1件作成してください。
記事に書かれていない事実・数字・制度名は書かないでください。

## テーマ
${label}（${extraContext}）

${translationRules}

${buildPostFormatRules(archetype, { ctaUrl, sourceLine: true })}

## 出力形式
投稿文とSOURCE_URLのみ出力してください。前後に説明文は不要です。`;
  }

  const query = `${AGENTDX_NEWS_QUERIES[contentType] || `保険代理店 ${label}`} ${recentTag} 最新`;

  return `## 手順

1. **Web検索**: 「${query}」で検索し、直近3ヶ月以内の最新ニュースを3〜5件ピックアップしてください
2. **記事選定**: 保険代理店の担当者が最も注目すべき記事を1件選ぶ
3. **X投稿を執筆**: 検索結果に書かれている事実「だけ」を使って投稿文を1件作成する

## テーマ
${label}（${extraContext}）

${translationRules}

${buildPostFormatRules(archetype, { ctaUrl, sourceLine: true })}

## 出力形式
投稿文とSOURCE_URLのみ出力してください。前後に説明文は不要です。`;
}

// 引用ポスト用のフォールバックプロンプト（APIキーが無い環境で外部AIに実行してもらう）
function buildQuoteFallbackPrompt({ quoteUrl, quotedText = null, note = null }) {
  const hasText = Boolean(quotedText && quotedText.trim());
  return `## 引用ポストのコメントを作る
引用元の投稿URL: ${quoteUrl}
${hasText
    ? `\n## 引用元の投稿の内容（これだけを根拠にする）\n${quotedText.trim()}\n`
    : `\nこのURLの内容を確認し、その内容「だけ」を根拠にしてください。確認できない場合は「NO_POST: 引用元の内容を取得できませんでした」とだけ出力してください。\n`}${note && note.trim() ? `\n## 運営者のメモ・言いたいこと（最優先で反映する）\n${note.trim()}\n` : ''}
## 厳守
- 引用元に書かれていない事実・数字・制度名を書かない
- 引用元が保険代理店の実務に関係が薄い場合は「NO_POST: 理由」とだけ出力する

${buildPostFormatRules('Q', { hasBodyUrl: true })}

## 出力形式
コメント部分のみを出力してください。引用元URLは書かないでください（システムが自動で末尾に付けます）。`;
}

// 出典URLは本文に入れず、本体投稿の直後にセルフリプライで出す。
// 外部リンク付き投稿はリーチが抑制されるため、本体はリンク0本に保つ。
export function buildSourceReplyText(sourceUrl) {
  if (!sourceUrl || !/^https?:\/\/\S+$/.test(String(sourceUrl).trim())) return null;
  return `出典: ${String(sourceUrl).trim()}\n\n要点は上の投稿にまとめました。`;
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
  const {
    contentType = 'ins_news',
    sourceUrl: rawSourceUrl,
    sourceText: rawSourceText,
    ctaUrl: rawCtaUrl,
    sourceLanguage: rawSourceLanguage,
  } = req.body;
  if (!CONTENT_TYPE_LABELS[contentType] || contentType === 'quote_post') {
    return res.status(400).json({ error: '不明なコンテンツ種別です。' });
  }

  // 出典URLはhttp(s)のみ許可。テキストは長すぎる貼り付けを切り詰める
  const sourceUrl = typeof rawSourceUrl === 'string' && /^https?:\/\/\S+$/.test(rawSourceUrl.trim())
    ? rawSourceUrl.trim()
    : null;
  const sourceText = typeof rawSourceText === 'string' && rawSourceText.trim()
    ? rawSourceText.trim().slice(0, 8000)
    : null;
  // ニュース候補の language（'en' など）が渡っていれば海外記事扱い＝型Cを優先する
  const sourceLanguage = typeof rawSourceLanguage === 'string' && rawSourceLanguage.trim()
    ? rawSourceLanguage.trim().slice(0, 8)
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
    const sourceOptions = { sourceUrl, sourceText, ctaUrl, trendAngle, sourceLanguage };
    const archetype = resolveArchetype(contentType, { sourceLanguage, sourceUrl });

    sendEvent('status', {
      message: sourceUrl
        ? '指定された記事を読み込んで編集中...'
        : `${label}の投稿を作成中...`,
    });

    const promptInfo = {
      label: `${label} 投稿プロンプト（型${archetype}）`,
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

    // 出典URLは本文に付け足さない（本体投稿はリンク0本に保つ）。
    // metadata に保存し、publish 時に「本体投稿 → 出典リプライ」の2段送信で出す。
    const postText = result.postText;
    const finalSourceUrl = result.sourceUrl || null;

    db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
      postId, 'agentdx', postText,
      JSON.stringify({
        contentType,
        sourceUrl: finalSourceUrl,
        archetype: result.archetype || archetype,
        groundedOn: sourceUrl ? 'url' : (sourceText ? 'text' : 'search'),
      }),
      'draft'
    );

    sendEvent('final_post', {
      post_id: postId,
      post_text: postText,
      source_url: finalSourceUrl,
      reply_text: buildSourceReplyText(finalSourceUrl),
      archetype: result.archetype || archetype,
    });
    sendEvent('done', {});
  } catch (err) {
    console.error('[agentdx] generate error:', err);
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

// 引用ポスト（リポストの置き換え）。
// X APIでは「本文＋対象ツイートURL」で引用が成立するため、本文に引用元URLを1本だけ含む。
// 文字数は URL=23単位 を差し引いた枠でコメントを書かせる。
const X_STATUS_URL_RE = /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[^/]+\/status\/\d+/i;

router.post('/quote-generate', async (req, res) => {
  const quoteUrl = typeof req.body?.quoteUrl === 'string' ? req.body.quoteUrl.trim() : '';
  const quotedText = typeof req.body?.quotedText === 'string' && req.body.quotedText.trim()
    ? req.body.quotedText.trim().slice(0, 4000)
    : null;
  const note = typeof req.body?.note === 'string' && req.body.note.trim()
    ? req.body.note.trim().slice(0, 2000)
    : null;

  if (!X_STATUS_URL_RE.test(quoteUrl)) {
    return res.status(400).json({ error: '引用する投稿のURL（https://x.com/ユーザー名/status/...）を入力してください。' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const postId = uuidv4();
    sendEvent('status', { message: '引用元を読んで、自分の解釈を書いています...' });

    const promptInfo = {
      label: '引用ポスト コメント生成プロンプト',
      system: AGENTDX_SYSTEM_PROMPT,
      user: buildQuoteFallbackPrompt({ quoteUrl, quotedText, note }),
    };

    const result = await tryClaudeOrEmitPrompt(
      promptInfo,
      () => generateQuotePostComment(AGENTDX_SYSTEM_PROMPT, { quoteUrl, quotedText, note }),
      sendEvent,
    );

    if (result == null) {
      sendEvent('done', {});
      return;
    }

    const postText = composeQuotePost(result.comment, quoteUrl);
    db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
      postId, 'agentdx', postText,
      JSON.stringify({ contentType: 'quote_post', quoteUrl, archetype: 'Q', groundedOn: quotedText ? 'text' : 'url' }),
      'draft'
    );

    sendEvent('final_post', {
      post_id: postId,
      post_text: postText,
      quote_url: quoteUrl,
      weighted_length: xWeightedLength(postText),
      archetype: 'Q',
    });
    sendEvent('done', {});
  } catch (err) {
    console.error('[agentdx] quote-generate error:', err);
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

// コメント＋引用元URL。URLは常に23単位で数えられるため、超過時はコメント側を削る。
function composeQuotePost(comment, quoteUrl) {
  const clean = sanitizePostBody(comment, { allowUrls: false });
  let body = clean;
  // 280 - 23(URL) - 2(改行2つ) = 255単位がコメントの上限
  const budget = X_MAX_WEIGHTED - 23 - 2;
  if (xWeightedLength(body) > budget) {
    const chars = Array.from(body);
    while (chars.length && xWeightedLength(chars.join('')) > budget) chars.pop();
    body = chars.join('').trimEnd();
  }
  return `${body}\n\n${quoteUrl}`;
}

router.post('/save-manual', (req, res) => {
  const { contentType, post_text } = req.body;
  if (!post_text?.trim()) return res.status(400).json({ error: 'post_text is required' });

  // 外部AIが返した本文には SOURCE_URL 行が含まれる。本文からは外し、
  // metadata に保存して publish 時の出典リプライに使う。
  const raw = post_text.trim();
  const urlMatch = raw.match(/SOURCE_URL:\s*(https?:\/\/\S+)/);
  const sourceUrl = urlMatch ? urlMatch[1] : null;
  let cleaned = raw.replace(/SOURCE_URL:\s*https?:\/\/\S+/g, '').trim();
  // 固定ポストと引用ポストは本文にURLを持つ仕様なのでURLは残す。ハッシュタグは常に除去。
  const allowUrls = contentType === 'pinned_app' || contentType === 'quote_post';
  cleaned = sanitizePostBody(cleaned, { allowUrls });
  if (!cleaned) return res.status(400).json({ error: '投稿本文が空になりました。' });

  const postId = uuidv4();
  db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
    postId, 'agentdx', cleaned, JSON.stringify({ contentType, sourceUrl, manual: true }), 'draft'
  );
  res.json({
    post_id: postId,
    post_text: cleaned,
    source_url: sourceUrl,
    reply_text: buildSourceReplyText(sourceUrl),
  });
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
  let metadata = {};
  try { metadata = JSON.parse(post.metadata || '{}'); } catch { metadata = {}; }
  res.json({
    ...post,
    image_url: imageUrlFor(post),
    metadata,
    reply_text: buildSourceReplyText(metadata.sourceUrl),
  });
});

router.put('/posts/:id', (req, res) => {
  const { post_text } = req.body;
  db.prepare(`UPDATE sns_posts SET post_text = ? WHERE id = ? AND app_type = 'agentdx'`).run(post_text, req.params.id);
  res.json({ success: true });
});

router.post('/posts/:id/publish', async (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'agentdx'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  let metadata = {};
  try { metadata = JSON.parse(post.metadata || '{}'); } catch { metadata = {}; }

  try {
    // xService.postTweet は base64 の `image` を受け取る（`mediaPath` は解釈されない）
    let image;
    if (post.image_path) {
      image = await fs.readFile(post.image_path, { encoding: 'base64' }).catch(() => undefined);
    }

    // ① 本体投稿（リンク0本）
    const result = await postTweet(post.post_text, { image });

    // ② 出典があれば、返ってきた tweet_id に対してセルフリプライで出典を送る。
    //    本体投稿に外部リンクを入れるとリーチが抑制されるため、リンクはこちらに逃がす。
    const replyText = buildSourceReplyText(metadata.sourceUrl);
    let replyTweetId = null;
    let replyError = null;
    if (replyText && result?.id) {
      try {
        const reply = await postTweet(replyText, { replyToId: result.id });
        replyTweetId = reply?.id || null;
      } catch (err) {
        // 出典リプライの失敗で本体投稿を失敗扱いにはしない（本体は既に公開済み）
        replyError = err.message;
        console.error('[agentdx] source reply failed:', err);
      }
    }

    db.prepare(
      `UPDATE sns_posts SET status = 'posted', social_post_id = ?, social_posted_at = CURRENT_TIMESTAMP, metadata = ? WHERE id = ?`
    ).run(result.id, JSON.stringify({ ...metadata, sourceReplyTweetId: replyTweetId, sourceReplyError: replyError }), post.id);

    res.json({
      success: true,
      tweet_id: result.id,
      reply_tweet_id: replyTweetId,
      reply_error: replyError,
      reply_sent: Boolean(replyTweetId),
    });
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
