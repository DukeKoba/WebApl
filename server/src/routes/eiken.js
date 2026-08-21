import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { generateTextFull } from '../services/claudeService.js';
import { tryClaudeOrEmitPrompt } from '../services/claudeFallback.js';
import { postTweet } from '../services/xService.js';
import { xLength, xTruncate } from '../utils/xText.js';
import { EIKEN_EXAMS, getNextExam, getCountdown } from '../data/eikenSchedule.js';

const router = express.Router();

const X_LIMIT = 280;

const QUESTION_TYPE_LABELS = {
  // 🔥 キラーコンテンツ（AI英検特化・バイラル）
  ai_writing_correction: '🔥 AI英作文 Before➔After添削',
  ai_interview: '🎙️ AI面接シミュレーション（満点vs不合格）',
  native_vs_japanese: '💡 ネイティブ違和感表現（直訳の罠）',
  controversial_quiz: '❓ 議論型1問1答（リプ・ツッコミ誘発）',
  thread_summary: '🧵 要点まとめスレッド（3〜4連ツイ）',

  // 基礎・既存
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
  ai_writing_correction: `【AI英作文 Before➔After 添削】
受験生が英検{level}の英作文で実際に書いてしまいがちな「惜しい・減点される英文」を取り上げ、AIが赤ペン添削して「ネイティブ級の合格答案」に劇的リライトする形式にしてください。

【構成（厳守）】
1行目: フック（例:「英検{level}の英作文、これ書くと確実に減点されます⚠️」「AI添削で発覚した惜しいミス👇」）
2. ❌【生徒の惜しい英文】（文法・語彙の不自然さや稚拙さがある一文）
3. 🤖【AIの赤ペン添削・減点理由】（「〜は不自然」「〜を使うと語彙レベルUP」と簡潔に指摘）
4. ⭕【合格模範答案】（英検{level}で満点が狙える自然で格調高い英文＋和訳）
5. 締め: 「無料のAI英検アプリで、あなたの英作文も一瞬で添削できます📲 詳細はリプ欄へ👇」`,

  ai_interview: `【AI面接シミュレーション（満点 vs 不合格）】
英検{level}の2次面接（スピーキング試験）のリアルな出題を取り上げ、「落ちる人の典型回答」と「AIが教える満点回答」を対比させてください。

【構成（厳守）】
1行目: フック（例:「英検{level}面接、この答え方だと落ちます⚠️」「面接官が『おっ』と感心する回答テクニック👇」）
2. 🎤【面接官の質問】（英検{level}の頻出質問 Q. "Some people say that..." など）
3. ❌【不合格になりがちな回答】（単語1語だけ、沈黙、理由の展開がない回答）
4. ⭕【AI推奨の満点回答】（"First of all... Also..." などの型と自然な表現を使った回答＋和訳）
5. 締め: 「面接練習もAIアプリなら本番形式で何回でも無料練習できます🎙️ 詳細はリプ欄へ👇」`,

  native_vs_japanese: `【ネイティブが違和感を持つ英検ミス・コロケーション】
「日本人が直訳して使いがちだけど、ネイティブが聞くと違和感がある・減点される表現」と「英検{level}で使える自然で高得点な英語」を対比して解説してください。

【構成（厳守）】
1行目: フック（例:「英検{level}で直訳すると減点される英語3選」「ネイティブが『ん？』と思う日本人のミス⚠️」）
2. ❌【日本人がやりがちな不自然な英語】
3. ⭕【ネイティブの自然な高得点表現】
4. 💡【なぜダメなのかの理由・ニュアンス解説】（簡潔に2〜3行）
5. 締め: 「AIが不自然な英語を瞬時に見抜く！アプリ情報はリプ欄👇」`,

  controversial_quiz: `【議論・リプライ誘発型 1問1答】
正答率が低く、直感とズレるひっかけ問題や、「なぜこれが間違いか説明できますか？」とフォロワーに考えさせてリプライを書き込ませる形式にしてください。

【構成（厳守）】
1行目: フック（例:「【正答率23%】英検{level}の罠問題。あなたは解けますか？」「9割の受験生が引っかかる1語⚠️」）
2. 📝【問題文】（英検{level}レベルの空所補充または文法問題）
3. 選択肢: ①〜 ②〜（絶妙な紛らわしさがある2択）
4. 締め: 「①と②どっちが正解だと思う？理由も一緒にリプで教えてください👇（正解と解説はリプ欄にあります）」`,

  thread_summary: `【要点まとめスレッド（3〜4連ツイート）】
英検{level}に最短で合格するための「神テンプレ」「頻出構文」「即点数になるテクニック」を3〜4ツイートの連投スレッドとして作成してください。
※本文とリプライのフォーマットではなく、スレッド形式で出力します。`,

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

// Randomized angle / theme hints
const VARIETY_HINTS = {
  ai_writing_correction: {
    pre1: [
      '理由付けで because から文を始めてしまうミス ➔ Since/Given that への書き換え',
      '「多くの人々」で many people を多用するミス ➔ a growing number of individuals / proponents への書き換え',
      '「重要だと思う」で I think it is important ➔ It is crucial/imperative that への洗練',
      '語彙が稚拙（good/bad/get） ➔ beneficial/detrimental/acquire への置換',
      '接続詞 moreover / furthermore の重複と不自然な位置の修正',
    ],
    '2': [
      '「〜だと思う」で I think... を3回連続で使ってしまうミス ➔ In my opinion / From my perspective',
      '「便利だから」で It is convenient だけ書いて終わるミス ➔ 具体例を展開する型',
      '主語と動詞の不一致（People uses...）や時制のブレ',
      '「たくさんのお金」で a lot of money ➔ significant financial resources への言い換え',
      '結論で So I think... と書くミス ➔ For these reasons, I believe that...',
    ],
    pre2: [
      'I like to... で幼稚に見える表現 ➔ I enjoy / I prefer',
      'because だけの不完全な文（Because it is fun. でピリオド）の修正',
      '単語のスペルミス・品詞の混同（delicious food vs very deliciously）',
      '理由が1つしか書けていない答案 ➔ Also を使って2つ目を追加する型',
    ],
    pre2plus: [
      'opinion と reason のつなぎが雑なミス ➔ First / Second の定石導入',
      'general idea と specific example の切り分け',
      '動名詞と不定詞の使い分けミス（enjoy to go ➔ enjoy going）',
    ],
    '3': [
      '動詞の過去形忘れ（Yesterday I go...）の修正',
      'I want to... の繰り返し ➔ I hope to / I would like to',
    ],
    '4': ['be動詞と一般動詞の混同（I am like apples）の修正'],
    '5': ['大文字・小文字、ピリオド忘れの修正'],
  },
  ai_interview: {
    pre1: [
      'Q. Should companies allow employees to work from home full-time?',
      'Q. Is it acceptable for artificial intelligence to replace human workers in creative fields?',
      'Q. Do you think the government should invest more in renewable energy?',
      'Q. Will online education completely replace traditional universities in the future?',
    ],
    '2': [
      'Q. Some people say that young people spend too much time on smartphones. What do you think?',
      'Q. Do you think more schools should introduce e-textbooks?',
      'Q. These days, many people buy eco-friendly products. Do you think this trend will continue?',
      'Q. Some people say that students should do more volunteer activities. What is your opinion?',
    ],
    pre2: [
      'Q. Do you think it is good for children to have their own smartphones?',
      'Q. Today, many people read books on tablet devices. Do you prefer paper books or e-books?',
      'Q. Do you think people will travel abroad more in the future?',
    ],
    pre2plus: [
      'Q. Do you think students should take part in club activities after school?',
      'Q. Some people say that people should use public transportation instead of cars. What do you think?',
    ],
    '3': [
      'Q. Which do you like better, reading books or watching movies?',
      'Q. What is your favorite season? Why?',
    ],
    '4': ['Q. What do you usually do on Sundays?'],
    '5': ['Q. Do you like sports?'],
  },
  native_vs_japanese: {
    pre1: [
      '❌ discuss about ➔ ⭕ discuss（他動詞なので about 不要）',
      '❌ consider about ➔ ⭕ consider',
      '❌ take a challenge ➔ ⭕ take on a challenge / take a risk',
      '❌ almost of people ➔ ⭕ most people / almost all people',
      '❌ improve my English skill ➔ ⭕ improve my English (proficiency)',
    ],
    '2': [
      '❌ play with smartphone ➔ ⭕ use my smartphone',
      '❌ I am boring ➔ ⭕ I am bored',
      '❌ make an effort to ➔ ⭕ strive to / work hard to',
      '❌ in my opinion, I think... ➔ ⭕ In my opinion, / I think...',
      '❌ Japanese people is... ➔ ⭕ Japanese people are...',
    ],
    pre2: [
      '❌ I went to shopping ➔ ⭕ I went shopping',
      '❌ see TV ➔ ⭕ watch TV',
      '❌ teach my English ➔ ⭕ teach me English',
    ],
    pre2plus: [
      '❌ agree with you vs agree to the plan の使い分け',
      '❌ explain me the problem ➔ ⭕ explain the problem to me',
    ],
    '3': ['❌ listen music ➔ ⭕ listen to music'],
    '4': ['❌ look the picture ➔ ⭕ look at the picture'],
    '5': ['❌ Thank you about ➔ ⭕ Thank you for'],
  },
  controversial_quiz: {
    pre1: [
      '「〜にもかかわらず」despite of は正しい？ 正解: despite または in spite of',
      'demand that S (should) do の仮定法現在トラップ',
      'hard vs hardly, late vs lately の品詞・意味トラップ',
      'affect vs effect の動詞/名詞トラップ',
    ],
    '2': [
      'suggest that he (go / goes) to hospital? どっちが正解？',
      'used to do vs be used to doing の使い分けトラップ',
      'look forward to (hear / hearing) from you? どっち？',
      'borrow / lend / rent の使い分けひっかけ',
    ],
    pre2: [
      'stop to smoke vs stop smoking の意味の違い',
      'remember to do vs remember doing の違い',
    ],
    pre2plus: [
      'If I (was / were) rich... どっちが英検で満点？',
      'The number of students (is / are) increasing?',
    ],
    '3': ['have been to vs have gone to の違い'],
    '4': ['yesterday がある文で had / have どっち？'],
    '5': ['he (have / has) a dog?'],
  },
  thread_summary: {
    pre1: [
      '英検準1級ライティングで28点以上を確定させる「神フレーズ＆構文5選」',
      '準1級語彙パートで8割取るための「語源×コロケーション暗記術」',
      '準1級面接で評価4（満点）を連発する「2文展開ロジック」',
    ],
    '2': [
      '英検2級英作文で14/16点以上取る「絶対に減点されない黄金テンプレ」',
      '2級リスニング第2部で先読みして満点を取る「3秒ルール」',
      '2級面接（スピーキング）で合格率98%にする「魔法の切り返し言葉3選」',
    ],
    pre2: [
      '準2級ライティングで即満点が取れる「3段落テンプレート」',
      '準2級で合否を分ける重要動詞トップ10と例文',
    ],
    pre2plus: [
      '準2級プラス新形式の完全対策とライティング要約のコツ',
    ],
    '3': ['英検3級英作文の書き方と満点テンプレ'],
    '4': ['英検4級の長文読解を10分で終わらせるコツ'],
    '5': ['英検5級リスニングで満点を取るコツ'],
  },
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
    hashtags: '#英検準2級 #高校受験',
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
    hashtags: '#英検4級 #小学英語',
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

const CTA_LINKS = {
  pre1: { url: 'https://apps.apple.com/jp/app/id6762535365', label: 'AI英検準1級 Pass' },
  '2': { url: 'https://apps.apple.com/jp/app/id6761838561', label: '英検2級Pass（AI英作文・面接対策）' },
  pre2: { url: 'https://apps.apple.com/jp/app/id6762229086', label: 'AI英検準2級 Pass' },
  pre2plus: { url: 'https://apps.apple.com/jp/app/id6762537264', label: 'AI英検準2級プラス Pass' },
};

const KOYOMI_CTA = {
  url: 'https://apps.apple.com/jp/app/id6794647918',
  label: 'Koyomi -暦-（年表＆カレンダーで覚える日本史・世界史）',
};

function getCta(level) {
  return CTA_LINKS[level] || null;
}

function buildCountdownLine() {
  const next = getCountdown();
  if (!next) return '';
  const [, m, d] = next.primaryDate.split('-');
  if (next.daysUntil === 0) return `⏳ 今日が一次試験本番！`;
  return `⏳ 一次試験まであと${next.daysUntil}日（${Number(m)}/${Number(d)}）`;
}

function buildSuffix(lv) {
  const countdown = buildCountdownLine();
  const suffix = countdown ? `\n\n${countdown}\n${lv.hashtags}` : `\n\n${lv.hashtags}`;
  return { suffix, cost: xLength(suffix) };
}

function buildReplyText(explanation, cta) {
  const parts = [];
  if (explanation) parts.push(explanation.trim());
  if (cta) parts.push(`📲 ${cta.label}\n${cta.url}`);
  const text = parts.join('\n\n');
  return xTruncate(text, X_LIMIT);
}

const BODY_MARK = '===本文===';
const REPLY_MARK = '===リプライ===';
const THREAD_MARK_REGEX = /===ツイート(\d+)===/g;

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

function splitThreadGenerated(raw) {
  const text = (raw || '').trim();
  const parts = text.split(/===ツイート\d+===/i).map(p => p.trim()).filter(Boolean);
  if (parts.length > 0) return parts;
  // Fallback: split by 2+ newlines or returns array of 1
  return [text];
}

function engagementRules(bodyLimit, replyLimit) {
  return `【Xで伸びる投稿の条件（最重要・厳守）】
タイムラインでは1投稿あたり0.5秒で読むか捨てるかが決まります。以下を必ず守ってください。
1. 1行目（フック）だけで指を止めさせる。数字・意外性・損失回避を使った具体的な一文にする。
   例:「9割が間違える1語です」「これ書くと英検本番で減点されます⚠️」
   挨拶・前置き・「今日は〜を紹介します」のような入りは絶対に書かない。
2. 1投稿1テーマ。詰め込まない。
3. 箇条書きや記号（❌ ⭕ 🤖 💡 📝）を使い、パッと見で構造が伝わるようにする。
4. 改行で3〜5ブロックに分ける。改行のない塊は読まれない。
5. 最後は必ずリプライを誘う一文で締める（「無料添削はリプ欄👇」「正解はリプ欄👇」など）。
   Xはリプライと保存が多い投稿を伸ばすため、これが表示回数に直結する。
6. 絵文字は2〜4個まで。視認性を高める目的に限定する。

【絶対に書いてはいけないもの】
- URL・リンク（システムが別途リプライに付けます）
- ハッシュタグ（システムが付けます）
- 「いかがでしたか」「解説します」などブログ的な定型句
- 試験日カウントダウン（システムが付けます）

【出力フォーマット（この形式以外で返さない）】
${BODY_MARK}
（X本文。${bodyLimit}カウント以内。日本語1文字＝2カウントで数えること。つまり日本語なら約${Math.floor(bodyLimit / 2)}文字が上限）
${REPLY_MARK}
（本文にぶら下げるリプライの中身。クイズなら「答え＋なぜそうなるかの解説」、Tipsや添削なら「もう一歩踏み込んだ補足や具体例」。${replyLimit}カウント以内＝日本語で約${Math.floor(replyLimit / 2)}文字。ここにもURLとハッシュタグは書かない）`;
}

function threadRules(level, cta) {
  const lv = LEVEL_CONFIG[level] || LEVEL_CONFIG['2'];
  return `【スレッド（連ツイ）出力フォーマット（厳守）】
以下の形式で3〜4ツイートを順番に出力してください。各ツイートは240カウント（日本語約120文字）以内に収めてください。

===ツイート1===
（フック＋導入。読者が思わずスレッドを開きたくなる強力な1文から始める。例:「英検${lv.label}ライティングで確実に高得点を取る型をまとめました。保存推奨👇」）

===ツイート2===
（1つ目の重要ポイント・添削Before/After・具体例）

===ツイート3===
（2つ目の重要ポイントまたは実践テクニック）

===ツイート4===
（まとめ＋「この練習がいつでもAIでできるアプリはこちら📲」などのCTA誘導。URLやハッシュタグは書かない）`;
}

function buildEikenPrompt(questionType, level, bodyLimit, replyLimit, variety = '') {
  const typeLabel = QUESTION_TYPE_LABELS[questionType] || questionType;
  const lv = LEVEL_CONFIG[level] || LEVEL_CONFIG['2'];
  const extra = (QUESTION_TYPE_EXTRA[questionType] || '').replaceAll('{level}', lv.label);
  const varietyLine = variety ? `- 今回のテーマ・切り口：「${variety}」で書いてください（毎回違う内容にするため）` : '';

  if (questionType === 'thread_summary') {
    return `英検${lv.label}の学習コンテンツをX（旧Twitter）のスレッド（連ツイ）形式で投稿します。
ターゲット: **${lv.target}**
テーマ: ${variety || `${lv.label}合格のための要点まとめ`}

【難易度・使用語彙の厳守事項】
${lv.difficulty}

${threadRules(level, getCta(level))}`;
  }

  return `英検${lv.label}の学習コンテンツをX（旧Twitter）に投稿します。
ターゲット: **${lv.target}**
コンテンツタイプ: ${typeLabel}

【難易度・使用語彙の厳守事項】
${lv.difficulty}
上記レベルを必ず守り、それより難しい語彙・文法を使わないこと。

【内容の要件】
- ${lv.hook}
${extra ? `- ${extra}` : `- 英検${lv.label}の${typeLabel}に関するTipsまたは例文を1つだけ`}
${varietyLine}
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

async function generateThreadContent({ systemPrompt, buildPrompt, level }) {
  const raw = await generateTextFull(systemPrompt, buildPrompt(240), {
    maxTokens: 1500,
    temperature: 0.9,
  });
  const parts = splitThreadGenerated(raw);
  const lv = LEVEL_CONFIG[level] || LEVEL_CONFIG['2'];
  const { suffix } = buildSuffix(lv);
  const cta = getCta(level);

  // Process parts: truncate each to limit, add suffix to last or first
  const processed = parts.map((p, idx) => {
    let t = p.trim();
    if (idx === parts.length - 1 && cta) {
      t = `${t}\n\n📲 ${cta.label}\n${cta.url}`;
    }
    return xTruncate(t, X_LIMIT);
  });

  return {
    threadPosts: processed,
    firstPost: processed[0] || '',
  };
}

function replyBudget(cta) {
  const ctaCost = cta ? xLength(`📲 ${cta.label}\n${cta.url}`) + 2 : 0;
  return X_LIMIT - ctaCost - 2;
}

// GET /api/eiken/exam-info
router.get('/exam-info', (req, res) => {
  res.json({
    exams: EIKEN_EXAMS,
    next: getNextExam(),
    countdown: getCountdown(),
  });
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
    const cta = getCta(level);
    const { suffix, cost: suffixCost } = buildSuffix(lv);
    const bodyLimit = X_LIMIT - suffixCost - 4;
    const replyLimit = replyBudget(cta);

    const systemPrompt = 'あなたはSNSマーケティングと英語教育の専門家です。Xで圧倒的に拡散されている教育アカウントの書き方を熟知しています。';
    const variety = pickVariety(questionType, level);
    const buildPrompt = (limit) => buildEikenPrompt(questionType, level, limit, replyLimit, variety);

    const promptInfo = [{
      label: `英検${lv.label} ${QUESTION_TYPE_LABELS[questionType] || questionType} 投稿生成プロンプト`,
      system: systemPrompt,
      user: buildPrompt(bodyLimit),
    }];

    if (questionType === 'thread_summary') {
      const generated = await tryClaudeOrEmitPrompt(
        promptInfo,
        () => generateThreadContent({ systemPrompt, buildPrompt, level }),
        sendEvent,
        prompt_only,
      );

      if (generated == null) {
        sendEvent('done', {});
        return;
      }

      const mainPostText = generated.firstPost;
      const metadata = {
        questionType,
        level,
        is_thread: true,
        thread_posts: generated.threadPosts,
        reply_text: generated.threadPosts.slice(1).join('\n\n---(次のツイート)---\n\n'),
      };

      db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
        postId, 'eiken', mainPostText, JSON.stringify(metadata), 'draft'
      );

      sendEvent('final_post', {
        post_id: postId,
        post_text: mainPostText,
        is_thread: true,
        thread_posts: generated.threadPosts,
        reply_text: metadata.reply_text,
      });
      sendEvent('done', {});
      return;
    }

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
      postId, 'eiken', postText,
      JSON.stringify({ questionType, level, reply_text: replyText }),
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

// POST /api/eiken/generate-batch - 1週間分（または複数件）一括生成 (SSE)
router.post('/generate-batch', async (req, res) => {
  const { level = '2', count = 7, prompt_only = false } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // 1週間の黄金比率スケジュール
    const scheduleTemplate = [
      { type: 'ai_writing_correction', day: '月曜', title: '🔥 AI英作文 添削' },
      { type: 'native_vs_japanese', day: '火曜', title: '💡 ネイティブ違和感表現' },
      { type: 'controversial_quiz', day: '水曜', title: '❓ 議論型クイズ' },
      { type: 'ai_interview', day: '木曜', title: '🎙️ AI面接シミュレーション' },
      { type: 'thread_summary', day: '金曜', title: '🧵 要点まとめスレッド' },
      { type: 'vocabulary', day: '土曜', title: '📚 重要語彙' },
      { type: 'study_tips', day: '日曜', title: '💡 学習メソッド・コツ' },
    ];

    const targetList = scheduleTemplate.slice(0, count);
    const lv = LEVEL_CONFIG[level] || LEVEL_CONFIG['2'];
    const cta = getCta(level);
    const { suffix, cost: suffixCost } = buildSuffix(lv);
    const bodyLimit = X_LIMIT - suffixCost - 4;
    const replyLimit = replyBudget(cta);
    const systemPrompt = 'あなたはSNSマーケティングと英語教育の専門家です。Xで圧倒的に拡散されている教育アカウントの書き方を熟知しています。';

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
      const variety = pickVariety(item.type, level);
      const buildPrompt = (limit) => buildEikenPrompt(item.type, level, limit, replyLimit, variety);

      if (item.type === 'thread_summary') {
        const generated = await generateThreadContent({ systemPrompt, buildPrompt, level });
        const metadata = {
          questionType: item.type,
          level,
          day: item.day,
          theme: item.title,
          is_thread: true,
          thread_posts: generated.threadPosts,
          reply_text: generated.threadPosts.slice(1).join('\n\n---(次のツイート)---\n\n'),
        };
        db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
          postId, 'eiken', generated.firstPost, JSON.stringify(metadata), 'draft'
        );
        generatedPosts.push({
          post_id: postId,
          post_text: generated.firstPost,
          metadata,
          day: item.day,
          type: item.type,
          title: item.title,
        });
      } else {
        const generated = await generateBodyAndReply({ systemPrompt, buildPrompt, bodyLimit, replyLimit });
        const postText = `${generated.body}${suffix}`;
        const replyText = buildReplyText(generated.explanation, cta);
        const metadata = {
          questionType: item.type,
          level,
          day: item.day,
          theme: item.title,
          reply_text: replyText,
        };
        db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
          postId, 'eiken', postText, JSON.stringify(metadata), 'draft'
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
    }

    sendEvent('batch_complete', { posts: generatedPosts });
    sendEvent('done', {});
  } catch (err) {
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

// POST /api/eiken/save-manual - Save manually-generated post text
router.post('/save-manual', (req, res) => {
  const { questionType, level = '2', body_text, reply_text, is_thread = false, thread_posts } = req.body;
  if (!body_text?.trim() && (!thread_posts || thread_posts.length === 0)) {
    return res.status(400).json({ error: 'body_text or thread_posts is required' });
  }

  const lv = LEVEL_CONFIG[level] || LEVEL_CONFIG['2'];
  const cta = getCta(level);
  const postId = uuidv4();

  if (is_thread && Array.isArray(thread_posts) && thread_posts.length > 0) {
    const mainPost = thread_posts[0];
    const metadata = {
      questionType,
      level,
      manual: true,
      is_thread: true,
      thread_posts,
      reply_text: thread_posts.slice(1).join('\n\n---(次のツイート)---\n\n'),
    };
    db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
      postId, 'eiken', mainPost, JSON.stringify(metadata), 'draft'
    );
    return res.json({ post_id: postId, post_text: mainPost, metadata });
  }

  const { suffix } = buildSuffix(lv);
  const { body, explanation } = splitGenerated(body_text);
  const postText = `${body}${suffix}`;
  const finalReplyText = buildReplyText(reply_text?.trim() || explanation, cta);

  db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
    postId, 'eiken', postText,
    JSON.stringify({ questionType, level, manual: true, reply_text: finalReplyText }),
    'draft',
  );
  res.json({ post_id: postId, post_text: postText, reply_text: finalReplyText });
});

// POST /api/eiken/generate-script - TikTok/Reels script generation
router.post('/generate-script', async (req, res) => {
  const { questionType = 'ai_writing_correction', level = '2' } = req.body;
  const lv = LEVEL_CONFIG[level] || LEVEL_CONFIG['2'];
  const typeLabel = QUESTION_TYPE_LABELS[questionType] || questionType;

  const next = getCountdown();
  const examHook = next
    ? `\n- フック冒頭で「一次試験まであと${next.daysUntil}日！」を必ず入れる` : '';
  const cta = getCta(level);
  const ctaLabel = cta ? cta.label : 'AI英検Pass';
  const ctaUrl = cta ? cta.url : '';

  const prompt = `英検${lv.label}の学習コンテンツのTikTok・Instagram Reels用動画台本を作成してください。
ターゲット: ${lv.target}
テーマ: ${typeLabel}

【台本の構成（約30秒）】
以下のセクション構成で台本を作成してください：

■ フック（0〜3秒）
画面テキスト: （大きく表示する文字。例:「英検${lv.label}でコレ書いたら0点です⚠️」など強烈なフック）
ナレーション: （話す言葉）

■ 問題提示・添削前の文（3〜12秒）
画面テキスト: （生徒の惜しい英語や問題）
ナレーション: （話す言葉）

■ AIの添削・解説（12〜22秒）
画面テキスト: （赤ペン指摘＆合格答案）
ナレーション: （話す言葉）

■ CTA（22〜30秒）
画面テキスト: 「${ctaLabel}で今すぐ無料AI添削！」${ctaUrl ? `\nURL: ${ctaUrl}` : ''}
ナレーション: （アプリへ誘導する言葉）

【要件】
- 最初の3秒でスクロールを止めるフック${examHook}
- 実際の英検${lv.label}レベル（難易度: ${lv.difficulty}）
- ナレーションはテンポよく自然な話し言葉
- 画面テキストは短くインパクト重視

台本のみを出力してください。前後に説明文を入れないでください。`;

  try {
    const script = await generateTextFull(
      'あなたはTikTok・Instagram Reelsのバズ動画制作と英語教育の専門家です。短尺で強烈に引きつける台本を作成します。',
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
  const { post_text, reply_text, metadata: newMeta } = req.body;
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'eiken'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const metadata = JSON.parse(post.metadata || '{}');
  if (reply_text !== undefined) metadata.reply_text = reply_text;
  if (newMeta && typeof newMeta === 'object') {
    Object.assign(metadata, newMeta);
  }

  db.prepare(`UPDATE sns_posts SET post_text = ?, metadata = ? WHERE id = ? AND app_type = 'eiken'`)
    .run(post_text ?? post.post_text, JSON.stringify(metadata), req.params.id);
  res.json({ success: true });
});

// POST /api/eiken/posts/:id/publish
// 本文を投稿し、CTA入りのリプライをぶら下げる。
router.post('/posts/:id/publish', async (req, res) => {
  const post = db.prepare(`SELECT * FROM sns_posts WHERE id = ? AND app_type = 'eiken'`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const metadata = JSON.parse(post.metadata || '{}');

  // スレッド投稿の場合
  if (metadata.is_thread && Array.isArray(metadata.thread_posts) && metadata.thread_posts.length > 1) {
    const threadPosts = metadata.thread_posts;
    const tweetIds = [];
    let lastTweetId = null;

    try {
      for (let i = 0; i < threadPosts.length; i++) {
        const text = threadPosts[i];
        if (xLength(text) > X_LIMIT) {
          throw new Error(`スレッド第${i + 1}ツイートが${xLength(text)}カウントで上限を超えています。`);
        }
        const resTweet = await postTweet(text, { replyToId: lastTweetId });
        tweetIds.push(resTweet.id);
        lastTweetId = resTweet.id;
      }

      metadata.thread_tweet_ids = tweetIds;
      db.prepare(
        `UPDATE sns_posts SET status = 'posted', social_post_id = ?, social_posted_at = CURRENT_TIMESTAMP, metadata = ?, error_message = NULL WHERE id = ?`
      ).run(tweetIds[0], JSON.stringify(metadata), post.id);

      return res.json({ success: true, tweet_id: tweetIds[0], thread_tweet_ids: tweetIds });
    } catch (err) {
      metadata.thread_tweet_ids = tweetIds;
      db.prepare(
        `UPDATE sns_posts SET status = 'failed', error_message = ?, metadata = ? WHERE id = ?`
      ).run(err.message, JSON.stringify(metadata), post.id);
      return res.status(500).json({ error: err.message, posted_tweets: tweetIds });
    }
  }

  // 単発投稿＋リプライの場合
  const replyText = metadata.reply_text;

  if (xLength(post.post_text) > X_LIMIT) {
    return res.status(400).json({
      error: `本文が${xLength(post.post_text)}カウントで上限${X_LIMIT}を超えています（日本語は1文字2カウント）。短くしてから投稿してください。`,
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
    const lv = LEVEL_CONFIG[level] || LEVEL_CONFIG['2'];
    const suffix = `\n\n#大学受験 #英検${lv.label} #推薦入試`;
    const bodyLimit = X_LIMIT - xLength(suffix) - 4;
    const cta = KOYOMI_CTA;
    const replyLimit = replyBudget(cta);

    const systemPrompt = 'あなたは高校生向け大学受験・推薦入試の専門家です。英検を活用した推薦入試のお得感や魅力を伝えるX投稿を作成します。';
    const buildPrompt = (limit) => `英検${lv.label}を利用できる大学の推薦入試情報をXに投稿します。
大学名: ${university}
学部: ${faculty}
出願条件: ${condition}
免除・優遇内容: ${exemption}
おすすめポイント: ${tips}

【内容の要件】
- 「英検${lv.label}を持っていれば、英語試験免除で受けられる！」というメリットを強調
- 高校生が保存（ブックマーク）したくなる情報量の密度にする
- 最後に「詳細は公式HPをチェック👇」とリプライを促す

${engagementRules(limit, replyLimit)}`;

    const promptInfo = [{
      label: `${university} 推薦入試 投稿生成プロンプト`,
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
      postId, 'eiken', postText,
      JSON.stringify({ type: 'university', university, level, faculty, reply_text: replyText }),
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

// 日本史・世界史（Koyomi）
const HISTORY_TYPES = {
  // 🔥 センター試験・共通テスト相当 1問1答（キラーコンテンツ）
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
  // 歴史解説・コラム
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
（※アプリリンクはシステムが自動追加します）

${engagementRules(bodyLimit, replyLimit)}`;
  }

  return `${type.label}の学習コンテンツをX（旧Twitter）に投稿します。
ターゲット: 大学受験で日本史・世界史を使う高校生・浪人生
テーマ: ${variety}

【内容の要件】
- 高校の教科書・入試で扱われる範囲の定説だけを書く
- 年号・人名・出来事は確実なものだけ使う。少しでも曖昧なものは扱わない
- 用語の暗記ではなく「なぜそうなったか」の因果や流れが分かる内容にする
- クイズ形式にする場合、選択肢は①②の2択のみ。答えは本文に書かず、リプライ側に書く

${engagementRules(bodyLimit, replyLimit)}`;
}

// POST /api/eiken/generate-history
router.post('/generate-history', async (req, res) => {
  const { contentType = 'japanese_history', prompt_only = false } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const postId = uuidv4();
    const type = HISTORY_TYPES[contentType] || HISTORY_TYPES.japanese_history;
    const suffix = `\n\n${type.hashtags}`;
    const bodyLimit = X_LIMIT - xLength(suffix) - 4;
    const cta = KOYOMI_CTA;
    const replyLimit = replyBudget(cta);
    const variety = type.hints[Math.floor(Math.random() * type.hints.length)];

    const systemPrompt = 'あなたはSNSマーケティングと高校歴史教育の専門家です。事実の正確さを最優先しつつ、Xで伸びる書き方を熟知しています。';
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
      postId, 'eiken', postText,
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

// POST /api/eiken/save-manual-history
router.post('/save-manual-history', (req, res) => {
  const { contentType = 'japanese_history', body_text, reply_text } = req.body;
  if (!body_text?.trim()) return res.status(400).json({ error: 'body_text is required' });

  const type = HISTORY_TYPES[contentType] || HISTORY_TYPES.japanese_history;
  const { body, explanation } = splitGenerated(body_text);
  const postId = uuidv4();
  const postText = `${body}\n\n${type.hashtags}`;
  const replyText = buildReplyText(reply_text?.trim() || explanation, KOYOMI_CTA);

  db.prepare(`INSERT INTO sns_posts (id, app_type, post_text, metadata, status) VALUES (?, ?, ?, ?, ?)`).run(
    postId, 'eiken', postText,
    JSON.stringify({ contentType, type: 'koyomi', manual: true, reply_text: replyText }),
    'draft',
  );
  res.json({ post_id: postId, post_text: postText, reply_text: replyText });
});

// DELETE /api/eiken/posts/:id
router.delete('/posts/:id', (req, res) => {
  db.prepare(`DELETE FROM sns_posts WHERE id = ? AND app_type = 'eiken'`).run(req.params.id);
  res.status(204).end();
});

export { KOYOMI_CTA, engagementRules, buildReplyText, generateBodyAndReply, replyBudget, X_LIMIT };

// POST /api/eiken/batch-prompts (1週間分のプロンプト一覧を取得)
router.post('/batch-prompts', (req, res) => {
  const { level = '2', count = 7 } = req.body;
  const targetList = WEEKLY_SCHEDULE.slice(0, count);
  const systemPrompt = 'あなたは英検指導のトッププロであり、SNSマーケティングの専門家です。事実の正確さと学習効果を最優先しつつ、Xで圧倒的にエンゲージメントが高く保存される書き方を熟知しています。';
  const cta = getEikenCta(level);
  const replyLimit = replyBudget(cta);

  const prompts = targetList.map((item, idx) => {
    const type = QUESTION_TYPES[item.type] || QUESTION_TYPES.vocabulary;
    const suffix = `\n\n${type.hashtags} #英検${level}級`;
    const bodyLimit = X_LIMIT - xLength(suffix) - 4;
    const userPrompt = buildPromptForType(item.type, level, bodyLimit, replyLimit, item.variety);

    return {
      day: item.day,
      title: item.title,
      label: `【${item.day}】${item.title} プロンプト`,
      system: systemPrompt,
      user: userPrompt,
    };
  });

  const fullPromptCombined = `【AI英検${level}級 X投稿 1週間分（7投稿）の一括生成指示】\n\n以下の7つの指示に従って、それぞれの投稿本文とリプライを出力してください。\n各投稿は「===Day 1===」「===Day 2===」で区切って出力してください。\n\n` +
    prompts.map((p, i) => `--- Day ${i + 1} (${p.day}: ${p.title}) ---\n${p.user}`).join('\n\n');

  res.json({ prompts, combined_prompt: fullPromptCombined });
});

export default router;
