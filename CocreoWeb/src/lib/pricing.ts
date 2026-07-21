/**
 * Cocreo マネタイズモデル & AIコスト分析
 *
 * ビジネスモデル: AI完結型コンサルティング + オプション人間コンサル紹介
 */

// === Claude API コスト構造 ===
export const AI_COST = {
  // Claude Sonnet 4.5 (メインで使用 - コスパ最適)
  sonnet: {
    inputPerMToken: 3.0,   // $3.00 / 1M input tokens
    outputPerMToken: 15.0,  // $15.00 / 1M output tokens
    name: "Claude Sonnet 4.5",
  },
  // Claude Haiku 4.5 (簡単な質問・分類用)
  haiku: {
    inputPerMToken: 1.0,   // $1.00 / 1M input tokens
    outputPerMToken: 5.0,  // $5.00 / 1M output tokens
    name: "Claude Haiku 4.5",
  },
  // バッチAPI (レポート生成用 - 50%割引)
  batch: {
    inputPerMToken: 1.5,   // $1.50 / 1M input tokens (Sonnet batch)
    outputPerMToken: 7.5,  // $7.50 / 1M output tokens
    name: "Batch API (Sonnet)",
  },
  exchangeRate: 150, // USD/JPY想定
};

// 1セッションあたりの平均トークン消費量（推定）
export const SESSION_TOKEN_ESTIMATES = {
  quickChat: {
    label: "クイック相談",
    inputTokens: 2000,
    outputTokens: 1500,
    sessionsPerMonth: 20,
  },
  deepConsulting: {
    label: "深掘りコンサル",
    inputTokens: 5000,
    outputTokens: 4000,
    sessionsPerMonth: 8,
  },
  proposalGeneration: {
    label: "提案書生成",
    inputTokens: 8000,
    outputTokens: 10000,
    sessionsPerMonth: 2,
  },
  plbsAnalysis: {
    label: "PL/BS分析",
    inputTokens: 10000,
    outputTokens: 8000,
    sessionsPerMonth: 1,
  },
};

// 月間AIコストの計算（1ユーザーあたり）
export function calculateMonthlyCost(planId: string): MonthlyCostBreakdown {
  const plan = PRICING_PLANS.find((p) => p.id === planId);
  if (!plan) return { totalCostUSD: 0, totalCostJPY: 0, items: [], margin: 0, marginRate: 0 };

  const items: CostItem[] = [];

  // Sonnet利用（メイン）
  const sonnetInput =
    (plan.estimatedSessions.quickChat * SESSION_TOKEN_ESTIMATES.quickChat.inputTokens +
      plan.estimatedSessions.deepConsulting * SESSION_TOKEN_ESTIMATES.deepConsulting.inputTokens +
      plan.estimatedSessions.proposalGeneration * SESSION_TOKEN_ESTIMATES.proposalGeneration.inputTokens +
      plan.estimatedSessions.plbsAnalysis * SESSION_TOKEN_ESTIMATES.plbsAnalysis.inputTokens) /
    1_000_000;
  const sonnetOutput =
    (plan.estimatedSessions.quickChat * SESSION_TOKEN_ESTIMATES.quickChat.outputTokens +
      plan.estimatedSessions.deepConsulting * SESSION_TOKEN_ESTIMATES.deepConsulting.outputTokens +
      plan.estimatedSessions.proposalGeneration * SESSION_TOKEN_ESTIMATES.proposalGeneration.outputTokens +
      plan.estimatedSessions.plbsAnalysis * SESSION_TOKEN_ESTIMATES.plbsAnalysis.outputTokens) /
    1_000_000;

  const sonnetCost =
    sonnetInput * AI_COST.sonnet.inputPerMToken +
    sonnetOutput * AI_COST.sonnet.outputPerMToken;

  items.push({
    name: "Claude Sonnet 4.5 (チャット・分析)",
    costUSD: sonnetCost,
    costJPY: sonnetCost * AI_COST.exchangeRate,
  });

  // Haiku利用（分類・簡易応答）
  const haikuTokens = plan.estimatedSessions.quickChat * 500 / 1_000_000;
  const haikuCost =
    haikuTokens * AI_COST.haiku.inputPerMToken +
    haikuTokens * AI_COST.haiku.outputPerMToken;

  items.push({
    name: "Claude Haiku 4.5 (分類・ルーティング)",
    costUSD: haikuCost,
    costJPY: haikuCost * AI_COST.exchangeRate,
  });

  // インフラコスト（Vercel/AWS等）
  const infraCost = plan.id === "free" ? 0 : plan.id === "starter" ? 2 : plan.id === "pro" ? 5 : 15;
  items.push({
    name: "インフラ (Vercel/DB/Storage)",
    costUSD: infraCost,
    costJPY: infraCost * AI_COST.exchangeRate,
  });

  const totalCostUSD = items.reduce((s, i) => s + i.costUSD, 0);
  const totalCostJPY = totalCostUSD * AI_COST.exchangeRate;
  const margin = plan.priceJPY - totalCostJPY;
  const marginRate = plan.priceJPY > 0 ? (margin / plan.priceJPY) * 100 : 0;

  return { totalCostUSD, totalCostJPY, items, margin, marginRate };
}

