import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Sparkles, History, ArrowLeft } from 'lucide-react';
import PostPreview from '../../components/shared/PostPreview';
import { authFetch } from '../../utils/api';
import PromptFallbackPanel from '../../components/shared/PromptFallbackPanel';
import AgentDxStrategyPanel from './AgentDxStrategyPanel';
import AgentDxImageStudio from './AgentDxImageStudio';
import AgentDxNewsFinder from './AgentDxNewsFinder';

const NEWS_TYPES = [
  { value: 'ins_news', label: '保険業界ニュース' },
  { value: 'law_reform', label: '法改正・規制動向' },
  { value: 'new_products', label: '新商品・金融商品' },
  { value: 'market_data', label: '市場動向・統計' },
  { value: 'disaster_risk', label: '災害・リスク情報' },
  { value: 'agency_ops', label: '代理店経営・運営' },
  { value: 'consumer_trend', label: '顧客・消費者動向' },
  { value: 'global_ins', label: 'グローバル・海外動向' },
  { value: 'trend_watch', label: '代理店DXトレンド' },
];

const CONVERSION_TYPES = [
  { value: 'efficiency_tips', label: '業務効率化Tips' },
  { value: 'app_demo', label: 'アプリ実演・制作実況' },
  { value: 'law_check', label: '業法対応チェック' },
  { value: 'case_story', label: '業務改善ミニ事例' },
];

const CONVERSION_VALUES = CONVERSION_TYPES.map(t => t.value);

export default function AgentDxHome() {
  const [contentType, setContentType] = useState('ins_news');
  const [sourceText, setSourceText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [postText, setPostText] = useState('');
  const [postId, setPostId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');
  const [fallbackPrompt, setFallbackPrompt] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isSavingPinned, setIsSavingPinned] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const isConversionType = CONVERSION_VALUES.includes(contentType);
  const isOriginalPost = isConversionType || contentType === 'pinned_app';

  const generateDefaultImage = async (id, text, accent = 'emerald') => {
    setIsGeneratingImage(true);
    try {
      const headline = String(text || '').split('\n').find(line => line.trim()) || '代理店業務を、もっとシンプルに。';
      const res = await authFetch(`/agentdx/posts/${id}/image/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, accent, kicker: 'AIで、代理店の現場を前へ。' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '投稿画像を生成できませんでした。');
      setImageUrl(`${data.image_url}?v=${Date.now()}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // source: { sourceUrl?, sourceText? } — ニュース候補や記事URLから生成する場合に渡す
  const handleGenerate = async (source = {}) => {
    setIsGenerating(true);
    setPostText('');
    setPostId(null);
    setStatus('draft');
    setError('');
    setStatusMessage('');
    setFallbackPrompt(null);
    setImageUrl('');

    try {
      const res = await authFetch('/agentdx/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          sourceUrl: source.sourceUrl || undefined,
          sourceText: source.sourceText || sourceText.trim() || undefined,
        }),
      });

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
              const data = JSON.parse(line.slice(6));
              if (event === 'final_post') {
                setPostText(data.post_text);
                setPostId(data.post_id);
                setStatusMessage('');
                if (isConversionType) void generateDefaultImage(data.post_id, data.post_text);
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
        if (isConversionType) void generateDefaultImage(data.post_id, data.post_text);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreatePinned = async (text) => {
    setIsSavingPinned(true);
    setError('');
    try {
      const res = await authFetch('/agentdx/save-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: 'pinned_app', post_text: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '固定ポスト案を保存できませんでした。');
      setContentType('pinned_app');
      setPostText(data.post_text);
      setPostId(data.post_id);
      setImageUrl('');
      setFallbackPrompt(null);
      setStatus('draft');
      void generateDefaultImage(data.post_id, data.post_text, 'violet');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSavingPinned(false);
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
            <div className="leading-tight">
              <h1 className="font-bold text-lg text-gray-900">Cocreo 代理店DX X投稿</h1>
              <p className="text-[11px] text-gray-500">価値提供から業務改善相談・受注へ</p>
            </div>
          </div>
          <div className="ml-auto">
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

      <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-4">
        <AgentDxStrategyPanel
          onSelectContentType={setContentType}
          onCreatePinned={handleCreatePinned}
          isSavingPinned={isSavingPinned}
        />
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">投稿戦略：</strong>
            ニュースは最新記事を検索・要約して、出典URL付きの自分の言葉で発信します（海外記事は日本語に翻訳・要約）。
            業務Tips・アプリ実演・業法チェックはオリジナル画像付きで発信し、プロフィール→固定ポストへの導線を作ります。
            開発実績を公開できるまで、投稿本文に自社サイトのリンクは入れません。
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            投稿テーマを選ぶ
          </h2>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ニュース系 <span className="font-normal text-gray-400">（集客・フォロー獲得）</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {NEWS_TYPES.map(ct => (
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              転換系 <span className="font-normal text-gray-400">（アプリ流入・受注につなげる）</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CONVERSION_TYPES.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => setContentType(ct.value)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors text-center ${
                    contentType === ct.value
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
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

          {isConversionType && (
            <>
              <div className="mb-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700">素材・メモ <span className="font-normal text-gray-400">（任意）</span></label>
                <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} rows={3} placeholder="例: 今週デモした内容、削減できた時間の実測値、投稿に入れたい数字など" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <button onClick={() => handleGenerate()} disabled={isGenerating || isGeneratingImage} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                {isGenerating || isGeneratingImage ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{isGeneratingImage ? '投稿画像を生成中...' : (statusMessage || '投稿を生成中...')}</> : <><Sparkles className="w-4 h-4" />投稿文＋画像を生成する</>}
              </button>
            </>
          )}
        </div>

        {!isOriginalPost && (
          <AgentDxNewsFinder
            contentType={contentType}
            onError={setError}
            onGenerateFromSource={handleGenerate}
            isGenerating={isGenerating || isGeneratingImage}
          />
        )}

        {fallbackPrompt && (
          <PromptFallbackPanel
            prompts={fallbackPrompt.prompts}
            reason={fallbackPrompt.reason}
            errorMessage={fallbackPrompt.message}
            placeholder="外部AIで生成したX投稿文をここに貼り付け"
            saveLabel="投稿を保存"
            onSave={handleSaveManual}
          />
        )}

        <AgentDxImageStudio
          postId={postId}
          postText={postText}
          imageUrl={imageUrl}
          onImageSet={setImageUrl}
          onError={setError}
        />

        <PostPreview
          platform="x"
          text={postText}
          onChange={postId ? setPostText : undefined}
          postId={postId}
          onPublish={handlePublish}
          isPublishing={isPublishing}
          status={status}
          imageUrl={imageUrl}
        />
      </div>
    </div>
  );
}
