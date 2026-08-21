import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { generateTextFull } from '../services/claudeService.js';
import { tryClaudeOrEmitPrompt } from '../services/claudeFallback.js';
import { postTweet } from '../services/xService.js';
import { xLength, xTruncate } from '../utils/xText.js';

const router = express.Router();
const X_LIMIT = 280;

const KOYOMI_CTA = {
  url: 'https://apps.apple.com/jp/app/id6794647918',
  label: 'Koyomi -暦-（年表＆カレンダーで覚える日本史・世界史）',
};

const HISTORY_TYPES = {
  japanese_center_qa: {
    label: '🇯🇵 日本史 センター1問1答',
    hashtags: '#日本史 #共通テスト #大学受験',
    isQa: true,
    hints: [
      '古代・ヤマト政権〜律令国家（国分寺建立・墾田永年私財法などの政策と天皇）',
      '平安・摂関政治と院政（藤原道長・白河上皇・保元平治の乱の因果）',
      '中世・鎌倉〜室町幕府（御恩と奉公・惣村・応仁の乱の構造）',
      '織豊政権・太閤検地と刀狩（兵農分離の意義）',
      '江戸初期・幕藩体制（武家諸法度・鎖国の完成手順）',
      '江戸中期・三大改革（享保・寛政・天保の政策の違いと結果）',
      '幕末・開国から明治維新（日米修好通商条約・尊皇攘夷・倒幕の流れ）',
      '明治・立憲体制と日清日露戦争（大日本帝国憲法・条約改正）',
      '大正・デモクラシーと政党政治（普通選挙法・治安維持法）',
      '昭和・恐慌から戦時体制・戦後改革（農地改革・財閥解体・日本国憲法）',
    ],
  },
  world_center_qa: {
    label: '🌍 世界史 センター1問1答',
    hashtags: '#世界史 #共通テスト #大学受験',
    isQa: true,
    hints: [
      'オリエント・地中海世界（アケメネス朝・ポリス民主政・ローマ帝国）',
      '中国王朝史（秦・漢の統一政策・唐の律令制・宋の文治主義）',
      'イスラム世界（ウマイヤ朝・アッバース朝・オスマン帝国の拡大）',
      '中世ヨーロッパ（封建社会・十字軍・教皇権の盛衰）',
      'ルネサンス・大航海時代・宗教改革（世界の一体化と商業革命）',
      '主権国家体制・絶対王政（三十年戦争・ルイ14世・議会政治）',
      '市民革命・産業革命（アメリカ独立・フランス革命・ナポレオン）',
      '19世紀の欧米（ウィーン体制・イタリア/ドイツ統一・帝国主義）',
      '第一次世界大戦・ロシア革命・ヴェルサイユ体制',
      '第二次世界大戦・冷戦構造（キューバ危機・中東戦争・東欧革命）',
    ],
  },
  same_era_qa: {
    label: '🔄 同時代比較 センター1問1答',
    hashtags: '#日本史 #世界史 #大学受験',
    isQa: true,
    hints: [
      '1600年頃: 関ヶ原の戦いの時、ヨーロッパでは何が起きていた？（東インド会社・三十年戦争前夜）',
      '1192/1185年: 鎌倉幕府成立の頃、中国や中東では？（南宋・第3回十字軍）',
      '1853/1868年: ペリー来航・明治維新の頃、清や欧米では？（アヘン戦争/太平天国・南北戦争・普仏戦争）',
      '710/794年: 奈良・平安初期、世界では何帝国が最盛期？（唐・アッバース朝・カール大帝）',
      '1543/1549年: 鉄砲伝来・キリスト教伝来と大航海時代（宗教改革・イエズス会）',
      '1904年: 日露戦争の頃、ヨーロッパの同盟関係は？（英仏協商・三国協商）',
    ],
  },
  japanese_history: {
    label: '日本史 要点解説',
    hashtags: '#日本史 #大学受験',
    isQa: false,
    hints: [
      '鎌倉幕府の成立をめぐる年号と実態のズレ',
      '応仁の乱が戦国時代を生んだ流れ',
      '織豊政権の政策（検地・刀狩）の狙い',
      '江戸幕府の三大改革の違いと結果',
      '開国から明治維新までの条約と国内対立',
      '自由民権運動と憲法制定の流れ',
      '大正デモクラシーと政党政治',
      '昭和恐慌から戦時体制への転換点',
      '戦後改革（農地改革・財閥解体）の中身',
      '摂関政治と院政の権力構造の違い',
    ],
  },
  world_history: {
    label: '世界史 要点解説',
    hashtags: '#世界史 #大学受験',
    isQa: false,
    hints: [
      '十字軍が結果的に何を変えたか',
      'ルネサンスと宗教改革のつながり',
      '大航海時代がもたらした世界の一体化',
      '市民革命（英・米・仏）の共通点と違い',
      '産業革命が社会構造をどう変えたか',
      'ウィーン体制とその崩壊',
      '帝国主義とアフリカ分割',
      '第一次世界大戦の原因と戦後処理',
      '冷戦の始まりと分断の構造',
      '中国王朝の交代パターンと統治制度',
    ],
  },
  mnemonic: {
    label: '年号の覚え方（ゴロ合わせ）',
    hashtags: '#日本史 #世界史 #受験勉強',
    isQa: false,
    hints: [
      '中世の重要年号のゴロ合わせ',
      '近世（江戸）の重要年号のゴロ合わせ',
      '近代（明治〜大正）の重要年号のゴロ合わせ',
      '世界史の重要年号のゴロ合わせ',
      '紛らわしい年号ペアの区別のしかた',
    ],
  },
};

