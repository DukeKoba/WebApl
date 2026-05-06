import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, History, ArrowLeft, Twitter, Video, Copy, Check, CalendarClock, GraduationCap, BadgeCheck, MapPin, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import PostPreview from '../../components/shared/PostPreview';
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
];

function UniversityCard({ data }) {
  const [expanded, setExpanded] = useState(false);

  return (
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
          英検準1級・2級を持っていると、英語試験なしで推薦入試に出願できる大学があります。各1校ずつ厳選して紹介します。
        </p>
      </div>

      {UNIVERSITY_DATA.map(data => (
        <UniversityCard key={data.level} data={data} />
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

const EXAM_DATES = { '2': '2026-05-31' };

function getDaysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function EikenHome() {
  const [tab, setTab] = useState('x');
  const [questionType, setQuestionType] = useState('vocabulary');
  const [level, setLevel] = useState('2');
  const [isGenerating, setIsGenerating] = useState(false);
  const [postText, setPostText] = useState('');
  const [postId, setPostId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState('draft');
  const [script, setScript] = useState('');
  const [error, setError] = useState('');

  const handleGenerateX = async () => {
    setIsGenerating(true);
    setPostText('');
    setPostId(null);
    setStatus('draft');
    setError('');

    try {
      const res = await authFetch('/eiken/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionType, level }),
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
                setPostId(data.post_id);
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
    try {
      const res = await authFetch(`/eiken/posts/${id}/publish`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setStatus('posted');
    } catch (err) {
      setError(err.message);
      setStatus('failed');
    } finally {
      setIsPublishing(false);
    }
  };

  const levelLabel = EIKEN_LEVELS.find(l => l.value === level)?.label;

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
          <Link
            to="/eiken/history"
            className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <History className="w-4 h-4" />
            投稿履歴
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-4">
        {/* Exam countdown banner */}
        {tab !== 'university' && EXAM_DATES[level] && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <CalendarClock className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-amber-800">
                英検{EIKEN_LEVELS.find(l => l.value === level)?.label} 1次試験
              </span>
              <span className="text-amber-700">（{EXAM_DATES[level]}）まで</span>
              <span className="font-bold text-amber-900 text-base ml-1">
                あと{getDaysUntil(EXAM_DATES[level])}日！
              </span>
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
                  onClick={() => setQuestionType(qt.value)}
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

        {/* Output */}
        {tab === 'x' ? (
          <PostPreview
            platform="x"
            text={postText}
            onChange={postId ? setPostText : undefined}
            postId={postId}
            onPublish={handlePublish}
            isPublishing={isPublishing}
            status={status}
          />
        ) : tab === 'script' ? (
          <ScriptPreview script={script} onScriptChange={setScript} />
        ) : null}

        {tab === 'university' && <UniversitySection />}
      </div>
    </div>
  );
}
