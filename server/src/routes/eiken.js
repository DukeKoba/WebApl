import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { generateTextFull } from '../services/claudeService.js';
import { tryClaudeOrEmitPrompt } from '../services/claudeFallback.js';
import { postTweet } from '../services/xService.js';

const router = express.Router();

const QUESTION_TYPE_LABELS = {
  vocabulary: '語彙',
  grammar: '文法',
  reading: '読解',
  writing: 'ライティング',
  listening: 'リスニング',
  interview: '面接Tips',
  american_culture: 'アメリカ文化・独特表現',
  ai_tips: 'AI活用Tips',
  study_tips: '学習のコツ',
  listening_tips: 'リスニング上達・英語耳',
};

// Extra instructions per question type
const QUESTION_TYPE_EXTRA = {
  american_culture: `アメリカの文化・習慣・スラング・慣用句に由来する英語表現を1つ取り上げてください。
例：「It's not rocket science」「ballpark figure」「rain check」など日本人が知らない表現。
その表現の意味・由来・使い方を簡潔に紹介し、英検{level}レベルのリーダーが実際に使えるようにしてください。`,
  ai_tips: `英検{level}の学習にAI（ChatGPT・Claude・Geminiなど）を活用する具体的なTipsを1つ紹介してください。
例：「AIに英作文を添削してもらう方法」「音読練習でAIをリスニング相手にする」「語彙暗記にAIフラッシュカードを作らせる」など。
実際にすぐ使えるプロンプト例や活用手順を含め、英検{level}を目指す学習者が今日から実践できる内容にしてください。`,
  study_tips: `英検{level}合格に役立つ英語の「学習法・勉強のコツ」を1つ紹介してください。
これは語彙問題ではありません。単語リストや単語の意味紹介ではなく、「どう勉強すれば力がつくか」という学習メソッド・習慣・ルーティン・モチベーション維持法を扱ってください。
テーマ例：スキマ時間の活用法／音読・シャドーイング手順／過去問の復習サイクル／ノートの取り方／スランプ脱出法／モチベ維持法／スケジュール管理／学習環境づくり／記憶の定着メカニズム。
「〇〇を毎日△分やる」「□□の順で解く」など、今日から真似できる手順やコツを中心に書いてください。例文や単語を紹介する投稿にはしないでください。`,
  listening_tips: `英検{level}リスニングを突破するための「英語耳の作り方」を1つ紹介してください。
例：「シャドーイングの正しいやり方」「ディクテーションで音を認識する練習法」「英語を英語のまま理解する脳の作り方」「公式過去問音声の活用法」など。
今日から実践できる具体的なステップや、英検{level}のリスニングセクションに直結する練習素材・フレーズ例を必ず含めてください。`,
};

