import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Sparkles, History, ArrowLeft } from 'lucide-react';
import PostPreview from '../../components/shared/PostPreview';
import { authFetch } from '../../utils/api';
import AiModeToggle, { useAiMode } from '../../components/shared/AiModeToggle';
import PromptFallbackPanel from '../../components/shared/PromptFallbackPanel';

const CONTENT_TYPES = [
  { value: 'ins_news', label: '保険業界ニュース' },
  { value: 'law_reform', label: '法改正・規制動向' },
  { value: 'new_products', label: '新商品・金融商品' },
  { value: 'market_data', label: '市場動向・統計' },
  { value: 'disaster_risk', label: '災害・リスク情報' },
  { value: 'agency_ops', label: '代理店経営・運営' },
  { value: 'consumer_trend', label: '顧客・消費者動向' },
  { value: 'global_ins', label: 'グローバル・海外動向' },
];

export default function AgentDxHome() {
  const [aiMode] = useAiMode();
  const promptOnly = aiMode === 'prompt';

  const [contentType, setContentType] = useState('ins_news');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [postText, setPostText] = useState('');
  const [postId, setPostId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');
  const [fallbackPrompt, setFallbackPrompt] = useState(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setPostText('');
    setPostId(null);
    setStatus('draft');
    setError('');
    setStatusMessage('');
    setFallbackPrompt(null);

    try {
      const res = await authFetch('/agentdx/generate', {
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
                setStatusMessage('');
              } else if (event === 'status') {
                setStatusMessage(data.message);
              } else if (event === 'fallback_prompt') {
                setFallbackPrompt(data);
                setStatusMessage('');
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

  const handleSaveManual = async (text) => {
    if (!text.trim()) return;
    try {
      const res = await authFetch('/agentdx/save-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, post_text: text }),
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

  const handlePublish = async (id) => {
    setIsPublishing(true);
    try {
      const res = await authFetch(`/agentdx/posts/${id}/publish`, { method: 'POST' });
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
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg text-gray-900">代理店DX X投稿</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <AiModeToggle />
            <Link
              to="/agentdx/history"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <History className="w-4 h-4" />
              投稿履歴
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">投稿戦略：</strong>
            保険業界の最新ニュース・法改正・新商品情報などをいち早く発信し、
            代理店経営者・担当者のフォロー獲得とCocreoブランド認知向上を目指します。
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
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
                      ? 'bg-indigo-600 text-white'
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
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {statusMessage || 'AIが生成中...'}
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
            placeholder="外部AIで生成したX投稿文をここに貼り付け"
            saveLabel="投稿を保存"
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
