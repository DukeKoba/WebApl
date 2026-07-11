import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { generateTextFull } from '../services/claudeService.js';
import { tryClaudeOrEmitPrompt, isClaudeCreditError } from '../services/claudeFallback.js';
import { postTweet } from '../services/xService.js';
import { orchestrateEikenPost, parseEikenPostJson, parseEikenMarkedText } from '../services/agentOrchestrator.js';

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
    '設問先読み→固有名詞・数字だけマークしてから本文に入る手順',
    'スラッシュリーディング（意味のかたまりで区切って読む）の練習手順',
    'パラグラフの1文目だけ拾って全体像をつかむスキミングの手順',
    '選択肢の言い換え（パラフレーズ）の定番パターンと見抜き方',
    'However/Therefore など逆接・結論マーカーの直後に答えが集まる理由',
    '内容不一致（NOT）問題を消去法で解く手順',
    '長文の時間配分と「捨て問」を決める基準',
    '代名詞 it/they が指すものを直前の文から3秒で特定する方法',
    'タイトルと最終段落を先に読む「サンドイッチ読み」',
    '空所補充問題は空所の前後1文だけで解ける場合が多い理由',
  ],
  writing: [
    '「主張→理由2つ→結論」テンプレートの実際の書き出し英文',
    'どんなお題にも使い回せる万能理由（health / money / time / environment）の当てはめ方',
    'First / Second / For these reasons などディスコースマーカーの正しい配置',
    '語数が足りない時に減点されずに増やす方法（理由に具体例を1文足す）',
    '減点されやすいミスTOP3（三単現・冠詞・時制）のセルフチェック手順',
    '賛成・反対は「本心」ではなく「理由を英語で書きやすい方」を選ぶ判断基準',
    'そのまま使える意見文の定型表現（I believe that 〜 / It is important to 〜）',
    '本番の時間配分（構想→執筆→見直しの分数配分）',
    'お題の単語をそのまま使い回して主題文を作る時短テク',
  ],
  listening: [
    '音声が流れる前の10秒で選択肢の動詞だけ先読みする手順',
    '数字・曜日・時刻のメモの取り方（算用数字＋記号で書く）',
    'gonna / wanna / gotta など縮約形の聞き取り方と元の形',
    '連結（リエゾン）の具体例（an apple / check it out）と聞こえ方',
    '会話問題は最後の発言に答えが集中する理由と狙い方',
    '1問聞き逃した時に引きずらず切り替えるルール',
    'ディクテーションの正しい手順（1文再生→書く→答え合わせ→音読）',
    '同じ音声を「字幕なし→スクリプト確認→もう1回」で聞く3回法',
  ],
  interview: [
    '沈黙を作らないつなぎ表現（Well… / Let me see…）の使いどころ',
    '質問が聞き取れなかった時の聞き返しフレーズ（Could you say that again?）',
    '意見問題は「結論1文＋理由1文」の2文で答える型',
    'アティチュード（態度点）で満点を取るための具体行動（アイコンタクト・声量・返事）',
    'パッセージ音読は3語ずつ区切る・カンマで必ず一拍置く',
    'イラスト問題を現在進行形で左から順に描写する手順',
    '入室から着席までの英語のやりとりの実際の流れ',
    '答えに詰まったら In my case… で自分の経験に引き寄せる技',
  ],
  american_culture: [
    '天気・季節に関する慣用句',
    'ビジネスで使われるスラング',
    'スポーツ由来のイディオム',
    '食べ物にまつわる表現',
    '日常会話でよく出る縮約・スラング',
    '数字を使ったイディオム（24/7 / first thing など）',
    'アメリカの学校生活のリアル表現（pop quiz / hall pass など）',
    '映画・ドラマ頻出の相づち・リアクション表現',
    '直訳すると失礼になる日本人がやりがちな英語表現',
  ],
  ai_tips: [
    '英作文を採点基準付きで添削させるプロンプトの実例',
    'AIを英検の面接官にするロールプレイプロンプトの実例',
    '苦手単語10個から4択クイズを作らせるプロンプトの実例',
    '「なぜ他の選択肢が間違いか」まで説明させる過去問深掘りの質問例',
    '1週間の学習計画表をAIに作らせる時に渡すべき情報3つ',
    'リスニング用スクリプトを生成して読み上げ機能で練習する手順',
    '自分の英作文に「より自然な言い回しを3つ」出させるプロンプト',
    '長文を「1文ずつ日本語訳＋文法解説」に分解させる使い方',
  ],
  study_tips: [
    '忘却曲線に基づく復習タイミング（当日→翌日→1週間後の3回）',
    '過去問1回分を3周する方法（1周目解く→2周目精読→3周目音読）',
    '単語は「見て1秒で意味が言える」まで高速周回する方法（1周を薄く速く）',
    'ポモドーロ法（25分集中＋5分休憩）を英語学習に当てはめた実例',
    '寝る前10分の単語インプット→翌朝セルフテストで定着させる手順',
    '間違いノートの作り方（間違えた理由を1行で書き添える）',
    '週1回のセルフ模試で本番の時間感覚を作る方法',
    '同じ長文を音読30回すると読速が上がる理由と実施手順',
    'スランプ時は「解ける問題だけやる日」を作って再起動する方法',
    '通学15分でできるリスニング学習の具体メニュー',
    '勉強開始のハードルを下げる「2分ルール」（最初の1問だけ解く）',
  ],
  listening_tips: [
    'シャドーイングの4段階（聞く→スクリプト精読→オーバーラッピング→シャドーイング）',
    'ディクテーションで「聞こえない音」を特定して潰す手順',
    '返り読みを封じて英語の語順のまま理解するトレーニング',
    '過去問音声を1.2倍速で聞いて本番をゆっくり感じさせる方法',
    '音の変化3種（連結・脱落・同化）を具体例セットで覚える',
    '毎日10分の「精聴」と流し聞き「多聴」の使い分け基準',
    '知らない単語は聞き取れない：リスニング前の語彙確認手順',
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
    hashtags: '#英検準1級 #英語学習',
    difficulty: 'TOEIC700点・大学上位レベル。allocate/discrepancy/paradigm相当のアカデミック語彙、倒置・強調構文・仮定法過去完了、抽象度の高い論説文を扱う。',
  },
  '2': {
    label: '2級',
    target: '高校生（推薦・一般入試で英検2級を目指している学生）',
    hook: '高校生が「推薦のために英検2級を取りたい」という動機に響く冒頭フック',
    hashtags: '#英検2級 #大学受験',
    difficulty: '高校英語・大学受験レベル。acquire/inevitable/propose相当の語彙、関係詞・仮定法・分詞構文、社会的テーマの長文を扱う。',
  },
  pre2: {
    label: '準2級',
    target: '中高生（高校入試や英語の基礎固めを目指す学習者）',
    hook: '準2級で英語に自信をつけたい中高生に響く冒頭フック',
    hashtags: '#英検準2級 #英語学習',
    difficulty: '中学〜高校初級レベル。environment/experience/promise相当の語彙、不定詞・受動態・比較、日常的な話題を扱う。難しすぎる表現は使わない。',
  },
  pre2plus: {
    label: '準2級プラス',
    target: '高校生（準2級合格後、2級を目指してステップアップしたい学習者）',
    hook: '準2級合格後に2級へ向けてレベルアップしたい高校生に響く冒頭フック',
    hashtags: '#英検準2級プラス #英語学習',
    difficulty: '高校初〜中級レベル（準2級と2級の中間）。acquire/propose相当の語彙、仮定法入門・分詞・間接疑問、やや抽象的なテーマも扱う。2級ほど難しくしない。',
  },
  '3': {
    label: '3級',
    target: '中学生（英検3級取得を目指す学習者）',
    hook: '中学生が英検3級に挑戦する動機に響く冒頭フック',
    hashtags: '#英検3級 #中学英語',
    difficulty: '中学英語レベル。enjoy/practice/excited相当の基本語彙、現在完了・不定詞・接続詞、短くわかりやすい文を使う。仮定法や分詞構文は使わない。',
  },
  '4': {
    label: '4級',
    target: '小中学生（英検4級を目指す学習者）',
    hook: '英語の基礎を楽しく学びたい小中学生に響く冒頭フック',
    hashtags: '#英検4級 #英語学習',
    difficulty: '小〜中学初級レベル。food/sport/family相当の日常語彙、be動詞・一般動詞・過去形・can、例文は10語以内のシンプルな文のみ。現在完了・仮定法は使わない。',
  },
  '5': {
    label: '5級',
    target: '小学生・英語初心者（英検5級にチャレンジする学習者）',
    hook: '英語を初めて学ぶ子どもや保護者に響く冒頭フック',
    hashtags: '#英検5級 #英語初心者',
    difficulty: '超基礎レベル。hello/cat/red/Monday/school相当の最も基本的な語彙のみ。be動詞と簡単な一般動詞のみ使用、例文は5〜7語以内、難しい文法は一切使わない。',
  },
};