// Randomized angle / theme hints — vocabulary & grammar are level-keyed, others are shared
const VARIETY_HINTS = {
  vocabulary: {
    pre1: [
      'TOEIC・学術論文頻出の動詞を1語（allocate/discrepancy相当レベル）',
      'ビジネス英語で使われる名詞を1語（準1級レベル）',
      '日本人が混同しやすい高度な多義語を1語',
      '準1級頻出の形容詞・副詞を1語',
      '語根から派生語を推測できる単語を1語（準1級レベル）',
    ],
    '2': [
      '大学入試・定期テスト頻出の動詞を1語',
      '英検頻出の形容詞・副詞を1語',
      '意味を取り違えやすい多義語を1語',
      'カタカナ語と意味がズレる英単語を1語',
      '似た意味で使い分けが必要な単語ペアから1語',
      'コロケーションで覚えると強い名詞を1語',
    ],
    pre2: [
      '高校入試で出る基本動詞を1語（environment/experience相当レベル）',
      '日常会話でよく使う名詞を1語（準2級レベル）',
      '準2級頻出の形容詞を1語',
      '日本語訳と意味がズレる基本単語を1語',
    ],
    pre2plus: [
      '高校英語〜大学受験入門レベルの動詞を1語（acquire/propose相当）',
      '準2級より一歩進んだ形容詞・副詞を1語',
      '日常会話・ニュースで使われる名詞を1語（準2級プラスレベル）',
      'カタカナ語と意味がズレる中上級単語を1語',
      '2級に向けて強化すべき多義語を1語',
    ],
    '3': [
      '中学英語の基本動詞を1語（enjoy/practiceレベル）',
      '感情・状態を表す形容詞を1語（excited/boredなど）',
      '3級頻出の名詞を1語',
      '日常生活でよく使う動詞を1語（中学レベル）',
    ],
    '4': [
      '食べ物・動物・色など身近な名詞を1語（4級レベル）',
      '基本的な動作動詞を1語（run/jump/eatなど）',
      '反対語ペアの基本単語を1語',
      '学校生活で使う英単語を1語（4級レベル）',
    ],
    '5': [
      '挨拶・あいさつで使う超基本英語を1語',
      '数字・色・形の英単語を1語',
      '家族の呼び方・身の回りの物を1語（5級レベル）',
      '動物の英語名を1語（超基礎・5級レベル）',
    ],
  },
  grammar: {
    pre1: [
      '倒置・強調構文のポイント',
      '仮定法過去完了のポイント',
      '複合関係詞・関係副詞のポイント',
      '名詞構文・無生物主語の上級パターン',
      '分詞構文の慣用表現',
    ],
    '2': [
      '時制・完了形に関するポイント',
      '関係詞・関係代名詞のポイント',
      '仮定法のポイント',
      '分詞・分詞構文のポイント',
      '助動詞の使い分けのポイント',
      '前置詞の使い分けのポイント',
      '受動態・無生物主語のポイント',
    ],
    pre2: [
      '不定詞と動名詞の使い分けのポイント',
      '受動態の基本パターン',
      '比較表現のポイント',
      '接続詞の使い方（because/when/ifなど）',
      '関係代名詞の基本（who/whichなど）',
    ],
    pre2plus: [
      '仮定法の入門（If I were〜）',
      '分詞の基本用法（現在分詞・過去分詞）',
      '間接疑問文のポイント',
      '関係代名詞の応用（that/which/whoの使い分け）',
      '助動詞の使い分け（should/must/may）',
    ],
    '3': [
      '現在完了形の使い方（have＋過去分詞）',
      '疑問文・否定文の作り方',
      '過去形の規則・不規則変化',
      '不定詞の基本用法（to＋動詞）',
      'There is/are 構文のポイント',
    ],
    '4': [
      'be動詞（am/is/are）の使い方',
      '一般動詞の現在形と過去形',
      'can/cannotの使い方',
      'What/Who/Whereで始まる疑問文',
      'have/hasの使い方',
    ],
    '5': [
      'am/is/areの使い方',
      '「I like〜 / I have〜」など基本文型',
      'Yes/No疑問文の答え方',
      '「This is〜 / That is〜」の使い方',
    ],
  },
  reading: [
    '長文のパラグラフリーディングのコツ',
    '指示語・代名詞を素早く特定するコツ',
    '選択肢の言い換え（パラフレーズ）を見抜くコツ',
    '筆者の主張と具体例を見分けるコツ',
    '時間配分・設問先読みのコツ',
  ],
  writing: [
    '意見文のテンプレート型構成',
    '理由2つ型の展開パターン',
    'つなぎ言葉・ディスコースマーカーの使い方',
    '語数を稼ぎつつ減点されないコツ',
    '主張→理由→具体例→結論の流れ',
  ],
  listening: [
    'ディクテーションの進め方',
    'シャドーイングのやり方',
    '会話問題の先読みのコツ',
    '数字・時刻・固定表現の聞き取りのコツ',
    '連結・脱落・同化など音の変化',
  ],
  interview: [
    '入室・挨拶でのマナーとコツ',
    'パッセージ音読のコツ',
    'イラスト描写問題のコツ',
    '意見を述べる問題の答え方',
    '聞き返し・言い換えのテクニック',
  ],
  american_culture: [
    '天気・季節に関する慣用句',
    'ビジネスで使われるスラング',
    'スポーツ由来のイディオム',
    '食べ物にまつわる表現',
    '日常会話でよく出る縮約・スラング',
  ],
  ai_tips: [
    '英作文添削プロンプト',
    '音読・スピーキング練習相手としての使い方',
    '単語暗記のフラッシュカード生成',
    'リスニング用スクリプト生成',
    '過去問の解説を深掘りさせる使い方',
    '弱点分析とカリキュラム作成',
  ],
  study_tips: [
    'スキマ時間の活用法（通学・休み時間）',
    '過去問の復習サイクル（間違いノート運用）',
    'モチベーション維持・習慣化のコツ',
    '音読・シャドーイングのルーティン化',
    '睡眠と記憶定着を意識した学習スケジュール',
    'スランプから抜け出すメンタル管理法',
    '学習環境・集中力を高める工夫',
    '1日のタイムブロッキング勉強法',
  ],
};

