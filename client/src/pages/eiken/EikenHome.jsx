import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, History, ArrowLeft, Twitter, Video, Copy, Check, CalendarClock, GraduationCap, BadgeCheck, MapPin, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import PostPreview from '../../components/shared/PostPreview';
import AiModeToggle, { useAiMode } from '../../components/shared/AiModeToggle';
import PromptFallbackPanel from '../../components/shared/PromptFallbackPanel';
import { authFetch } from '../../utils/api';

const QUESTION_TYPES = [
  { value: 'vocabulary', label: '語彙' },
  { value: 'grammar', label: '文法' },
  { value: 'reading', label: '読解' },
  { value: 'writing', label: 'ライティング' },
  { value: 'listening', label: 'リスニング' },
  { value: 'interview', label: '面接Tips' },
  { value: 'american_culture', label: '🇺🇸 文化表現' },
  { value: 'ai_tips', label: '🤖 AI活用Tips' },
  { value: 'study_tips', label: '📚 学習のコツ' },
  { value: 'listening_tips', label: '🎧 英語耳の作り方' },
];

const EIKEN_LEVELS = [
  { value: 'pre1', label: '準1級' },
  { value: '2', label: '2級' },
  { value: 'pre2', label: '準2級' },
  { value: 'pre2plus', label: '準2級プラス' },
  { value: '3', label: '3級' },
  { value: '4', label: '4級' },
  { value: '5', label: '5級' },
];

const APP_LINKS = {
  pre1: {
    href: 'https://apps.apple.com/jp/app/id6762535365',
    label: 'AI英検Pass準1',
  },
  '2': {
    href: 'https://apps.apple.com/jp/app/id6761838561',
    label: 'AI英検Pass2級',
  },
  pre2: {
    href: 'https://apps.apple.com/jp/app/id6762229086',
    label: 'AI英検Pass準2',
  },
  pre2plus: {
    href: 'https://apps.apple.com/jp/app/id6762537264',
    label: 'AI英検Pass準2プラス',
  },
};

