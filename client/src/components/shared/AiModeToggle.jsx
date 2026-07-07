import React, { useEffect, useState } from 'react';
import { Bot, FileText } from 'lucide-react';

const STORAGE_KEY = 'cocreo_ai_mode';

export function getAiMode() {
  if (typeof window === 'undefined') return 'api';
  return window.localStorage.getItem(STORAGE_KEY) === 'prompt' ? 'prompt' : 'api';
}

// storage イベントは別タブでしか発火しないため、同一タブ内の useAiMode 同士は
// カスタムイベントで同期する（トグルと生成ボタンが別コンポーネントにあるため必須）
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
 * 「AI実行 / プロンプトのみ」のトグル。各アプリのヘッダーに置く小さいUI。
 */
export default function AiModeToggle({ className = '' }) {
  const [mode, setMode] = useAiMode();
  return (
    <div className={`inline-flex items-center bg-gray-100 rounded-full p-0.5 text-xs ${className}`}>
      <button
        onClick={() => setMode('api')}
        title="AI APIを直接呼び出す（クレジットを消費）"
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors ${
          mode === 'api' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Bot className="w-3 h-3" />
        AI実行
      </button>
      <button
        onClick={() => setMode('prompt')}
        title="プロンプトを表示するだけ（外部AIで実行して結果を貼り戻す）"
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors ${
          mode === 'prompt' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <FileText className="w-3 h-3" />
        プロンプトのみ
      </button>
    </div>
  );
}