// 一次試験（本会場）は全級共通日程。過去の日付は自動でスキップされる。
const EXAM_SCHEDULE = [
  { round: '2026年度第1回', date: '2026-05-31' },
  { round: '2026年度第2回', date: '2026-10-04' },
  { round: '2026年度第3回', date: '2027-01-24' },
];

// カウントダウンは直前期のみ（残り日数が大きいと訴求力がなく本文の文字数も削るため）
const COUNTDOWN_WINDOW_DAYS = 60;

function getNextExam() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const exam of EXAM_SCHEDULE) {
    const daysUntil = Math.ceil((new Date(exam.date) - today) / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0) return { ...exam, daysUntil };
  }
  return null;
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

// 投稿フォーマット:
//  - quiz_reply: 本文はリンクなしのクイズ。解答・解説＋アプリリンクはリプ欄に投稿（リーチとCVの両立）
//  - value:      リンクなしの価値提供投稿（Xは外部リンク付き投稿のリーチを下げるため通常はこちら）
//  - promo:      本文にアプリリンクを含める宣伝投稿（週1回程度に抑える想定）
const POST_FORMATS = ['quiz_reply', 'value', 'promo'];

function defaultFormat(questionType) {
  return ['vocabulary', 'grammar'].includes(questionType) ? 'quiz_reply' : 'value';
}