function ScriptPreview({ script, onScriptChange }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(script || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!script) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-pink-500 to-orange-400">
        <Video className="w-5 h-5 text-white" />
        <span className="text-white font-semibold text-sm">TikTok / Reels 台本</span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">動画台本（約30秒）</span>
          <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600 transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <textarea
          value={script}
          onChange={e => onScriptChange(e.target.value)}
          rows={14}
          className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={handleCopy}
          className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white'
          }`}
        >
          {copied ? <><Check className="w-4 h-4" />コピーしました！</> : <><Copy className="w-4 h-4" />台本をコピー</>}
        </button>
      </div>
    </div>
  );
}

const UNIVERSITY_DATA = [
  {
    level: 'pre1',
    levelLabel: '準1級',
    levelColor: 'from-purple-600 to-indigo-600',
    levelBadge: 'bg-purple-100 text-purple-800',
    university: '青山学院大学',
    faculty: '文学部 英米文学科',
    examType: '自己推薦入学者選抜（英語資格取得者対象）',
    location: '東京都渋谷区',
    campus: '青山キャンパス（渋谷・表参道エリア）',
    condition: '英検準1級以上（またはTOEFL iBT 72以上等）',
    exemption: '英語の筆記試験なし。1次選考は書類審査、2次選考は小論文・面接のみ。共通テスト不要。',
    highlights: [
      '渋谷・表参道という最高立地のキャンパスで学べる',
      '英語ネイティブ教員多数。授業の多くが英語で実施',
      '英文学・英語学・コミュニケーションを深く探求',
      '帰国生・英語得意者が集まる刺激的な環境',
      '就職実績抜群。マスコミ・外資・国際機関への就職者多数',
    ],
    tips: '英検準1級を持っていれば、共通テストなしで青学に挑戦できる狙い目の入試。評定不問なのも嬉しいポイント！',
    officialUrl: 'https://www.aoyama.ac.jp/admission/undergraduate/examination/recommendation_self.html',
  },
  {
    level: 'pre1',
    levelLabel: '準1級',
    levelColor: 'from-purple-600 to-indigo-600',
    levelBadge: 'bg-purple-100 text-purple-800',
    university: '立教大学',
    faculty: '異文化コミュニケーション学部',
    examType: '自由選抜入試（英語重視型）',
    location: '東京都豊島区',
    campus: '池袋キャンパス（池袋駅徒歩7分）',
    condition: '英検準1級以上（またはTOEFL iBT 72以上、IELTS 5.5以上等）',
    exemption: '英語の個別入試なし。英語資格スコアで出願資格を得た後は、小論文・面接のみで審査。',
    highlights: [
      '異文化コミュニケーション学部は英語力を軸に国際感覚を磨く',
      '英語開講科目比率が高く、グローバルな学習環境',
      '留学プログラムが充実。協定校は50カ国以上',
      '池袋という抜群のアクセスと都市型キャンパス',
      'マスコミ・広告・国際機関への就職者多数',
    ],
    tips: '英検準1級があれば、立教の看板学部「異文コミ」を英語試験なしで狙える。英語力を武器にした推薦で差をつけよう！',
    officialUrl: 'https://www.rikkyo.ac.jp/admissions/',
  },
  {
    level: 'pre1',
    levelLabel: '準1級',
    levelColor: 'from-purple-600 to-indigo-600',
    levelBadge: 'bg-purple-100 text-purple-800',
    university: '明治大学',
    faculty: '国際日本学部',
    examType: '英語4技能・資格・検定試験利用入試',
    location: '神奈川県川崎市',
    campus: '中野キャンパス（中野駅徒歩5分）',
    condition: '英検準1級以上（またはTOEFL iBT 72以上等）、評定平均3.5以上',
    exemption: '英語の個別試験を免除。国語・小論文等で審査。共通テスト不要。',
    highlights: [
      '日本文化・メディア・コミュニケーションを英語で学ぶユニークな学部',
      'グローバル人材育成に特化したカリキュラム',
      '海外大学との交換留学が充実',
      '中野の新キャンパスでモダンな学習環境',
      '明治ブランドの就職力でマスコミ・外資・IT企業へ',
    ],
    tips: '英検準1級があれば、明治大学の国際日本学部を英語試験免除で受験可能。英語と日本文化どちらも好きな人に最適！',
    officialUrl: 'https://www.meiji.ac.jp/isa/admission/',
  },
  {
    level: '2',
    levelLabel: '2級',
    levelColor: 'from-green-600 to-teal-600',
    levelBadge: 'bg-green-100 text-green-800',
    university: '関西大学',
    faculty: '商学部',
    examType: '公募制推薦入試',
    location: '大阪府吹田市',
    campus: '千里山キャンパス（大阪・梅田から便利）',
    condition: '英検2級以上（評定平均4.0以上、商業系資格等でも可）',
    exemption: '英語の個別試験なし。試験は小論文と面接のみ。英語は資格で代替可。',
    highlights: [
      '関関同立の一角。知名度・就職力ともに関西トップクラス',
      '公認会計士合格者数、関西私大最多レベル',
      '会計・マーケティング・ファイナンスなど5専修から選択',
      'ビジネスリーダー特別プログラム（BLSP）等の実践教育',
      '梅田・難波へのアクセス良好。インターンシップ充実',
    ],
    tips: '英検2級があれば関関同立の関大商学部を公募推薦で狙える！英語試験なしで小論文と面接の対策に集中できる。',
    officialUrl: 'https://www.nyusi.kansai-u.ac.jp/admission/recommendation_commerce/',
  },
  {
    level: '2',
    levelLabel: '2級',
    levelColor: 'from-green-600 to-teal-600',
    levelBadge: 'bg-green-100 text-green-800',
    university: '法政大学',
    faculty: '経済学部',
    examType: '英語外部試験利用入試（公募推薦型）',
    location: '東京都千代田区',
    campus: '市ヶ谷キャンパス（市ヶ谷・飯田橋エリア）',
    condition: '英検2級以上（またはTOEIC L&R 600以上等）、評定平均3.8以上',
    exemption: '英語の個別試験を英検スコアで代替。現代文・小論文と面接のみで合否判定。',
    highlights: [
      'MARCH（明治・青山・立教・中央・法政）の一校',
      '経済・経営・ファイナンスなど実践的なカリキュラム',
      '市ヶ谷という都心立地でインターンや就活に有利',
      '法政独自のキャリアサポートプログラムが充実',
      '卒業生ネットワークが強く、業界問わず幅広く活躍',
    ],
    tips: '英検2級でMARCHの法政大学経済学部に推薦で挑戦できる！英語試験なしで経済系の上位私大を狙える狙い目の入試。',
    officialUrl: 'https://www.hosei.ac.jp/admission/',
  },
  {
    level: '2',
    levelLabel: '2級',
    levelColor: 'from-green-600 to-teal-600',
    levelBadge: 'bg-green-100 text-green-800',
    university: '同志社大学',
    faculty: '商学部',
    examType: '英語資格活用型公募制推薦入試',
    location: '京都府京都市',
    campus: '今出川キャンパス（京都御所の隣）',
    condition: '英検2級以上（またはGTEC 800以上等）、評定平均4.0以上',
    exemption: '英語の独自試験なし。英語資格で出願し、小論文と面接のみで審査。共通テスト不要。',
    highlights: [
      '関関同立の中でも特に就職力・知名度が高い',
      '同志社の商学部はビジネス・経済系で関西最高峰クラス',
      '京都御所隣という歴史ある美しいキャンパス',
      '豊富な海外提携大学との留学プログラム',
      '企業からの評価が高く、大手企業内定率が抜群',
    ],
    tips: '英検2級で憧れの同志社大学商学部を公募推薦で受験可能！英語試験なしで関西TOP私大に挑戦できる絶好のチャンス。',
    officialUrl: 'https://www.doshisha.ac.jp/admissions/',
  },
];

function UniversityCard({ data }) {
  const [expanded, setExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [postText, setPostText] = useState('');
  const [postId, setPostId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [postStatus, setPostStatus] = useState('draft');
  const [error, setError] = useState('');

  const handleGeneratePost = async () => {
    setIsGenerating(true);
    setPostText('');
    setPostId(null);
    setPostStatus('draft');
    setError('');

    try {
      const res = await authFetch('/eiken/generate-university-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          university: data.university,
          level: data.level,
          faculty: data.faculty,
          condition: data.condition,
          exemption: data.exemption,
          tips: data.tips,
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        let event = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            event = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const d = JSON.parse(line.slice(6));
              if (event === 'final_post') {
                setPostText(d.post_text);
                setPostId(d.post_id);
              } else if (event === 'error') {
                setError(d.message);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (id) => {
    setIsPublishing(true);
    try {
      const res = await authFetch(`/eiken/posts/${id}/publish`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setPostStatus('posted');
    } catch (err) {
      setError(err.message);
      setPostStatus('failed');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${data.levelColor} p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              英検{data.levelLabel}で推薦出願可
            </span>
          </div>
          <h3 className="text-white font-bold text-lg leading-tight">{data.university}</h3>
          <p className="text-white/90 text-sm mt-0.5">{data.faculty}</p>
          <p className="text-white/75 text-xs mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {data.campus}
          </p>
        </div>

        {/* Exemption highlight */}
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex gap-3">
          <BadgeCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-0.5">英語試験の扱い</p>
            <p className="text-sm text-amber-700">{data.exemption}</p>
          </div>
        </div>

        {/* Condition */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-1">入試種別・出願条件</p>
          <p className="text-sm font-medium text-gray-800">{data.examType}</p>
          <p className="text-sm text-gray-600 mt-0.5">{data.condition}</p>
        </div>

        {/* Tips */}
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-800 font-medium">{data.tips}</p>
        </div>

        {/* Highlights accordion */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            この大学の魅力を見る
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-2">
            {data.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700">{h}</p>
              </div>
            ))}
            <a
              href={data.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              公式入試ページを見る
            </a>
          </div>
        )}

        {/* X Post generate button */}
        <div className="px-4 pb-4 pt-3 border-t border-gray-100">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {error}
            </div>
          )}
          <button
            onClick={handleGeneratePost}
            disabled={isGenerating}
            className="w-full py-2.5 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                X投稿を生成中...
              </>
            ) : (
              <>
                <Twitter className="w-4 h-4" />
                この大学のX投稿を生成
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inline post preview */}
      {postText && (
        <PostPreview
          platform="x"
          text={postText}
          onChange={postId ? setPostText : undefined}
          postId={postId}
          onPublish={handlePublish}
          isPublishing={isPublishing}
          status={postStatus}
        />
      )}
    </div>
  );
}

function UniversitySection() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="w-5 h-5 text-green-600" />
          <h2 className="font-bold text-gray-900">英検で推薦入試を勝ち取ろう！</h2>
        </div>
        <p className="text-sm text-gray-600">
          英検準1級・2級を持っていると、英語試験なしで推薦入試に出願できる大学があります。各大学のX投稿を生成してそのまま投稿できます。
        </p>
      </div>

      {UNIVERSITY_DATA.map(data => (
        <UniversityCard key={`${data.university}-${data.faculty}`} data={data} />
      ))}

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          ※ 入試情報は変更になる場合があります。出願前に必ず各大学の公式募集要項をご確認ください。
          記載の内容は2025〜2026年度入試情報をもとに作成しています。
        </p>
      </div>
    </div>
  );
}

// 一次試験（本会場）は全級共通日程。過去の日付は自動でスキップ（サーバー側 eiken.js と同期）
const EXAM_SCHEDULE = [
  { round: '2026年度第1回', date: '2026-05-31' },
  { round: '2026年度第2回', date: '2026-10-04' },
  { round: '2026年度第3回', date: '2027-01-24' },
];

function getNextExam() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const exam of EXAM_SCHEDULE) {
    const daysUntil = Math.ceil((new Date(exam.date) - today) / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0) return { ...exam, daysUntil };
  }
  return null;
}

// 投稿フォーマット（server/src/routes/eiken.js の POST_FORMATS と対応）
const POST_FORMAT_OPTIONS = [
  { value: 'quiz_reply', label: 'クイズ＋答えはリプ欄', desc: '本文はリンクなしのクイズ。解答とアプリリンクはリプライで自動投稿（リーチ重視・推奨）' },
  { value: 'value', label: '価値提供', desc: 'リンクなしのTips投稿。リーチを稼いでプロフィール経由でアプリへ誘導' },
  { value: 'promo', label: 'アプリ訴求', desc: '本文にApp Storeリンクを含める宣伝投稿。リーチが下がるため週1回程度に' },
];

function defaultFormat(questionType) {
  return ['vocabulary', 'grammar'].includes(questionType) ? 'quiz_reply' : 'value';
}

// 週間投稿カレンダー（docs/EIKEN_GROWTH_STRATEGY.md）。index = getDay()（0=日）
const WEEKLY_PLAN = [
  [ // 日
    { time: '朝', label: '文化表現・雑学', questionType: 'american_culture', format: 'value' },
    { time: '夜', label: '面接Tips', questionType: 'interview', format: 'value' },
  ],
  [ // 月
    { time: '朝', label: '語彙クイズ', questionType: 'vocabulary', format: 'quiz_reply' },
  ],
  [ // 火
    { time: '朝', label: '文法クイズ', questionType: 'grammar', format: 'quiz_reply' },
    { time: '夜', label: '学習のコツ', questionType: 'study_tips', format: 'value' },
  ],
  [ // 水
    { time: '朝', label: '語彙クイズ', questionType: 'vocabulary', format: 'quiz_reply' },
  ],
  [ // 木
    { time: '朝', label: '大学入試×英検', university: true },
    { time: '夜', label: '英語耳・リスニング', questionType: 'listening_tips', format: 'value' },
  ],
  [ // 金
    { time: '朝', label: '語彙クイズ', questionType: 'vocabulary', format: 'quiz_reply' },
  ],
  [ // 土
    { time: '朝', label: 'AI活用Tips', questionType: 'ai_tips', format: 'value' },
    { time: '夜', label: 'アプリ紹介（週1のリンク付き枠）', questionType: 'study_tips', format: 'promo' },
  ],
];

export default function EikenHome() {
  const [tab, setTab] = useState('x');
  const [aiMode] = useAiMode();
  const promptOnly = aiMode === 'prompt';

  const [questionType, setQuestionType] = useState('vocabulary');
  const [level, setLevel] = useState('2');
  const [format, setFormat] = useState(defaultFormat('vocabulary'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [postText, setPostText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [postId, setPostId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState('draft');
  const [script, setScript] = useState('');
  const [error, setError] = useState('');
  const [fallbackPrompt, setFallbackPrompt] = useState(null);

  const handleSelectQuestionType = (value) => {
    setQuestionType(value);
    setFormat(defaultFormat(value));
  };

  const handleSaveManualEiken = async (text) => {
    if (!text.trim()) return;
    try {
      const res = await authFetch('/eiken/save-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionType, level, format, body_text: text }),
      });
      const data = await res.json();
      if (data.post_id) {
        setPostText(data.post_text);
        setReplyText(data.reply_text || '');
        setPostId(data.post_id);
        setFallbackPrompt(null);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const handleGenerateX = async () => {
    setIsGenerating(true);
    setPostText('');
    setReplyText('');
    setPostId(null);
    setStatus('draft');
    setError('');
    setFallbackPrompt(null);

    try {
      const res = await authFetch('/eiken/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionType, level, format, prompt_only: promptOnly }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let event = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            event = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (event === 'final_post') {
                setPostText(data.post_text);
                setReplyText(data.reply_text || '');
                setPostId(data.post_id);
              } else if (event === 'fallback_prompt') {
                setFallbackPrompt(data);
              } else if (event === 'error') {
                setError(data.message);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateScript = async () => {
    setIsGenerating(true);
    setScript('');
    setError('');

    try {
      const res = await authFetch('/eiken/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionType, level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScript(data.script);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (id) => {
    setIsPublishing(true);
    setError('');
    try {
      // プレビューで編集した本文・解答リプを保存してから投稿する
      await authFetch(`/eiken/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_text: postText, reply_text: replyText || null }),
      });
      const res = await authFetch(`/eiken/posts/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.reply_error) setError(`本文は投稿されましたが、解答リプの投稿に失敗しました: ${data.reply_error}`);
      setStatus('posted');
    } catch (err) {
      setError(err.message);
      setStatus('failed');
    } finally {
      setIsPublishing(false);
    }
  };

  const levelLabel = EIKEN_LEVELS.find(l => l.value === level)?.label;
  const nextExam = getNextExam();
  const todayPlan = WEEKLY_PLAN[new Date().getDay()];

  const applyPlanSlot = (slot) => {
    if (slot.university) {
      setTab('university');
      return;
    }
    setTab('x');
    setQuestionType(slot.questionType);
    setFormat(slot.format);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg text-gray-900">英検コンテンツ生成</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <AiModeToggle />
            <Link
              to="/eiken/history"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <History className="w-4 h-4" />
              投稿履歴
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-4">
        {/* Exam countdown banner */}
        {tab !== 'university' && nextExam && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <CalendarClock className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-amber-800">
                英検{nextExam.round} 1次試験
              </span>
              <span className="text-amber-700">（{nextExam.date}）まで</span>
              <span className="font-bold text-amber-900 text-base ml-1">
                あと{nextExam.daysUntil}日！
              </span>
              {nextExam.daysUntil > 60 && (
                <span className="text-xs text-amber-600 ml-2">※投稿へのカウントダウン自動付与は60日前から</span>
              )}
            </div>
          </div>
        )}

        {/* Today's recommended posts (weekly content calendar) */}
        {todayPlan?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">
              📆 今日の推奨投稿（{['日', '月', '火', '水', '木', '金', '土'][new Date().getDay()]}曜日）— クリックで設定を反映
            </p>
            <div className="flex flex-wrap gap-2">
              {todayPlan.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => applyPlanSlot(slot)}
                  className="flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-800 border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors"
                >
                  <span className="font-bold">{slot.time}</span>
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Link to actual Eiken practice app */}
        {tab !== 'university' && APP_LINKS[level] && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <BookOpen className="w-5 h-5 text-blue-500 shrink-0" />
            <div className="text-sm text-blue-800">
              実際の英検問題を解きたい方は
              <a
                href={APP_LINKS[level].href}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 font-semibold text-blue-600 underline hover:text-blue-800"
              >
                {APP_LINKS[level].label}
              </a>
            </div>
          </div>
        )}

        {/* Tab */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
          <button
            onClick={() => setTab('x')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
              tab === 'x' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Twitter className="w-4 h-4" />
            X投稿
          </button>
          <button
            onClick={() => setTab('script')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
              tab === 'script'
                ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Video className="w-4 h-4" />
            TikTok / Reels 台本
          </button>
          <button
            onClick={() => setTab('university')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
              tab === 'university'
                ? 'bg-gradient-to-r from-green-600 to-teal-500 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            大学受験
          </button>
        </div>

        {/* Controls — hidden on university tab */}
        {tab !== 'university' && <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-500" />
            {tab === 'x' ? 'X投稿を生成する' : '動画台本を生成する'}
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">レベル</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {EIKEN_LEVELS.map(lv => (
                <button
                  key={lv.value}
                  onClick={() => setLevel(lv.value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    level === lv.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {lv.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">問題タイプ</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUESTION_TYPES.map(qt => (
                <button
                  key={qt.value}
                  onClick={() => handleSelectQuestionType(qt.value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    questionType === qt.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {qt.label}
                </button>
              ))}
            </div>
          </div>

          {tab === 'x' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">投稿フォーマット</label>
              <div className="space-y-2">
                {POST_FORMAT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFormat(opt.value)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                      format === opt.value
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-semibold ${format === opt.value ? 'text-green-700' : 'text-gray-700'}`}>
                      {opt.label}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={tab === 'x' ? handleGenerateX : handleGenerateScript}
            disabled={isGenerating}
            className={`w-full py-3 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              tab === 'x'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500'
            }`}
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                AIが生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                生成する
              </>
            )}
          </button>
        </div>}

        {/* Fallback prompt panel (X tab only) */}
        {tab === 'x' && fallbackPrompt && (
          <PromptFallbackPanel
            prompts={fallbackPrompt.prompts}
            reason={fallbackPrompt.reason || 'prompt_only'}
            errorMessage={fallbackPrompt.message}
            placeholder="外部AIで生成したX投稿本文をここに貼り付け（前後の固定文は自動付与されます）"
            saveLabel="本文を保存"
            onSave={handleSaveManualEiken}
          />
        )}

        {/* Output */}
        {tab === 'x' ? (
          <>
            <PostPreview
              platform="x"
              text={postText}
              onChange={postId ? setPostText : undefined}
              postId={postId}
              onPublish={handlePublish}
              isPublishing={isPublishing}
              status={status}
            />
            {replyText && (
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-800">
                  <span className="text-white font-semibold text-sm">💬 解答リプライ（本文の直後にスレッドとして自動投稿）</span>
                </div>
                <div className="p-4">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={5}
                    className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    アプリリンクはリプ側に付きます（本文をリンクなしに保つことでリーチ低下を防ぐ）
                  </p>
                </div>
              </div>
            )}
          </>
        ) : tab === 'script' ? (
          <ScriptPreview script={script} onScriptChange={setScript} />
        ) : null}

        {tab === 'university' && <UniversitySection />}
      </div>
    </div>
  );
}