function pickVariety(questionType, level) {
  const hints = VARIETY_HINTS[questionType];
  if (!hints) return '';
  const list = Array.isArray(hints) ? hints : (hints[level] || hints['2'] || []);
  if (list.length === 0) return '';
  return list[Math.floor(Math.random() * list.length)];
}

const LEVEL_CONFIG = {
  pre1: {
    label: '準1級',
    target: '大学生・社会人（TOEIC600点相当、上級英語力を目指す学習者）',
    hook: '準1級合格で英語力を証明したいという向上心に響く冒頭フック',
    hashtags: '#英検準1級 #英語学習 #TOEIC',
    difficulty: 'TOEIC700点・大学上位レベル。allocate/discrepancy/paradigm相当のアカデミック語彙、倒置・強調構文・仮定法過去完了、抽象度の高い論説文を扱う。',
  },
  '2': {
    label: '2級',
    target: '高校生（推薦・一般入試で英検2級を目指している学生）',
    hook: '高校生が「推薦のために英検2級を取りたい」という動機に響く冒頭フック',
    hashtags: '#英検2級 #英語学習 #大学受験',
    difficulty: '高校英語・大学受験レベル。acquire/inevitable/propose相当の語彙、関係詞・仮定法・分詞構文、社会的テーマの長文を扱う。',
  },
  pre2: {
    label: '準2級',
    target: '中高生（高校入試や英語の基礎固めを目指す学習者）',
    hook: '準2級で英語に自信をつけたい中高生に響く冒頭フック',
    hashtags: '#英検準2級 #英語学習 #高校受験',
    difficulty: '中学〜高校初級レベル。environment/experience/promise相当の語彙、不定詞・受動態・比較、日常的な話題を扱う。難しすぎる表現は使わない。',
  },
  pre2plus: {
    label: '準2級プラス',
    target: '高校生（準2級合格後、2級を目指してステップアップしたい学習者）',
    hook: '準2級合格後に2級へ向けてレベルアップしたい高校生に響く冒頭フック',
    hashtags: '#英検準2級プラス #英語学習 #高校受験',
    difficulty: '高校初〜中級レベル（準2級と2級の中間）。acquire/propose相当の語彙、仮定法入門・分詞・間接疑問、やや抽象的なテーマも扱う。2級ほど難しくしない。',
  },
  '3': {
    label: '3級',
    target: '中学生（英検3級取得を目指す学習者）',
    hook: '中学生が英検3級に挑戦する動機に響く冒頭フック',
    hashtags: '#英検3級 #英語学習 #中学英語',
    difficulty: '中学英語レベル。enjoy/practice/excited相当の基本語彙、現在完了・不定詞・接続詞、短くわかりやすい文を使う。仮定法や分詞構文は使わない。',
  },
  '4': {
    label: '4級',
    target: '小中学生（英検4級を目指す学習者）',
    hook: '英語の基礎を楽しく学びたい小中学生に響く冒頭フック',
    hashtags: '#英検4級 #英語学習 #小学英語',
    difficulty: '小〜中学初級レベル。food/sport/family相当の日常語彙、be動詞・一般動詞・過去形・can、例文は10語以内のシンプルな文のみ。現在完了・仮定法は使わない。',
  },
  '5': {
    label: '5級',
    target: '小学生・英語初心者（英検5級にチャレンジする学習者）',
    hook: '英語を初めて学ぶ子どもや保護者に響く冒頭フック',
    hashtags: '#英検5級 #英語学習 #英語初心者',
    difficulty: '超基礎レベル。hello/cat/red/Monday/school相当の最も基本的な語彙のみ。be動詞と簡単な一般動詞のみ使用、例文は5〜7語以内、難しい文法は一切使わない。',
  },
};