export interface CostItem {
  name: string;
  costUSD: number;
  costJPY: number;
}

export interface MonthlyCostBreakdown {
  totalCostUSD: number;
  totalCostJPY: number;
  items: CostItem[];
  margin: number;
  marginRate: number;
}

// === 料金プラン ===
export interface PricingPlan {
  id: string;
  name: string;
  priceJPY: number;
  priceLabel: string;
  description: string;
  features: string[];
  limitations: string[];
  estimatedSessions: {
    quickChat: number;
    deepConsulting: number;
    proposalGeneration: number;
    plbsAnalysis: number;
  };
  consultantReferral: boolean;
  recommended?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "フリー",
    priceJPY: 0,
    priceLabel: "¥0",
    description: "まずはAIコンサルを体験",
    features: [
      "経営診断（月1回）",
      "AIチャット相談（月5回）",
      "基本的な経営アドバイス",
    ],
    limitations: [
      "提案書生成なし",
      "PL/BS分析なし",
      "コンサルタント紹介なし",
    ],
    estimatedSessions: {
      quickChat: 5,
      deepConsulting: 0,
      proposalGeneration: 0,
      plbsAnalysis: 0,
    },
    consultantReferral: false,
  },
  {
    id: "starter",
    name: "スターター",
    priceJPY: 9800,
    priceLabel: "¥9,800/月",
    description: "小規模事業者の経営改善に",
    features: [
      "AIチャット相談（無制限）",
      "経営診断（随時）",
      "オーダーメイド提案書（月2回）",
      "簡易PL分析（月1回）",
      "メール質問サポート",
    ],
    limitations: [
      "BS分析なし",
      "コンサルタント紹介なし",
    ],
    estimatedSessions: {
      quickChat: 20,
      deepConsulting: 4,
      proposalGeneration: 2,
      plbsAnalysis: 1,
    },
    consultantReferral: false,
  },
  {
    id: "pro",
    name: "プロ",
    priceJPY: 29800,
    priceLabel: "¥29,800/月",
    description: "本格的な経営戦略支援",
    features: [
      "AIチャット相談（無制限）",
      "オーダーメイド提案書（無制限）",
      "PL/BS分析（月次レポート）",
      "補助金マッチング",
      "KPIダッシュボード",
      "専門コンサルタント紹介（月1回）",
    ],
    limitations: [],
    estimatedSessions: {
      quickChat: 40,
      deepConsulting: 8,
      proposalGeneration: 4,
      plbsAnalysis: 2,
    },
    consultantReferral: true,
    recommended: true,
  },
  {
    id: "enterprise",
    name: "エンタープライズ",
    priceJPY: 98000,
    priceLabel: "¥98,000/月",
    description: "複数拠点・グループ企業向け",
    features: [
      "プロプランの全機能",
      "複数ユーザーアカウント（5名まで）",
      "カスタムAIエージェント",
      "月次経営レビューレポート",
      "専門コンサルタント紹介（無制限）",
      "優先サポート",
      "API連携",
    ],
    limitations: [],
    estimatedSessions: {
      quickChat: 100,
      deepConsulting: 20,
      proposalGeneration: 10,
      plbsAnalysis: 4,
    },
    consultantReferral: true,
  },
];

// === コンサルタント紹介サービス ===
export interface ConsultantProfile {
  id: string;
  name: string;
  specialty: string;
  description: string;
  experience: string;
  rate: string;
  availability: string;
  matchScore?: number;
}

