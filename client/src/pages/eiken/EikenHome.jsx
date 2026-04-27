import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, History, ArrowLeft, Twitter, Video, Copy, Check, CalendarClock } from 'lucide-react';
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
  { value: '3', label: '3級' },
  { value: '4', label: '4級' },
  { value: '5', label: '5級' },
];

const APP_LINKS = {
  pre1: {
    href: 'https://apps.apple.com/us/app/ai%E8%8B%B1%E6%A4%9C%E6%BA%961%E7%B4%9A-pass/id6762535365',
    label: 'AI英検Pass準1',
  },
  '2': {
    href: 'https://apps.apple.com/jp/app/ai%E8%8B%B1%E6%A4%9Cpass-%EF%BC%92%E7%B4%9A/id6761838561',
    label: 'AI英検Pass2級',
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
        {EXAM_DATES[level] && (
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
        {APP_LINKS[level] && (
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
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
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
        </div>

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
        ) : (
          <ScriptPreview script={script} onScriptChange={setScript} />
        )}
      </div>
    </div>
  );
}
