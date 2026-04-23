import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { generateTextFull } from '../services/claudeService.js';
import { postTweet } from '../services/xService.js';

const router = express.Router();

// 試験範囲3分野 × 講師監修テーマ + マーケ起点フォーマット
export const CONTENT_TYPE_LABELS = {
  strategy: 'ストラテジ系（経営戦略・法務）',
  management: 'マネジメント系（プロマネ・サービス）',
  tech_basics: 'テクノロジ系・基礎理論（2進数・論理）',
  tech_computer: 'テクノロジ系・コンピュータ構成',
  network: 'ネットワーク',
  database: 'データベース',
  security: 'セキュリティ',
  mnemonic: '覚え方・ゴロ合わせ',
  past_question: '過去問チラ見せ（クイズ）',
  study_tips: '勉強法・合格戦略',
  ai_utilize: 'AI×ITパスポート学習法',
  news_law: '最新ITニュース・法改正',
};

// 講師監修：分野ごとの「シラバス頻出テーマ」を毎回ランダムに固定して内容のブレを抑える
const VARIETY_HINTS = {
  strategy: [
    'SWOT分析の使い方', '4P/4C（マーケティングミックス）', 'PPM（プロダクトポートフォリオマネジメント）',
    '3C分析', 'バリューチェーン分析', 'CSF・KGI・KPIの違い',
    'ベンチマーキング', 'コアコンピタンス', 'ファイブフォース分析',
    '個人情報保護法のポイント', '不正競争防止法・営業秘密の3要件',
    '労働者派遣法と請負契約の違い', '著作権法（プログラム/データベース）',
  ],
  management: [
    'WBS（作業分解構造）', 'ガントチャートとアローダイアグラム',
    'PERT図とクリティカルパスの求め方', 'ファンクションポイント法',
    'EVM（Earned Value Management）', 'リスクマネジメント（回避・転嫁・軽減・受容）',
    'ITILのサービスマネジメントプロセス', 'SLA・SLO・SLM',
    'インシデント管理と問題管理の違い', 'システム監査の独立性',
  ],
  tech_basics: [
    '10進数 ⇄ 2進数 ⇄ 16進数の変換', '論理演算（AND・OR・XOR・NOT）',
    'ビットとバイトの単位（KB・MB・GB・TB）', '補数表現（2の補数）',
    '集合とベン図', '確率・順列・組合せ', '誤差（丸め誤差・桁落ち）',
    '文字コード（ASCII・Unicode・UTF-8）',
  ],
  tech_computer: [
    'CPUの動作原理（クロック・コア・キャッシュ）', '主記憶と補助記憶の階層',
    'RAID 0/1/5/6 の違い', 'OSの役割（プロセス管理・メモリ管理）',
    'ファイルシステムとディレクトリ', '仮想化（ハイパーバイザ・コンテナ）',
    '入出力インタフェース（USB・HDMI・Bluetooth）', 'IoTデバイス・組込みシステム',
  ],
  network: [
    'OSI参照モデル7階層', 'TCPとUDPの違い',
    'IPアドレス（IPv4/IPv6・サブネット）', 'DNS・DHCP・NATの役割',
    'HTTPとHTTPSの違い・SSL/TLS', '無線LAN規格（Wi-Fi 5/6/6E）',
    'プロキシ・ファイアウォール・VPN', 'ポート番号（80/443/22/25）',
  ],
  database: [
    '関係データベースの正規化（第1〜第3）', '主キー・外部キー・参照整合性',
    'SELECT文の基本（WHERE・GROUP BY・JOIN）', 'インデックスの仕組みと注意点',
    'トランザクション（ACID特性）', '排他制御（共有ロック・専有ロック）',
    'NoSQL（キーバリュー・ドキュメント）', 'データウェアハウス・データマート',
  ],
  security: [
    'SQLインジェクションの原理と対策', 'XSS（クロスサイトスクリプティング）',
    'CSRFの仕組み', '共通鍵暗号と公開鍵暗号の違い',
    'デジタル署名と認証局（CA）', '多要素認証（MFA）',
    'ランサムウェア対策', 'ソーシャルエンジニアリング',
    'ゼロトラスト・最小権限の原則', 'CVSSと脆弱性評価',
  ],
  mnemonic: [
    'SWOT「強み・弱み・機会・脅威」の覚え方', '4P「製品・価格・流通・販促」のゴロ',
    'PPM4象限「金のなる木・花形・問題児・負け犬」', 'OSI7階層のゴロ合わせ',
    'RAID0/1/5の違いを一発で覚えるコツ', 'ACID特性のゴロ',
    '基本処理3要素（順次・選択・反復）の覚え方', 'PDCAサイクルとOODAの違いの覚え方',
  ],
  past_question: [
    'ストラテジ系の頻出4択問題を1問', 'マネジメント系の頻出4択問題を1問',
    'テクノロジ系・基礎理論の計算問題を1問', 'セキュリティ分野の頻出4択問題を1問',
    'ネットワーク分野の頻出4択問題を1問', 'データベース分野の頻出4択問題を1問',
    '法務分野（個人情報保護・著作権）の4択問題を1問',
  ],
  study_tips: [
    '60%合格ラインを意識した分野別の勉強配分', 'CBT方式の特徴と当日の流れ',
    '過去問道場の使い方とサイクル', '直前1週間の総まとめ計画',
    '社会人がスキマ時間で1日30分続けるコツ', '文系がテクノロジ系を捨てずに乗り切る戦略',
    '計算問題に時間を取られないコツ', '苦手分野の優先順位付け（学習効率順）',
  ],
  ai_utilize: [
    'ChatGPTにIT用語を「中学生レベル」で説明させるプロンプト',
    'Claudeで過去問の解説を深掘りさせる使い方',
    'AIに自分の弱点分野からカリキュラムを作らせる',
    'AIで模擬試験4択問題を量産する方法',
    'AIに「ゴロ合わせ」を作らせて暗記を加速',
    '画像生成AIで覚えにくい概念を図解化',
  ],
  news_law: [
    '最近のサイバー攻撃事例（ランサムウェア等）',
    '個人情報保護法・改正のポイント',
    '生成AI関連の規制動向（EU AI Act等）',
    'マイナンバー制度の最新動向',
    'クラウドセキュリティの最新トピック',
    'DX推進・経済産業省のレポート要点',
  ],
};

