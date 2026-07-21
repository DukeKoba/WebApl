/**
 * 中小企業白書2025ベースの課題データベース & 差別化シミュレーションエンジン
 *
 * 他社にない差別化要素:
 * 1. 価格転嫁シミュレーター（転嫁率49.7%問題）
 * 2. 賃上げ余力診断（労働分配率80%問題）
 * 3. 事業承継スコアリング（経営者平均60.7歳問題）
 * 4. 経営力スコア（白書3軸: 個人特性・戦略策定・組織人材）
 */

// ============================
// 1. 価格転嫁シミュレーター
// ============================

export interface PricePassThroughInput {
  currentRevenue: number;         // 現在の年商
  materialCostRatio: number;      // 原材料費比率 (%)
  laborCostRatio: number;         // 人件費比率 (%)
  costIncreaseRate: number;       // コスト上昇率 (%)
  currentPassThroughRate: number; // 現在の転嫁率 (%)
  targetPassThroughRate: number;  // 目標転嫁率 (%)
  mainCustomerType: "BtoB" | "BtoC" | "both";
}

export interface PricePassThroughResult {
  currentAbsorption: number;      // 現在の自社負担額
  targetAbsorption: number;       // 目標転嫁後の自社負担額
  profitRecovery: number;         // 利益回復額
  requiredPriceIncrease: number;  // 必要な値上げ幅 (%)
  breakEvenPassThrough: number;   // 損益分岐転嫁率 (%)
  industryAvgRate: number;        // 業界平均転嫁率
  strategies: PassThroughStrategy[];
  timeline: string[];
}

export interface PassThroughStrategy {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  impact: "high" | "medium" | "low";
  timeframe: string;
}

export function simulatePricePassThrough(
  input: PricePassThroughInput
): PricePassThroughResult {
  const totalCostIncrease =
    input.currentRevenue *
    ((input.materialCostRatio + input.laborCostRatio) / 100) *
    (input.costIncreaseRate / 100);

  const currentAbsorption =
    totalCostIncrease * (1 - input.currentPassThroughRate / 100);
  const targetAbsorption =
    totalCostIncrease * (1 - input.targetPassThroughRate / 100);
  const profitRecovery = currentAbsorption - targetAbsorption;

  const requiredPriceIncrease =
    ((input.targetPassThroughRate - input.currentPassThroughRate) / 100) *
    (input.costIncreaseRate / 100) *
    ((input.materialCostRatio + input.laborCostRatio) / 100) *
    100;

  // 営業利益率5%を確保するための最低転嫁率
  const operatingMarginTarget = 0.05;
  const costRatio = (input.materialCostRatio + input.laborCostRatio) / 100;
  const breakEvenPassThrough = Math.min(
    100,
    Math.max(
      0,
      ((input.costIncreaseRate / 100) * costRatio - operatingMarginTarget) /
        ((input.costIncreaseRate / 100) * costRatio) *
        100
    )
  );

  const industryAvgRate = 49.7; // 2024年9月時点

  const strategies: PassThroughStrategy[] = [];

  // BtoB向け戦略
  if (input.mainCustomerType === "BtoB" || input.mainCustomerType === "both") {
    strategies.push(
      {
        title: "コスト構造の可視化と根拠提示",
        description:
          "原材料費・エネルギー費・人件費の上昇を定量的にまとめた「コスト変動レポート」を作成し、取引先に提示。パートナーシップ構築宣言企業には特に有効。",
        difficulty: "easy",
        impact: "high",
        timeframe: "1-2週間",
      },
      {
        title: "価格交渉促進月間（9月/3月）の活用",
        description:
          "政府が設定する価格交渉促進月間に合わせて交渉。下請Gメンの調査対象でもあり、買い手側も応じやすいタイミング。",
        difficulty: "easy",
        impact: "medium",
        timeframe: "次回月間まで",
      },
      {
        title: "スライド条項・自動改定条項の導入",
        description:
          "契約に原材料価格連動の自動値上げ条項を盛り込む。毎回の交渉コストを削減し、継続的な転嫁を実現。",
        difficulty: "medium",
        impact: "high",
        timeframe: "次回契約更新時",
      }
    );
  }

  // BtoC向け戦略
  if (input.mainCustomerType === "BtoC" || input.mainCustomerType === "both") {
    strategies.push(
      {
        title: "付加価値向上による「値上げ」ではなく「価値上げ」",
        description:
          "商品の品質向上・パッケージ変更・サイズ変更と同時に価格改定。消費者に値上げの合理性を伝えるストーリーを構築。",
        difficulty: "medium",
        impact: "high",
        timeframe: "1-3ヶ月",
      },
      {
        title: "ダイナミックプライシングの導入",
        description:
          "需要に応じた価格設定で収益最大化。繁閑差のある業種（飲食・宿泊等）で特に有効。",
        difficulty: "hard",
        impact: "high",
        timeframe: "3-6ヶ月",
      }
    );
  }

  // 共通戦略
  strategies.push(
    {
      title: "原価管理のデジタル化",
      description:
        "AIによるリアルタイム原価計算を導入。コスト変動を即座に把握し、適切なタイミングで価格改定。",
      difficulty: "medium",
      impact: "medium",
      timeframe: "1-3ヶ月",
    },
    {
      title: "取引先の分散・新規開拓",
      description:
        "特定取引先への依存度を下げ、価格交渉力を強化。EC販路の開拓でBtoC直販比率を高める。",
      difficulty: "hard",
      impact: "high",
      timeframe: "6-12ヶ月",
    }
  );

  const timeline = [
    "Week 1-2: コスト構造分析レポートの作成（AIが自動生成）",
    "Week 3-4: 主要取引先への価格改定通知の準備",
    "Month 2: 価格交渉の実施（上位3取引先から）",
    "Month 3: 契約条件の見直し（スライド条項の検討）",
    "Month 4-6: 新規販路の開拓・直販チャネルの強化",
    "Month 6: 効果測定・次期改定計画の策定",
  ];

  return {
    currentAbsorption,
    targetAbsorption,
    profitRecovery,
    requiredPriceIncrease,
    breakEvenPassThrough,
    industryAvgRate,
    strategies,
    timeline,
  };
}

