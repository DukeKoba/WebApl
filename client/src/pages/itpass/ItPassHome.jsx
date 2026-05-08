import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, History, ArrowLeft, CalendarClock } from 'lucide-react';
import PostPreview from '../../components/shared/PostPreview';
import { authFetch } from '../../utils/api';
import AiModeToggle, { useAiMode } from '../../components/shared/AiModeToggle';
import PromptFallbackPanel from '../../components/shared/PromptFallbackPanel';

// マーケ + IT資格講師チームで合意した「DLにつながる投稿カテゴリ12種」
const CONTENT_TYPES = [
  { value: 'past_question', label: '過去問チラ見せ' },
  { value: 'mnemonic', label: '覚え方・ゴロ' },
  { value: 'study_tips', label: '勉強法' },
  { value: 'ai_utilize', label: 'AI活用' },
  { value: 'security', label: 'セキュリティ' },
  { value: 'network', label: 'ネットワーク' },
  { value: 'database', label: 'データベース' },
  { value: 'tech_basics', label: '基礎理論' },
  { value: 'tech_computer', label: 'コンピュータ構成' },
  { value: 'strategy', label: 'ストラテジ系' },
  { value: 'management', label: 'マネジメント系' },
  { value: 'news_law', label: 'ニュース・法務' },
  { value: 'terminology', label: 'IT用語解説' },
  { value: 'calculation', label: '計算問題特訓' },
  { value: 'real_world', label: '実務活用' },
];

export default function ItPassHome() {
  const [aiMode] = useAiMode();
  const promptOnly = aiMode === 'prompt';

  const [contentType, setContentType] = useState('past_question');
  const [isGenerating, setIsGenerating] = useState(false);
  const [postText, setPostText] = useState('');
  const [postId, setPostId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');
  const [examInfo, setExamInfo] = useState(null);
  const [fallbackPrompt, setFallbackPrompt] = useState(null);

  useEffect(() => {
    authFetch('/itpass/exam-info')
      .then(r => r.json())
      .then(setExamInfo)
      .catch(() => {});
  }, []);

  const handleSaveManual = async (text) => {
    if (!text.trim()) return;
    try {
      const res = await authFetch('/itpass/save-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, body_text: text }),
      });
      const data = await res.json();
      if (data.post_id) {
        setPostText(data.post_text);
        setPostId(data.post_id);
        setFallbackPrompt(null);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setPostText('');
    setPostId(null);
    setStatus('draft');
    setError('');
    setFallbackPrompt(null);

    try {
      const res = await authFetch('/itpass/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, prompt_only: promptOnly }),
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

  const handlePublish = async (id) => {
    setIsPublishing(true);
    try {
      const res = await authFetch(`/itpass/posts/${id}/publish`, { method: 'POST' });
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg text-gray-900">ITパスポート X投稿</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <AiModeToggle />
            <Link
              to="/itpass/history"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <History className="w-4 h-4" />
              投稿履歴
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-4">
        {examInfo?.daysUntil != null && (
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 flex items-center gap-2 text-sm text-cyan-800">
            <CalendarClock className="w-4 h-4" />
            試験日（{examInfo.examDate}）まであと <strong className="mx-1">{examInfo.daysUntil}</strong> 日 — 全投稿に自動でカウントダウンが入ります
          </div>
        )}

        {/* Strategy callout（マーケ + 講師チームの企画意図を可視化） */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">投稿戦略：</strong>
            「過去問チラ見せ→続きはアプリで」型のフックと、講師監修のシラバス準拠コンテンツを組み合わせて、
            保存・シェア・アプリDLを最大化します。CTAとハッシュタグは自動付与。
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            投稿を生成する
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">コンテンツタイプ</label>
            <div className="grid grid-cols-3 gap-2">
              {CONTENT_TYPES.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => setContentType(ct.value)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors text-center ${
                    contentType === ct.value
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {ct.label}
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
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
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

        {fallbackPrompt && (
          <PromptFallbackPanel
            prompts={fallbackPrompt.prompts}
            reason={fallbackPrompt.reason || 'prompt_only'}
            errorMessage={fallbackPrompt.message}
            placeholder="外部AIで生成したX投稿本文をここに貼り付け（前後の固定文は自動付与されます）"
            saveLabel="本文を保存"
            onSave={handleSaveManual}
          />
        )}

        <PostPreview
          platform="x"
          text={postText}
          onChange={postId ? setPostText : undefined}
          postId={postId}
          onPublish={handlePublish}
          isPublishing={isPublishing}
          status={status}
        />
      </div>
    </div>
  );
}
