import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, TrendingUp, Lightbulb, Monitor, Users, Target, FileText } from 'lucide-react';
import { AI_AGENTS } from '../../../lib/cocreo/agents';

const iconMap = { TrendingUp, Lightbulb, Monitor, Users, Target };

function generateContextualResponse(agentId, userMessage, projectCase, proposal) {
  const agent = AI_AGENTS.find((a) => a.id === agentId);
  const phase = proposal.phases.find((p) => p.agentId === agentId);
  if (!agent || !phase) return "ご質問ありがとうございます。担当エージェントに確認いたします。";

  const responses = {
    "market-researcher": `${projectCase.companyName}様の${projectCase.industry}における「${projectCase.challengeType}」について、マーケティングの観点から分析しました。\n\n**${projectCase.prefecture}エリアの市場分析**\n\n**1. ターゲット市場の明確化**\n- ${projectCase.prefecture}の地域特性を活かしたポジショニング\n- 都市部の消費者への訴求ポイントの整理\n- 競合との差別化要因の明確化\n\n**2. デジタルチャネル戦略**\n- Instagram：ビジュアルで商品の魅力を発信（週3-4回投稿）\n- LINE公式：既存顧客のリピート促進（月2回配信）\n- Google MAP（MEO）：地域での認知度向上\n\n**3. 具体的な数値目標**\n${proposal.kpis.map((k) => `- ${k.name}: ${k.current} → ${k.target}（${k.timeline}）`).join("\n")}\n\n「${userMessage}」について、さらに詳しく知りたい点はありますか？`,

    "product-developer": `${projectCase.companyName}様、商品開発の観点からアドバイスいたします。\n\n**「${projectCase.challengeDetail}」への提案**\n\n**Step 1: 商品コンセプトの磨き込み**\n- 御社ならではの「ストーリー」を言語化\n- ${projectCase.prefecture}の地域性を活かした独自価値の設計\n\n**Step 2: MVPアプローチでの検証**\n- まずは最小限の商品ラインナップ（3-5商品）で開始\n- クラウドファンディングでの市場反応テスト\n\n**Step 3: フィードバックループの構築**\n- 初期購入者へのアンケート\n- レビュー・口コミの分析\n\n「${userMessage}」に関して、もう少し具体的にお聞かせいただけますか？`,

    "dx-advisor": `${projectCase.companyName}様のDX推進について、具体的にご提案します。\n\n**現状: ${projectCase.employeeCount}名規模の${projectCase.industry}企業向けDXプラン**\n\n**即座に導入すべきツール（月額0〜5,000円/人）**\n1. **クラウド会計**: freee or マネーフォワード\n2. **ビジネスチャット**: Slack無料プラン or LINE WORKS\n3. **Google Workspace**: メール・カレンダー・ファイル共有の一元化\n\n**活用できる補助金**\n- IT導入補助金: 最大450万円（ソフトウェア導入費の1/2〜3/4）\n- 小規模事業者持続化補助金: 最大200万円\n\n「${userMessage}」について、優先的に取り組みたい部分はどこですか？`,

    "hr-strategist": `${projectCase.companyName}様の人材課題について、${projectCase.prefecture}の地域事情も踏まえてアドバイスします。\n\n**${projectCase.employeeCount}名企業の人材戦略**\n\n**1. 採用ブランディング（AIで立案）**\n- 「${projectCase.prefecture}で働く魅力」のストーリー設計\n- 求人原稿のAI自動生成・最適化\n\n**2. リモートワーク体制の設計**\n- 最低限のツール選定: Zoom + Slack + Google Drive\n- 成果ベースの評価制度設計\n\n「${userMessage}」について、まずはどの施策から始めたいですか？`,

    "strategy-consultant": `${projectCase.companyName}様の経営戦略について、包括的にアドバイスいたします。\n\n**現状分析（${projectCase.prefecture} / ${projectCase.industry} / ${projectCase.employeeCount}名）**\n\n**推奨アクションプラン**\n\n**Phase 1（1-3ヶ月）: 基盤整備**\n${proposal.phases[0]?.actions.map((a) => `- ${a}`).join("\n") || "- 課題の構造化と優先順位付け"}\n\n**活用を推奨する補助金**\n- ものづくり補助金: 最大1,250万円\n- IT導入補助金: 最大450万円\n\n「${userMessage}」について、さらに深掘りしたいポイントはありますか？`,
  };

  return responses[agentId] || `${projectCase.companyName}様のご質問「${userMessage}」について検討中です。`;
}