// Build the fixed suffix (hashtags, and CTA only for promo) with its X char cost
function buildSuffix(lv, level, format) {
  const ctaText = format === 'promo' ? buildCtaText(level) : null;
  const suffix = ctaText ? `\n${ctaText}\n${lv.hashtags}` : `\n${lv.hashtags}`;
  return { suffix, cost: calcXCharCount(suffix) };
}

// Build the fixed prefix (exam countdown, only within the countdown window)
function buildPrefix() {
  const exam = getNextExam();
  if (!exam || exam.daysUntil > COUNTDOWN_WINDOW_DAYS) return { prefix: '', cost: 0 };
  const prefix = `📅 1次試験まであと${exam.daysUntil}日！\n`;
  return { prefix, cost: prefix.length };
}

// 誇大表現・偽の限定性・エンゲージメント乞いはアカウントの信頼とリーチを毀損するため全生成で禁止する
const CONTENT_QUALITY_RULES = `【コンテンツ品質ルール（厳守）】
- 架空の統計・数字を作らない（「合格者の98%が知っている」「受験生の92%が間違える」等は禁止）
- 「残り○時間限定」「正解者にプレゼント」など、実施していない企画や偽の限定性を書かない
- 「いいね・RT・フォローお願いします」等のお願い・依頼文を入れない
- 「これだけで合格」「絶対に出る」等の誇大な断定をしない
- 読んだ人がこの投稿だけで1つ確実に学べる、具体的で正確な内容にする
- 冒頭1行は挨拶や前置きではなく、続きを読みたくなる具体的なフックにする（問い・意外な事実・あるあるの失敗など）`;

// docs/EIKEN_GROWTH_STRATEGY.md の要約。エージェントチームの共通コンテキスト
const EIKEN_PLAYBOOK = `【マーケティング方針（要約）】
- 目的: X（@optimalrnai）経由でAI英検Passアプリの認知・ダウンロードを増やす。ただし投稿の大半は売り込みではなく「価値提供」でリーチとフォローを稼ぐ（価値8:宣伝2）
- リンク付き投稿はリーチが下がるため、アプリリンクは解答リプライまたは週1のpromo枠のみ
- 勝ちパターン: ①リプ欄で答えたくなる参加型クイズ ②「知らなかった」と保存されるTips ③受験・進学に直結する実利情報
- トーン: 上から目線の先生ではなく、頼れる先輩・伴走者。丁寧すぎず、チャラすぎず`;

