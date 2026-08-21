import React, { useEffect, useState } from 'react';
import { Bot, FileText } from 'lucide-react';

const STORAGE_KEY = 'cocreo_ai_mode';

// デフォルトは「AI実行（api）」。ワンクリックで直接AIが投稿を生成してプレビューする。
// プロンプトを確認したい場合のみユーザーが「プロンプトのみ」に切り替える。
export function getAiMode() {
  if (typeof window === 'undefined') return 'api';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'prompt') return 'prompt';
  return 'api';
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

/**
 * 「AI実行 / プロンプトのみ」のトグル。各アプリのヘッダーに置くUI。
 */
export default function AiModeToggle({ className = '' }) {
  const [mode, setMode] = useAiMode();
  return (
    <div className={`inline-flex items-center bg-gray-200/80 rounded-full p-0.5 text-xs font-semibold shadow-inner ${className}`}>
      <button
        onClick={() => setMode('api')}
        title="AI APIを直接呼び出して自動生成"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
          mode === 'api' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Bot className="w-3.5 h-3.5" />
        AI実行
      </button>
      <button
        onClick={() => setMode('prompt')}
        title="プロンプトを表示して外部AIで手動実行"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
          mode === 'prompt' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <FileText className="w-3.5 h-3.5" />
        プロンプトのみ
      </button>
    </div>
  );
}