const BODY_MARK = '===本文===';
const REPLY_MARK = '===リプライ===';

function splitGenerated(raw) {
  const text = (raw || '').trim();
  const replyIdx = text.indexOf(REPLY_MARK);
  const stripBody = (s) => s.replace(BODY_MARK, '').trim();
  if (replyIdx === -1) return { body: stripBody(text), explanation: '' };
  return {
    body: stripBody(text.slice(0, replyIdx)),
    explanation: text.slice(replyIdx + REPLY_MARK.length).trim(),
  };
}

function buildReplyText(explanation, cta = KOYOMI_CTA) {
  const parts = [];
  if (explanation) parts.push(explanation.trim());
  if (cta) parts.push(`📲 ${cta.label}\\n${cta.url}`);
  const text = parts.join('\\n\\n');
  return xTruncate(text, X_LIMIT);
}

function replyBudget(cta = KOYOMI_CTA) {
  const ctaCost = cta ? xLength(`📲 ${cta.label}\\n${cta.url}`) + 2 : 0;
  return X_LIMIT - ctaCost - 2;
}

function engagementRules(bodyLimit, replyLimit) {
  return `【Xで伸びる投稿の条件（最重要・厳守）】
タイムラインでは1投稿あたり0.5秒で読むか捨てるかが決まります。以下を必ず守ってください。
1. 1行目（フック）だけで指を止めさせる。数字・意外性・損失回避を使った具体的な一文にする。
2. 1投稿1テーマ。詰め込まない。
3. 箇条書きや記号（📝 ⭕ ❌ 💡 ⏳）を使い、パッと見で構造が伝わるようにする。
4. 改行で3〜5ブロックに分ける。改行のない塊は読まれない。
5. 最後は必ずリプライを誘う一文で締める（「正解はリプ欄👇」など）。
6. 絵文字は2〜4個まで。

【絶対に書いてはいけないもの】
- URL・リンク（システムが自動でリプライに付けます）
- ハッシュタグ（システムが付けます）
- 「いかがでしたか」「解説します」などブログ的な定型句

【出力フォーマット（この形式以外で返さない）】
${BODY_MARK}
（X本文。${bodyLimit}カウント以内。日本語なら約${Math.floor(bodyLimit / 2)}文字が上限）
${REPLY_MARK}
（本文にぶら下げるリプライの中身。正解と詳細解説・年表のポイント。${replyLimit}カウント以内＝日本語で約${Math.floor(replyLimit / 2)}文字。URL・ハッシュタグは書かない）`;
}