const HOOK_PATTERNS = `1. 問いかけ型（「〜、英語で言えますか？」）
2. 意外な事実型（「実は◯◯には△△の意味もある」）
3. あるある失敗型（「〜と訳した人、要注意」）
4. ビフォーアフター型（「これを知る前と後で長文の読み方が変わる」）
5. 共感型（「単語帳、3日で飽きた人へ」）
6. 直球クイズ型（前置きなしでいきなり問題文から始める）
7. ミニストーリー型（短い情景・会話の1文から入る）
8. 手順型（「◯◯は3ステップで解ける」※実在する解き方のみ）`;

const FORMAT_DESCRIPTIONS = {
  quiz_reply: 'クイズ＋答えはリプ欄（本文はリンクなしの4択クイズ。正解・解説とアプリリンクはリプライに分離してエンゲージメントを稼ぐ）',
  value: '価値提供（リンクなしのTips投稿。リーチとフォロー獲得が目的）',
  promo: 'アプリ訴求（本文にApp Storeリンクを含む宣伝投稿。週1回の枠）',
};

// 投稿にはクイズ/Tipsカード画像を自動生成して添付する。カードが綺麗に組めるよう本文を構造化させる
const CARD_LAYOUT_RULE = `【カード画像用の構造（この投稿には内容を要約したカード画像が自動生成され一緒に投稿されます。カードが綺麗に組めるよう次の構造を守ること）】`;

function buildFormatRequirements(format, lv, extra) {
  const extraBlock = extra ? `\n【問題タイプ固有の指示】\n${extra}\n` : '';
  if (format === 'quiz_reply') {
    return `${extraBlock}${CARD_LAYOUT_RULE}
- 1行目: パンチのある短い見出し（フック）を1行だけ。20文字以内
- 2行目以降に、空所を1つだけ含む英文の問題文（空所は ( ) で表す。空所は必ず1つ）
- 選択肢は①〜④の4択。**必ず1行に1つずつ改行して並べる**（例: 「①rose」で改行「②raised」…）。1行に詰め込まない
- 最後に「答えはリプ欄👇」で締める
- **正解・解説は絶対に書かない**
- 絵文字は1〜2個まで

【解答リプライ（reply）の要件】
- 1行目で正解を明示（例：「正解は②！」）
- なぜその答えになるか＋覚え方や関連知識を簡潔に解説
- 絵文字は1個まで`;
  }
  return `${extraBlock}${CARD_LAYOUT_RULE}
- 1行目: パンチのある短い見出し（フック）を1行だけ。20文字以内
- 2行目以降: 本文（下記の要件を満たす）
- ${lv.hook}
- Tipsまたは例文を1つだけ。読者が今日から実践できる具体性を持たせる
- **一般論・精神論だけの内容は禁止**（「毎日コツコツ」「スキマ時間を活用しよう」「集中できる環境を作ろう」のような、誰でも言える内容で終わらせない）
- 次のいずれかを必ず含める: ①名前のある具体的テクニック ②数値（分数・回数・日数・語数） ③3ステップ以内の手順 ④実際の英文例1つ
- 「今日、机に座ったら最初に何をすればいいか」が明確に分かる粒度まで具体化する
- 絵文字は1〜2個まで
- replyはnull`;
}

