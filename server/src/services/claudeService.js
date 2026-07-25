import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

// APIキー未設定でもサーバーを起動できるよう、クライアントは初回利用時に生成する。
// キーの有無は claudeFallback.hasClaudeKey() が判定し、未設定時はプロンプト方式に切り替わる。
let clientInstance = null;
function getClient() {
  if (!clientInstance) {
    clientInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
    });
  }
  return clientInstance;
}

// 旧 claude-sonnet-4-20250514 は2026年6月に廃止予定のため claude-sonnet-5 に移行。
// Sonnet 5 は thinking がデフォルトONになるため、従来挙動を保つ箇所では明示的に無効化する。
const DEFAULT_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5';

export async function searchAiNews(contentType, label) {
  // Recency window: today, last 30 days, current year (computed at call time)
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const recent = `${y}年${m}月`;          // e.g. "2026年4月"
  const prevM = m === 1 ? `${y - 1}年12月` : `${y}年${m - 1}月`;
  const recencyTag = `${recent} OR ${prevM} 直近 最新`;

  const queries = {
    subsidy_news:   `AI IT導入補助金 ものづくり補助金 中小企業 ${recencyTag} 公募 締切 採択`,
    subsidy_howto:  `補助金 申請 採択率 事業計画書 書き方 中小企業 ${recencyTag}`,
    ai_dx:          `中小企業 AI業務改善 DX 事例 効果 ${recencyTag}`,
    ai_smb:         `中小企業 生成AI 導入事例 ROI 効果 ${recencyTag}`,
    ai_efficiency:  `生成AI 業務効率化 バックオフィス 自動化 事例 ${recencyTag}`,
    ai_tools:       `AIツール 業務活用 中小企業 新機能 リリース ${recencyTag}`,
    claude_biz:     `Claude Anthropic 業務活用 新機能 アップデート ${recencyTag}`,
    chatgpt_biz:    `ChatGPT OpenAI 業務活用 新機能 GPTs アップデート ${recencyTag}`,
    insurance_ai:   `保険代理店 AI 意向把握 コンプライアンス DX 事例 ${recencyTag}`,
    mvp:            `AI MVP 開発 内製化 Claude Code Cursor 事例 ${recencyTag}`,
    vibecoding:     `バイブコーディング Vibe Coding AI開発 ${recencyTag}`,
    cocreo_voice:   `中小企業 AI 業務改善 補助金 経営 トレンド ${recencyTag}`,
  };
  const query = queries[contentType] || `${label} 中小企業 AI 補助金 ${recencyTag}`;

  // Compute "no older than" boundary: 90 days ago
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
  const todayStr = `${y}-${String(m).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  try {
    const response = await getClient().messages.create({
      model: DEFAULT_MODEL,
      thinking: { type: 'disabled' },
      max_tokens: 2500,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }],
      messages: [{
        role: 'user',
        content: `今日は ${todayStr} です。「${query}」で最新ニュース・公募情報・事例をWeb検索してください。

【厳守ルール】
- 公開日が ${cutoffStr} 以降（直近90日以内）の記事のみ採用すること。それより古い記事は採用せず、必要なら検索キーワードを変えて再検索すること（最大5回まで検索可）。
- 1回目の検索結果が古ければ、「${recent}」「直近」「最新」「today」などの語を加えて再検索すること。
- 各記事の公開日（YYYY-MM-DD）を必ず本文に明記すること。日付不明な記事は採用しないこと。

【出力形式】
X（Twitter）投稿のネタになりそうなトピックを3〜5件、箇条書きで日本語にまとめてください。各項目に以下を含めてください：
- 公開日（YYYY-MM-DD）
- 具体的な数字・金額・締切・ツール名・企業名・補助金名
- 出典URL

最後に、最もバズりそうなトピックの出典URLを1件「SOURCE_URL: https://...」の形式で必ず記載してください。
直近90日の記事が見つからない場合は「情報なし」とだけ返してください。`,
      }],
    });

    // Aggregate text + collect citations.
    // Prefer URLs the model actually cited (text-block citations) over raw search hits,
    // because the model has filtered for recency per the prompt rules above.
    let text = '';
    const cited = [];
    const citedSeen = new Set();
    const fallback = [];
    const fallbackSeen = new Set();

    for (const block of response.content || []) {
      if (block.type === 'text') {
        text += (text ? '\n' : '') + (block.text || '');
        for (const c of block.citations || []) {
          const url = c.url;
          if (!url || citedSeen.has(url)) continue;
          citedSeen.add(url);
          cited.push({ url, title: c.title || '' });
        }
      } else if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
        for (const item of block.content) {
          const url = item.url;
          if (!url || fallbackSeen.has(url)) continue;
          fallbackSeen.add(url);
          fallback.push({ url, title: item.title || '' });
        }
      }
    }

    if (!text || text.includes('情報なし')) return { summary: null, sourceUrl: null, sources: [] };

    // Extract a single best source URL (for character-limited X post embedding)
    const urlMatch = text.match(/SOURCE_URL:\s*(https?:\/\/\S+)/);
    const sourceUrl = urlMatch ? urlMatch[1] : (cited[0]?.url || fallback[0]?.url || null);
    const summary = text.replace(/SOURCE_URL:\s*https?:\/\/\S+/g, '').trim();
    const sources = (cited.length ? cited : fallback).slice(0, 5);
    return { summary, sourceUrl, sources };
  } catch {
    return { summary: null, sourceUrl: null, sources: [] };
  }
}

// 保険代理店向け「最新ニュース取得」用の検索クエリ。
// ニュース系コンテンツ種別ごとに、直近の一次情報にたどり着きやすい語を並べる。
// global_ins は海外記事（英語）が主役になるため、英語クエリを併記する。
// ニュース系は9種→3種に統合（投稿比率を転換系に寄せるため）。
export const AGENTDX_NEWS_QUERIES = {
  ins_news:      `保険業界 ニュース 経営 提携 新戦略 保険代理店 手数料 市場動向`,
  law_reform:    `保険業法 改正 金融庁 監督指針 規制変更 意向把握 比較推奨`,
  global_ins:    `insurance industry news insurtech regulation OR 海外保険業界 InsurTech グローバル 規制`,
};

/** ニュース検索の対象期間（直近90日）と当日日付を返す */
function newsWindow() {
  const now = new Date();
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 90);
  return {
    todayStr: iso(now),
    cutoffStr: iso(cutoff),
    recentTag: `${now.getFullYear()}年${now.getMonth() + 1}月`,
  };
}

/**
 * 保険代理店向けの最新ニュース候補を web_search で取得し、日本語で要約して返す。
 * 海外（英語）記事もヒットするため、要約は必ず日本語に翻訳したうえで返させる。
 *
 * @returns {Promise<{ items: Array<{date,title,summary,url,language}>, sources: Array<{url,title}> }>}
 */
export async function searchInsuranceNews(contentType, label) {
  const { todayStr, cutoffStr, recentTag } = newsWindow();
  const query = `${AGENTDX_NEWS_QUERIES[contentType] || `保険代理店 ${label}`} ${recentTag} 最新`;

  const response = await getClient().messages.create({
    model: DEFAULT_MODEL,
    thinking: { type: 'disabled' },
    max_tokens: 3000,
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }],
    messages: [{
      role: 'user',
      content: `今日は ${todayStr} です。「${query}」でWeb検索し、保険代理店の実務担当者が知るべきニュースを3〜5件集めてください。

【厳守ルール】
- 公開日が ${cutoffStr} 以降（直近90日以内）の記事のみ採用する。古ければ検索語を変えて再検索する（最大5回）
- 公開日が確認できない記事は採用しない
- 記事に書かれていない事実・数字・制度名を足さない
- 記事が英語など日本語以外の場合も採用してよい。ただし title・summary は必ず正確な日本語に翻訳して書く。
  専門用語は日本の保険業界で通じる語に置き換える（例: underwriting→引受、claims→保険金支払、broker/agent→代理店、premium→保険料、
  policyholder→契約者、InsurTech→インシュアテック）。原文にない情報は補わない

【出力形式】
説明文を一切書かず、次のJSON配列だけを \`\`\`json のコードブロックで出力してください。
[
  {
    "date": "YYYY-MM-DD",
    "title": "日本語の見出し（40字以内）",
    "summary": "日本語の要約2〜3文。数字・企業名・制度名を残す",
    "impact": "保険代理店の現場への影響を1文で",
    "url": "https://...",
    "language": "ja または en など原文の言語コード"
  }
]
直近90日の記事が見つからない場合は [] とだけ出力してください。`,
    }],
  });

  let text = '';
  const cited = [];
  const seen = new Set();
  for (const block of response.content || []) {
    if (block.type === 'text') {
      text += (text ? '\n' : '') + (block.text || '');
      for (const c of block.citations || []) {
        if (!c.url || seen.has(c.url)) continue;
        seen.add(c.url);
        cited.push({ url: c.url, title: c.title || '' });
      }
    } else if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
      for (const item of block.content) {
        if (!item.url || seen.has(item.url)) continue;
        seen.add(item.url);
        cited.push({ url: item.url, title: item.title || '' });
      }
    }
  }

  return { items: parseNewsItems(text), sources: cited.slice(0, 8) };
}

