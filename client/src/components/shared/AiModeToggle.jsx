import React, { useEffect, useState } from 'react';
import { Bot, FileText } from 'lucide-react';

const STORAGE_KEY = 'cocreo_ai_mode';

// デフォルトは「プロンプト生成（prompt）」。
// プロンプトをコピーして ChatGPT / Claude.ai 等で高品質に生成する運用が基本。
export function getAiMode() {
  if (typeof window === 'undefined') return 'prompt';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'api') return 'api';
  return 'prompt';
}

const SYNC_EVENT = 'cocreo-ai-mode-change';

export function useAiMode() {
  const [mode, setModeState] = useState(getAiMode);
  useEffect(() => {
    const sync = () => setModeState(getAiMode());
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) sync();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(SYNC_EVENT, sync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(SYNC_EVENT, sync);
    };
  }, []);
  const setMode = (next) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
    window.dispatchEvent(new Event(SYNC_EVENT));
  };
  return [mode, setMode];
}

export default function AiModeToggle({ className = '' }) {
  const [mode, setMode] = useAiMode();
  return (
    <div className={`inline-flex items-center bg-gray-100 rounded-xl p-1 text-xs font-semibold border border-gray-200 shadow-2xs ${className}`}>
      <button
        onClick={() => setMode('prompt')}
        title="プロンプトを生成してChatGPT/Claude等で実行（標準）"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
          mode === 'prompt' ? 'bg-white text-gray-900 shadow-xs font-bold border border-gray-200' : 'text-gray-500 hover:text-gray-800'
        }`}
      >
        <FileText className="w-3.5 h-3.5 text-amber-600" />
        プロンプト生成
      </button>
      <button
        onClick={() => setMode('api')}
        title="AI APIを直接呼び出して自動生成"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
          mode === 'api' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold' : 'text-gray-500 hover:text-gray-800'
        }`}
      >
        <Bot className="w-3.5 h-3.5" />
        API直接実行
      </button>
    </div>
  );
}
