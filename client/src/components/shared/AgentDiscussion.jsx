import React from 'react';
import AgentMessage from './AgentMessage';

export default function AgentDiscussion({ messages, isGenerating, currentAgent }) {
  const rounds = [...new Set(messages.map(m => m.round))].sort();

  return (
    <div className="space-y-4">
      {rounds.map(round => (
        <div key={round}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium text-gray-500 px-2">ラウンド {round}</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="space-y-3">
            {messages.filter(m => m.round === round).map((msg, i) => (
              <AgentMessage key={i} {...msg} />
            ))}
          </div>
        </div>
      ))}

      {isGenerating && currentAgent && (
        <div>
          {messages.length > 0 && rounds.length > 0 && (
            <div />
          )}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-gray-500">{currentAgent} が考えています...</span>
            </div>
          </div>
        </div>
      )}

      {!isGenerating && messages.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-sm">生成ボタンを押すとエージェントの協議が始まります</p>
        </div>
      )}
    </div>
  );
}