// ============================
// 2. 賃上げ余力診断
// ============================

export interface WageCapacityInput {
  annualRevenue: number;
  operatingProfit: number;
  totalLaborCost: number;
  employeeCount: number;
  currentAvgWage: number;      // 一人あたり平均年収
  targetRaiseRate: number;     // 目標賃上げ率(%)
  pricePassThroughPlan: number; // 価格転嫁での吸収予定(万円)
  productivityGainPlan: number; // 生産性向上での捻出予定(万円)
}

export interface WageCapacityResult {
  laborShareRate: number;           // 労働分配率
  laborShareStatus: "healthy" | "warning" | "critical";
  totalRaiseCost: number;           // 賃上げ総額
  affordability: "affordable" | "stretch" | "difficult";
  profitAfterRaise: number;
  laborShareAfterRaise: number;
  fundingSources: FundingSource[];
  recommendations: string[];
  industryBenchmark: { avgWage: number; avgRaiseRate: number; laborShare: number };
}

export interface FundingSource {
  source: string;
  amount: number;
  feasibility: "high" | "medium" | "low";
}

export function diagnoseWageCapacity(
  input: WageCapacityInput
): WageCapacityResult {
  const grossValueAdded = input.operatingProfit + input.totalLaborCost;
  const laborShareRate =
    grossValueAdded > 0 ? (input.totalLaborCost / grossValueAdded) * 100 : 100;

  const laborShareStatus: "healthy" | "warning" | "critical" =
    laborShareRate < 60 ? "healthy" : laborShareRate < 75 ? "warning" : "critical";

  const totalRaiseCost =
    input.totalLaborCost * (input.targetRaiseRate / 100);

  const profitAfterRaise = input.operatingProfit - totalRaiseCost +
    input.pricePassThroughPlan * 10000 + input.productivityGainPlan * 10000;

  const newLaborCost = input.totalLaborCost + totalRaiseCost;
  const newGVA = profitAfterRaise + newLaborCost;
  const laborShareAfterRaise = newGVA > 0 ? (newLaborCost / newGVA) * 100 : 100;

  const affordability: "affordable" | "stretch" | "difficult" =
    profitAfterRaise > input.operatingProfit * 0.5
      ? "affordable"
      : profitAfterRaise > 0
      ? "stretch"
      : "difficult";

  const fundingSources: FundingSource[] = [
    {
      source: "価格転嫁による原資確保",
      amount: input.pricePassThroughPlan * 10000,
      feasibility: "medium",
    },
    {
      source: "生産性向上・省力化投資",
      amount: input.productivityGainPlan * 10000,
      feasibility: "medium",
    },
    {
      source: "業務プロセス改善によるコスト削減",
      amount: Math.round(input.totalLaborCost * 0.03),
      feasibility: "high",
    },
    {
      source: "業務効率化補助金の活用",
      amount: Math.min(4500000, totalRaiseCost * 0.5),
      feasibility: "medium",
    },
  ];

  if (totalRaiseCost > input.operatingProfit * 0.3) {
    fundingSources.push({
      source: "賃上げ促進税制の活用（法人税控除）",
      amount: Math.round(totalRaiseCost * 0.25),
      feasibility: "high",
    });
  }

  const recommendations: string[] = [];

  if (laborShareRate >= 75) {
    recommendations.push(
      "労働分配率が75%超と高水準。賃上げの前に付加価値向上（価格転嫁・新商品開発）が必須"
    );
  }
  if (affordability === "difficult") {
    recommendations.push(
      "現在の利益水準では目標賃上げ率の達成は困難。まず価格転嫁と生産性向上に注力を推奨"
    );
    recommendations.push(
      "段階的な賃上げ（初年度2%→2年目で目標率）を検討"
    );
  }
  if (input.targetRaiseRate >= 4.5) {
    recommendations.push(
      "4.5%以上の賃上げは中小企業平均並み。賃上げ促進税制を活用して税負担を軽減"
    );
  }
  recommendations.push(
    "省力化投資補助金（最大1,500万円）を活用し、IT/AI導入で1人あたり生産性を20%向上させることで賃上げ原資を確保"
  );
  recommendations.push(
    "人材定着による採用コスト削減も賃上げ原資に。離職率を10%改善すると年間約" +
      Math.round((input.currentAvgWage * 0.3 * input.employeeCount * 0.1) / 10000) +
      "万円のコスト削減効果"
  );

  return {
    laborShareRate: Math.round(laborShareRate * 10) / 10,
    laborShareStatus,
    totalRaiseCost,
    affordability,
    profitAfterRaise,
    laborShareAfterRaise: Math.round(laborShareAfterRaise * 10) / 10,
    fundingSources,
    recommendations,
    industryBenchmark: {
      avgWage: 3800000,
      avgRaiseRate: 4.5,
      laborShare: 78,
    },
  };
}

