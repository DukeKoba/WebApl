import React, { useState } from 'react';
import { Copy, Check, ClipboardPaste, Save, Sparkles, AlertTriangle } from 'lucide-react';

/**
 * 表示用パネル：APIが使えない（または「プロンプトのみ」モード）の時、
 * 完成済みプロンプトを表示してユーザーが ChatGPT / Claude.ai などで実行 →
 * 結果を貼り戻して保存できるようにする。
 *
 * Props:
 *  - prompts: [{ system?: string, user: string, label?: string }]
 *  - reason: 'prompt_only' | 'api_error'
 *  - errorMessage?: string
 *  - placeholder?: string  paste 欄の placeholder
 *  - saveLabel?: string    保存ボタンのラベル
 *  - onSave: (pastedText: string) => Promise<void> | void
 *  - busy?: boolean
 */
export default function PromptFallbackPanel({
  prompts = [],
  reason = 'prompt_only',
  errorMessage,
  placeholder = 'ChatGPTやClaude.aiに上記プロンプトを貼り付けて、出てきた結果をここにペーストしてください',
  saveLabel = '結果を保存して次へ',
  onSave,
  busy = false,
}) {
  const [pasted, setPasted] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(-1);

  const copyPrompt = (idx, text) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(-1), 2000);
  };

  return (
    <div className="space-y-3">
      <div className={`rounded-lg border p-3 text-xs ${reason === 'api_error' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
        <div className="flex items-start gap-2">
          {reason === 'api_error' ? (
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold mb-1">
              {reason === 'api_error' ? 'AI APIが利用できないためプロンプト方式に切替' : 'プロンプトのみモード'}
            </p>
            <p className="leading-relaxed">
              下記プロンプトをコピーし、ChatGPT・Claude.ai・Gemini など外部AIに貼り付けて実行してください。
              生成された結果を一番下のテキストエリアに貼り戻して保存します。
            </p>
            {errorMessage && (
              <p className="mt-1 text-[11px] opacity-70 break-all">エラー詳細: {errorMessage}</p>
            )}
          </div>
        </div>
      </div>

      {prompts.map((p, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-700">
              {p.label || `プロンプト ${i + 1}`}
            </span>
            <button
              onClick={() => {
                const text = (p.system ? `【System】\n${p.system}\n\n【User】\n` : '') + (p.user || '');
                copyPrompt(i, text);
              }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {copiedIdx === i ? (
                <>
                  <Check className="w-3 h-3 text-green-500" />
                  コピー済み
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  プロンプトをコピー
                </>
              )}
            </button>
          </div>
          {p.system && (
            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">System</p>
              <pre className="text-[11px] text-gray-600 whitespace-pre-wrap leading-relaxed font-sans">{p.system}</pre>
            </div>
          )}
          <div className="px-3 py-2 max-h-64 overflow-y-auto">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">User Prompt</p>
            <pre className="text-[11px] text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">{p.user}</pre>
          </div>
        </div>
      ))}

      <div className="border border-orange-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 border-b border-orange-200 text-xs font-semibold text-orange-700">
          <ClipboardPaste className="w-3.5 h-3.5" />
          外部AIから返ってきた結果を貼り付け
        </div>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={8}
          placeholder={placeholder}
          className="w-full p-3 text-sm leading-relaxed resize-none focus:outline-none"
        />
        <button
          onClick={() => onSave?.(pasted)}
          disabled={!pasted.trim() || busy}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {busy ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saveLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
