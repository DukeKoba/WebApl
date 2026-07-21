"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  TrendingUp,
  Lightbulb,
  Monitor,
  Users,
  Target,
  FileText,
} from "lucide-react";
import { AI_AGENTS } from "@/lib/agents";
import { ProjectCase, CaseProposal } from "@/lib/cases";
import { Message } from "@/types";

const iconMap: Record<string, React.ComponentType<Record<string, unknown>>> = {
  TrendingUp,
  Lightbulb,
  Monitor,
  Users,
  Target,
};

interface CaseChatViewProps {
  projectCase: ProjectCase;
  proposal: CaseProposal;
}

function generateContextualResponse(
  agentId: string,
  userMessage: string,
  projectCase: ProjectCase,
  proposal: CaseProposal
): string {
  const agent = AI_AGENTS.find((a) => a.id === agentId);
  const phase = proposal.phases.find((p) => p.agentId === agentId);

  if (!agent || !phase) {
    return "ご質問ありがとうございます。担当エージェントに確認いたします。";
  }

  const responses: Record<string, string> = {
    "market-researcher": `${projectCase.companyName}様の${projectCase.industry}における「${projectCase.challengeType}」の課題について、マーケティングの観点から分析しました。

**${projectCase.prefecture}エリアの市場分析**

御社のような${projectCase.industry}の企業が${projectCase.challengeType}を進める上で、以下が重要です：

**1. ターゲット市場の明確化**
- ${projectCase.prefecture}の地域特性を活かしたポジショニング
- 都市部の消費者への訴求ポイントの整理
- 競合との差別化要因の明確化

**2. デジタルチャネル戦略**
- Instagram：ビジュアルで商品の魅力を発信（週3-4回投稿）
- LINE公式：既存顧客のリピート促進（月2回配信）
- Google MAP（MEO）：地域での認知度向上

**3. 具体的な数値目標**
${proposal.kpis.map((k) => `- ${k.name}: ${k.current} → ${k.target}（${k.timeline}）`).join("\n")}

「${userMessage}」について、さらに詳しく知りたい点はありますか？`,

    "product-developer": `${projectCase.companyName}様、商品開発の観点からアドバイスいたします。

**「${projectCase.challengeDetail}」への提案**

${projectCase.prefecture}の${projectCase.industry}として、以下のアプローチを推奨します：

**Step 1: 商品コンセプトの磨き込み**
- 御社ならではの「ストーリー」を言語化
- ${projectCase.prefecture}の地域性を活かした独自価値の設計
- ターゲット顧客が求める「体験」の定義

**Step 2: MVPアプローチでの検証**
- まずは最小限の商品ラインナップ（3-5商品）で開始
- クラウドファンディングでの市場反応テスト
- SNSでのプレマーケティング（発売前の期待醸成）

**Step 3: フィードバックループの構築**
- 初期購入者へのアンケート
- レビュー・口コミの分析
- 商品改良サイクルの確立

「${userMessage}」に関して、もう少し具体的にお聞かせいただけますか？`,

    "dx-advisor": `${projectCase.companyName}様のDX推進について、具体的にご提案します。

**現状: ${projectCase.employeeCount}名規模の${projectCase.industry}企業向けDXプラン**

従業員${projectCase.employeeCount}名の規模であれば、以下の優先順位で進めるのが最も効果的です：

**即座に導入すべきツール（月額0〜5,000円/人）**
1. **クラウド会計**: freee or マネーフォワード（経理時間を月20時間削減）
2. **ビジネスチャット**: Slack無料プラン or LINE WORKS（社内連絡の効率化）
3. **Google Workspace**: メール・カレンダー・ファイル共有の一元化

**1-3ヶ月以内に導入**
4. **Googleビジネスプロフィール**: 無料で地域集客力UP
5. **LINE公式アカウント**: 顧客接点のデジタル化（無料〜月5,000円）
6. **ECサイト**: BASE（無料）orShopify（月$29〜）

**活用できる補助金**
- IT導入補助金: 最大450万円（ソフトウェア導入費の1/2〜3/4）
- 小規模事業者持続化補助金: 最大200万円

「${userMessage}」について、優先的に取り組みたい部分はどこですか？`,

    "hr-strategist": `${projectCase.companyName}様の人材課題について、${projectCase.prefecture}の地域事情も踏まえてアドバイスします。

**${projectCase.employeeCount}名企業の人材戦略**

**1. 採用ブランディング（AIで立案）**
- 「${projectCase.prefecture}で働く魅力」のストーリー設計
- 求人原稿のAI自動生成・最適化
- 社員インタビュー構成のテンプレート提供
- 地域メディア・移住サイトへの掲載戦略

**2. リモートワーク体制の設計**
- 最低限のツール選定: Zoom + Slack + Google Drive
- リモートワーク規程のテンプレート提供
- 成果ベースの評価制度設計

**3. 組織力強化**
- 人材育成プログラムの設計
- 1on1ミーティングの導入支援
- 従業員満足度向上施策の提案

※ 実行フェーズで専門家が必要な場合、人事コンサルタントをご紹介できます（プロプラン以上）

「${userMessage}」について、まずはどの施策から始めたいですか？`,

    "strategy-consultant": `${projectCase.companyName}様の経営戦略について、包括的にアドバイスいたします。

**現状分析（${projectCase.prefecture} / ${projectCase.industry} / ${projectCase.employeeCount}名）**

**SWOT分析**
| | プラス | マイナス |
|---|---|---|
| **内部** | 地域での信頼・実績 | リソース不足・デジタル化遅れ |
| **外部** | 地方創生の追い風・EC市場成長 | 人口減少・大手参入 |

**推奨アクションプラン**

**Phase 1（1-3ヶ月）: 基盤整備**
${proposal.phases[0]?.actions.map((a) => `- ${a}`).join("\n") || "- 課題の構造化と優先順位付け"}

**Phase 2（3-6ヶ月）: 施策実行**
${proposal.phases[1]?.actions.map((a) => `- ${a}`).join("\n") || "- 重点施策の実行開始"}

**活用を推奨する補助金**
- ものづくり補助金: 最大1,250万円
- 事業再構築補助金: 最大1,500万円
- IT導入補助金: 最大450万円

「${userMessage}」について、さらに深掘りしたいポイントはありますか？`,
  };

  return (
    responses[agentId] ||
    `${projectCase.companyName}様のご質問「${userMessage}」について検討中です。`
  );
}