// ============================
// 3. 事業承継スコアリング
// ============================

export interface SuccessionInput {
  ownerAge: number;
  hasSuccessor: boolean;
  successorType?: "family" | "employee" | "external" | "undecided";
  yearsToPlannedRetirement: number;
  hasWrittenPlan: boolean;
  hasStartedTransition: boolean;
  keyPersonDependency: "high" | "medium" | "low";
  financialHealth: "good" | "fair" | "poor";
  employeeCount: number;
  hasIntellectualProperty: boolean;
  businessValuationDone: boolean;
}

export interface SuccessionResult {
  totalScore: number;
  maxScore: number;
  urgencyLevel: "critical" | "high" | "medium" | "low";
  categories: SuccessionCategory[];
  estimatedTimelineMonths: number;
  recommendations: string[];
  risks: string[];
  supportPrograms: string[];
}

export interface SuccessionCategory {
  name: string;
  score: number;
  maxScore: number;
  status: "good" | "warning" | "danger";
  details: string;
}

export function scoreSuccession(input: SuccessionInput): SuccessionResult {
  const categories: SuccessionCategory[] = [];

  // 1. 後継者準備 (30点)
  let successorScore = 0;
  let successorDetail = "";
  if (input.hasSuccessor && input.successorType === "family") {
    successorScore = 25;
    successorDetail = "親族後継者が確定。育成計画の具体化を推奨";
  } else if (input.hasSuccessor && input.successorType === "employee") {
    successorScore = 20;
    successorDetail = "従業員承継は株式取得の資金面の検討が必要";
  } else if (input.hasSuccessor && input.successorType === "external") {
    successorScore = 15;
    successorDetail = "第三者承継（M&A含む）は専門家支援の活用を推奨";
  } else {
    successorScore = 5;
    successorDetail = "後継者未定。早急に事業承継計画の検討開始が必要";
  }
  if (input.hasStartedTransition) successorScore += 5;
  categories.push({
    name: "後継者準備",
    score: Math.min(30, successorScore),
    maxScore: 30,
    status: successorScore >= 20 ? "good" : successorScore >= 10 ? "warning" : "danger",
    details: successorDetail,
  });

  // 2. 計画・準備 (25点)
  let planScore = 0;
  if (input.hasWrittenPlan) planScore += 15;
  if (input.businessValuationDone) planScore += 10;
  categories.push({
    name: "計画・準備",
    score: planScore,
    maxScore: 25,
    status: planScore >= 15 ? "good" : planScore >= 10 ? "warning" : "danger",
    details: input.hasWrittenPlan
      ? "事業承継計画書あり" + (input.businessValuationDone ? "、企業価値評価済み" : "。企業価値評価を推奨")
      : "事業承継計画書の作成が最優先課題",
  });

  // 3. 時間的余裕 (25点)
  let timeScore = 0;
  if (input.yearsToPlannedRetirement > 10) timeScore = 25;
  else if (input.yearsToPlannedRetirement > 5) timeScore = 20;
  else if (input.yearsToPlannedRetirement > 3) timeScore = 12;
  else if (input.yearsToPlannedRetirement > 1) timeScore = 5;
  else timeScore = 0;
  categories.push({
    name: "時間的余裕",
    score: timeScore,
    maxScore: 25,
    status: timeScore >= 15 ? "good" : timeScore >= 8 ? "warning" : "danger",
    details:
      input.yearsToPlannedRetirement <= 3
        ? `引退まで${input.yearsToPlannedRetirement}年。事業承継は通常5-10年かかるため非常に緊急度が高い`
        : `引退まで${input.yearsToPlannedRetirement}年。計画的に準備を進められる`,
  });

  // 4. 組織・リスク (20点)
  let orgScore = 0;
  if (input.keyPersonDependency === "low") orgScore += 10;
  else if (input.keyPersonDependency === "medium") orgScore += 5;
  if (input.financialHealth === "good") orgScore += 7;
  else if (input.financialHealth === "fair") orgScore += 4;
  if (input.hasIntellectualProperty) orgScore += 3;
  categories.push({
    name: "組織体制・リスク",
    score: Math.min(20, orgScore),
    maxScore: 20,
    status: orgScore >= 14 ? "good" : orgScore >= 7 ? "warning" : "danger",
    details:
      input.keyPersonDependency === "high"
        ? "経営者への依存度が高い。業務の属人化解消が急務"
        : "組織としての事業運営基盤がある程度整っている",
  });

  const totalScore = categories.reduce((s, c) => s + c.score, 0);
  const maxScore = 100;

  const urgencyLevel: "critical" | "high" | "medium" | "low" =
    input.ownerAge >= 70 && !input.hasSuccessor
      ? "critical"
      : input.ownerAge >= 65 || (!input.hasSuccessor && input.yearsToPlannedRetirement <= 5)
      ? "high"
      : totalScore < 40
      ? "medium"
      : "low";

  const estimatedTimelineMonths =
    input.hasSuccessor && input.hasWrittenPlan ? 24 : input.hasSuccessor ? 36 : 60;

  const recommendations: string[] = [];
  if (!input.hasSuccessor) {
    recommendations.push("事業引継ぎ支援センター（全国47ヶ所）に相談し、後継者マッチングを開始");
    recommendations.push("M&Aプラットフォーム（バトンズ、TRANBI等）への登録を検討");
  }
  if (!input.hasWrittenPlan) {
    recommendations.push("事業承継計画書を作成。Cocreoの経営戦略コンサルタントが雛形を提供");
  }
  if (!input.businessValuationDone) {
    recommendations.push("企業価値評価（簡易版）を実施。PL/BS分析機能を活用可能");
  }
  if (input.keyPersonDependency === "high") {
    recommendations.push("業務マニュアルの整備とナレッジのデジタル化で属人化を解消");
    recommendations.push("経営者の職務権限を段階的に分散し、一人経営体制を克服");
  }
  if (input.ownerAge >= 60) {
    recommendations.push("事業承継税制（特例措置）の活用で、贈与税・相続税の納税猶予を検討");
  }

  const risks: string[] = [];
  if (input.ownerAge >= 65 && !input.hasSuccessor) {
    risks.push("後継者不在のまま経営者の高齢化が進行。突発的な休廃業リスクが高い");
  }
  if (input.keyPersonDependency === "high") {
    risks.push("経営者に万一のことがあった場合、事業継続が困難になる可能性");
  }
  if (input.employeeCount > 10 && !input.hasWrittenPlan) {
    risks.push("従業員の雇用維持の観点からも、早期の承継計画策定が重要");
  }

  const supportPrograms = [
    "事業承継・引継ぎ補助金（最大800万円）",
    "事業承継税制（特例措置）- 贈与税・相続税の納税猶予",
    "事業引継ぎ支援センター（無料相談）",
    "経営承継円滑化法に基づく金融支援",
    "事業承継ファンド（中小機構）",
  ];

  return {
    totalScore,
    maxScore,
    urgencyLevel,
    categories,
    estimatedTimelineMonths,
    recommendations,
    risks,
    supportPrograms,
  };
}