export default function CaseChatView({ projectCase, proposal }) {
  const initialAgent = proposal.phases[0]?.agentId || "strategy-consultant";
  const [selectedAgent, setSelectedAgent] = useState(initialAgent);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const agent = AI_AGENTS.find((a) => a.id === selectedAgent);

  useEffect(() => {
    const a = AI_AGENTS.find((ag) => ag.id === selectedAgent);
    const phase = proposal.phases.find((p) => p.agentId === selectedAgent);
    if (a && phase) {
      setMessages([{
        id: "welcome",
        agentId: a.id,
        agentName: a.name,
        content: `${projectCase.companyName}様、こんにちは。${a.name}です。\n\n「${projectCase.challengeDetail}」についてのご相談を承ります。\n\n私の担当は**Phase ${phase.phase}: ${phase.name}**です。\n\n以下の施策について、詳しくご説明できます：\n${phase.actions.map((a) => `- ${a}`).join("\n")}\n\nどこから始めましょうか？`,
        timestamp: new Date(),
        type: "agent",
      }]);
    }
  }, [selectedAgent, projectCase, proposal]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { id: `user-${Date.now()}`, agentId: "user", agentName: "あなた", content: input, timestamp: new Date(), type: "user" };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      const response = generateContextualResponse(selectedAgent, currentInput, projectCase, proposal);
      setMessages((prev) => [...prev, { id: `agent-${Date.now()}`, agentId: selectedAgent, agentName: agent.name, content: response, timestamp: new Date(), type: "agent" }]);
      setIsTyping(false);
    }, 2000);
  };

  if (!agent) return null;

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="hidden lg:flex w-72 bg-white border-r flex-col" style={{ borderColor: 'var(--color-border)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>プロジェクト</div>
          <h3 className="font-bold text-sm">{projectCase.companyName}</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{projectCase.challengeType}</p>
        </div>
        <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>担当エージェント</div>
          {proposal.phases.map((phase) => {
            const a = AI_AGENTS.find((ag) => ag.id === phase.agentId);
            const Icon = iconMap[a?.icon] || Target;
            const color = a?.color || "#6b7280";
            return (
              <button key={phase.phase} onClick={() => setSelectedAgent(phase.agentId)} className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors mb-1" style={{ backgroundColor: selectedAgent === phase.agentId ? 'rgba(201,137,31,0.1)' : 'transparent' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">Phase {phase.phase}: {phase.name}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{a?.name}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-4">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>提案の成果物</div>
          {proposal.phases.flatMap((p) => p.deliverables).map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1" style={{ color: 'var(--color-text-secondary)' }}>
              <FileText className="w-3.5 h-3.5 shrink-0" /> {d}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="bg-white border-b px-6 py-3 flex items-center gap-3" style={{ borderColor: 'var(--color-border)' }}>
          {(() => {
            const Icon = iconMap[agent.icon] || Target;
            return (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${agent.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: agent.color }} />
              </div>
            );
          })()}
          <div>
            <h3 className="font-bold text-sm">{agent.name}</h3>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{projectCase.companyName}様の{agent.specialty}担当</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-600 font-medium">案件対応中</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 animate-fade-in ${msg.type === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.type === "user" ? "text-white" : "bg-white border"}`} style={{ backgroundColor: msg.type === "user" ? 'var(--color-primary)' : undefined, borderColor: msg.type !== "user" ? 'var(--color-border)' : undefined }}>
                {msg.type === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.type === "user" ? "text-white" : "bg-white border"}`} style={{ backgroundColor: msg.type === "user" ? 'var(--color-primary)' : undefined, borderColor: msg.type !== "user" ? 'var(--color-border)' : undefined }}>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                    part.startsWith("**") && part.endsWith("**")
                      ? <strong key={i}>{part.slice(2, -2)}</strong>
                      : <span key={i}>{part}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border" style={{ borderColor: 'var(--color-border)' }}>
                <Bot className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="bg-white border rounded-2xl px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
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

        <div className="bg-white border-t p-4" style={{ borderColor: 'var(--color-border)' }}>
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={`${agent.name}に質問...`}
              className="flex-1 px-4 py-3 border rounded-xl focus:outline-none text-sm"
              style={{ borderColor: 'var(--color-border)' }}
            />
            <button onClick={handleSend} disabled={!input.trim()} className="px-4 py-3 text-white rounded-xl transition-colors disabled:opacity-50" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
