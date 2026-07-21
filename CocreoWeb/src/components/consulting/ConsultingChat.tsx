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
} from "lucide-react";
import { AI_AGENTS } from "@/lib/agents";
import { Message } from "@/types";

const iconMap: Record<string, React.ComponentType<Record<string, unknown>>> = {
  TrendingUp,
  Lightbulb,
  Monitor,
  Users,
  Target,
};

interface ConsultingChatProps {
  initialAgentId: string | null;
}

function generateAgentResponse(agentId: string, userMessage: string): string {
  const agent = AI_AGENTS.find((a) => a.id === agentId);
  if (!agent) return "ご質問ありがとうございます。どのようなお手伝いができますか？";

  const responses: Record<string, string[]> = {
    "market-researcher": [
      `マーケティングの観点からお答えします。\n\n「${userMessage}」について、まず以下の3つのステップで分析を進めることをお勧めします：\n\n**1. 現状分析**\n- 現在のターゲット顧客層の明確化\n- 競合他社のポジショニング調査\n- 自社の強み・差別化ポイントの整理\n\n**2. 戦略立案**\n- SNS（Instagram/LINE公式）を活用した地域密着型マーケティング\n- Googleビジネスプロフィールの最適化でローカルSEO強化\n- 口コミ・紹介を促進する仕組みづくり\n\n**3. 実行・効果測定**\n- 月次でKPIを設定し効果を測定\n- A/Bテストで最適な施策を見極め\n\nより具体的な戦略を立てるには、御社の業種や現在の集客方法をお聞かせいただけますか？`,
      `マーケティングリサーチの結果をお伝えします。\n\n地方中小企業のマーケティングで最も効果が高い施策は：\n\n**即効性が高い施策**\n1. LINE公式アカウントの活用（開封率60%以上）\n2. Googleマップ最適化（MEO対策）\n3. 地域メディア・フリーペーパーとのタイアップ\n\n**中長期で効く施策**\n1. コンテンツマーケティング（ブログ・SNS発信）\n2. メールマーケティングの自動化\n3. 既存顧客のLTV向上策\n\nどの施策から取り組みたいですか？優先順位をつけてロードマップを作成しましょう。`,
    ],
    "product-developer": [
      `商品開発の専門家としてアドバイスします。\n\n「${userMessage}」に関して、地域資源を活かした商品開発のフレームワークをご提案します：\n\n**Step 1: 地域資源の棚卸し**\n- 自然資源（特産物、景観、気候）\n- 文化資源（伝統工芸、祭り、歴史）\n- 人的資源（職人技術、地域コミュニティ）\n\n**Step 2: ニーズとのマッチング**\n- 都市部消費者のトレンド分析\n- ECでの販売可能性の検証\n- ふるさと納税返礼品としての展開\n\n**Step 3: MVP（最小実行可能製品）開発**\n- 小ロットでのテスト販売\n- クラウドファンディングでの反応テスト\n- SNSでのプレマーケティング\n\n御社の地域ならではの資源や素材について教えていただけますか？`,
    ],
    "dx-advisor": [
      `DX推進アドバイザーとしてお答えします。\n\n「${userMessage}」について、中小企業のDXは段階的に進めることが重要です：\n\n**フェーズ1: デジタイゼーション（1-3ヶ月）**\n- クラウド会計ソフト導入（freee/マネーフォワード）\n- 勤怠管理のクラウド化\n- ビジネスチャット導入（Slack/Teams）\n\n**フェーズ2: デジタライゼーション（3-6ヶ月）**\n- 顧客管理（CRM）システム導入\n- ECサイト構築（Shopify/BASE）\n- 業務フローのペーパーレス化\n\n**フェーズ3: デジタルトランスフォーメーション（6-12ヶ月）**\n- データ分析による意思決定\n- AI活用による業務自動化\n- 新しいビジネスモデルの構築\n\n現在の業務でデジタル化が最も遅れている領域はどこですか？`,
    ],
    "hr-strategist": [
      `人材戦略の観点からアドバイスします。\n\n「${userMessage}」について、地方中小企業の人材課題解決には以下のアプローチが効果的です：\n\n**即座に取り組める施策（AIで立案・実行支援）**\n1. **採用ブランディング** - 求人原稿のAI最適化、会社の魅力をSNSで発信\n2. **リモートワーク導入** - 採用エリアを全国に拡大、規程テンプレート提供\n3. **採用チャネル最適化** - 効果的な求人媒体の選定・運用戦略\n\n**中期的な施策**\n1. 社内研修プログラムの設計\n2. 評価制度の透明化・再設計\n3. 従業員エンゲージメント向上策\n\n**長期的な施策**\n1. 事業承継計画の策定\n2. 次世代リーダーの育成プログラム\n3. 組織文化づくり\n\n※ 実行フェーズで専門家が必要な場合、人事コンサルタントをご紹介可能です（プロプラン以上）\n\nまず最も困っている人材課題は何ですか？（採用？育成？定着？）`,
    ],
    "strategy-consultant": [
      `経営戦略コンサルタントとしてお答えします。\n\n「${userMessage}」について、以下のフレームワークで整理しましょう：\n\n**経営戦略の立案ステップ**\n\n1. **現状分析（SWOT分析）**\n   - 強み：御社の独自技術、地域での信頼\n   - 弱み：リソース不足、デジタル化の遅れ\n   - 機会：地方創生の追い風、EC市場の成長\n   - 脅威：人口減少、大手参入\n\n2. **事業計画の策定**\n   - 3年後のビジョン設定\n   - 年度ごとの売上目標\n   - 必要な投資計画\n\n3. **補助金・助成金の活用**\n   - ものづくり補助金（最大1,250万円）\n   - IT導入補助金（最大450万円）\n   - 事業再構築補助金\n   - 小規模事業者持続化補助金\n\n御社の年商規模と従業員数を教えていただけますか？最適な支援制度を提案します。`,
    ],
  };

  const agentResponses = responses[agentId] || responses["strategy-consultant"];
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

export default function ConsultingChat({ initialAgentId }: ConsultingChatProps) {
  const [selectedAgent, setSelectedAgent] = useState(
    initialAgentId || "strategy-consultant"
  );
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agent = AI_AGENTS.find((a) => a.id === selectedAgent)!;

  useEffect(() => {
    const welcomeAgent = AI_AGENTS.find((a) => a.id === selectedAgent);
    if (welcomeAgent) {
      setMessages([
        {
          id: "welcome",
          agentId: welcomeAgent.id,
          agentName: welcomeAgent.name,
          content: `こんにちは！${welcomeAgent.name}です。${welcomeAgent.description}\n\nどのようなお悩みがありますか？お気軽にご相談ください。`,
          timestamp: new Date(),
          type: "agent",
        },
      ]);
    }
  }, [selectedAgent]);

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
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const responseText = generateAgentResponse(selectedAgent, input);
      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        agentId: selectedAgent,
        agentName: agent.name,
        content: responseText,
        timestamp: new Date(),
        type: "agent",
      };
      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Agent sidebar */}
      <div className="hidden md:flex w-64 bg-white border-r border-border flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-sm text-text-secondary">
            AIエージェント一覧
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {AI_AGENTS.map((a) => {
            const Icon = iconMap[a.icon] || Target;
            return (
              <button
                key={a.id}
                onClick={() => setSelectedAgent(a.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors mb-1 ${
                  selectedAgent === a.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-gray-50 text-text-secondary"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="text-xs opacity-70 truncate">{a.specialty}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-surface">
        {/* Agent header */}
        <div className="bg-white border-b border-border px-6 py-3 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${agent.color}15` }}
          >
            {(() => {
              const Icon = iconMap[agent.icon] || Target;
              return <Icon className="w-5 h-5" style={{ color: agent.color }} />;
            })()}
          </div>
          <div>
            <h3 className="font-bold">{agent.name}</h3>
            <p className="text-xs text-text-secondary">{agent.role}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs text-secondary font-medium">オンライン</span>
          </div>
        </div>

        {/* Messages */}
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
                <div
                  className={`text-xs mt-2 ${
                    msg.type === "user" ? "text-white/60" : "text-text-secondary"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
                  <div
                    className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-border p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="経営のお悩みを入力してください..."
              className="flex-1 px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-text-secondary mt-2">
            AIエージェントの回答は参考情報です。重要な経営判断は専門家にもご相談ください。
          </p>
        </div>
      </div>
    </div>
  );
}
