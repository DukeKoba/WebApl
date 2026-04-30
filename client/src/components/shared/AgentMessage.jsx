import React from 'react';

const AGENT_CONFIG = {
  marketer: {
    label: 'マーケティングのプロ',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    avatar: 'bg-blue-600',
    emoji: '🎯',
  },
  copywriter: {
    label: '有名コピーライター',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    avatar: 'bg-purple-600',
    emoji: '✍️',
  },
  consultant: {
    label: 'デジタルマーケティングコンサルタント',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    avatar: 'bg-green-600',
    emoji: '📈',
  },
};

export default function AgentMessage({ agent, name, round, content, isStreaming }) {
  const config = AGENT_CONFIG[agent] || {
    label: name,
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
    avatar: 'bg-gray-600',
    emoji: '🤖',
  };

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-full ${config.avatar} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {config.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-gray-900 text-sm">{config.label}</span>
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${config.badge}`}>
            Round {round}
          </span>
        </div>
      </div>
      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pl-10">
        {content}
        {isStreaming && <span className="inline-block w-1 h-4 bg-gray-400 animate-pulse ml-0.5 align-middle" />}
      </div>
    </div>
  );
}
