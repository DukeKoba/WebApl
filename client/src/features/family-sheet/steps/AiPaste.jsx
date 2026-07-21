import React, { useState } from 'react';
import { Copy, Check, ExternalLink, ArrowLeft } from 'lucide-react';
import { EXTRACT_PROMPT, parseAiResponse } from '../prompt';
import { normalizeExtracted } from '../schema';

// 経路B: 外部AIプロンプト方式(運営APIキー不要)。
// ①プロンプトをコピー → ②Claude.ai/ChatGPTで証券写真とともに実行 → ③結果を貼り戻す。
export default function AiPaste({ onExtracted, onBack, onManual }) {
  const [copied, setCopied] = useState(false);
  const [pasted, setPasted] = useState('');
  const [error, setError] = useState('');

  const copy = () => {
    navigator.clipboard.writeText(EXTRACT_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const apply = () => {
    setError('');
    const res = parseAiResponse(pasted);
    if (!res.ok) {
      setError('うまく読み取れませんでした。AIの回答のうち「{」から「}」までをコピーして貼り直してください。');
      return;
    }
    const { policies, warnings } = normalizeExtracted(res.data);
    if (policies.length === 0) {
      setError('保険の情報が見つかりませんでした。もう一度お試しいただくか、「自分で入力する」をご利用ください。');
      return;
    }
    onExtracted(policies, warnings);
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-stone-500 hover:text-stone-700">
        <ArrowLeft className="w-5 h-5" /> もどる
      </button>

      <div>
        <h2 className="text-2xl font-bold text-stone-900">AIに読み取ってもらう(無料)</h2>
        <p className="mt-2 text-stone-600 leading-relaxed">
          お手持ちの無料AI(Claude・ChatGPT)に、保険証券の写真を読み取ってもらいます。
          <strong>写真はこのサイトのサーバーを通りません。</strong>ご自身のAIアカウントの中だけで処理されます。
        </p>
      </div>

      <ol className="space-y-4">
        <li className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="font-bold text-emerald-900 mb-2">① 下の文をコピーする</div>
          <button
            onClick={copy}
            className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-white font-semibold hover:bg-emerald-800"
          >
            {copied ? <><Check className="w-5 h-5" />コピーしました</> : <><Copy className="w-5 h-5" />文をコピー</>}
          </button>
          <pre className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white border border-stone-200 p-3 text-xs text-stone-600">{EXTRACT_PROMPT}</pre>
        </li>

        <li className="rounded-xl border border-stone-200 p-4">
          <div className="font-bold text-stone-800 mb-2">② AIを開いて、貼り付け＋証券の写真を送る</div>
          <div className="flex flex-wrap gap-2">
            <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2.5 text-white font-semibold hover:bg-orange-600">
              <ExternalLink className="w-4 h-4" />Claudeを開く
            </a>
            <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 rounded-lg bg-stone-700 px-4 py-2.5 text-white font-semibold hover:bg-stone-800">
              <ExternalLink className="w-4 h-4" />ChatGPTを開く
            </a>
          </div>
          <p className="mt-2 text-sm text-stone-500">
            開いた画面に、コピーした文を貼り付け、保険証券の写真を添付して送信してください。
          </p>
        </li>

        <li className="rounded-xl border border-stone-200 p-4">
          <div className="font-bold text-stone-800 mb-2">③ AIの答えを、まるごと貼り付ける</div>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={6}
            placeholder="AIが返した文をここに貼り付けてください"
            className="w-full rounded-lg border border-stone-300 p-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={apply}
            disabled={!pasted.trim()}
            className="mt-3 w-full rounded-lg bg-emerald-700 py-3 text-lg font-semibold text-white hover:bg-emerald-800 disabled:bg-stone-300"
          >
            読み取り結果を取り込む
          </button>
        </li>
      </ol>

      <button onClick={onManual} className="w-full text-center text-emerald-700 underline">
        うまくいかないときは「自分で入力する」に切りかえる
      </button>
    </div>
  );
}
