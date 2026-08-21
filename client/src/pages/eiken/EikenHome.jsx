import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Sparkles, History, ArrowLeft, Video, Copy, Check, CalendarClock,
  GraduationCap, BadgeCheck, MapPin, Trophy, ChevronDown, ChevronUp, Scroll,
  Download, Layers, Zap, Flame, Mic, Lightbulb, HelpCircle, CheckCircle2,
  Calendar, RefreshCw, AlertTriangle
} from 'lucide-react';
import PostPreview from '../../components/shared/PostPreview';
import XLogo from '../../components/shared/XLogo';
import AiModeToggle, { useAiMode } from '../../components/shared/AiModeToggle';
import PromptFallbackPanel from '../../components/shared/PromptFallbackPanel';
import { authFetch } from '../../utils/api';

// 🔥 AI英検 キラーコンテンツ
const KILLER_QUESTION_TYPES = [
  {
    value: 'ai_writing_correction',
    label: 'AI英作文 添削',
    badge: '最重要・保存率No.1',
    badgeColor: 'bg-red-500 text-white',
    icon: Flame,
    desc: '生徒の惜しい英文 ➔ AI赤ペン解説 ➔ 合格答案',
    color: 'from-rose-500 to-red-600',
    borderColor: 'border-red-200 hover:border-red-400',
  },
  {
    value: 'ai_interview',
    label: 'AI面接 模範回答',
    badge: '2次面接対策',
    badgeColor: 'bg-purple-600 text-white',
    icon: Mic,
    desc: '面接官の質問 ➔ ❌落ちる回答 vs ⭕AI満点回答',
    color: 'from-purple-600 to-indigo-600',
    borderColor: 'border-purple-200 hover:border-purple-400',
  },
  {
    value: 'native_vs_japanese',
    label: 'ネイティブ違和感表現',
    badge: '知的好奇心フック',
    badgeColor: 'bg-amber-500 text-white',
    icon: Lightbulb,
    desc: '日本人が直訳しがちな英語 vs 自然な高得点英語',
    color: 'from-amber-500 to-yellow-600',
    borderColor: 'border-amber-200 hover:border-amber-400',
  },
  {
    value: 'controversial_quiz',
    label: '議論・リプ誘発クイズ',
    badge: 'リプ欄活性化',
    badgeColor: 'bg-blue-500 text-white',
    icon: HelpCircle,
    desc: '正答率20%の罠問題・なぜ間違いかをリプで議論',
    color: 'from-blue-600 to-cyan-600',
    borderColor: 'border-blue-200 hover:border-blue-400',
  },
  {
    value: 'thread_summary',
    label: '要点まとめスレッド',
    badge: '滞在時間UP',
    badgeColor: 'bg-teal-600 text-white',
    icon: Layers,
    desc: '神テンプレ・頻出構文の3〜4連ツイート',
    color: 'from-teal-600 to-emerald-600',
    borderColor: 'border-teal-200 hover:border-teal-400',
  },
];

const STANDARD_QUESTION_TYPES = [
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
  { value: 'pre1', label: '準1級', badge: '上級・大学レベル' },
  { value: '2', label: '2級', badge: '高校生・推薦入試' },
  { value: 'pre2', label: '準2級', badge: '中高生・基礎固め' },
  { value: 'pre2plus', label: '準2級プラス', badge: '新設・ステップUP' },
  { value: '3', label: '3級', badge: '中学生' },
  { value: '4', label: '4級', badge: '小中学生' },
  { value: '5', label: '5級', badge: '初級' },
];

const HISTORY_TYPES = [
  {
    value: 'japanese_center_qa',
    label: '🇯🇵 日本史 センター1問1答',
    badge: '共通テスト良問',
    desc: '正誤判定・因果関係・年表把握の1問1答',
    color: 'from-amber-600 to-red-600',
  },
  {
    value: 'world_center_qa',
    label: '🌍 世界史 センター1問1答',
    badge: '共通テスト良問',
    desc: '王朝史・革命・世界の一体化の1問1答',
    color: 'from-blue-600 to-indigo-600',
  },
  {
    value: 'same_era_qa',
    label: '🔄 同時代比較 センター1問1答',
    badge: '差がつく良問',
    desc: '「同じ年に世界では？」を問う横断1問1答',
    color: 'from-purple-600 to-pink-600',
  },
  {
    value: 'japanese_history',
    label: '日本史 要点解説',
    badge: '流れと因果',
    desc: '幕府・改革・明治維新の重要ポイント',
    color: 'from-gray-700 to-gray-900',
  },
  {
    value: 'world_history',
    label: '世界史 要点解説',
    badge: '流れと因果',
    desc: '市民革命・大航海・冷戦の重要ポイント',
    color: 'from-gray-700 to-gray-900',
  },
  {
    value: 'mnemonic',
    label: '年号の覚え方（ゴロ合わせ）',
    badge: '暗記ハック',
    desc: '紛らわしい重要年号の語呂合わせ',
    color: 'from-teal-600 to-cyan-600',
  },
];