function buildHistoryPrompt(contentType, bodyLimit, replyLimit, variety) {
  const type = HISTORY_TYPES[contentType] || HISTORY_TYPES.japanese_center_qa;

  if (type.isQa) {
    return `大学入試センター試験・共通テスト相当の【${type.label}】の1問1答問題をX（旧Twitter）に投稿します。
ターゲット: 共通テスト・大学入試で日本史/世界史を受験する高校生・浪人生
テーマ・時代: ${variety}

【問題の要件（センター試験・共通テストレベルの良問）】
- 教科書の重要事項・正誤判定・因果関係・同時代把握に直結する良問を作成してください。
- 難易度: センター試験・共通テスト標準〜やや難（正答率40〜60%の差がつく問題）。

【本文の構成（厳守）】
1行目: フック（例:「【センター${type.label.includes('日本史') ? '日本史' : '世界史'}】9割が悩む正誤判定。あなたは解けますか？」「【共通テスト頻出】差がつく1問👇」）
2. 📝【問題文】（時代背景を簡潔に示し、下線部や設問を提示）
3. 選択肢: ① 〜  ② 〜 （※紛らわしく考えさせる2択。確実に教科書の根拠があるもの）
4. 締め: 「①と②どっちが正しい？理由をリプで教えてください👇（正解と年表・因果関係の解説はリプ欄へ）」

【リプライの構成（厳守）】
- 正解（「正解は①（または②）！」）
- なぜそれが正解か、もう一方がなぜ誤りかの詳細な解説（年号・背景・因果関係）
- 年表での位置づけや覚え方のポイント

${engagementRules(bodyLimit, replyLimit)}`;
  }

  return `${type.label}の学習コンテンツをX（旧Twitter）に投稿します。
ターゲット: 大学受験で日本史・世界史を使う高校生・浪人生
テーマ: ${variety}

【内容の要件】
- 高校の教科書・入試で扱われる範囲の定説だけを書く
- 年号・人名・出来事は確実なものだけ使う
- 用語の暗記ではなく「なぜそうなったか」の因果や流れが分かる内容にする
- クイズ形式にする場合、選択肢は①②の2択のみ。答えは本文に書かず、リプライ側に書く

${engagementRules(bodyLimit, replyLimit)}`;
}

async function generateBodyAndReply({ systemPrompt, buildPrompt, bodyLimit, replyLimit }) {
  let body = '';
  let explanation = '';

  for (let attempt = 0; attempt < 3; attempt++) {
    const limitForAttempt = attempt === 0 ? bodyLimit : Math.floor(bodyLimit * (attempt === 1 ? 0.85 : 0.7));
    const raw = await generateTextFull(systemPrompt, buildPrompt(limitForAttempt), {
      maxTokens: 1000,
      temperature: 1.0,
    });
    ({ body, explanation } = splitGenerated(raw));
    if (xLength(body) <= bodyLimit) break;
  }

  return {
    body: xTruncate(body, bodyLimit),
    explanation: xTruncate(explanation, replyLimit),
  };
}