// prompt-onlyモード用: 外部AIに1回貼るだけで「そのままXに投稿できる完成形」を出力させる一括プロンプト
// 単発投稿（value/promo）はプレーンテキスト出力（JSONだと外部AIの不正エスケープで壊れるため）。
// クイズ＋リプ分離のみ、2つのテキストを区別する必要があるためJSONを使う
function buildEikenSinglePrompt(task, fixed) {
  const prefixRule = fixed.prefix
    ? `- 投稿の先頭に次の固定文をそのまま置く: "${fixed.prefix}"`
    : '- カウントダウンの固定文はなし（付けない）';

  const assemblyRules = task.format === 'quiz_reply'
    ? `${prefixRule}
- postの末尾に次の固定文をそのまま置く: "${fixed.suffix}"
- replyの末尾に次の固定文をそのまま置く: "${fixed.replySuffix}"
- 固定文を除いた本文部分は、postが${task.bodyLimit}文字以内、replyが${task.replyLimit}文字以内`
    : `${prefixRule}
- 投稿の末尾に次の固定文をそのまま置く: "${fixed.suffix}"
- 固定文を除いた本文部分は${task.bodyLimit}文字以内`;

  const outputRules = task.format === 'quiz_reply'
    ? `次の形式で、そのままXに貼れる2つの完成テキストだけを出力してください。
JSON・コードブロック・前後の説明文は一切付けないこと。「【投稿欄】」「【リプ欄】」の見出しは一字一句このまま使うこと：

【投稿欄】
（投稿欄にそのまま貼るテキスト）

【リプ欄】
（リプ欄にそのまま貼るテキスト）`
    : `そのままXに貼れる完成形の投稿テキストのみを出力してください。
JSON・コードブロック・前後の説明文・見出しは一切付けず、投稿テキストだけを出力すること。`;

  return `あなたはマーケター・コピーライター・品質レビュアーの3役を1人でこなし、X（@optimalrnai）の英検${task.levelLabel}「${task.typeLabel}」投稿を完成させます。

${task.playbook}

【今回の投稿枠】
フォーマット: ${task.formatDesc}
ターゲット: ${task.target}

【難易度・使用語彙の厳守事項】
${task.difficulty}

${task.qualityRules}

${task.formatRequirements}

【最近の投稿（題材・フックの型・言い回しを絶対に被らせない）】
${task.recentPosts?.length ? task.recentPosts.map((t, i) => `${i + 1}. ${t.replace(/\s+/g, ' ').slice(0, 120)}`).join('\n') : '（過去投稿なし）'}

【フックの型（最近の投稿で使われていないものを選ぶ）】
${task.hookPatterns}

【参考テーマ候補】${task.varietyHint || 'なし'}（採用は任意。より刺さる題材があれば優先）

【完成形の組み立てルール（固定文は一字一句このまま出力に含めること）】
${assemblyRules}

【出力形式】
${outputRules}`;
}

// GET /api/eiken/exam-info
router.get('/exam-info', (req, res) => {
  const next = getNextExam();
  res.json({
    next,
    countdownActive: !!next && next.daysUntil <= COUNTDOWN_WINDOW_DAYS,
    schedule: EXAM_SCHEDULE,
  });
});

