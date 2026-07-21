"use client";

import {
  TrendingUp,
  Lightbulb,
  Monitor,
  Users,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  FileText,
  BarChart3,
  Shield,
  MessageSquare,
} from "lucide-react";
import { ProjectCase, CaseProposal } from "@/lib/cases";

const iconMap: Record<string, React.ComponentType<Record<string, unknown>>> = {
  TrendingUp,
  Lightbulb,
  Monitor,
  Users,
  Target,
};

const agentColorMap: Record<string, string> = {
  "market-researcher": "#3b82f6",
  "product-developer": "#10b981",
  "dx-advisor": "#8b5cf6",
  "hr-strategist": "#f59e0b",
  "strategy-consultant": "#ef4444",
};

const agentIconMap: Record<string, string> = {
  "market-researcher": "TrendingUp",
  "product-developer": "Lightbulb",
  "dx-advisor": "Monitor",
  "hr-strategist": "Users",
  "strategy-consultant": "Target",
};

interface CaseProposalViewProps {
  projectCase: ProjectCase;
  proposal: CaseProposal;
  onStartChat: (agentId: string) => void;
}

export default function CaseProposalView({
  projectCase,
  proposal,
  onStartChat,
}: CaseProposalViewProps) {
  return (
    <div className="flex-1 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Proposal header */}
        <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 md:p-8 text-white mb-8 animate-slide-up">
          <div className="flex items-start gap-3 mb-4">
            <FileText className="w-8 h-8 shrink-0" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                {projectCase.companyName}様 専用コンサルティング提案書
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {projectCase.prefecture} / {projectCase.industry} / 従業員{projectCase.employeeCount}名
              </p>
            </div>
          </div>
          <p className="text-white/90 text-sm leading-relaxed">
            {proposal.summary}
          </p>
          <div className="flex gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4" />
              <span>想定期間: {proposal.estimatedDuration}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <BarChart3 className="w-4 h-4" />
              <span>担当エージェント: {proposal.phases.length}名</span>
            </div>
          </div>
        </div>

        {/* Phases */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            実行フェーズ
          </h2>
          <div className="space-y-4">
            {proposal.phases.map((phase) => {
              const color = agentColorMap[phase.agentId] || "#6b7280";
              const iconName = agentIconMap[phase.agentId] || "Target";
              const Icon = iconMap[iconName] || Target;

              return (
                <div
                  key={phase.phase}
                  className="bg-white rounded-2xl border border-border overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${phase.phase * 0.15}s` }}
                >
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: color }}
                        >
                          Phase {phase.phase}
                        </span>
                        <h3 className="font-bold">{phase.name}</h3>
                      </div>
                      <p className="text-xs text-text-secondary">
                        担当: {phase.agentName} / 期間: {phase.duration}
                      </p>
                    </div>
                    <button
                      onClick={() => onStartChat(phase.agentId)}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors"
                      style={{ color, backgroundColor: `${color}10` }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      相談する
                    </button>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-text-secondary mb-2">
                        アクション項目
                      </div>
                      <ul className="space-y-1.5">
                        {phase.actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2
                              className="w-4 h-4 shrink-0 mt-0.5"
                              style={{ color }}
                            />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-text-secondary mb-2">
                        成果物
                      </div>
                      <ul className="space-y-1.5">
                        {phase.deliverables.map((d, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-text-secondary shrink-0" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="p-4 pt-0 sm:hidden">
                    <button
                      onClick={() => onStartChat(phase.agentId)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-xl font-medium"
                      style={{ color, backgroundColor: `${color}10` }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      このエージェントに相談する
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* KPIs */}
        {proposal.kpis.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              目標KPI
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {proposal.kpis.map((kpi) => (
                <div
                  key={kpi.name}
                  className="bg-white rounded-xl border border-border p-4"
                >
                  <div className="text-sm text-text-secondary mb-2">
                    {kpi.name}
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-text-secondary text-sm line-through">
                      {kpi.current}
                    </span>
                    <ArrowRight className="w-4 h-4 text-text-secondary" />
                    <span className="text-lg font-bold text-primary">
                      {kpi.target}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary mt-1">
                    {kpi.timeline}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risks */}
        {proposal.risks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              リスクと対策
            </h2>
            <div className="bg-white rounded-xl border border-border divide-y divide-border">
              {proposal.risks.map((risk, i) => (
                <div key={i} className="p-4 flex items-start gap-3">
                  <AlertTriangle
                    className={`w-5 h-5 shrink-0 ${
                      risk.impact === "high"
                        ? "text-red-500"
                        : risk.impact === "medium"
                        ? "text-amber-500"
                        : "text-gray-400"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium">{risk.description}</div>
                    <div className="text-sm text-secondary mt-1">
                      対策: {risk.mitigation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget */}
        <div className="bg-white rounded-xl border border-border p-6 mb-8">
          <h2 className="text-lg font-bold mb-2">想定コスト</h2>
          <p className="text-text-secondary text-sm">{proposal.estimatedBudget}</p>
          <p className="text-xs text-text-secondary mt-2">
            ※ 副業人材を雇う場合の月額3〜10万円と比較して、AIコンサルなら24時間対応で低コスト
          </p>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">
            この提案書をもとに、AIエージェントと詳細を詰めましょう
          </h3>
          <p className="text-white/80 text-sm mb-4">
            各フェーズの担当エージェントと直接チャットで相談できます
          </p>
          <button
            onClick={() => onStartChat(proposal.phases[0]?.agentId || "strategy-consultant")}
            className="px-8 py-3 bg-white text-primary font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
          >
            Phase 1 のエージェントに相談する
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
