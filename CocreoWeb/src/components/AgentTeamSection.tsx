"use client";

import {
  TrendingUp,
  Lightbulb,
  Monitor,
  Users,
  Target,
  MessageSquare,
} from "lucide-react";
import { AI_AGENTS } from "@/lib/agents";

const iconMap: Record<string, React.ComponentType<Record<string, unknown>>> = {
  TrendingUp,
  Lightbulb,
  Monitor,
  Users,
  Target,
};

interface AgentTeamSectionProps {
  onSelectAgent: (agentId: string) => void;
}

export default function AgentTeamSection({
  onSelectAgent,
}: AgentTeamSectionProps) {
  return (
    <section id="agents" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            5人の専門AIエージェントチーム
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            各分野のプロフェッショナルAIが連携し、
            あなたの会社の課題を多角的に分析・解決します。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AI_AGENTS.map((agent) => {
            const Icon = iconMap[agent.icon] || Target;
            return (
              <div
                key={agent.id}
                className="group bg-white border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${agent.color}15` }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: agent.color }}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-text-primary">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-text-secondary">{agent.role}</p>
                  </div>
                </div>

                <p className="text-sm text-text-secondary mb-4">
                  {agent.description}
                </p>

                <div className="space-y-2 mb-6">
                  {agent.capabilities.slice(0, 3).map((cap) => (
                    <div
                      key={cap}
                      className="flex items-center gap-2 text-sm text-text-secondary"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: agent.color }}
                      />
                      {cap}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onSelectAgent(agent.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 rounded-xl text-sm font-medium transition-all group-hover:text-white"
                  style={{
                    borderColor: agent.color,
                    color: agent.color,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = agent.color;
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = agent.color;
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  このエージェントに相談
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