// POST /api/eiken/generate - Direct single-call generation (SSE)
router.post('/generate', async (req, res) => {
  const { questionType = 'vocabulary', level = '2', prompt_only = false } = req.body;
  const format = POST_FORMATS.includes(req.body.format) ? req.body.format : defaultFormat(questionType);

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
    const { prefix } = buildPrefix();
    const { suffix, cost: suffixCost } = buildSuffix(lv, level, format);
    const bodyLimit = 280 - prefix.length - suffixCost - 2; // 2 for safety margin

    // 解答リプにはCTAリンクを付ける（本文をリンクなしに保ちつつ、正解を見に来た人に届く）
    const ctaText = buildCtaText(level);
    const replySuffix = ctaText ? `\n\n${ctaText}` : '';
    const replyLimit = 280 - calcXCharCount(replySuffix) - 2;

    const typeLabel = QUESTION_TYPE_LABELS[questionType] || questionType;
    const extra = (QUESTION_TYPE_EXTRA[questionType] || '').replaceAll('{level}', lv.label);
    const recentPosts = db.prepare(
      `SELECT post_text FROM sns_posts WHERE app_type = 'eiken' ORDER BY created_at DESC LIMIT 8`
    ).all().map(r => r.post_text);

    const task = {
      format,
      formatDesc: FORMAT_DESCRIPTIONS[format],
      levelLabel: lv.label,
      typeLabel,
      target: lv.target,
      difficulty: lv.difficulty,
      qualityRules: CONTENT_QUALITY_RULES,
      playbook: EIKEN_PLAYBOOK,
      hookPatterns: HOOK_PATTERNS,
      formatRequirements: buildFormatRequirements(format, lv, extra),
      bodyLimit,
      replyLimit,
      recentPosts,
      varietyHint: pickVariety(questionType, level),
    };

    // prompt-onlyモード: 外部AIに貼るだけで完成形（固定文込み）が出る一括プロンプトを提示
    const promptInfo = [{
      label: `英検${lv.label} ${typeLabel} 一括生成プロンプト（${format}・完成形出力）`,
      system: 'あなたはSNSマーケティングと英語教育の専門家チームです。',
      user: buildEikenSinglePrompt(task, { prefix, suffix, replySuffix }),
    }];

    const generated = await tryClaudeOrEmitPrompt(
      promptInfo,
      async () => orchestrateEikenPost(task, (msg) => sendEvent('agent_message', msg)),
      sendEvent,
      prompt_only,
    );

    if (generated == null) {
      sendEvent('done', {});
      return;
    }

    const postText = `${prefix}${generated.post}${suffix}`;
    const replyText = generated.reply ? `${generated.reply}${replySuffix}` : null;

    db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
      postId, 'eiken', postText, JSON.stringify({ questionType, level, format, ...(replyText ? { reply_text: replyText } : {}) }), 'draft'
    );

    // エージェントの協議ログを保存（投稿詳細画面で参照可能）
    if (generated.conversation?.length) {
      const convId = uuidv4();
      db.prepare(`INSERT INTO agent_conversations (id, post_id) VALUES (?, ?)`).run(convId, postId);
      const insertMsg = db.prepare(
        `INSERT INTO agent_messages (id, conversation_id, agent_role, agent_name, round, content) VALUES (?, ?, ?, ?, ?, ?)`
      );
      for (const msg of generated.conversation) {
        insertMsg.run(uuidv4(), convId, msg.agent, msg.name || msg.agent, msg.round, msg.content);
      }
    }

    sendEvent('final_post', { post_id: postId, post_text: postText, reply_text: replyText });
    sendEvent('done', {});
  } catch (err) {
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

// POST /api/eiken/save-manual - Save externally-generated post text (stored verbatim)
// 一括生成プロンプトは固定文込みの完成形を出力させるため、ここでは何も付与しない
router.post('/save-manual', (req, res) => {
  const { questionType, level = '2', body_text } = req.body;
  const format = POST_FORMATS.includes(req.body.format) ? req.body.format : defaultFormat(questionType);
  if (!body_text?.trim()) return res.status(400).json({ error: 'body_text is required' });
  const postId = uuidv4();

  // quiz_reply は「【投稿欄】/【リプ欄】」区切りテキストが基本形式。
  // 旧形式のJSON（スマートクォート・不正エスケープ含む）や、単発投稿のプレーンテキストも受け付ける
  const trimmed = body_text.trim();
  const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('```');
  const parsed = parseEikenMarkedText(trimmed)
    || ((format === 'quiz_reply' || looksLikeJson) ? parseEikenPostJson(trimmed) : null);
  const postText = parsed ? parsed.post : trimmed.replace(/```(?:json)?/gi, '').trim();
  const replyText = parsed?.reply || null;

  db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
    postId, 'eiken', postText, JSON.stringify({ questionType, level, format, manual: true, ...(replyText ? { reply_text: replyText } : {}) }), 'draft'
  );
  res.json({ post_id: postId, post_text: postText, reply_text: replyText });
});

// POST /api/eiken/generate-script - TikTok/Reels script generation
router.post('/generate-script', async (req, res) => {
  const { questionType = 'vocabulary', level = '2' } = req.body;
  const lv = LEVEL_CONFIG[level] || LEVEL_CONFIG['2'];
  const typeLabel = QUESTION_TYPE_LABELS[questionType] || questionType;

  const nextExam = getNextExam();
  const examHook = nextExam && nextExam.daysUntil <= COUNTDOWN_WINDOW_DAYS
    ? `\n- フック冒頭で「1次試験まであと${nextExam.daysUntil}日！」を必ず入れる` : '';
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

  const systemPrompt = 'あなたはTikTok・Instagram Reelsの動画制作と英語教育の専門家です。高校生に刺さる短尺動画の台本を作成します。';
  const promptInfo = [{
    label: `英検${lv.label} ${typeLabel} 動画台本プロンプト`,
    system: systemPrompt,
    user: prompt,
  }];

  // APIキーなし運用: プロンプトのみモード、またはAPIが使えない場合はプロンプトを返して外部AIで実行してもらう
  if (req.body.prompt_only) {
    return res.json({ fallback: { reason: 'prompt_only', prompts: promptInfo } });
  }

  try {
    const script = await generateTextFull(systemPrompt, prompt, { maxTokens: 1000 });
    res.json({ script: script.trim() });
  } catch (err) {
    if (isClaudeCreditError(err)) {
      return res.json({ fallback: { reason: 'api_error', message: err.message, prompts: promptInfo } });
    }
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
  const { post_text, reply_text } = req.body;
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'eiken'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const metadata = JSON.parse(post.metadata || '{}');
  if (reply_text !== undefined) {
    if (reply_text) metadata.reply_text = reply_text;
    else delete metadata.reply_text;
  }
  db.prepare(`UPDATE sns_posts SET post_text = ?, metadata = ? WHERE id = ? AND app_type = 'eiken'`)
    .run(post_text ?? post.post_text, JSON.stringify(metadata), req.params.id);
  res.json({ success: true });
});

// POST /api/eiken/posts/:id/publish
// body.image / body.reply_image: クライアントで生成したカード画像（data URL）。省略可
router.post('/posts/:id/publish', async (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'eiken'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const { image, reply_image } = req.body || {};

  try {
    const result = await postTweet(post.post_text, { image });
    db.prepare(
      `UPDATE sns_posts SET status = 'posted', social_post_id = ?, social_posted_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(result.id, post.id);

    // quiz_reply: 解答（＋アプリリンク）をリプ欄にぶら下げる
    const metadata = JSON.parse(post.metadata || '{}');
    let replyTweetId = null;
    let replyError = null;
    if (metadata.reply_text) {
      try {
        const replyResult = await postTweet(metadata.reply_text, { replyToId: result.id, image: reply_image });
        replyTweetId = replyResult.id;
      } catch (err) {
        replyError = err.message;
        db.prepare(`UPDATE sns_posts SET error_message = ? WHERE id = ?`)
          .run(`本文は投稿済み。解答リプの投稿に失敗: ${err.message}`, post.id);
      }
    }

    res.json({ success: true, tweet_id: result.id, reply_tweet_id: replyTweetId, reply_error: replyError });
  } catch (err) {
    db.prepare(`UPDATE sns_posts SET status = 'failed', error_message = ? WHERE id = ?`).run(err.message, post.id);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eiken/generate-university-post
router.post('/generate-university-post', async (req, res) => {
  const { university, level, faculty, condition, exemption, tips, prompt_only = false } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const postId = uuidv4();
    const levelLabel = level === 'pre1' ? '準1級' : level === '2' ? '2級' : level === 'pre2' ? '準2級' : level;
    const hashtags = `#英検${levelLabel} #推薦入試`;
    const bodyLimit = 280 - hashtags.length - 2;

    const systemPrompt = 'あなたはSNSマーケティングと大学受験の専門家です。';
    const userPrompt = `大学受験で英検を活用できる情報を、そのままX（旧Twitter）に投稿できる完成形で書いてください。

【大学情報】
大学名: ${university}
学部: ${faculty}
英検レベル: 英検${levelLabel}
出願条件: ${condition}
英語試験の扱い: ${exemption}
ポイント: ${tips}

【要件】
- 高校生・受験生が「これは知らなかった！」と思う情報にする
- 英検を持っている人に刺さる内容
- 英語試験が免除・不要である点を強調
- 記載された事実のみを使い、誇張・断定（「必ず受かる」等）をしない
- 絵文字は2〜3個
- 本文は${bodyLimit}文字以内
- 末尾に次のハッシュタグを一字一句このまま置く: "${hashtags}"
- URLは含めない
- 投稿テキストのみを出力（前後に説明文を付けない）`;

    const promptInfo = [{
      label: `${university} 大学受験X投稿プロンプト（完成形出力）`,
      system: systemPrompt,
      user: userPrompt,
    }];

    const generated = await tryClaudeOrEmitPrompt(
      promptInfo,
      async () => {
        const body = (await generateTextFull(systemPrompt, userPrompt, { maxTokens: 300, temperature: 1.0 })).trim();
        return body;
      },
      sendEvent,
      prompt_only,
    );

    if (generated == null) {
      sendEvent('done', {});
      return;
    }

    // 完成形出力（末尾ハッシュタグ込み）。念のため欠けていた場合のみ付与する
    const postText = generated.includes(hashtags) ? generated : `${generated}\n${hashtags}`;

    db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
      postId, 'eiken', postText, JSON.stringify({ university, level, type: 'university' }), 'draft'
    );

    sendEvent('final_post', { post_id: postId, post_text: postText });
    sendEvent('done', {});
  } catch (err) {
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

// DELETE /api/eiken/posts/:id
router.delete('/posts/:id', (req, res) => {
  db.prepare(`DELETE FROM sns_posts WHERE id = ? AND app_type = 'eiken'`).run(req.params.id);
  res.status(204).end();
});

export default router;