// ============================
// 4. 経営力スコア（白書3軸）
// ============================

export interface ManagementPowerInput {
  // 個人特性面
  networkActivity: 1 | 2 | 3 | 4 | 5;      // 異業種交流の活発さ
  learningHabit: 1 | 2 | 3 | 4 | 5;        // 学び直し・自己研鑽
  digitalLiteracy: 1 | 2 | 3 | 4 | 5;      // デジタルリテラシー
  riskTolerance: 1 | 2 | 3 | 4 | 5;        // 挑戦・リスクテイク

  // 戦略策定面
  hasBusinessPlan: boolean;                   // 経営計画の有無
  planExecutionRate: 1 | 2 | 3 | 4 | 5;     // 計画の実行度
  pricingStrategy: 1 | 2 | 3 | 4 | 5;      // 価格設定の戦略性
  differentiationLevel: 1 | 2 | 3 | 4 | 5;  // 差別化の度合い
  investmentInDX: 1 | 2 | 3 | 4 | 5;       // DX投資の積極性

  // 組織人材面
  missionSharing: 1 | 2 | 3 | 4 | 5;       // 経営理念の共有度
  infoTransparency: 1 | 2 | 3 | 4 | 5;     // 業績情報の共有度
  psychologicalSafety: 1 | 2 | 3 | 4 | 5;  // 心理的安全性
  talentDevelopment: 1 | 2 | 3 | 4 | 5;    // 人材育成の仕組み
  wageCompetitiveness: 1 | 2 | 3 | 4 | 5;  // 賃金の競争力
}

export interface ManagementPowerResult {
  totalScore: number;
  maxScore: number;
  grade: "S" | "A" | "B" | "C" | "D";
  axes: ManagementAxis[];
  strengths: string[];
  improvements: string[];
  actionPlan: string[];
}

export interface ManagementAxis {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  items: { name: string; score: number; maxScore: number }[];
}