// POST /api/koyomi/generate (SSE)
router.post('/generate', async (req, res) => {
  const { contentType = 'japanese_center_qa', prompt_only = false } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\\ndata: ${JSON.stringify(data)}\\n\\n`);
  };

  try {
    const postId = uuidv4();
    const type = HISTORY_TYPES[contentType] || HISTORY_TYPES.japanese_center_qa;
    const suffix = `\\n\\n${type.hashtags}`;
    const bodyLimit = X_LIMIT - xLength(suffix) - 4;
    const cta = KOYOMI_CTA;
    const replyLimit = replyBudget(cta);
    const variety = type.hints[Math.floor(Math.random() * type.hints.length)];

    const systemPrompt = 'あなたはSNSマーケティングと高校歴史教育の専門家です。事実の正確さを最優先しつつ、Xで圧倒的に伸びる書き方を熟知しています。';
    const buildPrompt = (limit) => buildHistoryPrompt(contentType, limit, replyLimit, variety);

    const promptInfo = [{
      label: `${type.label} 投稿生成プロンプト`,
      system: systemPrompt,
      user: buildPrompt(bodyLimit),
    }];

    const generated = await tryClaudeOrEmitPrompt(
      promptInfo,
      () => generateBodyAndReply({ systemPrompt, buildPrompt, bodyLimit, replyLimit }),
      sendEvent,
      prompt_only,
    );

    if (generated == null) {
      sendEvent('done', {});
      return;
    }

    const postText = `${generated.body}${suffix}`;
    const replyText = buildReplyText(generated.explanation, cta);

    db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
      postId, 'koyomi', postText,
      JSON.stringify({ contentType, type: 'koyomi', theme: variety, reply_text: replyText }),
      'draft',
    );

    sendEvent('final_post', { post_id: postId, post_text: postText, reply_text: replyText });
    sendEvent('done', {});
  } catch (err) {
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

// POST /api/koyomi/generate-batch (1週間分 一括量産 SSE)
router.post('/generate-batch', async (req, res) => {
  const { count = 7 } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\\ndata: ${JSON.stringify(data)}\\n\\n`);
  };

  try {
    const scheduleTemplate = [
      { type: 'japanese_center_qa', day: '月曜', title: '🇯🇵 日本史 センター1問1答' },
      { type: 'world_center_qa', day: '火曜', title: '🌍 世界史 センター1問1答' },
      { type: 'same_era_qa', day: '水曜', title: '🔄 同時代 センター1問1答' },
      { type: 'japanese_history', day: '木曜', title: '🇯🇵 日本史 重要因果解説' },
      { type: 'world_history', day: '金曜', title: '🌍 世界史 重要因果解説' },
      { type: 'mnemonic', day: '土曜', title: '💡 年号ゴロ合わせ' },
      { type: 'japanese_center_qa', day: '日曜', title: '🇯🇵 日本史 週末良問演習' },
    ];

    const targetList = scheduleTemplate.slice(0, count);
    const systemPrompt = 'あなたはSNSマーケティングと高校歴史教育の専門家です。事実の正確さを最優先しつつ、Xで圧倒的に伸びる書き方を熟知しています。';
    const cta = KOYOMI_CTA;
    const replyLimit = replyBudget(cta);
    const generatedPosts = [];

    for (let i = 0; i < targetList.length; i++) {
      const item = targetList[i];
      sendEvent('batch_progress', {
        current: i + 1,
        total: targetList.length,
        itemDay: item.day,
        itemTitle: item.title,
      });

      const postId = uuidv4();
      const type = HISTORY_TYPES[item.type] || HISTORY_TYPES.japanese_center_qa;
      const suffix = `\\n\\n${type.hashtags}`;
      const bodyLimit = X_LIMIT - xLength(suffix) - 4;
      const variety = type.hints[Math.floor(Math.random() * type.hints.length)];
      const buildPrompt = (limit) => buildHistoryPrompt(item.type, limit, replyLimit, variety);

      const generated = await generateBodyAndReply({ systemPrompt, buildPrompt, bodyLimit, replyLimit });
      const postText = `${generated.body}${suffix}`;
      const replyText = buildReplyText(generated.explanation, cta);

      const metadata = {
        contentType: item.type,
        type: 'koyomi',
        day: item.day,
        theme: item.title,
        reply_text: replyText,
      };

      db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
        postId, 'koyomi', postText, JSON.stringify(metadata), 'draft'
      );

      generatedPosts.push({
        post_id: postId,
        post_text: postText,
        reply_text: replyText,
        metadata,
        day: item.day,
        type: item.type,
        title: item.title,
      });
    }

    sendEvent('batch_complete', { posts: generatedPosts });
    sendEvent('done', {});
  } catch (err) {
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

// POST /api/koyomi/save-manual
router.post('/save-manual', (req, res) => {
  const { contentType = 'japanese_center_qa', body_text, reply_text } = req.body;
  if (!body_text?.trim()) return res.status(400).json({ error: 'body_text is required' });

  const type = HISTORY_TYPES[contentType] || HISTORY_TYPES.japanese_center_qa;
  const { body, explanation } = splitGenerated(body_text);
  const postId = uuidv4();
  const postText = `${body}\\n\\n${type.hashtags}`;
  const finalReplyText = buildReplyText(reply_text?.trim() || explanation, KOYOMI_CTA);

  db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
    postId, 'koyomi', postText,
    JSON.stringify({ contentType, type: 'koyomi', manual: true, reply_text: finalReplyText }),
    'draft',
  );
  res.json({ post_id: postId, post_text: postText, reply_text: finalReplyText });
});