export const CONSULTANT_SPECIALTIES = [
  { id: "marketing", label: "マーケティング・集客", icon: "TrendingUp" },
  { id: "finance", label: "財務・税務・補助金", icon: "BarChart3" },
  { id: "it", label: "IT・DX推進", icon: "Monitor" },
  { id: "hr", label: "人事・組織開発", icon: "Users" },
  { id: "product", label: "商品開発・ブランディング", icon: "Lightbulb" },
  { id: "legal", label: "法務・知財", icon: "Shield" },
];

// AIコンサルで解決 → 必要に応じて人間コンサルを紹介するフロー
export function shouldRecommendConsultant(
  challengeType: string,
  complexity: "low" | "medium" | "high"
): { recommend: boolean; reason: string; specialties: string[] } {
  // 高度な実行・専門判断が必要なケースのみ人間コンサルを推奨
  const highComplexityCases: Record<string, { reason: string; specialties: string[] }> = {
    "経営戦略・資金調達": {
      reason: "補助金申請の代行や融資交渉は専門家のサポートが効果的です",
      specialties: ["finance"],
    },
    "採用・人材確保": {
      reason: "採用面接や組織づくりの実行フェーズは人的サポートが有効です",
      specialties: ["hr"],
    },
  };

  if (complexity === "high" && highComplexityCases[challengeType]) {
    return {
      recommend: true,
      ...highComplexityCases[challengeType],
    };
  }

  if (complexity === "high") {
    return {
      recommend: true,
      reason: "実行フェーズでの専門家サポートをお勧めします",
      specialties: ["marketing", "it"],
    };
  }

  return {
    recommend: false,
    reason: "AIコンサルティングで対応可能です",
    specialties: [],
  };
}

// === 事業収支シミュレーション ===
export interface BusinessProjection {
  month: number;
  users: number;
  revenue: number;
  aiCost: number;
  infraCost: number;
  operatingCost: number;
  profit: number;
  cumulativeProfit: number;
}

export function generateBusinessProjection(months: number = 24): BusinessProjection[] {
  const projections: BusinessProjection[] = [];
  let cumulativeProfit = -500000; // 初期開発費

  // ユーザー成長モデル（月次）
  const growthModel = {
    freeConversionRate: 0.15,   // フリー→有料転換率
    monthlyGrowthRate: 0.20,    // 月次ユーザー成長率（初期）
    churnRate: 0.05,            // 月次解約率
  };

  // プラン分布（有料ユーザー）
  const planDistribution = {
    starter: 0.55,
    pro: 0.35,
    enterprise: 0.10,
  };

  let totalUsers = 10; // 初月ユーザー数

  for (let month = 1; month <= months; month++) {
    // ユーザー成長（成長率は逓減）
    const growthRate = growthModel.monthlyGrowthRate * Math.max(0.3, 1 - month / 36);
    totalUsers = Math.floor(totalUsers * (1 + growthRate) * (1 - growthModel.churnRate));

    const paidUsers = Math.floor(totalUsers * growthModel.freeConversionRate);
    const starterUsers = Math.floor(paidUsers * planDistribution.starter);
    const proUsers = Math.floor(paidUsers * planDistribution.pro);
    const enterpriseUsers = Math.max(1, Math.floor(paidUsers * planDistribution.enterprise));

    const revenue =
      starterUsers * 9800 +
      proUsers * 29800 +
      enterpriseUsers * 98000;

    // コンサルタント紹介のコミッション（プロ以上ユーザーの10%が紹介利用）
    const referralRevenue = Math.floor((proUsers + enterpriseUsers) * 0.1) * 30000;

    const totalRevenue = revenue + referralRevenue;

    // AIコスト
    const starterCost = calculateMonthlyCost("starter");
    const proCost = calculateMonthlyCost("pro");
    const enterpriseCost = calculateMonthlyCost("enterprise");
    const aiCost =
      starterUsers * starterCost.totalCostJPY +
      proUsers * proCost.totalCostJPY +
      enterpriseUsers * enterpriseCost.totalCostJPY;

    // インフラ・固定費
    const infraCost = 50000 + totalUsers * 100; // 基本5万 + ユーザーあたり100円
    const operatingCost = 200000; // 運営固定費（月20万）

    const profit = totalRevenue - aiCost - infraCost - operatingCost;
    cumulativeProfit += profit;

    projections.push({
      month,
      users: totalUsers,
      revenue: totalRevenue,
      aiCost,
      infraCost,
      operatingCost,
      profit,
      cumulativeProfit,
    });
  }

  return projections;
}
