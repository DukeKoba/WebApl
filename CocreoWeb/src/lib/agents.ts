import { Agent } from "@/types";

export const AI_AGENTS: Agent[] = [
  {
    id: "market-researcher",
    name: "マーケットリサーチャー",
    role: "市場調査・分析専門AI",
    specialty: "マーケティング",
    description:
      "地方市場の動向分析、競合調査、顧客ニーズの把握を行い、データドリブンなマーケティング戦略を提案します。",
    icon: "TrendingUp",
    color: "#EA580C",
    capabilities: [
      "地域市場の規模・成長性分析",
      "競合企業の強み・弱み分析",
      "ターゲット顧客のペルソナ作成",
      "SNS・デジタルマーケティング戦略立案",
      "広告ROI最適化提案",
    ],
  },
  {
    id: "product-developer",
    name: "プロダクトイノベーター",
    role: "商品開発・新規事業専門AI",
    specialty: "商品開発",
    description:
      "地域資源を活かした新商品開発、既存商品の改良、新規事業のアイデア創出をサポートします。",
    icon: "Lightbulb",
    color: "#F97316",
    capabilities: [
      "地域資源の発掘・活用提案",
      "商品コンセプト設計",
      "プロトタイプ開発ロードマップ作成",
      "市場投入戦略（GTM）策定",
      "顧客フィードバック分析",
    ],
  },
  {
    id: "dx-advisor",
    name: "DXアドバイザー",
    role: "デジタル変革専門AI",
    specialty: "DX推進",
    description:
      "業務プロセスのデジタル化、ITツール導入支援、EC展開など、中小企業のDXを包括的にサポートします。",
    icon: "Monitor",
    color: "#C2410C",
    capabilities: [
      "業務プロセスの可視化・改善提案",
      "適切なITツール・SaaSの選定",
      "ECサイト構築・運営戦略",
      "データ活用基盤の構築支援",
      "セキュリティ対策の提案",
    ],
  },
  {
    id: "hr-strategist",
    name: "HR戦略パートナー",
    role: "人材戦略専門AI",
    specialty: "人材・組織",
    description:
      "採用戦略、人材育成、組織づくりを支援し、地方企業の人材課題を解決します。必要に応じて専門コンサルタントもご紹介します。",
    icon: "Users",
    color: "#FB923C",
    capabilities: [
      "採用ブランディング戦略",
      "人材育成プログラム設計",
      "リモートワーク導入支援",
      "評価制度・報酬制度の設計",
      "組織文化・エンゲージメント向上",
    ],
  },
  {
    id: "strategy-consultant",
    name: "経営戦略コンサルタント",
    role: "経営戦略・財務専門AI",
    specialty: "経営戦略",
    description:
      "事業計画策定、財務分析、補助金活用など、中小企業の経営基盤強化を総合的にサポートします。",
    icon: "Target",
    color: "#EA580C",
    capabilities: [
      "事業計画書の作成支援",
      "財務分析・キャッシュフロー改善",
      "補助金・助成金の活用提案",
      "事業承継・M&A戦略",
      "リスク管理・BCP策定",
    ],
  },
];

export function getAgentById(id: string): Agent | undefined {
  return AI_AGENTS.find((agent) => agent.id === id);
}

export function getAgentsBySpecialty(specialty: string): Agent[] {
  return AI_AGENTS.filter((agent) => agent.specialty === specialty);
}
