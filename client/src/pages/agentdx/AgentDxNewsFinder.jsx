import React, { useEffect, useState } from 'react';
import { ExternalLink, Globe, Link2, Loader2, Newspaper, RefreshCw, Sparkles } from 'lucide-react';
import { authFetch } from '../../utils/api';
import PromptFallbackPanel from '../../components/shared/PromptFallbackPanel';

function isForeign(language) {
  return Boolean(language) && !String(language).toLowerCase().startsWith('ja');
}

/**
 * 最新ニュースを取得して要約し、投稿ドラフトにつなげるパネル。
 * - 「最新ニュースを探す」→ 候補一覧 → 「この記事で投稿を作る」
 * - 海外（英語など）の記事URLを直接貼っても、日本語に翻訳・要約して投稿化できる
 * - APIキーが無い環境ではプロンプト方式にフォールバックし、外部AIの結果を貼り戻せる
 */
export default function AgentDxNewsFinder({ contentType, onError, onGenerateFromSource, isGenerating }) {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [fallbackPrompt, setFallbackPrompt] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    setItems([]);
    setMessage('');
    setFallbackPrompt(null);
  }, [contentType]);

  const searchNews = async () => {
    setSearching(true);
    setMessage('');
    setItems([]);
    setFallbackPrompt(null);
    onError('');

    try {
      const res = await authFetch('/agentdx/news-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType }),
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
              if (event === 'news_items') {
                setItems(data.items || []);
                setMessage(data.items?.length
                  ? `${data.items.length}件の候補を取得しました。`
                  : '直近90日の該当ニュースが見つかりませんでした。別の種別で試してください。');
              } else if (event === 'status') {
                setMessage(data.message);
              } else if (event === 'fallback_prompt') {
                setFallbackPrompt(data);
                setMessage('');
              } else if (event === 'error') {
                onError(data.message);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setSearching(false);
    }
  };

  // 外部AIが返したJSONを候補一覧に変換する
  const handleParsePasted = async (text) => {
    if (!text.trim()) return;
    setParsing(true);
    onError('');
    try {
      const res = await authFetch('/agentdx/news-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ニュース候補を読み取れませんでした。');
      setItems(data.items || []);
      setFallbackPrompt(null);
      setMessage(`${data.items.length}件の候補を読み取りました。`);
    } catch (err) {
      onError(err.message);
    } finally {
      setParsing(false);
    }
  };

  const generateFromItem = (item) => {
    onGenerateFromSource({
      sourceUrl: item.url,
      sourceText: [item.title, item.summary, item.impact].filter(Boolean).join('\n'),
      // 海外記事（language が ja 以外）は型C（海外ニュース翻訳型）で書かせる
      sourceLanguage: item.language || undefined,
    });
  };

  const generateFromManualUrl = () => {
    const url = manualUrl.trim();
    if (!/^https?:\/\/\S+$/.test(url)) {
      onError('http:// または https:// で始まる記事URLを入力してください。');
      return;
    }
    onError('');
    onGenerateFromSource({ sourceUrl: url });
  };

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white">
          <Newspaper className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold text-gray-900">最新ニュースを探して投稿にする</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
            直近90日の一次情報を検索し、日本語で要約します。候補を選ぶとその記事だけを根拠に投稿ドラフトを作ります。
          </p>
        </div>
      </div>

      <button
        onClick={searchNews}
        disabled={searching || isGenerating}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-gray-300"
      >
        {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        最新ニュースを探す
      </button>

      {message && <p className="mt-3 text-xs text-gray-500">{message}</p>}

      {/* 記事URLを直接指定する導線（海外記事もOK） */}
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
          <Link2 className="h-3.5 w-3.5" />
          記事URLを直接指定して投稿を作る
        </label>
        <p className="mt-1 flex items-start gap-1 text-[11px] leading-relaxed text-sky-700">
          <Globe className="mt-0.5 h-3 w-3 shrink-0" />
          海外記事のURLでもOK（英語などの記事は日本語に翻訳・要約します）
        </p>
        <div className="mt-2 flex gap-2">
          <input
            type="url"
            value={manualUrl}
            onChange={event => setManualUrl(event.target.value)}
            placeholder="https://... （国内・海外どちらのニュース記事でも可）"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
          <button
            onClick={generateFromManualUrl}
            disabled={!manualUrl.trim() || isGenerating}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:bg-gray-300"
          >
            <Sparkles className="h-3.5 w-3.5" />
            この記事で作る
          </button>
        </div>
      </div>

      {fallbackPrompt && (
        <div className="mt-4">
          <PromptFallbackPanel
            prompts={fallbackPrompt.prompts}
            reason={fallbackPrompt.reason}
            errorMessage={fallbackPrompt.message}
            placeholder="外部AIが返したニュース一覧（JSON）をここに貼り付け"
            saveLabel="ニュース候補として読み込む"
            onSave={handleParsePasted}
            busy={parsing}
          />
        </div>
      )}

      <div className="mt-4 space-y-3">
        {items.map(item => (
          <article key={item.url} className="overflow-hidden rounded-xl border border-gray-200">
            <div className="p-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                {item.date && <span className="rounded bg-gray-100 px-1.5 py-0.5 font-semibold text-gray-600">{item.date}</span>}
                {isForeign(item.language) && (
                  <span className="flex items-center gap-1 rounded bg-sky-50 px-1.5 py-0.5 font-semibold text-sky-700">
                    <Globe className="h-3 w-3" />海外記事・日本語要約
                  </span>
                )}
              </div>
              <strong className="mt-2 block text-sm leading-snug text-gray-900">{item.title}</strong>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-gray-600">{item.summary}</p>
              {item.impact && (
                <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-amber-900">
                  現場への影響: {item.impact}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 border-t border-gray-100">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4" />原文を確認
              </a>
              <button
                onClick={() => generateFromItem(item)}
                disabled={isGenerating}
                className="flex items-center justify-center gap-1.5 border-l border-gray-100 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:text-gray-400"
              >
                <Sparkles className="h-4 w-4" />この記事で投稿を作る
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
