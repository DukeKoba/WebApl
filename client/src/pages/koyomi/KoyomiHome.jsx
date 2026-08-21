import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scroll, Sparkles, History, ArrowLeft, Copy, Check, Download, Zap,
  Flame, HelpCircle, CheckCircle2, RefreshCw, AlertTriangle, BookOpen, Layers
} from 'lucide-react';
import PostPreview from '../../components/shared/PostPreview';
import XLogo from '../../components/shared/XLogo';
import AiModeToggle, { useAiMode } from '../../components/shared/AiModeToggle';
import PromptFallbackPanel from '../../components/shared/PromptFallbackPanel';
import { authFetch } from '../../utils/api';

const HISTORY_TYPES = [
  {
    value: 'japanese_center_qa',
    label: '🇯🇵 日本史 センター1問1答',
    badge: '共通テスト良問',
    badgeColor: 'bg-amber-600 text-white',
    desc: '正誤判定・因果関係・年表把握の1問1答',
    color: 'from-amber-600 to-red-600',
  },
  {
    value: 'world_center_qa',
    label: '🌍 世界史 センター1問1答',
    badge: '共通テスト良問',
    badgeColor: 'bg-blue-600 text-white',
    desc: '王朝史・革命・世界の一体化の1問1答',
    color: 'from-blue-600 to-indigo-600',
  },
  {
    value: 'same_era_qa',
    label: '🔄 同時代比較 センター1問1答',
    badge: '差がつく良問',
    badgeColor: 'bg-purple-600 text-white',
    desc: '「同じ年に世界では？」を問う横断1問1答',
    color: 'from-purple-600 to-pink-600',
  },
  {
    value: 'japanese_history',
    label: '🇯🇵 日本史 要点・因果解説',
    badge: '流れと因果',
    badgeColor: 'bg-gray-700 text-white',
    desc: '幕府・改革・明治維新の重要ポイント',
    color: 'from-gray-700 to-gray-900',
  },
  {
    value: 'world_history',
    label: '🌍 世界史 要点・因果解説',
    badge: '流れと因果',
    badgeColor: 'bg-gray-700 text-white',
    desc: '市民革命・大航海・冷戦の重要ポイント',
    color: 'from-gray-700 to-gray-900',
  },
  {
    value: 'mnemonic',
    label: '💡 年号の覚え方（ゴロ合わせ）',
    badge: '暗記ハック',
    badgeColor: 'bg-teal-600 text-white',
    desc: '紛らわしい重要年号の語呂合わせ',
    color: 'from-teal-600 to-cyan-600',
  },
];

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

function HistoryBatchSection() {
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
      const res = await authFetch('/koyomi/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 7 }),
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
      const res = await authFetch(`/koyomi/posts/${postId}/publish`, { method: 'POST' });
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
      <div className="bg-gradient-to-r from-amber-800 via-orange-800 to-yellow-900 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h2 className="font-bold text-lg">歴史 1週間分（7問）の一括量産ジェネレーター</h2>
        </div>
        <p className="text-sm text-amber-100 leading-relaxed mb-4">
          日本史共テ問・世界史共テ問・同時代比較・因果関係解説・年号ゴロ合わせなど、1週間分のストックを一撃で自動生成します。
        </p>

        <button
          onClick={handleGenerateBatch}
          disabled={isGenerating}
          className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:from-gray-500 disabled:to-gray-600 text-gray-900 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-gray-900" />
              <span>7問一括生成中... ({progress?.current || 0}/7)</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-gray-900" />
              <span>1週間分（7投稿）を一括生成する</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {isGenerating && progress && (
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm space-y-2">
          <div className="flex justify-between text-xs font-semibold text-gray-700">
            <span className="flex items-center gap-1.5 text-amber-700">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              【{progress.itemDay}】{progress.itemTitle} を生成中...
            </span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-600 to-orange-600 h-2 transition-all duration-300 rounded-full"
              style={{ width: `${(progress.current / (progress.total || 7)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {batchPosts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              生成された1週間分の歴史問題 ({batchPosts.length}件)
            </h3>
            <span className="text-xs text-gray-500">下書きに自動保存済み</span>
          </div>

          <div className="space-y-4">
            {batchPosts.map((p, idx) => (
              <div key={p.post_id || idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-amber-50/70 px-4 py-2.5 flex items-center justify-between border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-700 text-white font-bold text-xs px-2 py-0.5 rounded">
                      {p.day || `Day ${idx + 1}`}
                    </span>
                    <span className="font-bold text-xs text-gray-800">{p.title}</span>
                  </div>
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

export default function KoyomiHome() {
  const [tab, setTab] = useState('single');
  const [aiMode] = useAiMode();
  const promptOnly = aiMode === 'prompt';

  const [contentType, setContentType] = useState('japanese_center_qa');
  const [isGenerating, setIsGenerating] = useState(false);
  const [postText, setPostText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [postId, setPostId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');
  const [fallbackPrompt, setFallbackPrompt] = useState(null);

  const resetOutput = () => {
    setPostText('');
    setReplyText('');
    setPostId(null);
    setStatus('draft');
    setError('');
    setFallbackPrompt(null);
  };

  const handleGeneratePost = async () => {
    setIsGenerating(true);
    resetOutput();

    try {
      const res = await authFetch('/koyomi/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, prompt_only: promptOnly }),
      });

      await readSse(res, (event, data) => {
        if (event === 'final_post') {
          setPostText(data.post_text);
          setReplyText(data.reply_text || '');
          setPostId(data.post_id);
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

  const handlePublish = async (id) => {
    setIsPublishing(true);
    try {
      const res = await authFetch(`/koyomi/posts/${id}/publish`, { method: 'POST' });
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

  const tabs = [
    { value: 'single', label: '📜 センター1問1答 生成', icon: Scroll, color: 'bg-gradient-to-r from-amber-700 to-orange-600 text-white' },
    { value: 'batch', label: '⚡ 1週間分 一括量産', icon: Zap, color: 'bg-gradient-to-r from-yellow-600 to-amber-700 text-white' },
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
              <div className="w-8 h-8 bg-gradient-to-br from-amber-700 to-orange-600 rounded-lg flex items-center justify-center shadow-xs">
                <Scroll className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base text-gray-900 leading-tight">日本史・世界史 X投稿ジェネレーター</h1>
                <p className="text-[11px] text-gray-500">センター試験・共通テスト1問1答 ＆ Koyomi連動</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AiModeToggle />
            <Link
              to="/koyomi/history"
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
          <a
            href={KOYOMI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/60 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            App Store
          </a>
        </div>

        {tab === 'batch' && <HistoryBatchSection />}

        {tab === 'single' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <span className="text-xs font-bold text-gray-800 block">問題タイプ・ジャンルを選択</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {HISTORY_TYPES.map(h => {
                  const isSelected = contentType === h.value;
                  return (
                    <button
                      key={h.value}
                      onClick={() => setContentType(h.value)}
                      className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-gray-900">{h.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${h.badgeColor}`}>
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
                  authFetch('/koyomi/save-manual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contentType, body_text: text }),
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