export default function CaseChatView({
  projectCase,
  proposal,
}: CaseChatViewProps) {
  const initialAgent = proposal.phases[0]?.agentId || "strategy-consultant";
  const [selectedAgent, setSelectedAgent] = useState(initialAgent);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agent = AI_AGENTS.find((a) => a.id === selectedAgent)!;

  useEffect(() => {
    const a = AI_AGENTS.find((ag) => ag.id === selectedAgent);
    const phase = proposal.phases.find((p) => p.agentId === selectedAgent);
    if (a && phase) {
      setMessages([
        {
          id: "welcome",
          agentId: a.id,
          agentName: a.name,
          content: `${projectCase.companyName}様、こんにちは。${a.name}です。\n\n「${projectCase.challengeDetail}」についてのご相談を承ります。\n\n私の担当は**Phase ${phase.phase}: ${phase.name}**です。\n\n以下の施策について、詳しくご説明できます：\n${phase.actions.map((a) => `- ${a}`).join("\n")}\n\nどこから始めましょうか？`,
          timestamp: new Date(),
          type: "agent",
        },
      ]);
    }
  }, [selectedAgent, projectCase, proposal]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      agentId: "user",
      agentName: "あなた",
      content: input,
      timestamp: new Date(),
      type: "user",
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = generateContextualResponse(
        selectedAgent,
        currentInput,
        projectCase,
        proposal
      );
      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        agentId: selectedAgent,
        agentName: agent.name,
        content: response,
        timestamp: new Date(),
        type: "agent",
      };
      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar: project summary + agent selector */}
      <div className="hidden lg:flex w-72 bg-white border-r border-border flex-col">
        <div className="p-4 border-b border-border">
          <div className="text-xs text-text-secondary mb-1">プロジェクト</div>
          <h3 className="font-bold text-sm">{projectCase.companyName}</h3>
          <p className="text-xs text-text-secondary mt-1">
            {projectCase.challengeType}
          </p>
        </div>
        <div className="p-3 border-b border-border">
          <div className="text-xs font-medium text-text-secondary mb-2">
            担当エージェント
          </div>
          {proposal.phases.map((phase) => {
            const a = AI_AGENTS.find((ag) => ag.id === phase.agentId);
            const iconName =
              a?.icon || "Target";
            const Icon = iconMap[iconName] || Target;
            const color =
              a?.color || "#6b7280";
            return (
              <button
                key={phase.phase}
                onClick={() => setSelectedAgent(phase.agentId)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors mb-1 ${
                  selectedAgent === phase.agentId
                    ? "bg-primary/10"
                    : "hover:bg-gray-50"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">
                    Phase {phase.phase}: {phase.name}
                  </div>
                  <div className="text-xs text-text-secondary truncate">
                    {a?.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-4">
          <div className="text-xs font-medium text-text-secondary mb-2">
            提案の成果物
          </div>
          {proposal.phases
            .flatMap((p) => p.deliverables)
            .map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-secondary py-1">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                {d}
              </div>
            ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-surface">
        <div className="bg-white border-b border-border px-6 py-3 flex items-center gap-3">
          {(() => {
            const Icon = iconMap[agent.icon] || Target;
            return (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${agent.color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: agent.color }} />
              </div>
            );
          })()}
          <div>
            <h3 className="font-bold text-sm">{agent.name}</h3>
            <p className="text-xs text-text-secondary">
              {projectCase.companyName}様の{agent.specialty}担当
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-600 font-medium">案件対応中</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-fade-in ${
                msg.type === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.type === "user"
                    ? "bg-primary"
                    : "bg-white border border-border"
                }`}
              >
                {msg.type === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-primary" />
                )}
              </div>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.type === "user"
                    ? "bg-primary text-white"
                    : "bg-white border border-border"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <strong key={i}>{part.slice(2, -2)}</strong>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-border">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-white border border-border rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border-t border-border p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={`${agent.name}に質問...`}
              className="flex-1 px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