const EXAM_DATES = {
  '2': new Date('2026-05-31'),
};

function getDaysUntilExam(level) {
  const examDate = EXAM_DATES[level];
  if (!examDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

const CTA_LINKS = {
  pre1: { url: 'https://apps.apple.com/jp/app/id6762535365', label: '英検準１級Pass' },
  '2':  { url: 'https://apps.apple.com/jp/app/id6761838561', label: '英検２級Pass' },
  pre2: { url: 'https://apps.apple.com/jp/app/id6762229086', label: '英検準２級Pass' },
  pre2plus: { url: 'https://apps.apple.com/jp/app/id6762537264', label: '英検準２級プラスPass' },
};

function buildCtaText(level) {
  const cta = CTA_LINKS[level];
  if (!cta) return null;
  return `📲 ${cta.label} → ${cta.url}`;
}

// X counts every URL as exactly 23 chars regardless of length
function calcXCharCount(text) {
  const urlRegex = /https?:\/\/\S+/g;
  return text.replace(urlRegex, 'x'.repeat(23)).length;
}

// Build the fixed suffix (CTA + hashtags) and return it with its X char cost
function buildSuffix(lv, level) {
  const ctaText = buildCtaText(level);
  const suffix = ctaText ? `\n${ctaText}\n${lv.hashtags}` : `\n${lv.hashtags}`;
  return { suffix, cost: calcXCharCount(suffix) };
}

// Build the fixed prefix (exam countdown) and return it with its X char cost
function buildPrefix(level) {
  const daysUntil = getDaysUntilExam(level);
  if (daysUntil === null) return { prefix: '', cost: 0 };
  const prefix = `📅 1次試験まであと${daysUntil}日！\n`;
  return { prefix, cost: prefix.length };
}

function buildEikenPrompt(questionType, level, bodyLimit, variety = '') {
  const typeLabel = QUESTION_TYPE_LABELS[questionType] || questionType;
  const lv = LEVEL_CONFIG[level] || LEVEL_CONFIG['2'];
  const extra = (QUESTION_TYPE_EXTRA[questionType] || '').replaceAll('{level}', lv.label);
  const varietyLine = variety ? `- 今回のテーマ・切り口：「${variety}」で書いてください（毎回違う内容にするため）` : '';

  return `英検${lv.label}の学習コンテンツの本文部分のみを書いてください。ターゲット: **${lv.target}**
問題タイプ: ${typeLabel}

【役割】
あなたはSNSマーケティングと英語教育の専門家です。
以下の本文のみを出力してください。受験日・URL・ハッシュタグはシステムが自動付与するので含めないでください。

【難易度・使用語彙の厳守事項】
${lv.difficulty}
上記レベルを必ず守り、それより難しい語彙・文法を使わないこと。

【本文の要件】
- ${lv.hook}
${extra ? `- ${extra}` : `- 英検${lv.label}の${typeLabel}に関するTipsまたは例文を1つだけ`}
${varietyLine}
- クイズ形式なら選択肢は①②の2択のみ
- 絵文字は1〜2個まで
- **本文は${bodyLimit}文字以内**（厳守）

【出力形式】
本文テキストのみ。URL・ハッシュタグ・受験日カウントダウン・前置き・説明文は一切含めないこと。`;
}

// GET /api/eiken/exam-info
router.get('/exam-info', (req, res) => {
  const info = {};
  for (const [level, date] of Object.entries(EXAM_DATES)) {
    const days = getDaysUntilExam(level);
    info[level] = { examDate: date.toISOString().slice(0, 10), daysUntil: days };
  }
  res.json(info);
});

// POST /api/eiken/generate - Direct single-call generation (SSE)
router.post('/generate', async (req, res) => {
  const { questionType = 'vocabulary', level = '2', prompt_only = false } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const postId = uuidv4();
    const lv = LEVEL_CONFIG[level] || LEVEL_CONFIG['2'];
    const { prefix } = buildPrefix(level);
    const { suffix, cost: suffixCost } = buildSuffix(lv, level);
    const prefixCost = prefix.length;
    const bodyLimit = 280 - prefixCost - suffixCost - 2; // 2 for safety margin

    const systemPrompt = 'あなたはSNSマーケティングと英語教育の専門家です。';
    const variety = pickVariety(questionType, level);
    const userPrompt = buildEikenPrompt(questionType, level, bodyLimit, variety);

    const promptInfo = [{
      label: `英検${lv.label} ${questionType} 投稿生成プロンプト`,
      system: systemPrompt,
      user: `${userPrompt}\n\n【出力形式】\n本文のみを出力してください（前後の固定文 "${prefix}" と "${suffix}" はシステム側で付与します）。本文は ${bodyLimit} 文字以内厳守。`,
    }];

    const generated = await tryClaudeOrEmitPrompt(
      promptInfo,
      async () => {
        let body = '';
        for (let attempt = 0; attempt < 3; attempt++) {
          const limitForAttempt = attempt === 0 ? bodyLimit : Math.floor(bodyLimit * 0.85);
          const prompt = buildEikenPrompt(questionType, level, limitForAttempt, variety);
          body = (await generateTextFull(systemPrompt, prompt, { maxTokens: 400, temperature: 1.0 })).trim();
          if (body.length <= bodyLimit) break;
        }
        if (body.length > bodyLimit) body = body.slice(0, bodyLimit).trimEnd();
        return body;
      },
      sendEvent,
      prompt_only,
    );

    if (generated == null) {
      sendEvent('done', {});
      return;
    }

    const postText = `${prefix}${generated}${suffix}`;

    db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
      postId, 'eiken', postText, JSON.stringify({ questionType, level }), 'draft'
    );

    sendEvent('final_post', { post_id: postId, post_text: postText });
    sendEvent('done', {});
  } catch (err) {
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

// POST /api/eiken/save-manual - Save manually-generated post text
router.post('/save-manual', (req, res) => {
  const { questionType, level = '2', body_text } = req.body;
  if (!body_text?.trim()) return res.status(400).json({ error: 'body_text is required' });
  const lv = LEVEL_CONFIG[level] || LEVEL_CONFIG['2'];
  const { prefix } = buildPrefix(level);
  const { suffix } = buildSuffix(lv, level);
  const postId = uuidv4();
  const postText = `${prefix}${body_text.trim()}${suffix}`;
  db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
    postId, 'eiken', postText, JSON.stringify({ questionType, level, manual: true }), 'draft'
  );
  res.json({ post_id: postId, post_text: postText });
});

// POST /api/eiken/generate-script - TikTok/Reels script generation
router.post('/generate-script', async (req, res) => {
  const { questionType = 'vocabulary', level = '2' } = req.body;
  const lv = LEVEL_CONFIG[level] || LEVEL_CONFIG['2'];
  const typeLabel = QUESTION_TYPE_LABELS[questionType] || questionType;

  const daysUntilScript = getDaysUntilExam(level);
  const examHook = daysUntilScript !== null
    ? `\n- フック冒頭で「1次試験まであと${daysUntilScript}日！」を必ず入れる` : '';
  const cta = CTA_LINKS[level];
  const ctaLabel = cta ? cta.label : 'AI英検Pass';
  const ctaUrl = cta ? cta.url : '';

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
画面テキスト: 「${ctaLabel}でもっと練習！」${ctaUrl ? `\nURL（キャプションに記載）: ${ctaUrl}` : ''}
ナレーション: （アプリへ誘導する言葉）

【要件】
- ${lv.target}が最初の3秒で止まりたくなるフック${examHook}
- 実際の英検${lv.label}レベルのサンプル問題を使う（難易度: ${lv.difficulty}）
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