export function scoreManagementPower(
  input: ManagementPowerInput
): ManagementPowerResult {
  // 個人特性面 (25点)
  const personalItems = [
    { name: "異業種ネットワーク", score: input.networkActivity, maxScore: 5 },
    { name: "学び直し・自己研鑽", score: input.learningHabit, maxScore: 5 },
    { name: "デジタルリテラシー", score: input.digitalLiteracy, maxScore: 5 },
    { name: "挑戦・リスクテイク", score: input.riskTolerance, maxScore: 5 },
  ];
  const personalScore = personalItems.reduce((s, i) => s + i.score, 0);
  const personalMax = 20;

  // 戦略策定面 (35点)
  const strategyItems = [
    { name: "経営計画の策定", score: input.hasBusinessPlan ? 5 : 1, maxScore: 5 },
    { name: "計画の実行度", score: input.planExecutionRate, maxScore: 5 },
    { name: "価格設定の戦略性", score: input.pricingStrategy, maxScore: 5 },
    { name: "差別化の度合い", score: input.differentiationLevel, maxScore: 5 },
    { name: "DX投資の積極性", score: input.investmentInDX, maxScore: 5 },
  ];
  const strategyScore = strategyItems.reduce((s, i) => s + i.score, 0);
  const strategyMax = 25;

  // 組織人材面 (40点)
  const orgItems = [
    { name: "経営理念の共有", score: input.missionSharing, maxScore: 5 },
    { name: "業績情報の共有", score: input.infoTransparency, maxScore: 5 },
    { name: "心理的安全性", score: input.psychologicalSafety, maxScore: 5 },
    { name: "人材育成の仕組み", score: input.talentDevelopment, maxScore: 5 },
    { name: "賃金の競争力", score: input.wageCompetitiveness, maxScore: 5 },
  ];
  const orgScore = orgItems.reduce((s, i) => s + i.score, 0);
  const orgMax = 25;

  const axes: ManagementAxis[] = [
    {
      name: "個人特性",
      score: personalScore,
      maxScore: personalMax,
      percentage: Math.round((personalScore / personalMax) * 100),
      items: personalItems,
    },
    {
      name: "戦略策定",
      score: strategyScore,
      maxScore: strategyMax,
      percentage: Math.round((strategyScore / strategyMax) * 100),
      items: strategyItems,
    },
    {
      name: "組織人材",
      score: orgScore,
      maxScore: orgMax,
      percentage: Math.round((orgScore / orgMax) * 100),
      items: orgItems,
    },
  ];

  const totalScore = personalScore + strategyScore + orgScore;
  const maxScore = personalMax + strategyMax + orgMax;
  const pct = (totalScore / maxScore) * 100;

  const grade: "S" | "A" | "B" | "C" | "D" =
    pct >= 85 ? "S" : pct >= 70 ? "A" : pct >= 55 ? "B" : pct >= 40 ? "C" : "D";

  const strengths: string[] = [];
  const improvements: string[] = [];

  axes.forEach((axis) => {
    if (axis.percentage >= 70) {
      strengths.push(`${axis.name}面が強い（${axis.percentage}%）`);
    }
    axis.items.forEach((item) => {
      if (item.score <= 2) {
        improvements.push(`${item.name}の強化が必要`);
      }
    });
  });

  const actionPlan: string[] = [];
  if (input.networkActivity <= 2)
    actionPlan.push("商工会議所やオンラインコミュニティでの異業種交流を月1回以上実施");
  if (input.learningHabit <= 2)
    actionPlan.push("経営者向けセミナー・書籍での学び直しを習慣化（月2回以上）");
  if (!input.hasBusinessPlan)
    actionPlan.push("3ヶ年経営計画書の策定（Cocreoが雛形・分析を支援）");
  if (input.pricingStrategy <= 2)
    actionPlan.push("適正価格設定のための原価分析（価格転嫁シミュレーター活用）");
  if (input.investmentInDX <= 2)
    actionPlan.push("IT導入補助金を活用したDX投資の開始");
  if (input.psychologicalSafety <= 2)
    actionPlan.push("1on1ミーティングの導入、社員提案制度の整備");
  if (input.infoTransparency <= 2)
    actionPlan.push("月次決算の社員への開示、経営状況の定期共有会の開催");
  if (input.wageCompetitiveness <= 2)
    actionPlan.push("賃上げ余力診断を実施し、段階的な待遇改善計画を策定");

  return {
    totalScore,
    maxScore,
    grade,
    axes,
    strengths,
    improvements,
    actionPlan,
  };
}

// ============================
// 5. 採用戦略プランナー
// ============================

export interface HiringStrategyInput {
  industry: string;
  region: string;
  employeeCount: number;
  annualRevenue: number;
  // 採用状況
  openPositions: number;              // 募集中ポジション数
  monthlyApplications: number;        // 月間応募数
  hiringBudgetMonthly: number;        // 月間採用予算（円）
  avgCostPerHire: number;             // 一人あたり採用コスト（円）
  avgTimeToHire: number;              // 平均採用期間（日）
  turnoverRate: number;               // 離職率（%）
  // 採用チャネル
  channels: {
    agencies: boolean;                // 人材紹介
    jobBoards: boolean;               // 求人サイト
    helloWork: boolean;               // ハローワーク
    referral: boolean;                // 社員紹介
    sns: boolean;                     // SNS採用
    directRecruit: boolean;           // ダイレクトリクルーティング
  };
  // 組織状態
  hasEmployerBrand: boolean;          // 採用ブランディングの有無
  hasCareerPath: boolean;             // キャリアパス制度の有無
  hasTrainingProgram: boolean;        // 研修制度の有無
  hasRemoteWork: boolean;             // リモートワーク可否
  wageCompetitiveness: 1 | 2 | 3 | 4 | 5; // 賃金競争力
  targetAgeGroup: "young" | "mid" | "senior" | "all"; // ターゲット年齢層
}

export interface HiringStrategyResult {
  // スコアリング
  overallScore: number;               // 総合スコア（100点）
  grade: "S" | "A" | "B" | "C" | "D";
  categories: HiringCategory[];
  // 分析
  costEfficiency: {
    currentCostPerHire: number;
    industryAvgCostPerHire: number;
    potentialSavings: number;
    costEfficiencyRating: "good" | "average" | "poor";
  };
  channelAnalysis: ChannelRecommendation[];
  // 戦略
  strategies: HiringStrategy[];
  improvementPlan: ImprovementPhase[];
  risks: string[];
  kpis: HiringKPI[];
}

export interface HiringCategory {
  name: string;
  score: number;
  maxScore: number;
  status: "good" | "warning" | "danger";
  details: string;
}

export interface ChannelRecommendation {
  channel: string;
  currentlyUsed: boolean;
  effectiveness: "high" | "medium" | "low";
  costLevel: "high" | "medium" | "low";
  recommendation: string;
  priority: number;
}

export interface HiringStrategy {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  difficulty: "easy" | "medium" | "hard";
  timeframe: string;
  estimatedCostReduction: number;      // %
}