const APP_LINKS = {
  pre1: { href: 'https://apps.apple.com/jp/app/id6762535365', label: 'AI英検準1級 Pass' },
  '2': { href: 'https://apps.apple.com/jp/app/id6761838561', label: '英検2級Pass｜AI英作文・面接対策' },
  pre2: { href: 'https://apps.apple.com/jp/app/id6762229086', label: 'AI英検準2級 Pass' },
  pre2plus: { href: 'https://apps.apple.com/jp/app/id6762537264', label: 'AI英検準2級プラス Pass' },
};

const KOYOMI_URL = 'https://apps.apple.com/jp/app/id6794647918';

async function readSse(res, onEvent) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let event = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        event = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        try {
          onEvent(event, JSON.parse(line.slice(6)));
        } catch {}
      }
    }
  }
}

function ScriptPreview({ script, onScriptChange }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(script || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!script) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-pink-500 to-orange-400">
        <Video className="w-5 h-5 text-white" />
        <span className="text-white font-semibold text-sm">TikTok / Reels 動画台本</span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">台本（約30秒）</span>
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

// 1週間分一括バッチ生成ビュー
function BatchGenerationSection({ level, setLevel }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [batchPosts, setBatchPosts] = useState([]);
  const [publishingIds, setPublishingIds] = useState({});
  const [postStatuses, setPostStatuses] = useState({});
  const [error, setError] = useState('');

  const handleGenerateBatch = async () => {
    setIsGenerating(true);
    setProgress({ current: 0, total: 7, itemTitle: '準備中...' });
    setBatchPosts([]);
    setError('');

    try {
      const res = await authFetch('/eiken/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, count: 7 }),
      });

      await readSse(res, (event, data) => {
        if (event === 'batch_progress') {
          setProgress(data);
        } else if (event === 'batch_complete') {
          setBatchPosts(data.posts || []);
        } else if (event === 'error') {
          setError(data.message);
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishPost = async (postId) => {
    setPublishingIds(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await authFetch(`/eiken/posts/${postId}/publish`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setPostStatuses(prev => ({ ...prev, [postId]: 'posted' }));
    } catch (err) {
      alert(`投稿失敗: ${err.message}`);
    } finally {
      setPublishingIds(prev => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* 説明カード */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h2 className="font-bold text-lg">1週間分（7投稿）の一括量産ジェネレーター</h2>
        </div>
        <p className="text-sm text-blue-100 leading-relaxed mb-4">
          Xのアルゴリズムで最も伸びる「曜日別黄金比率」で、AI添削・ネイティブ表現・議論クイズ・面接・要点スレッドなど7日分の投稿ストックを一撃で自動生成します。
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1.5 border border-white/20">
            <span className="text-xs text-white/80 font-medium px-2">対象の級:</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="bg-black/40 text-white font-bold text-sm rounded px-2.5 py-1 focus:outline-none"
            >
              {EIKEN_LEVELS.map(lv => (
                <option key={lv.value} value={lv.value} className="text-gray-900 bg-white">
                  英検{lv.label} ({lv.badge})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateBatch}
            disabled={isGenerating}
            className="flex-1 min-w-[200px] py-3 px-5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:from-gray-500 disabled:to-gray-600 text-gray-900 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-gray-900" />
                <span>7件一括生成中... ({progress?.current || 0}/7)</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-gray-900" />
                <span>1週間分（7投稿）を一括生成する</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 進捗バー */}
      {isGenerating && progress && (
        <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm space-y-2">
          <div className="flex justify-between text-xs font-semibold text-gray-700">
            <span className="flex items-center gap-1.5 text-blue-600">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              【{progress.itemDay}】{progress.itemTitle} を生成中...
            </span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 transition-all duration-300 rounded-full"
              style={{ width: `${(progress.current / (progress.total || 7)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 一括生成結果リスト */}
      {batchPosts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              生成された1週間分の投稿 ({batchPosts.length}件)
            </h3>
            <span className="text-xs text-gray-500">下書きに自動保存済み</span>
          </div>

          <div className="space-y-4">
            {batchPosts.map((p, idx) => (
              <div key={p.post_id || idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-100 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white font-bold text-xs px-2 py-0.5 rounded">
                      {p.day || `Day ${idx + 1}`}
                    </span>
                    <span className="font-bold text-xs text-gray-800">{p.title}</span>
                  </div>
                  {p.metadata?.is_thread && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                      スレッド連ツイ
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <PostPreview
                    platform="x"
                    text={p.post_text}
                    postId={p.post_id}
                    onPublish={handlePublishPost}
                    isPublishing={publishingIds[p.post_id]}
                    status={postStatuses[p.post_id] || 'draft'}
                    ctaText={p.reply_text}
                    isThread={p.metadata?.is_thread}
                    threadPosts={p.metadata?.thread_posts || []}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const UNIVERSITY_DATA = [
  {
    id: 'aoyama-kokusai',
    level: 'pre1',
    levelLabel: '準1級',
    levelColor: 'from-purple-600 to-indigo-600',
    university: '青山学院大学',
    faculty: '文学部 英米文学科',
    examType: '自己推薦入試',
    campus: '青山キャンパス（渋谷駅徒歩10分）',
    condition: '英検準1級以上（評定不問）',
    exemption: '英語の筆記試験免除。書類審査と面接（英語含む）・小論文のみ。',
    tips: '英検準1級を持っていれば、共通テストなしで青学に挑戦できる狙い目の入試。評定不問なのも嬉しいポイント！',
    officialUrl: 'https://www.aoyama.ac.jp/admission/undergraduate/examination/recommendation_self.html',
    highlights: [
      '渋谷・表参道エリアの抜群の立地',
      '英語ネイティブ教員多数。授業の多くが英語で実施',
      '就職実績抜群。マスコミ・外資・国際機関への就職者多数',
    ],
  },
  {
    id: 'rikkyo-ic',
    level: 'pre1',
    levelLabel: '準1級',
    levelColor: 'from-purple-600 to-indigo-600',
    university: '立教大学',
    faculty: '異文化コミュニケーション学部',
    examType: '自由選抜入試（英語重視型）',
    campus: '池袋キャンパス（池袋駅徒歩7分）',
    condition: '英検準1級以上（またはTOEFL iBT 72以上等）',
    exemption: '英語の個別入試なし。英語資格スコアで出願資格を得た後は、小論文・面接のみ。',
    tips: '英検準1級があれば、立教の看板学部「異文コミ」を英語試験なしで狙える！',
    officialUrl: 'https://www.rikkyo.ac.jp/admissions/',
    highlights: [
      '看板学部で国際感覚を磨く',
      '留学プログラムが充実（協定校50カ国以上）',
      'マスコミ・広告・国際機関への就職者多数',
    ],
  },
  {
    id: 'kandai-shogaku',
    level: '2',
    levelLabel: '2級',
    levelColor: 'from-green-600 to-teal-600',
    university: '関西大学',
    faculty: '商学部',
    examType: '公募制推薦入試',
    campus: '千里山キャンパス（大阪）',
    condition: '英検2級以上（評定平均4.0以上等）',
    exemption: '英語の個別試験なし。試験は小論文と面接のみ。',
    tips: '英検2級があれば関関同立の関大商学部を公募推薦で狙える！',
    officialUrl: 'https://www.nyusi.kansai-u.ac.jp/admission/recommendation_commerce/',
    highlights: [
      '公認会計士合格者数、関西私大最多レベル',
      '就職力・知名度ともに関西トップクラス',
    ],
  },
  {
    id: 'hosei-keizai',
    level: '2',
    levelLabel: '2級',
    levelColor: 'from-green-600 to-teal-600',
    university: '法政大学',
    faculty: '経済学部',
    examType: '英語外部試験利用入試（公募推薦型）',
    campus: '市ヶ谷キャンパス（東京）',
    condition: '英検2級以上、評定平均3.8以上',
    exemption: '英語の個別試験を英検スコアで代替。現代文・小論文と面接のみ。',
    tips: '英検2級でMARCHの法政大学経済学部に推薦で挑戦できる！',
    officialUrl: 'https://www.hosei.ac.jp/admission/',
    highlights: [
      'MARCHの一角。都心市ヶ谷立地で就活に強い',
      '実践的な経済・経営カリキュラム',
    ],
  },
];

function UniversityCard({ data }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [postText, setPostText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [postId, setPostId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [postStatus, setPostStatus] = useState('draft');
  const [error, setError] = useState('');

  const handleGeneratePost = async () => {
    setIsGenerating(true);
    setPostText('');
    setReplyText('');
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

      await readSse(res, (event, d) => {
        if (event === 'final_post') {
          setPostText(d.post_text);
          setReplyText(d.reply_text || '');
          setPostId(d.post_id);
        } else if (event === 'error') {
          setError(d.message);
        }
      });
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
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className={`bg-gradient-to-r ${data.levelColor} p-4 text-white`}>
          <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
            英検{data.levelLabel}で推薦出願可
          </span>
          <h3 className="font-bold text-lg mt-1">{data.university}</h3>
          <p className="text-sm opacity-90">{data.faculty}</p>
          <p className="text-xs opacity-75 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {data.campus}
          </p>
        </div>

        <div className="bg-amber-50 border-b border-amber-100 p-3 flex gap-2.5">
          <BadgeCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-900 block">英語試験の扱い</span>
            <span className="text-amber-800">{data.exemption}</span>
          </div>
        </div>

        <div className="p-3 border-b border-gray-100 text-xs">
          <span className="font-semibold text-gray-500 block mb-0.5">出願条件</span>
          <span className="text-gray-800 font-medium">{data.condition}</span>
        </div>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleGeneratePost}
            disabled={isGenerating}
            className="w-full py-2.5 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                X投稿を生成中...
              </>
            ) : (
              <>
                <XLogo className="w-3.5 h-3.5" />
                この大学のX投稿を生成
              </>
            )}
          </button>
        </div>
      </div>

      {postText && (
        <PostPreview
          platform="x"
          text={postText}
          onChange={postId ? setPostText : undefined}
          postId={postId}
          onPublish={handlePublish}
          isPublishing={isPublishing}
          status={postStatus}
          ctaText={replyText}
        />
      )}
    </div>
  );
}

export default function EikenHome() {
  const [tab, setTab] = useState('single');
  const [aiMode] = useAiMode();
  const promptOnly = aiMode === 'prompt';

  const [questionType, setQuestionType] = useState('ai_writing_correction');
  const [level, setLevel] = useState('2');
  const [historyType, setHistoryType] = useState('japanese_center_qa');
  const [isGenerating, setIsGenerating] = useState(false);
  const [postText, setPostText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [postId, setPostId] = useState(null);
  const [isThread, setIsThread] = useState(false);
  const [threadPosts, setThreadPosts] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState('draft');
  const [script, setScript] = useState('');
  const [error, setError] = useState('');
  const [fallbackPrompt, setFallbackPrompt] = useState(null);
  const [examInfo, setExamInfo] = useState(null);

  useEffect(() => {
    authFetch('/eiken/exam-info')
      .then(res => res.json())
      .then(setExamInfo)
      .catch(() => {});
  }, []);

  const isHistoryTab = tab === 'history';

  const resetOutput = () => {
    setPostText('');
    setReplyText('');
    setPostId(null);
    setIsThread(false);
    setThreadPosts([]);
    setStatus('draft');
    setError('');
    setFallbackPrompt(null);
  };

  const handleGeneratePost = async () => {
    setIsGenerating(true);
    resetOutput();

    const endpoint = isHistoryTab ? '/eiken/generate-history' : '/eiken/generate';
    const payload = isHistoryTab
      ? { contentType: historyType, prompt_only: promptOnly }
      : { questionType, level, prompt_only: promptOnly };

    try {
      const res = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      await readSse(res, (event, data) => {
        if (event === 'final_post') {
          setPostText(data.post_text);
          setReplyText(data.reply_text || '');
          setPostId(data.post_id);
          if (data.is_thread) {
            setIsThread(true);
            setThreadPosts(data.thread_posts || []);
          }
        } else if (event === 'fallback_prompt') {
          setFallbackPrompt(data);
        } else if (event === 'error') {
          setError(data.message);
        }
      });
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
    try {
      const res = await authFetch(`/eiken/posts/${id}/publish`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setStatus('posted');
      if (result.reply_error) {
        setError(`本文は投稿できましたが、リプライに失敗しました: ${result.reply_error}`);
      }
    } catch (err) {
      setError(err.message);
      setStatus('failed');
    } finally {
      setIsPublishing(false);
    }
  };

  const next = examInfo?.next;

  const tabs = [
    { value: 'single', label: '🔥 AI英検 特化投稿', icon: Flame, color: 'bg-red-600 text-white' },
    { value: 'batch', label: '⚡ 1週間分 一括量産', icon: Zap, color: 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white' },
    { value: 'script', label: '🎬 動画台本', icon: Video, color: 'bg-gradient-to-r from-pink-500 to-orange-400 text-white' },
    { value: 'university', label: '🎓 大学推薦入試', icon: GraduationCap, color: 'bg-gradient-to-r from-green-600 to-teal-600 text-white' },
    { value: 'history', label: '📜 日本史・世界史', icon: Scroll, color: 'bg-gradient-to-r from-amber-600 to-orange-500 text-white' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-500 rounded-lg flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base text-gray-900 leading-tight">AI英検 SNSグロースエンジン</h1>
                <p className="text-[11px] text-gray-500">バズ特化フォーマット＆1週間一括量産</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AiModeToggle />
            <Link
              to="/eiken/history"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
            >
              <History className="w-4 h-4 text-gray-500" />
              投稿履歴
            </Link>
          </div>
        </div>
      </div>

      {/* Main Tab Nav */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => {
                  setTab(t.value);
                  resetOutput();
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? `${t.color} shadow-sm scale-[1.02]`
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* 試験カウントダウン */}
        {next && tab !== 'history' && tab !== 'university' && (
          <div className="flex items-center gap-3 bg-amber-50/90 border border-amber-200 rounded-xl px-4 py-2.5">
            <CalendarClock className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-900">{next.round} 一次試験（{next.primaryDate}）まで</span>
              <span className="font-extrabold text-amber-900 text-sm ml-1.5">あと{next.daysUntil}日</span>
            </div>
          </div>
        )}

        {/* 1週間一括バッチ生成タブ */}
        {tab === 'batch' && (
          <BatchGenerationSection level={level} setLevel={setLevel} />
        )}

        {/* 単発AI英検特化生成タブ */}
        {tab === 'single' && (
          <div className="space-y-4">
            {/* 級選択 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700">対象の級を選択</span>
                {APP_LINKS[level] && (
                  <span className="text-[11px] text-blue-600 font-medium">
                    連動アプリ: {APP_LINKS[level].label}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {EIKEN_LEVELS.map((lv) => (
                  <button
                    key={lv.value}
                    onClick={() => setLevel(lv.value)}
                    className={`py-2 px-1 rounded-lg text-center font-bold text-xs transition-all ${
                      level === lv.value
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div>{lv.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* キラーコンテンツ選択カード */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5 px-1">
                <Flame className="w-4 h-4 text-red-500" />
                AI英検 5大キラーフォーマット（拡散＆保存特化）
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {KILLER_QUESTION_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = questionType === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setQuestionType(type.value)}
                      className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? `border-red-600 bg-red-50/40 shadow-sm ring-1 ring-red-500`
                          : `bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg text-white bg-gradient-to-r ${type.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-sm text-gray-900">{type.label}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${type.badgeColor}`}>
                          {type.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-snug">{type.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 基礎タイプ選択（アコーディオン） */}
            <details className="bg-white rounded-xl border border-gray-200 p-3 shadow-xs">
              <summary className="text-xs font-semibold text-gray-600 cursor-pointer flex items-center justify-between">
                <span>📚 その他の通常フォーマット（語彙・文法・Tipsなど）</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </summary>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-3">
                {STANDARD_QUESTION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setQuestionType(type.value)}
                    className={`p-2 rounded-lg text-xs font-medium text-left border transition-all ${
                      questionType === type.value
                        ? 'border-gray-900 bg-gray-900 text-white font-bold'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </details>

            {/* 生成ボタン */}
            <button
              onClick={handleGeneratePost}
              disabled={isGenerating}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:from-gray-400 disabled:to-gray-500 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI英検コンテンツを生成中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>X投稿を生成する</span>
                </>
              )}
            </button>

            {/* エラー表示 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {error}
              </div>
            )}

            {/* プロンプトフォールバック */}
            {fallbackPrompt && (
              <PromptFallbackPanel
                prompts={fallbackPrompt.prompts}
                onSaveManual={(text) => {
                  authFetch('/eiken/save-manual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questionType, level, body_text: text }),
                  })
                    .then(r => r.json())
                    .then(d => {
                      setPostText(d.post_text);
                      setReplyText(d.reply_text);
                      setPostId(d.post_id);
                      setFallbackPrompt(null);
                    });
                }}
              />
            )}

            {/* プレビュー */}
            {postText && (
              <PostPreview
                platform="x"
                text={postText}
                onChange={postId ? setPostText : undefined}
                postId={postId}
                onPublish={handlePublish}
                isPublishing={isPublishing}
                status={status}
                ctaText={replyText}
                isThread={isThread}
                threadPosts={threadPosts}
                onThreadChange={setThreadPosts}
              />
            )}
          </div>
        )}

        {/* 動画台本タブ */}
        {tab === 'script' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <span className="text-xs font-bold text-gray-700 block">テーマと級の選択</span>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {EIKEN_LEVELS.map(lv => (
                  <button
                    key={lv.value}
                    onClick={() => setLevel(lv.value)}
                    className={`py-1.5 px-1 rounded-lg text-center font-bold text-xs ${
                      level === lv.value ? 'bg-pink-600 text-white' : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {lv.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerateScript}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                TikTok / Reels 動画台本を生成
              </button>
            </div>
            {script && <ScriptPreview script={script} onScriptChange={setScript} />}
          </div>
        )}

        {/* 大学受験タブ */}
        {tab === 'university' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-5 h-5 text-green-600" />
                <h2 className="font-bold text-gray-900">英検で推薦入試を勝ち取ろう！</h2>
              </div>
              <p className="text-xs text-gray-600">
                英検2級・準1級で英語試験免除になる大学の紹介ポストを生成できます。
              </p>
            </div>
            {UNIVERSITY_DATA.map(data => (
              <UniversityCard key={data.id} data={data} />
            ))}
          </div>
        )}

        {/* 日本史・世界史タブ */}
        {tab === 'history' && (
          <div className="space-y-4">
            {/* Koyomi 導線バナー */}
            <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-600 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
              <div>
                <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  Koyomi -暦- 連動
                </span>
                <h2 className="font-extrabold text-base mt-1">センター試験・共通テスト 1問1答ジェネレーター</h2>
                <p className="text-xs text-amber-100 mt-0.5">
                  正誤判定や因果関係を問う良問を生成。リプライに正解解説とKoyomiアプリリンクが付きます。
                </p>
              </div>
              <Scroll className="w-8 h-8 text-amber-200 shrink-0 opacity-80" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <span className="text-xs font-bold text-gray-800 block">問題タイプ・ジャンルを選択</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {HISTORY_TYPES.map(h => {
                  const isSelected = historyType === h.value;
                  return (
                    <button
                      key={h.value}
                      onClick={() => setHistoryType(h.value)}
                      className={`text-left p-3 rounded-xl border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-gray-900">{h.label}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {h.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">{h.desc}</p>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleGeneratePost}
                disabled={isGenerating}
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>センター1問1答を生成中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>センター試験レベルの1問1答を生成</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {error}
              </div>
            )}

            {fallbackPrompt && (
              <PromptFallbackPanel
                prompts={fallbackPrompt.prompts}
                onSaveManual={(text) => {
                  authFetch('/eiken/save-manual-history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contentType: historyType, body_text: text }),
                  })
                    .then(r => r.json())
                    .then(d => {
                      setPostText(d.post_text);
                      setReplyText(d.reply_text);
                      setPostId(d.post_id);
                      setFallbackPrompt(null);
                    });
                }}
              />
            )}

            {postText && (
              <PostPreview
                platform="x"
                text={postText}
                onChange={postId ? setPostText : undefined}
                postId={postId}
                onPublish={handlePublish}
                isPublishing={isPublishing}
                status={status}
                ctaText={replyText}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