/** モデル出力（JSONコードブロック想定）からニュース候補配列を取り出す。壊れた出力でも落とさない。 */
export function parseNewsItems(text) {
  if (!text) return [];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const arrayMatch = raw.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return [];
  let parsed;
  try {
    parsed = JSON.parse(arrayMatch[0]);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(item => item && typeof item === 'object' && /^https?:\/\//.test(String(item.url || '')))
    .slice(0, 8)
    .map(item => ({
      date: String(item.date || '').slice(0, 10),
      title: String(item.title || '').slice(0, 120),
      summary: String(item.summary || '').slice(0, 400),
      impact: String(item.impact || '').slice(0, 200),
      url: String(item.url),
      language: String(item.language || '').slice(0, 8) || 'ja',
    }));
}

// ─────────────────────────────────────────────────────────────
// 投稿の「型」（4種）
//
// 旧テンプレ（フック→事実→「▼代理店の現場では」→ハッシュタグ）は全投稿で同じ形になり、
// かつ ①ハッシュタグは検索到達にほぼ寄与せず業者感でフォロー率を下げる
//     ②外部リンク付き投稿はリーチが抑制される
//     ③圧縮された投稿より改行で縦に長い投稿の方が滞在時間で有利
// という前提に合わないため廃止。コンテンツ種別ごとに以下4型を使い分ける。
//
//   A: 数字ショック型（実務Tips）
//   B: セルフチェック型（業法・制度／□のチェックリスト）
//   C: 海外ニュース翻訳型（事実要約＋日本の代理店への効き方）
//   D: 制作実況型（最重要。明示的に返信を求める）
//   Q: 引用ポスト用の短いコメント（本文に引用元URLを含む唯一の例外）
// ─────────────────────────────────────────────────────────────

/** コンテンツ種別 → 既定の型 */
export const POST_ARCHETYPE_BY_TYPE = {
  efficiency_tips: 'A',
  ins_news:        'A',
  law_check:       'B',
  law_reform:      'B',
  global_ins:      'C',
  case_story:      'D',
  app_demo:        'D',
  fail_story:      'D',
  pinned_app:      'D',
  quote_post:      'Q',
};

// .jp 以外のドメインでも日本語メディアであるものは「海外記事」と判定しない
const JP_MEDIA_HOSTS = [
  'nikkei.com', 'asahi.com', 'sankei.com', 'toyokeizai.net', 'diamond.jp',
  'newspicks.com', 'note.com', 'prtimes.jp', 'jiji.com', 'bloomberg.co.jp',
  'itmedia.co.jp', 'impress.co.jp', 'newsweekjapan.jp',
];

/** URLの見た目から「海外（日本語以外）の記事らしいか」をざっくり判定する */
export function looksForeignUrl(url) {
  try {
    const host = new URL(String(url)).hostname.toLowerCase();
    if (host.endsWith('.jp')) return false;
    if (JP_MEDIA_HOSTS.some(h => host === h || host.endsWith(`.${h}`))) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * 投稿の型を決める。
 * 海外記事（言語コードが ja 以外／海外ドメイン）を根拠にする場合は種別によらず型Cを優先する。
 */
export function resolveArchetype(contentType, { sourceLanguage = null, sourceUrl = null } = {}) {
  if (contentType === 'quote_post') return 'Q';
  if (sourceLanguage && !String(sourceLanguage).toLowerCase().startsWith('ja')) return 'C';
  if (sourceUrl && looksForeignUrl(sourceUrl)) return 'C';
  return POST_ARCHETYPE_BY_TYPE[contentType] || 'A';
}

/** 全型共通のルール（ハッシュタグ0・本文リンク0・縦に長く・最終行は返信誘発） */
export function buildCommonPostRules({ ctaUrl = null, hasBodyUrl = false } = {}) {
  // Xの加重文字数は「全角=2 / 半角=1 / 改行=1 / URLは長さに関わらず23」で上限280。
  // 全角130字＝260単位。改行を10〜15本入れても280に収まる安全圏。
  // 本文にURLを1本入れる場合は 280-23=257 → 全角118字（236単位）＋改行で安全圏。
  const limitLine = (ctaUrl || hasBodyUrl)
    ? `- 本文は全角118文字以内（Xの上限は280単位。全角1字=2単位・改行1つ=1単位・URLは長さに関わらず23単位。URLを1本含むため 280-23=257単位が本文の枠）`
    : `- 本文は全角130文字以内（Xの上限280単位＝全角140字。全角1字=2単位・改行1つ=1単位。改行を多く使うぶんの余裕を持たせている）`;

  const linkLine = ctaUrl
    ? `- 本文に入れてよいリンクはこの1本だけ: ${ctaUrl}（末尾に単独行で置く）`
    : hasBodyUrl
      ? `- 引用元URLはシステムが末尾に自動で付けるので、あなたは書かない。
  それ以外のURL・リンクも一切入れない（本文に含まれるURLは引用元の1本だけになる）`
      : `- 本文にURL・リンクを一切入れない。Xでは外部リンク付き投稿のリーチが数分の1に抑制されるため、
  出典URLは本体投稿ではなく直後のセルフリプライで出す（システムが自動で送る）
- 「詳細はこちら」「リンクから」「プロフィールのリンク」等、リンク前提の表現も使わない`;

  return `【全型に共通する絶対ルール】
- ハッシュタグは1つも使わない。#保険代理店 も #業務効率化 も禁止。
  （Xではハッシュタグは検索到達にほぼ寄与せず、業者アカウントの印象を与えてフォロー率を下げるため）
${linkLine}
- 改行を多用して縦に長く読ませる。1行は全角25字程度までで折り返し、2〜3行のかたまりごとに空行を入れる
- 1段落に圧縮しない。短文・箇条書き・空行でリズムを作る
- 最終行は必ず読者の返信を誘う一文で終える（問いかけ、または「教えてください」という明示的な依頼）。
  Xではリプライがいいねの十数倍〜数十倍の重みを持つシグナルのため、ここは省略しない
- 絵文字は0〜1個まで。多用しない
${limitLine}`;
}

const ARCHETYPE_BODIES = {
  A: `【型A：数字ショック型】
狙い: 「これはうちの話だ」と気づかせ、保存とリプライを取る。
構造（この順序で書く）:
1. 1行目に業務時間・件数などの生々しい数字を1つだけ置き、短く言い切る
2. 空行。その数字を年間・人日など「無視できない大きさ」に換算し直す
3. 空行。やることを「1 」「2 」「3 」の番号付きで3つ、各1行だけで示す
4. 空行。順番の落とし穴・つまずきどころを1〜2行
5. 最終行は読者への問いかけ

質感の見本（改行の入れ方・語り口を真似る。内容はテーマに合わせて差し替える）:
---
申込書の転記に1件12分。

月20件で年48時間。
募集人の丸6日が「紙を見て打ち直す」だけに消えている計算です。

削るなら順番があります。
1 転記元を1つに絞る
2 頻出項目だけ定型化
3 最後にAI読取

いきなり3から入ると、たいてい失敗します。
---
※見本は改行とトーンの見本です。見本には問いかけが無いが、実際の投稿では最終行に必ず問いかけを置くこと。`,

  B: `【型B：セルフチェック型】
狙い: スクリーンショットを撮られ、社内の朝礼・研修で共有されること。保存とリプライを取る。
構造（この順序で書く）:
1. 1行目に「つもりで一番あぶないのはここです」型の切り出し（制度名・施行年を1つ入れる）
2. 空行。「□ 」で始まるチェック項目を3つ（各1行、全角20〜28字程度、業務の現場語で書く）
3. 空行。全部外れていれば大丈夫／1つでも当てはまるなら…という判定の一言
4. 最終行は読者への問いかけ

質感の見本（改行の入れ方・語り口を真似る。内容はテーマに合わせて差し替える）:
---
2026年改正、「対応済み」のつもりで一番あぶないのはここです。

□ 意向把握の記録が募集人のメモ頼り
□ 比較推奨した理由が書面に残っていない
□ 高齢者募集の複数回面談が運用に乗っていない

全部チェックが外れていれば大丈夫。
1つでも当てはまるなら、来週の朝礼の議題です。
---
※チェック記号は必ず半角ではなく「□」を使う。項目は3つ。法的助言ではなく「確認のきっかけ」のトーンにする。
※見本には問いかけが無いが、実際の投稿では最終行に必ず問いかけを置くこと。`,

  C: `【型C：海外ニュース翻訳型】
狙い: 海外の一次情報を、日本の代理店の実務語に翻訳して届ける。
構造（この順序で書く）:
1. 1行目で「争点は◯◯ではない」と、読者の予想を一度外す
2. 空行。では何が争点なのかを1行で言い切る
3. 空行。事実の要約（出典に書かれていることだけ。数字・機関名は原文どおり）
4. 空行。「日本の代理店に置き換えると、こうなります。」に続けて、実務にどう効くかを必ず1〜2行
5. 最終行は読者への問いかけ

質感の見本（改行の入れ方・語り口を真似る。内容はテーマに合わせて差し替える）:
---
海外の保険業界でいま争点になっているのは、AIの精度ではありません。

「人が最終判断した記録が残っているか」です。

日本の代理店に置き換えると、こうなります。
AIを入れる前に、誰がいつ何を見て確認したかの残し方を決めておく。

ツールより先に、記録の設計です。
---
※「日本の代理店の実務にどう効くか」の1〜2行は必須。ただし日本の制度への読み替えを断定しない（「置き換えると」「示唆としては」の語法を使う）。
※見本には問いかけが無いが、実際の投稿では最終行に必ず問いかけを置くこと。`,

  D: `【型D：制作実況型】※最重要の型
狙い: 「この人に頼めば作ってもらえそう」と思わせ、返信で要望を集めること。返信数が最優先。
構造（この順序で書く）:
1. 1行目は現場の人が実際に言った言葉を「」で引用する（生の口語のまま）
2. 空行。「そう聞いたので、〜を作ってみました。」と、自分が手を動かしたことを1行で
3. 空行。Before → After を数字で（例「40分 → 3分。」）。続けて種明かしを1行（「すごい技術は使っていません。◯◯をやめただけです。」）
4. 空行。最終行で明示的に返信を求める（例「同じことで消耗している方、どの業務がいちばん重いか教えてください。作ってみます。」）

質感の見本（改行の入れ方・語り口を真似る。内容はテーマに合わせて差し替える）:
---
「満期更改の一覧、毎月Excelで作り直してます」

そう聞いたので、貼るだけで抽出できるものを作ってみました。

40分 → 3分。
すごい技術は使っていません。転記をやめただけです。

同じことで消耗している方、どの業務がいちばん重いか教えてください。作ってみます。
---
※最終行の「返信の依頼」は絶対に省略しない。売り込み口調・サービス紹介口調にしない。
※実際に作っていないものを「作った」と書かない。素材・メモに書かれた事実の範囲で書く。`,

  Q: `【引用ポスト用のコメント】
狙い: 業界ニュースに自分の解釈を1〜2行だけ足し、引用元の読者に「この人は現場が分かっている」と思わせる。
構造:
1. 引用元の内容を要約し直さない（読者は引用カードで元投稿を読める）
2. 「自分はこう読んだ」「代理店の現場ではこうなる」という解釈を1〜2行だけ書く
3. 最終行は読者への問いかけ（1行）
- 全体で3〜4行。改行で区切る。コメント部分は全角90字以内に収める`,
};

/** 型（A/B/C/D/Q）＋共通ルール＋文字数ルールをまとめて返す */
export function buildPostFormatRules(archetype, { ctaUrl = null, hasBodyUrl = false, sourceLine = false } = {}) {
  const body = ARCHETYPE_BODIES[archetype] || ARCHETYPE_BODIES.A;
  const sourceRule = sourceLine
    ? `\n\n【出典の扱い】
- 出典URLは投稿本文に書かない。本文とは別に、最終行へ「SOURCE_URL: https://...」を1行だけ書く
- この行は投稿されない。システムが本体投稿の直後に「出典リプライ」として自動送信するためのメタ情報`
    : '';
  return `${body}\n\n${buildCommonPostRules({ ctaUrl, hasBodyUrl })}${sourceRule}`;
}

// 海外記事（英語など日本語以外）を扱うときの共通ルール。
// 出典URLモード・テキスト貼り付けモードの両方で使う。
export const TRANSLATION_RULES = `【日本語以外の記事の扱い】
- 記事が英語など日本語以外の場合は、まず内容を正確に日本語へ翻訳・要約したうえで投稿を書く（投稿文は必ず日本語）
- 専門用語は日本の保険業界で通じる語に置き換える（例: underwriting→引受、claims→保険金支払、broker/agent→代理店、
  premium→保険料、policyholder→契約者、loss ratio→損害率、InsurTech→インシュアテック、regulator→規制当局）
- 固有名詞（企業名・機関名）は原語表記のままか、一般的な日本語表記があればそれを使う
- 金額・単位は原文の通貨・単位を保持する（勝手に円換算しない）
- 原文にない情報・数字・制度名を足さない。日本国内の制度に読み替えられる断定もしない
- 海外事例は「日本の代理店にとっての示唆」として1文で接続する`;

export async function generateAgentDxPost(contentType, label, extraContext, systemPrompt, { sourceUrl = null, sourceText = null, ctaUrl = null, trendAngle = null, sourceLanguage = null } = {}) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const todayStr = `${y}-${String(m).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const recentTag = `${y}年${m}月 OR ${y}年${m === 1 ? 12 : m - 1}月 最新`;
  const trendLine = trendAngle ? `\n【今の時流（この空気感を1文でも織り込む）】\n${trendAngle}\n` : '';

  const queries = {
    ins_news:      `保険業界 ニュース 経営 提携 新戦略 代理店 手数料 ${recentTag}`,
    law_reform:    `保険業法 改正 金融庁 監督指針 規制変更 意向把握 比較推奨 ${recentTag}`,
    global_ins:    `海外保険業界 InsurTech グローバル 規制 ${recentTag}`,
  };

  const archetype = resolveArchetype(contentType, { sourceLanguage, sourceUrl });
  const isConversionType = ['efficiency_tips', 'app_demo', 'law_check', 'case_story', 'fail_story', 'pinned_app'].includes(contentType);

  let userMessage;
  let tools;

  if (isConversionType) {
    // 転換系（受注につなげる投稿）: Web検索不要。業務知識ベースで生成する。
    // 開発実績が出るまで自社サイトへのリンクは入れない方針のため、既定は ctaUrl = null。
    tools = undefined;
    userMessage = `今日は ${todayStr} です。

【テーマ】${label}
【背景・素材】${extraContext}
${trendLine}${sourceText ? `\n【追加の素材・メモ（これを最優先の材料にする）】\n${sourceText}\n` : ''}
保険代理店向けのX（Twitter）投稿を1件作成してください。
ニュースの紹介ではなく、「読んだ代理店がそのまま実行できる具体的な内容」にしてください。

${buildPostFormatRules(archetype, { ctaUrl })}

【出力形式】
投稿文のみを出力してください。前後に説明文を入れないでください。SOURCE_URL行は不要です。`;
  } else if (sourceUrl) {
    // 出典URL指定モード: 貼られた記事だけを根拠に生成（誤報防止の本命モード）。
    // 海外（英語など）の記事URLでも、日本語に翻訳・要約したうえで投稿化する。
    tools = [{ type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 3 }];
    userMessage = `今日は ${todayStr} です。

【テーマ】${label}
【背景】${extraContext}

以下の記事URLの内容を web_fetch で取得し、その記事「だけ」を根拠にX（Twitter）投稿を1件作成してください。
記事URL: ${sourceUrl}
${sourceText ? `\n【運営者のメモ・補足（内容の解釈に使ってよい）】\n${sourceText}\n` : ''}
【厳守】
- 記事に書かれていない事実・数字・制度名を書かない
- 記事が取得できない、または保険代理店に関係が薄い場合は「NO_POST: 理由」とだけ出力する

${TRANSLATION_RULES}

${buildPostFormatRules(archetype, { ctaUrl, sourceLine: true })}
- SOURCE_URL行には必ず ${sourceUrl} を記載する

【出力形式】
投稿文とSOURCE_URLのみ出力してください。前後に説明文を入れないでください。`;
  } else if (sourceText) {
    // テキスト貼り付けモード: 貼られた本文だけを根拠に生成（ツール不要）
    tools = undefined;
    userMessage = `今日は ${todayStr} です。

【テーマ】${label}
【背景】${extraContext}

以下に貼り付けた記事・情報「だけ」を根拠に、保険代理店向けのX（Twitter）投稿を1件作成してください。

【貼り付けられた記事・情報】
${sourceText}

【厳守】
- 貼り付けられた内容に書かれていない事実・数字・制度名を書かない
- 内容が保険代理店に関係が薄い場合は「NO_POST: 理由」とだけ出力する

${TRANSLATION_RULES}

${buildPostFormatRules(archetype, { ctaUrl, sourceLine: true })}
- 貼り付け内容に出典URLが含まれていればSOURCE_URL行に記載、なければSOURCE_URL行は省略する

【出力形式】
投稿文とSOURCE_URL（あれば）のみ出力してください。前後に説明文を入れないでください。`;
  } else {
    // Web検索モード: 出典なしでは書かせない（検索結果に忠実に）
    const query = queries[contentType] || `保険代理店 ${label} 最新 ${recentTag}`;
    tools = [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }];
    userMessage = `今日は ${todayStr} です。

【テーマ】${label}
【背景】${extraContext}

以下の手順でX（Twitter）投稿を1件作成してください：

1. 「${query}」でWebを検索し、直近3ヶ月以内の最新ニュース・情報を探す
2. 最もインパクトが大きく代理店担当者が知るべき記事を1件選ぶ
3. その記事に書かれている事実「だけ」を使って投稿を執筆する

【厳守】
- 検索結果に書かれていない事実・数字・制度名を書かない（記憶からの補完は禁止）
- 直近3ヶ月以内の記事が見つからない場合は「NO_POST: 直近の記事が見つかりません」とだけ出力する

${TRANSLATION_RULES}

${buildPostFormatRules(archetype, { ctaUrl, sourceLine: true })}
- SOURCE_URL行には実際に参照した記事のURLを記載する

【出力形式】
投稿文とSOURCE_URLのみ出力してください。前後に説明文を入れないでください。`;
  }

  let messages = [{ role: 'user', content: userMessage }];
  let response;
  // サーバーサイドツールの反復上限で pause_turn が返ることがあるため、最大3回まで継続する
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await getClient().messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      system: systemPrompt,
      ...(tools ? { tools } : {}),
      messages,
    });
    if (response.stop_reason !== 'pause_turn') break;
    messages = [...messages, { role: 'assistant', content: response.content }];
  }

  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  if (!text) throw new Error('Claude からテキスト応答が返りませんでした');

  const noPostMatch = text.match(/NO_POST:\s*(.*)/);
  if (noPostMatch) {
    throw new Error(`投稿を生成できませんでした: ${noPostMatch[1] || '根拠となる記事が見つかりません'}`);
  }

  const urlMatch = text.match(/SOURCE_URL:\s*(https?:\/\/\S+)/);
  const extractedSourceUrl = urlMatch ? urlMatch[1] : (sourceUrl || null);
  let postText = text.replace(/SOURCE_URL:\s*https?:\/\/\S+/g, '').trim();
  // モデルがルールを破った場合の安全網。ハッシュタグは常に除去し、
  // ctaUrl を明示指定していない限り本文のURLも除去する（本文リンク0本の方針）。
  postText = sanitizePostBody(postText, { allowUrls: Boolean(ctaUrl) });
  return { postText, sourceUrl: extractedSourceUrl, archetype };
}

/**
 * 生成された本文からハッシュタグ（および方針上不要なURL）を機械的に取り除く。
 * プロンプトで禁止していても稀にモデルが付けるため、投稿前の最終防衛線として使う。
 */
export function sanitizePostBody(text, { allowUrls = false } = {}) {
  let out = String(text || '');
  // 「#タグ」「＃タグ」を行頭・空白直後から除去（英数字・日本語タグの両方）
  out = out.replace(/(^|[\s　])[#＃][^\s　#＃]+/g, '$1');
  if (!allowUrls) out = out.replace(/https?:\/\/\S+/g, '');
  return out
    .replace(/[ \t　]+$/gm, '')   // 行末の余白
    .replace(/\n{3,}/g, '\n\n')   // 空行の連続を1つに
    .trim();
}

/**
 * 引用ポスト用のコメント（1〜2行の自分の解釈）を生成する。
 * X APIでは「本文＋対象ツイートURL」で引用が成立するため、本文にURLを1本だけ含む。
 * quotedText（引用元の本文の貼り付け）があればそれだけを根拠にし、無ければ web_fetch を試す。
 */
export async function generateQuotePostComment(systemPrompt, { quoteUrl, quotedText = null, note = null } = {}) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const hasText = Boolean(quotedText && quotedText.trim());
  const tools = hasText ? undefined : [{ type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 3 }];

  const userMessage = `今日は ${todayStr} です。

引用ポスト（quote post）のコメント部分を作成してください。
引用元の投稿URL: ${quoteUrl}
${hasText
    ? `\n【引用元の投稿の内容（これだけを根拠にする）】\n${quotedText.trim()}\n`
    : `\nこのURLの内容を web_fetch で取得し、その内容「だけ」を根拠にしてください。\n取得できない場合は「NO_POST: 引用元の内容を取得できませんでした」とだけ出力してください。\n`}${note && note.trim() ? `\n【運営者のメモ・言いたいこと（最優先で反映する）】\n${note.trim()}\n` : ''}
【厳守】
- 引用元に書かれていない事実・数字・制度名を書かない（記憶からの補完は禁止）
- 引用元が保険代理店の実務に関係が薄い場合は「NO_POST: 理由」とだけ出力する

${buildPostFormatRules('Q', { hasBodyUrl: true })}

【出力形式】
コメント部分のみを出力してください。引用元URLは書かないでください（システムが自動で末尾に付けます）。
前後の説明文も不要です。`;

  let messages = [{ role: 'user', content: userMessage }];
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await getClient().messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: systemPrompt,
      ...(tools ? { tools } : {}),
      messages,
    });
    if (response.stop_reason !== 'pause_turn') break;
    messages = [...messages, { role: 'assistant', content: response.content }];
  }

  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  if (!text) throw new Error('Claude からテキスト応答が返りませんでした');

  const noPostMatch = text.match(/NO_POST:\s*(.*)/);
  if (noPostMatch) {
    throw new Error(`引用ポストを生成できませんでした: ${noPostMatch[1] || '引用元の内容を確認できません'}`);
  }

  // コメント側にURLが混ざらないよう除去（引用URLはルート側で末尾に1本だけ付ける）
  const comment = sanitizePostBody(text, { allowUrls: false });
  if (!comment) throw new Error('引用ポストのコメントが空になりました');
  return { comment };
}

export async function searchRamenTypeReviews(ramenType, location) {
  if (!ramenType) return null;
  try {
    const locationPart = location ? ` ${location}` : '';
    const query = `${ramenType}ラーメン${locationPart} 口コミ 特徴 おすすめ`;
    const response = await getClient().messages.create({
      model: DEFAULT_MODEL,
      thinking: { type: 'disabled' },
      max_tokens: 2048,
      tools: [{ type: 'web_search_20260209', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `「${query}」について食べログ・Googleマップ・Rettyなどで口コミを検索してください。以下を日本語でまとめてください：
・このラーメンスタイル（${ramenType}）の特徴・味わい
・スープの特徴（具体的に）
・麺の種類・食感
・人気のトッピング・食べ方
・実際の口コミコメント（具体的な表現を引用）
実際に見つかった情報のみ使用してください。情報が見つからない場合は「口コミ情報なし」と返してください。`,
      }],
    });
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    return text && !text.includes('口コミ情報なし') ? text : null;
  } catch {
    return null;
  }
}

export async function convertImpressionToEnglish(japaneseText) {
  try {
    return await generateTextFull(
      'You are a food writer specializing in Japanese ramen. Convert the user\'s impression into vivid, engaging English suitable for an Instagram caption. Keep it natural and enthusiastic, 1-3 sentences. Output only the English text, no explanation.',
      `以下の感想を、Instagramキャプション向けの自然な英語に変換してください：\n\n${japaneseText}`,
      { maxTokens: 300 }
    );
  } catch {
    return null;
  }
}

const INSTAGRAM_CAPTION_LIMIT = 2200;

export async function translateInstagramPostToEnglish(japanesePost) {
  try {
    let english = await generateTextFull(
      `You are a creative food writer specializing in Japanese ramen culture, crafting captions for an international Instagram audience. Your goal is a vivid food story — not a literal translation, but an authentic experience.

Rules:
1. STORYTELLING: Write as if sharing a personal food discovery. Use sensory language (aroma, texture, depth of flavor). Make readers feel they must visit.
2. RAMEN TERMS: Naturally explain Japanese terms inline (e.g., "shoyu — a clear, soy-seasoned broth", "chashu — melt-in-your-mouth braised pork", "tsukemen — thick noodles served for dipping").
3. HASHTAGS: Replace ALL Japanese hashtags with English equivalents that international users actually search. Use: #ramen #ramennoodles #japanesefood #foodie #tokyofood (adjust location/type to English). Never keep Japanese-script hashtags.
4. SLURP LINE: The line starting with "📲 Slurp" must become: "📲 Discover more ramen spots on Slurp! [keep the original URL]"
5. LENGTH: Total output (body + blank line + hashtags) MUST be 2200 characters or fewer — Instagram's hard limit. Condense if needed.
6. OUTPUT: Caption body + one blank line + hashtags only. No explanation, no preamble.`,
      `Craft an English Instagram caption from this Japanese ramen post. Follow all rules in the system prompt exactly.

[Japanese post]
${japanesePost}`,
      { maxTokens: 1500 }
    );

    if (!english) return null;
    english = english.trim();

    // Safety net: if the model still went over, retry once asking it to compress.
    if (english.length > INSTAGRAM_CAPTION_LIMIT) {
      const retry = await generateTextFull(
        'You compress Instagram captions to fit Instagram\'s 2200-character limit while preserving voice and hashtags. Output only the compressed caption.',
        `次の英語Instagramキャプションは${english.length}文字あり、Instagram上限の2200文字を超えています。意味・トーン・主要なハッシュタグを保ったまま、必ず2200文字以下に収めてください。本文を圧縮し、優先度の低いハッシュタグを削ってください。出力は圧縮後のキャプションのみ：\n\n${english}`,
        { maxTokens: 1500 }
      );
      if (retry && retry.trim().length <= INSTAGRAM_CAPTION_LIMIT) {
        english = retry.trim();
      }
    }

    return english;
  } catch {
    return null;
  }
}

export async function searchRestaurantReviews(restaurantName, location, ramenType, ramenName) {
  if (!restaurantName) return null;
  try {
    const parts = [restaurantName];
    if (ramenName) parts.push(ramenName);
    if (location) parts.push(location);
    if (ramenType) parts.push(ramenType);
    parts.push('ラーメン');
    const query = parts.join(' ');
    const focusNote = ramenName
      ? `特に「${ramenName}」というメニューに関する口コミ・評価を重点的に調べてください。`
      : ramenType ? `特に「${ramenType}」スタイルのラーメンに関する記述を優先して拾ってください。` : '';
    const response = await getClient().messages.create({
      model: DEFAULT_MODEL,
      thinking: { type: 'disabled' },
      max_tokens: 2048,
      tools: [{ type: 'web_search_20260209', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `「${query}」について食べログ・Googleマップ・Rettyなどで口コミを検索してください。${focusNote}以下を日本語でまとめてください：
・スープの特徴・味わい（具体的に）
・麺の種類・食感
・人気メニュー・おすすめ
・トッピングの特徴
・雰囲気・価格帯
・実際の口コミコメント（具体的な表現を引用）
実際に見つかった情報のみ使用してください。情報が見つからない場合は「口コミ情報なし」と返してください。`,
      }],
    });
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    return text && !text.includes('口コミ情報なし') ? text : null;
  } catch {
    return null;
  }
}


export async function generateText(systemPrompt, userMessage, options = {}) {
  const stream = await getClient().messages.stream({
    model: DEFAULT_MODEL,
      thinking: { type: 'disabled' },
    max_tokens: options.maxTokens || 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  return stream;
}

export async function generateTextFull(systemPrompt, userMessage, options = {}) {
  const response = await getClient().messages.create({
    model: DEFAULT_MODEL,
      thinking: { type: 'disabled' },
    max_tokens: options.maxTokens || 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  return response.content[0].text;
}

export async function analyzeRamenImage(imagePath) {
  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString('base64');
  const ext = imagePath.split('.').pop().toLowerCase();
  const mimeTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
  const mimeType = mimeTypes[ext] || 'image/jpeg';

  const response = await getClient().messages.create({
    model: DEFAULT_MODEL,
      thinking: { type: 'disabled' },
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: base64 },
        },
        {
          type: 'text',
          text: `この写真のラーメンを詳しく分析してください。以下の形式のJSONのみを返してください（説明文なし）：
{
  "ramen_type": "ラーメンのスタイル（醤油/味噌/豚骨/塩/つけ麺/その他）",
  "toppings": ["トッピング1", "トッピング2"],
  "appearance": "見た目の特徴（スープの色、麺の太さ、盛り付けなど）",
  "atmosphere": "雰囲気（カジュアル/高級/地元の名店/トレンド系）",
  "notable_features": "特筆すべき点",
  "japanese_description": "Instagramキャプション向けの魅力的な日本語説明文（1〜2文）",
  "detected_restaurant_name": "写真内の看板・メニュー・箸袋・丼・レシートなどに店名が明確に見える場合はラテン文字表記（日本語の場合はローマ字化）で返す。見えない場合は空文字列。"
}`,
        },
      ],
    }],
  });

  const text = response.content[0].text.trim();
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { english_description: text };
  } catch {
    return { english_description: text };
  }
}
