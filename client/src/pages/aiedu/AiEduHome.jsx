import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, History, ArrowLeft, Search } from 'lucide-react';
import PostPreview from '../../components/shared/PostPreview';
import { authFetch } from '../../utils/api';
import AiModeToggle, { useAiMode } from '../../components/shared/AiModeToggle';
import PromptFallbackPanel from '../../components/shared/PromptFallbackPanel';

const CONTENT_TYPES = [
  { value: 'subsidy_news', label: '補助金最新情報' },
  { value: 'subsidy_howto', label: '補助金活用ノウハウ' },
  { value: 'ai_dx', label: 'AI業務改善事例' },
  { value: 'ai_smb', label: '中小企業AI活用' },
  { value: 'ai_efficiency', label: '業務効率化Tips' },
  { value: 'ai_tools', label: 'AIツール業務活用' },
  { value: 'claude_biz', label: 'Claude業務活用' },
  { value: 'chatgpt_biz', label: 'ChatGPT業務活用' },
  { value: 'insurance_ai', label: '保険×AI活用' },
  { value: 'mvp', label: 'MVP開発事例' },
  { value: 'vibecoding', label: 'バイブコーディング' },
  { value: 'cocreo_voice', label: 'Cocreoの視点' },
];

export default function AiEduHome() {
  const [aiMode] = useAiMode();
  const promptOnly = aiMode === 'prompt';

  const [contentType, setContentType] = useState('subsidy_news');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentAgent, setCurrentAgent] = useState('');
  const [postText, setPostText] = useState('');
  const [hadNewsContext, setHadNewsContext] = useState(false);
  const [sources, setSources] = useState([]);
  const [postId, setPostId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');
  const [fallbackPrompt, setFallbackPrompt] = useState(null);

  const agentNames = {
    marketer: 'マーケティングのプロ',
    copywriter: '有名コピーライター',
    consultant: 'デジタルマーケティングコンサルタント',
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage('');
    setMessages([]);
    setPostText('');
    setHadNewsContext(false);
    setSources([]);
    setPostId(null);
    setStatus('draft');
    setError('');
    setFallbackPrompt(null);

    try {
      const res = await authFetch('/aiedu/generate', {
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
              if (event === 'status') {
                setStatusMessage(data.message);
              } else if (event === 'agent_message') {
                setCurrentAgent(agentNames[data.agent] || data.name);
                setMessages(prev => [...prev, data]);
              } else if (event === 'final_post') {
                setPostText(data.post_text);
                setPostId(data.post_id);
                setHadNewsContext(!!data.had_news_context);
                setSources(Array.isArray(data.sources) ? data.sources : []);
                setStatusMessage('');
                setCurrentAgent('');
              } else if (event === 'fallback_prompt') {
                setFallbackPrompt(data);
                setStatusMessage('');
                setCurrentAgent('');
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
      setCurrentAgent('');
    }
  };

  const handleSaveManual = async (text) => {
    if (!text.trim()) return;
    try {
      const res = await authFetch('/aiedu/save-manual', {
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
      const res = await authFetch(`/aiedu/posts/${id}/publish`, { method: 'POST' });
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
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <h1 className="font-bold text-lg text-gray-900">Cocreo X投稿ジェネレーター</h1>
              <p className="text-[11px] text-gray-500 tracking-wide">AI業務改善・補助金活用を発信</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <AiModeToggle />
            <Link
              to="/aiedu/history"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <History className="w-4 h-4" />
              投稿履歴
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-4">
        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
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
                      ? 'bg-violet-600 text-white'
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
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
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
            placeholder="外部AIで生成したX投稿文をここに貼り付けて保存"
            saveLabel="X投稿を保存"
            onSave={handleSaveManual}
          />
        )}

        {/* News context badge & sources */}
        {postText && hadNewsContext && (
          <div className="text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2.5 space-y-2">
            <div className="flex items-center gap-1.5 font-medium">
              <Search className="w-3.5 h-3.5 flex-shrink-0" />
              最新ニュースをWeb検索して生成しました
            </div>
            {sources.length > 0 && (
              <ul className="space-y-1 pl-5 list-disc marker:text-violet-400">
                {sources.map((s, i) => (
                  <li key={i} className="break-all">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 hover:underline"
                    >
                      {s.title || s.url}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Post Preview */}
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
