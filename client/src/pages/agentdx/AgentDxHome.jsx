import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Sparkles, History, ArrowLeft } from 'lucide-react';
import PostPreview from '../../components/shared/PostPreview';
import { authFetch } from '../../utils/api';
import PromptFallbackPanel from '../../components/shared/PromptFallbackPanel';

const NEWS_TYPES = [
  { value: 'ins_news', label: '保険業界ニュース' },
  { value: 'law_reform', label: '法改正・規制動向' },
  { value: 'new_products', label: '新商品・金融商品' },
  { value: 'market_data', label: '市場動向・統計' },
  { value: 'disaster_risk', label: '災害・リスク情報' },
  { value: 'agency_ops', label: '代理店経営・運営' },
  { value: 'consumer_trend', label: '顧客・消費者動向' },
  { value: 'global_ins', label: 'グローバル・海外動向' },
];

const CONVERSION_TYPES = [
  { value: 'efficiency_tips', label: '業務効率化Tips' },
  { value: 'app_demo', label: 'アプリ実演・制作実況' },
  { value: 'law_check', label: '業法対応チェック' },
];

const CONVERSION_VALUES = CONVERSION_TYPES.map(t => t.value);

export default function AgentDxHome() {
  const [contentType, setContentType] = useState('ins_news');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [postText, setPostText] = useState('');
  const [postId, setPostId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');
  const [fallbackPrompt, setFallbackPrompt] = useState(null);

  const isConversionType = CONVERSION_VALUES.includes(contentType);

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
        body: JSON.stringify({
          contentType,
          sourceUrl: isConversionType ? undefined : (sourceUrl.trim() || undefined),
          sourceText: sourceText.trim() || undefined,
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
            <h1 className="font-bold text-lg text-gray-900">保険ニュース X投稿</h1>
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

      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">投稿戦略：</strong>
            ニュースは「いち早く」ではなく「現場への影響が一番わかりやすい形」に翻訳して毎日発信（集客）。
            業務Tips・アプリ実演・業法チェックの投稿でプロフィール→固定ポスト→アプリへの導線を作り、
            無料ツール経由の相談・受注につなげます。
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            投稿を生成する
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

          {!isConversionType && (
            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                出典記事のURL <span className="font-normal text-gray-400">（推奨）</span>
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://... 業界紙・保険会社リリース等の記事URL"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="text-xs text-gray-400 leading-relaxed">
                URLを入れると、その記事だけを根拠に投稿を作成します（誤報防止のため推奨）。
                空欄の場合はWeb検索で直近3ヶ月のニュースを探します。
              </p>
            </div>
          )}

          <div className="mb-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {isConversionType ? '素材・メモ' : '記事本文の貼り付け'}{' '}
              <span className="font-normal text-gray-400">（任意）</span>
            </label>
            <textarea
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
              rows={3}
              placeholder={
                isConversionType
                  ? '例: 今週デモした内容、削減できた時間の実測値、投稿に入れたい数字など'
                  : '記事の本文やポイントを貼り付けると、その内容だけを根拠に作成します'
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
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
                {statusMessage || 'ニュースを調査・編集中...'}
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
            reason={fallbackPrompt.reason}
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