export interface ImprovementPhase {
  phase: number;
  name: string;
  duration: string;
  actions: string[];
  expectedOutcome: string;
}

export interface HiringKPI {
  name: string;
  current: string;
  target: string;
  timeline: string;
}

// 業種別採用コスト平均（円）
const industryHiringCosts: Record<string, number> = {
  "食品・飲食": 350000,
  "製造業": 450000,
  "小売・卸売": 300000,
  "IT・通信": 800000,
  "建設・不動産": 500000,
  "医療・福祉": 400000,
  "観光・宿泊": 280000,
  "サービス業": 350000,
  "教育": 320000,
  "運輸・物流": 380000,
  "農林水産": 250000,
  "伝統工芸": 300000,
};

export function planHiringStrategy(input: HiringStrategyInput): HiringStrategyResult {
  const categories: HiringCategory[] = [];

  // 1. 採用力スコア (25点)
  let attractionScore = 0;
  if (input.hasEmployerBrand) attractionScore += 8;
  if (input.hasRemoteWork) attractionScore += 5;
  if (input.wageCompetitiveness >= 4) attractionScore += 7;
  else if (input.wageCompetitiveness >= 3) attractionScore += 4;
  else if (input.wageCompetitiveness >= 2) attractionScore += 2;
  if (input.monthlyApplications >= input.openPositions * 5) attractionScore += 5;
  else if (input.monthlyApplications >= input.openPositions * 2) attractionScore += 3;
  attractionScore = Math.min(attractionScore, 25);

  categories.push({
    name: "採用力・魅力度",
    score: attractionScore,
    maxScore: 25,
    status: attractionScore >= 18 ? "good" : attractionScore >= 10 ? "warning" : "danger",
    details: attractionScore >= 18
      ? "採用ブランドと待遇が競争力を持っています"
      : attractionScore >= 10
      ? "採用力に改善余地があります。ブランディングと待遇の見直しを検討してください"
      : "採用力が不足しています。早急に採用ブランディングと待遇改善が必要です",
  });

  // 2. 定着力スコア (25点)
  let retentionScore = 0;
  if (input.turnoverRate < 10) retentionScore += 10;
  else if (input.turnoverRate < 20) retentionScore += 6;
  else if (input.turnoverRate < 30) retentionScore += 3;
  if (input.hasCareerPath) retentionScore += 7;
  if (input.hasTrainingProgram) retentionScore += 5;
  if (input.wageCompetitiveness >= 3) retentionScore += 3;
  retentionScore = Math.min(retentionScore, 25);

  categories.push({
    name: "定着力・育成力",
    score: retentionScore,
    maxScore: 25,
    status: retentionScore >= 18 ? "good" : retentionScore >= 10 ? "warning" : "danger",
    details: input.turnoverRate >= 25
      ? `離職率${input.turnoverRate}%は高水準。定着施策が急務です`
      : input.turnoverRate >= 15
      ? `離職率${input.turnoverRate}%は業界平均水準。更なる改善余地があります`
      : `離職率${input.turnoverRate}%は良好。現在の施策を維持してください`,
  });

  // 3. チャネル最適化スコア (25点)
  const channelCount = Object.values(input.channels).filter(Boolean).length;
  let channelScore = 0;
  if (channelCount >= 4) channelScore += 10;
  else if (channelCount >= 2) channelScore += 6;
  else channelScore += 2;
  if (input.channels.referral) channelScore += 5;
  if (input.channels.sns || input.channels.directRecruit) channelScore += 5;
  if (!input.channels.agencies || channelCount >= 3) channelScore += 5;
  channelScore = Math.min(channelScore, 25);

  categories.push({
    name: "チャネル最適化",
    score: channelScore,
    maxScore: 25,
    status: channelScore >= 18 ? "good" : channelScore >= 10 ? "warning" : "danger",
    details: channelCount <= 2
      ? "採用チャネルが少なく、応募数が限定的になりがちです"
      : "複数チャネルを活用中。チャネル別効果の分析を推奨します",
  });

  // 4. コスト効率スコア (25点)
  const industryAvg = industryHiringCosts[input.industry] || 400000;
  let costScore = 0;
  if (input.avgCostPerHire <= industryAvg * 0.7) costScore += 12;
  else if (input.avgCostPerHire <= industryAvg) costScore += 8;
  else if (input.avgCostPerHire <= industryAvg * 1.5) costScore += 4;
  if (input.avgTimeToHire <= 30) costScore += 8;
  else if (input.avgTimeToHire <= 60) costScore += 5;
  else if (input.avgTimeToHire <= 90) costScore += 2;
  if (input.channels.referral) costScore += 3;
  if (input.channels.helloWork) costScore += 2;
  costScore = Math.min(costScore, 25);

  categories.push({
    name: "コスト効率",
    score: costScore,
    maxScore: 25,
    status: costScore >= 18 ? "good" : costScore >= 10 ? "warning" : "danger",
    details: input.avgCostPerHire > industryAvg
      ? `採用単価${(input.avgCostPerHire / 10000).toFixed(0)}万円は業界平均${(industryAvg / 10000).toFixed(0)}万円を上回っています`
      : `採用単価${(input.avgCostPerHire / 10000).toFixed(0)}万円は業界平均${(industryAvg / 10000).toFixed(0)}万円以下で効率的です`,
  });

  const totalScore = attractionScore + retentionScore + channelScore + costScore;
  const pct = (totalScore / 100) * 100;
  const grade: "S" | "A" | "B" | "C" | "D" =
    pct >= 85 ? "S" : pct >= 70 ? "A" : pct >= 55 ? "B" : pct >= 40 ? "C" : "D";

  // コスト効率分析
  const potentialSavings = Math.max(0, (input.avgCostPerHire - industryAvg * 0.7) * input.openPositions);
  const costEfficiency = {
    currentCostPerHire: input.avgCostPerHire,
    industryAvgCostPerHire: industryAvg,
    potentialSavings,
    costEfficiencyRating: (input.avgCostPerHire <= industryAvg * 0.8 ? "good" : input.avgCostPerHire <= industryAvg * 1.2 ? "average" : "poor") as "good" | "average" | "poor",
  };

  // チャネル分析
  const channelAnalysis: ChannelRecommendation[] = [
    {
      channel: "社員紹介（リファラル）",
      currentlyUsed: input.channels.referral,
      effectiveness: "high",
      costLevel: "low",
      recommendation: input.channels.referral
        ? "紹介報奨金制度を拡充し、紹介数を倍増させましょう"
        : "最もコスト効率の高いチャネル。紹介報奨金制度（5〜30万円）の導入を推奨",
      priority: 1,
    },
    {
      channel: "SNS採用（採用広報）",
      currentlyUsed: input.channels.sns,
      effectiveness: input.targetAgeGroup === "young" || input.targetAgeGroup === "all" ? "high" : "medium",
      costLevel: "low",
      recommendation: input.channels.sns
        ? "投稿頻度と社員の日常コンテンツを増やし、エンゲージメントを向上"
        : "Instagram/X/TikTokで社風発信。若手採用に効果的（運用コスト月5万円〜）",
      priority: input.targetAgeGroup === "young" ? 2 : 4,
    },
    {
      channel: "ダイレクトリクルーティング",
      currentlyUsed: input.channels.directRecruit,
      effectiveness: "high",
      costLevel: "medium",
      recommendation: input.channels.directRecruit
        ? "スカウト文面のA/Bテストと返信率の分析を実施"
        : "ビズリーチ・Wantedly等で即戦力にアプローチ。返信率向上がカギ",
      priority: input.targetAgeGroup === "mid" || input.targetAgeGroup === "senior" ? 2 : 3,
    },
    {
      channel: "求人サイト",
      currentlyUsed: input.channels.jobBoards,
      effectiveness: "medium",
      costLevel: "medium",
      recommendation: input.channels.jobBoards
        ? "掲載内容の写真・動画強化と、Indeed等の無料枠も併用"
        : "Indeed（無料枠あり）やエンゲージで母集団形成",
      priority: 4,
    },
    {
      channel: "ハローワーク",
      currentlyUsed: input.channels.helloWork,
      effectiveness: input.region !== "関東" && input.region !== "関西" ? "medium" : "low",
      costLevel: "low",
      recommendation: input.channels.helloWork
        ? "求人票の魅力向上（写真追加・福利厚生の詳細記載）"
        : "無料で利用可能。地方では一定の効果あり。助成金との連携も可能",
      priority: 5,
    },
    {
      channel: "人材紹介エージェント",
      currentlyUsed: input.channels.agencies,
      effectiveness: "medium",
      costLevel: "high",
      recommendation: input.channels.agencies
        ? "紹介手数料の交渉と、他チャネルとの併用でコスト最適化"
        : "即戦力確保には有効だが、年収の30-35%のコスト。他チャネル構築後に限定活用を推奨",
      priority: 6,
    },
  ];
  channelAnalysis.sort((a, b) => a.priority - b.priority);

  // 戦略生成
  const strategies: HiringStrategy[] = [];

  if (!input.hasEmployerBrand) {
    strategies.push({
      title: "採用ブランディングの構築",
      description: "自社の強み・社風・働きがいを言語化し、採用サイト・SNSで発信。社員インタビュー動画の制作も効果的。",
      impact: "high",
      difficulty: "medium",
      timeframe: "1〜2ヶ月",
      estimatedCostReduction: 15,
    });
  }

  if (!input.channels.referral) {
    strategies.push({
      title: "リファラル採用制度の導入",
      description: "社員紹介報奨金（5〜30万円）を設定。エージェント費用の1/10以下で質の高い採用が可能。",
      impact: "high",
      difficulty: "easy",
      timeframe: "2週間",
      estimatedCostReduction: 25,
    });
  }

  if (input.turnoverRate >= 20) {
    strategies.push({
      title: "早期離職防止プログラム",
      description: "入社3ヶ月のオンボーディング強化、メンター制度、1on1面談の定期実施で離職率を改善。",
      impact: "high",
      difficulty: "medium",
      timeframe: "1〜3ヶ月",
      estimatedCostReduction: 20,
    });
  }

  if (!input.hasCareerPath) {
    strategies.push({
      title: "キャリアパス制度の整備",
      description: "等級制度・昇進基準を明確化。「この会社で成長できる」イメージを求職者に訴求。",
      impact: "high",
      difficulty: "medium",
      timeframe: "2〜3ヶ月",
      estimatedCostReduction: 10,
    });
  }

  if (input.wageCompetitiveness <= 2) {
    strategies.push({
      title: "報酬パッケージの見直し",
      description: "基本給の引き上げが困難なら、福利厚生（住宅手当・資格手当・食事補助）で実質待遇を改善。",
      impact: "high",
      difficulty: "hard",
      timeframe: "1〜3ヶ月",
      estimatedCostReduction: 5,
    });
  }

  if (!input.channels.sns && (input.targetAgeGroup === "young" || input.targetAgeGroup === "all")) {
    strategies.push({
      title: "SNS採用広報の開始",
      description: "Instagram/TikTokで社員の日常や職場の雰囲気を発信。採用コスト0円で若手にリーチ可能。",
      impact: "medium",
      difficulty: "easy",
      timeframe: "2週間〜",
      estimatedCostReduction: 10,
    });
  }

  if (input.avgTimeToHire > 60) {
    strategies.push({
      title: "選考プロセスの短縮",
      description: "面接回数の削減（最大2回）、オンライン面接の導入、即日内定の仕組みで優秀人材の離脱を防止。",
      impact: "medium",
      difficulty: "easy",
      timeframe: "1〜2週間",
      estimatedCostReduction: 10,
    });
  }

  if (!input.hasTrainingProgram) {
    strategies.push({
      title: "研修・育成プログラムの整備",
      description: "OJT計画書の作成、外部研修の活用、スキルマップの導入で「未経験歓迎」の信頼性を担保。",
      impact: "medium",
      difficulty: "medium",
      timeframe: "1〜2ヶ月",
      estimatedCostReduction: 5,
    });
  }

  // 改善フェーズ
  const improvementPlan: ImprovementPhase[] = [
    {
      phase: 1,
      name: "採用基盤の構築",
      duration: "1〜2週間",
      actions: [
        "現状の採用データ収集と課題の可視化",
        "求人票の全面リライト（魅力・具体性の向上）",
        "社員紹介制度の設計・社内告知",
        "採用ページ/SNSアカウントの開設",
      ],
      expectedOutcome: "採用チャネルの多角化と求人の質の向上",
    },
    {
      phase: 2,
      name: "母集団形成の強化",
      duration: "1〜2ヶ月",
      actions: [
        "SNSでの採用広報開始（週2回以上投稿）",
        "社員インタビュー・職場紹介コンテンツの制作",
        "Indeed/Engage等の無料・低コスト媒体への掲載",
        "ハローワーク求人票のアップデート",
      ],
      expectedOutcome: "月間応募数の50%増加",
    },
    {
      phase: 3,
      name: "選考・定着の最適化",
      duration: "2〜3ヶ月",
      actions: [
        "面接プロセスの標準化（構造化面接の導入）",
        "オンボーディングプログラムの整備",
        "入社後1/3/6ヶ月面談の制度化",
        "採用KPIダッシュボードの運用開始",
      ],
      expectedOutcome: "採用リードタイム30%短縮、1年定着率85%以上",
    },
    {
      phase: 4,
      name: "採用ブランドの確立",
      duration: "3〜6ヶ月",
      actions: [
        "企業理念・MVVの採用メッセージへの落とし込み",
        "社員アンバサダー制度の運用",
        "採用イベント・会社説明会の定期開催",
        "採用データに基づくチャネル投資の最適化",
      ],
      expectedOutcome: "自然応募比率30%以上、採用コスト40%削減",
    },
  ];

  // リスク
  const risks: string[] = [];
  if (input.turnoverRate >= 25) risks.push("高離職率が続くと採用コストが膨らみ、組織力が低下するリスク");
  if (input.openPositions >= input.employeeCount * 0.2) risks.push("欠員率が高く、既存社員の負荷増大による連鎖退職リスク");
  if (input.wageCompetitiveness <= 2) risks.push("賃金競争力の低さにより、採用しても早期離職するリスク");
  if (channelCount <= 1) risks.push("採用チャネルが単一で、市場変化に脆弱");
  if (input.avgTimeToHire > 90) risks.push("選考期間が長く、優秀な候補者が他社に流出するリスク");
  if (!input.hasTrainingProgram) risks.push("研修制度がなく、即戦力以外の採用が困難");
  if (risks.length === 0) risks.push("現時点で重大なリスクは検出されていません。継続的なモニタリングを推奨します");

  // KPI
  const kpis: HiringKPI[] = [
    {
      name: "月間応募数",
      current: `${input.monthlyApplications}件`,
      target: `${Math.max(input.monthlyApplications * 2, input.openPositions * 5)}件`,
      timeline: "3ヶ月",
    },
    {
      name: "採用単価",
      current: `${(input.avgCostPerHire / 10000).toFixed(0)}万円`,
      target: `${(Math.min(input.avgCostPerHire * 0.6, industryAvg * 0.7) / 10000).toFixed(0)}万円`,
      timeline: "6ヶ月",
    },
    {
      name: "平均採用期間",
      current: `${input.avgTimeToHire}日`,
      target: `${Math.max(Math.floor(input.avgTimeToHire * 0.6), 14)}日`,
      timeline: "3ヶ月",
    },
    {
      name: "1年定着率",
      current: `${(100 - input.turnoverRate).toFixed(0)}%`,
      target: "85%以上",
      timeline: "12ヶ月",
    },
    {
      name: "リファラル比率",
      current: input.channels.referral ? "導入済" : "0%",
      target: "20%以上",
      timeline: "6ヶ月",
    },
  ];

  return {
    overallScore: totalScore,
    grade,
    categories,
    costEfficiency,
    channelAnalysis,
    strategies,
    improvementPlan,
    risks,
    kpis,
  };
}