function pickVariety(contentType) {
  const list = VARIETY_HINTS[contentType];
  if (!list || list.length === 0) return '';
  return list[Math.floor(Math.random() * list.length)];
}

// 試験日カウントダウン（受験者が「自分はいつ受けるか」を意識して保存・リピートしやすくする狙い）
// CBT方式で随時受験のため空欄も許容、設定された場合は冒頭にカウントダウンを差し込む
const EXAM_DATE_ENV = process.env.ITPASS_EXAM_DATE; // YYYY-MM-DD
function getDaysUntilExam() {
  if (!EXAM_DATE_ENV) return null;
  const examDate = new Date(EXAM_DATE_ENV);
  if (isNaN(examDate.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

// マーケのプロ提案：CTAは「続きはアプリで」型で1動作完結のフリクションを減らす
const CTA_URL = process.env.ITPASS_APP_URL || 'https://www.ipa.go.jp/shiken/kubun/ip.html';
const CTA_TEXT = `📲 続きはITパスポート対策アプリで → ${CTA_URL}`;
const HASHTAGS = '#ITパスポート #IT資格 #ITパスポート試験';

// X counts every URL as exactly 23 chars regardless of length
function calcXCharCount(text) {
  const urlRegex = /https?:\/\/\S+/g;
  return text.replace(urlRegex, 'x'.repeat(23)).length;
}

function buildSuffix() {
  const suffix = `\n${CTA_TEXT}\n${HASHTAGS}`;
  return { suffix, cost: calcXCharCount(suffix) };
}

function buildPrefix() {
  const days = getDaysUntilExam();
  if (days === null) return { prefix: '', cost: 0 };
  const prefix = `📅 試験日まであと${days}日！\n`;
  return { prefix, cost: prefix.length };
}

function buildItPassPrompt(contentType, bodyLimit, variety = '') {
  const label = CONTENT_TYPE_LABELS[contentType] || contentType;
  const varietyLine = variety ? `- 今回のテーマ・切り口：「${variety}」で書いてください（毎回違う内容にするため）` : '';

  // コンテンツタイプ別の出力ガイドライン（IT資格講師チームが監修）
  const formatHints = {
    past_question: `- クイズ形式：問題文＋4択（①〜④）＋「答えはリプ欄／アプリで！」と引っ張る`,
    mnemonic: `- ゴロ合わせ・語呂・覚え方を1つ。なぜそう覚えるか1行解説をつける`,
    study_tips: `- 「今日からできる行動」を1つだけ具体的に`,
    ai_utilize: `- すぐコピペできるプロンプト例を1つ含める（鍵カッコで囲む）`,
    news_law: `- 用語解説 + 試験ではどう問われるかを必ず1行入れる`,
  };
  const formatHint = formatHints[contentType] || `- 「これ知ってる？」と問いかけて1テーマを30秒で読める分量にまとめる`;

  return `ITパスポート試験の学習コンテンツの本文部分のみを書いてください。
ターゲット: **文系大学生・新入社員・非エンジニアの社会人で、ITパスポート合格を目指す層**
コンテンツタイプ: ${label}

【役割】
あなたはSNSマーケティングとIT資格教育の専門家です。
以下の本文のみを出力してください。試験日カウントダウン・URL・ハッシュタグはシステムが自動付与するので含めないでください。

【本文の要件】
- 1行目で「指止め」できるフックを必ず作る（数字・問いかけ・意外性のある事実）
${formatHint}
${varietyLine}
- ITパスポート試験のシラバスに準拠した正確な内容
- 専門用語は1〜2語までに抑え、必ず噛み砕いた説明を添える
- 絵文字は1〜3個まで（多すぎ厳禁）
- **本文は${bodyLimit}文字以内**（厳守、超えたら強制カットされます）

【出力形式】
本文テキストのみ。URL・ハッシュタグ・試験日カウントダウン・前置き・説明文は一切含めないこと。`;
}

// GET /api/itpass/exam-info
router.get('/exam-info', (req, res) => {
  const days = getDaysUntilExam();
  res.json({
    examDate: EXAM_DATE_ENV || null,
    daysUntil: days,
  });
});

// POST /api/itpass/generate - SSE single-call generation
router.post('/generate', async (req, res) => {
  const { contentType = 'past_question' } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const postId = uuidv4();
    const { prefix } = buildPrefix();
    const { suffix, cost: suffixCost } = buildSuffix();
    const prefixCost = prefix.length;
    const bodyLimit = 280 - prefixCost - suffixCost - 2; // 安全マージン

    const systemPrompt = 'あなたはSNSマーケティングとIT資格教育（ITパスポート・基本情報・応用情報）の両方に精通したプロです。受験者がアプリをダウンロードしたくなる、保存・シェアされる投稿を作成します。';
    const variety = pickVariety(contentType);

    let body = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      const limitForAttempt = attempt === 0 ? bodyLimit : Math.floor(bodyLimit * 0.85);
      const prompt = buildItPassPrompt(contentType, limitForAttempt, variety);
      body = (await generateTextFull(systemPrompt, prompt, { maxTokens: 500, temperature: 1.0 })).trim();
      if (body.length <= bodyLimit) break;
    }
    if (body.length > bodyLimit) body = body.slice(0, bodyLimit).trimEnd();

    const postText = `${prefix}${body}${suffix}`;

    db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
      postId, 'itpass', postText, JSON.stringify({ contentType }), 'draft'
    );

    sendEvent('final_post', { post_id: postId, post_text: postText });
    sendEvent('done', {});
  } catch (err) {
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

// GET /api/itpass/posts
router.get('/posts', (req, res) => {
  const posts = db.prepare(
    `SELECT * FROM sns_posts WHERE app_type = 'itpass' ORDER BY created_at DESC`
  ).all();
  res.json(posts.map(p => ({ ...p, metadata: JSON.parse(p.metadata || '{}') })));
});

// GET /api/itpass/posts/:id
router.get('/posts/:id', (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'itpass'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json({ ...post, metadata: JSON.parse(post.metadata || '{}') });
});

// PUT /api/itpass/posts/:id
router.put('/posts/:id', (req, res) => {
  const { post_text } = req.body;
  db.prepare(`UPDATE sns_posts SET post_text = ? WHERE id = ? AND app_type = 'itpass'`).run(post_text, req.params.id);
  res.json({ success: true });
});

// POST /api/itpass/posts/:id/publish
router.post('/posts/:id/publish', async (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'itpass'`).get(req.params.id);
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

// DELETE /api/itpass/posts/:id
router.delete('/posts/:id', (req, res) => {
  db.prepare(`DELETE FROM sns_posts WHERE id = ? AND app_type = 'itpass'`).run(req.params.id);
  res.status(204).end();
});

export default router;