// GET /api/koyomi/posts
router.get('/posts', (req, res) => {
  const posts = db.prepare(
    `SELECT * FROM sns_posts WHERE app_type = 'koyomi' OR (app_type = 'eiken' AND json_extract(metadata, '$.type') = 'koyomi') ORDER BY created_at DESC`
  ).all();
  res.json(posts.map(p => ({ ...p, metadata: JSON.parse(p.metadata || '{}') })));
});

// GET /api/koyomi/posts/:id
router.get('/posts/:id', (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ?`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json({ ...post, metadata: JSON.parse(post.metadata || '{}') });
});

// PUT /api/koyomi/posts/:id
router.put('/posts/:id', (req, res) => {
  const { post_text, reply_text } = req.body;
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ?`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const metadata = JSON.parse(post.metadata || '{}');
  if (reply_text !== undefined) metadata.reply_text = reply_text;

  db.prepare(`UPDATE sns_posts SET post_text = ?, metadata = ? WHERE id = ?`)
    .run(post_text ?? post.post_text, JSON.stringify(metadata), req.params.id);
  res.json({ success: true });
});

// POST /api/koyomi/posts/:id/publish
router.post('/posts/:id/publish', async (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ?`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const metadata = JSON.parse(post.metadata || '{}');
  const replyText = metadata.reply_text;

  if (xLength(post.post_text) > X_LIMIT) {
    return res.status(400).json({
      error: `本文が${xLength(post.post_text)}カウントで上限${X_LIMIT}を超えています。短くしてから投稿してください。`,
    });
  }

  let tweet;
  try {
    tweet = await postTweet(post.post_text);
  } catch (err) {
    db.prepare(`UPDATE sns_posts SET status = 'failed', error_message = ? WHERE id = ?`).run(err.message, post.id);
    return res.status(500).json({ error: err.message });
  }

  let replyId = null;
  let replyError = null;
  if (replyText?.trim()) {
    try {
      const reply = await postTweet(replyText, { replyToId: tweet.id });
      replyId = reply.id;
    } catch (err) {
      replyError = err.message;
    }
  }

  metadata.reply_tweet_id = replyId;
  metadata.reply_error = replyError;
  db.prepare(
    `UPDATE sns_posts SET status = 'posted', social_post_id = ?, social_posted_at = CURRENT_TIMESTAMP, metadata = ?, error_message = ? WHERE id = ?`
  ).run(tweet.id, JSON.stringify(metadata), replyError, post.id);

  res.json({ success: true, tweet_id: tweet.id, reply_tweet_id: replyId, reply_error: replyError });
});

// DELETE /api/koyomi/posts/:id
router.delete('/posts/:id', (req, res) => {
  db.prepare(`DELETE FROM sns_posts WHERE id = ?`).run(req.params.id);
  res.status(204).end();
});

export default router;
