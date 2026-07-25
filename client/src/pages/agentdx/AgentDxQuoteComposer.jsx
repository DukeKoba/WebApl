import React, { useState } from 'react';
import { Loader2, Quote, Sparkles } from 'lucide-react';
import { authFetch } from '../../utils/api';
import PromptFallbackPanel from '../../components/shared/PromptFallbackPanel';
import { xWeightedLength, X_MAX_WEIGHTED } from '../../utils/xText';

const X_STATUS_URL_RE = /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[^/]+\/status\/\d+/i;

/**
 * 引用ポスト（リポストの置き換え）。
 * X APIでは「本文＋対象ツイートURL」で引用が成立するため、
 * 引用元URLに対する自分の解釈を1〜2行だけ生成し、本文＋URLで投稿する。
 * URLは長さに関わらず加重23単位で数えられる点を考慮している。
 */
export default function AgentDxQuoteComposer({ onDraft, onError, isBusy, highlight }) {
  const [quoteUrl, setQuoteUrl] = useState('');
  const [quotedText, setQuotedText] = useState('');
  const [note, setNote] = useState('');
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [fallbackPrompt, setFallbackPrompt] = useState(null);

  const urlOk = X_STATUS_URL_RE.test(quoteUrl.trim());
  // URL=23単位ぶんを引いた、コメント本文に使える残り
  const commentBudget = X_MAX_WEIGHTED - 23 - 2;

  const handleGenerate = async () => {
    if (!urlOk) {
      onError('引用する投稿のURL（https://x.com/ユーザー名/status/...）を入力してください。');
      return;
    }
    setGenerating(true);
    setStatusMessage('');
    setFallbackPrompt(null);
    onError('');

    try {
      const res = await authFetch('/agentdx/quote-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteUrl: quoteUrl.trim(),
          quotedText: quotedText.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });

      if (!res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        throw new Error(data.error || '引用ポストを生成できませんでした。');
      }

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
                onDraft({ postId: data.post_id, postText: data.post_text });
                setStatusMessage('');
              } else if (event === 'status') {
                setStatusMessage(data.message);
              } else if (event === 'fallback_prompt') {
                setFallbackPrompt(data);
                setStatusMessage('');
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
      setGenerating(false);
    }
  };

  // 外部AIが返したコメントを保存する（APIキーが無い環境のフォールバック）
  const handleSaveManual = async (text) => {
    const comment = text.trim();
    if (!comment) return;
    try {
      const res = await authFetch('/agentdx/save-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'quote_post',
          post_text: `${comment}\n\n${quoteUrl.trim()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '引用ポストを保存できませんでした。');
      onDraft({ postId: data.post_id, postText: data.post_text });
      setFallbackPrompt(null);
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <section className={`rounded-xl border bg-white p-5 ${highlight ? 'border-violet-400 ring-2 ring-violet-100' : 'border-violet-200'}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
          <Quote className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold text-gray-900">引用ポストを作る</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
            他の投稿に「自分の解釈」を1〜2行だけ足して引用します。リポストと違い、自分の言葉が残るのでフォロー理由になります。
            引用ポストは性質上URLを1本含むため、コメントは加重{commentBudget}単位（全角約{Math.floor(commentBudget / 2)}字）までに収めます。
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700">引用したい投稿のURL</label>
          <input
            type="url"
            value={quoteUrl}
            onChange={e => setQuoteUrl(e.target.value)}
            placeholder="https://x.com/ユーザー名/status/1234567890"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          {quoteUrl.trim() && !urlOk && (
            <p className="mt-1 text-[11px] text-red-500">x.com / twitter.com の投稿URL（/status/…）を入力してください。</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700">
            引用元の投稿の内容 <span className="font-normal text-gray-400">（貼り付け推奨）</span>
          </label>
          <textarea
            value={quotedText}
            onChange={e => setQuotedText(e.target.value)}
            rows={3}
            placeholder="引用元の本文をそのまま貼り付けてください。貼り付けた内容だけを根拠に解釈を書きます（誤読防止）"
            className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700">
            自分が言いたいこと <span className="font-normal text-gray-400">（任意・最優先で反映されます）</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="例: 現場では記録の残し方の方が先に効く、という角度で書きたい"
            className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!urlOk || generating || isBusy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:bg-gray-300"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? (statusMessage || '解釈を生成中...') : '引用ポストの下書きを作る'}
        </button>

        {quotedText.trim() && (
          <p className="text-[11px] text-gray-400">
            貼り付けた内容の加重文字数: {xWeightedLength(quotedText)}（参考値）
          </p>
        )}
      </div>

      {fallbackPrompt && (
        <div className="mt-4">
          <PromptFallbackPanel
            prompts={fallbackPrompt.prompts}
            reason={fallbackPrompt.reason}
            errorMessage={fallbackPrompt.message}
            placeholder="外部AIが返した引用コメントをここに貼り付け（引用元URLは自動で付きます）"
            saveLabel="引用ポストを保存"
            onSave={handleSaveManual}
          />
        </div>
      )}
    </section>
  );
}
