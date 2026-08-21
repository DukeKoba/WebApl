import React, { useState } from 'react';
import { Copy, Check, ClipboardPaste, Save, Sparkles, AlertTriangle, ExternalLink, ArrowRight, CornerDownRight } from 'lucide-react';

const AI_LAUNCHERS = [
  { key: 'claude',  label: 'Claudeで開く',  url: (q) => `https://claude.ai/new?q=${encodeURIComponent(q)}`,  color: 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700' },
  { key: 'chatgpt', label: 'ChatGPTで開く', url: (q) => `https://chatgpt.com/?q=${encodeURIComponent(q)}`,    color: 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800' },
  { key: 'gemini',  label: 'Geminiで開く',  url: (q) => `https://gemini.google.com/app?q=${encodeURIComponent(q)}`, color: 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800' },
];

const URL_LIMIT = 7000;

function buildLaunchPrompt(p) {
  return (p.system ? `【システム指示】\n${p.system}\n\n【プロンプト内容】\n` : '') + (p.user || '');
}

export default function PromptFallbackPanel({
  prompts = [],
  reason = 'prompt_only',
  errorMessage,
  placeholder = 'ChatGPTやClaude等で生成された結果（===本文===〜===リプライ===）をここに貼り付けてください',
  saveLabel = '結果を反映してXプレビューへ',
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

  const launchInExternalAi = (p, launcher) => {
    const promptText = buildLaunchPrompt(p);
    if (promptText.length > URL_LIMIT) {
      navigator.clipboard.writeText(promptText);
      window.open(launcher.url(''), '_blank', 'noopener,noreferrer');
      alert(`プロンプトをクリップボードにコピーしました！\n${launcher.label.replace('で開く', '')}が開いたら、入力欄にペースト（貼り付け）して送信してください。`);
      return;
    }
    navigator.clipboard.writeText(promptText);
    window.open(launcher.url(promptText), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4 rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-5 shadow-sm">
      {/* 説明ヘッダー */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-gray-900">
            生成用AIプロンプトが作成されました！
          </h3>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
            下のボタンからプロンプトをコピー、またはワンクリックで各AI（Claude / ChatGPT / Gemini）を開いて生成してください。生成結果を下の欄に貼り付けると、X投稿プレビューが表示されます。
          </p>
          {errorMessage && (
            <p className="mt-1 text-xs text-red-600 font-semibold break-all">エラー詳細: {errorMessage}</p>
          )}
        </div>
      </div>

      {prompts.map((p, i) => {
        const fullPrompt = buildLaunchPrompt(p);
        const isCopied = copiedIdx === i;

        return (
          <div key={i} className="border border-amber-200 rounded-xl overflow-hidden bg-white shadow-xs">
            {/* Header with Title & Big Copy Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-r from-amber-100/80 to-yellow-50 border-b border-amber-200">
              <span className="text-xs font-bold text-gray-800">
                {p.label || `生成プロンプト`}
              </span>
              <button
                onClick={() => copyPrompt(i, fullPrompt)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold transition-all shadow-xs ${
                  isCopied
                    ? 'bg-green-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    プロンプトをコピーしました！
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    プロンプトをコピー
                  </>
                )}
              </button>
            </div>

            {/* AI Launchers */}
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <span className="text-[11px] font-bold text-gray-500 block mb-2">
                ワンクリックでAIを開く（プロンプト自動入力）:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {AI_LAUNCHERS.map((launcher) => (
                  <button
                    key={launcher.key}
                    onClick={() => launchInExternalAi(p, launcher)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all shadow-xs ${launcher.color}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {launcher.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt preview */}
            <div className="p-3 max-h-64 overflow-y-auto bg-gray-900 text-gray-100 text-xs font-mono rounded-b-xl">
              <pre className="whitespace-pre-wrap leading-relaxed font-sans">{fullPrompt}</pre>
            </div>
          </div>
        );
      })}

      {/* 結果貼り付け欄 */}
      <div className="border-2 border-dashed border-amber-300 rounded-xl p-4 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <ClipboardPaste className="w-4 h-4 text-amber-600" />
            AIから返ってきた結果を貼り付けてください
          </span>
          <span className="text-[11px] text-gray-400">自動で本文とリプライに分割されます</span>
        </div>

        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={6}
          placeholder={placeholder}
          className="w-full p-3 text-sm border border-gray-200 rounded-xl leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50 focus:bg-white"
        />

        <button
          onClick={() => onSave?.(pasted)}
          disabled={!pasted.trim() || busy}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          {busy ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              反映中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saveLabel}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
