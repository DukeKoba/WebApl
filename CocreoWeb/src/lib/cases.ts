import { Agent } from "@/types";
import { AI_AGENTS } from "./agents";

export interface CaseTemplate {
  id: string;
  title: string;
  industry: string;
  region: string;
  challenge: string;
  description: string;
  requiredAgents: string[];
  phases: ConsultingPhase[];
  estimatedDuration: string;
  tags: string[];
}

export interface ConsultingPhase {
  name: string;
  agentId: string;
  tasks: string[];
  deliverables: string[];
  duration: string;
}

export interface ProjectCase {
  id: string;
  companyName: string;
  industry: string;
  region: string;
  prefecture: string;
  employeeCount: number;
  annualRevenue: string;
  challengeType: string;
  challengeDetail: string;
  goals: string[];
  constraints: string[];
  status: "intake" | "analysis" | "proposal" | "execution" | "review";
  assignedAgents: string[];
  proposal?: CaseProposal;
  createdAt: Date;
}

export interface CaseProposal {
  summary: string;
  phases: ProposalPhase[];
  kpis: KPI[];
  risks: Risk[];
  estimatedBudget: string;
  estimatedDuration: string;
}

export interface ProposalPhase {
  phase: number;
  name: string;
  agentId: string;
  agentName: string;
  duration: string;
  actions: string[];
  deliverables: string[];
}

export interface KPI {
  name: string;
  current: string;
  target: string;
  timeline: string;
}

export interface Risk {
  description: string;
  impact: "high" | "medium" | "low";
  mitigation: string;
}

// Cocreoの実案件をベースにしたケーステンプレート
export const CASE_TEMPLATES: CaseTemplate[] = [
  {
    id: "ec-launch",
    title: "EC事業の立ち上げ・販路拡大",
    industry: "食品・飲食",
    region: "全国",
    challenge: "地元で人気の商品を全国に届けたいが、ECのノウハウがない",
    description:
      "地域の特産品や人気商品をECサイトを通じて全国展開するプロジェクト。物流体制の構築からブランディング、集客戦略まで包括的に支援します。",
    requiredAgents: ["dx-advisor", "market-researcher", "strategy-consultant"],
    phases: [
      {
        name: "現状分析・EC戦略策定",
        agentId: "strategy-consultant",
        tasks: [
          "商品ラインナップの整理と価格戦略",
          "競合EC店舗の調査",
          "ターゲット顧客の明確化",
        ],
        deliverables: ["EC事業計画書", "競合分析レポート"],
        duration: "2週間",
      },
      {
        name: "ECサイト構築・物流設計",
        agentId: "dx-advisor",
        tasks: [
          "ECプラットフォーム選定（Shopify/BASE/楽天）",
          "商品ページ作成ガイドライン",
          "物流・配送体制の設計",
          "決済システムの導入",
        ],
        deliverables: [
          "ECサイト構築ロードマップ",
          "物流フロー設計書",
        ],
        duration: "4週間",
      },
      {
        name: "集客・マーケティング",
        agentId: "market-researcher",
        tasks: [
          "SNSアカウント設計・コンテンツ戦略",
          "Google/SNS広告の設計",
          "ふるさと納税返礼品としての登録",
          "インフルエンサー連携企画",
        ],
        deliverables: ["マーケティング実行計画", "SNS運用マニュアル"],
        duration: "継続",
      },
    ],
    estimatedDuration: "3ヶ月",
    tags: ["EC", "販路拡大", "DX", "地域特産品"],
  },
  {
    id: "hiring-strategy",
    title: "採用戦略の立案・採用ブランディング",
    industry: "全業種",
    region: "全国",
    challenge: "人材が集まらない。地方で優秀な人材を確保したい",
    description:
      "採用難に直面する地方企業向けに、AIを活用した採用戦略を構築。採用ブランディングからリモートワーク体制まで包括的に支援します。",
    requiredAgents: ["hr-strategist", "market-researcher", "dx-advisor"],
    phases: [
      {
        name: "採用課題の分析",
        agentId: "hr-strategist",
        tasks: [
          "現在の採用フローの課題整理",
          "求める人材像の明確化",
          "採用市場の調査",
        ],
        deliverables: ["採用課題レポート", "ペルソナ設計書"],
        duration: "1週間",
      },
      {
        name: "採用ブランディング戦略",
        agentId: "market-researcher",
        tasks: [
          "企業の魅力の言語化・ストーリー設計",
          "採用サイト・SNSの設計",
          "社員インタビュー企画",
        ],
        deliverables: ["採用ブランドコンセプト", "コンテンツ計画"],
        duration: "2週間",
      },
      {
        name: "リモートワーク・採用基盤整備",
        agentId: "dx-advisor",
        tasks: [
          "リモートワーク環境の整備",
          "プロジェクト管理ツールの導入",
          "採用管理システム（ATS）の選定",
        ],
        deliverables: ["リモートワーク導入マニュアル", "採用DXガイド"],
        duration: "2週間",
      },
    ],
    estimatedDuration: "1.5ヶ月",
    tags: ["採用", "人材", "組織", "リモートワーク"],
  },
  {
    id: "new-product-dev",
    title: "地域資源を活かした新商品開発",
    industry: "製造・食品・工芸",
    region: "全国",
    challenge: "既存事業が縮小傾向。地域の強みを活かした新商品を作りたい",
    description:
      "地域の特産品、伝統技術、自然資源を活かした新商品を企画・開発。市場調査からプロトタイプ、テスト販売まで一貫して支援します。",
    requiredAgents: [
      "product-developer",
      "market-researcher",
      "strategy-consultant",
    ],
    phases: [
      {
        name: "市場調査・アイデア創出",
        agentId: "market-researcher",
        tasks: [
          "トレンド分析・消費者ニーズ調査",
          "競合商品のベンチマーク",
          "地域資源の棚卸し",
        ],
        deliverables: ["市場調査レポート", "アイデアリスト"],
        duration: "2週間",
      },
      {
        name: "商品コンセプト設計",
        agentId: "product-developer",
        tasks: [
          "商品コンセプトの策定",
          "ターゲット顧客とのフィット検証",
          "パッケージデザインの方向性",
          "試作品の仕様策定",
        ],
        deliverables: ["商品企画書", "プロトタイプ仕様書"],
        duration: "3週間",
      },
      {
        name: "テスト販売・事業計画",
        agentId: "strategy-consultant",
        tasks: [
          "テスト販売計画の策定",
          "原価計算・価格設定",
          "事業収支シミュレーション",
          "補助金活用の検討",
        ],
        deliverables: ["テスト販売レポート", "事業計画書"],
        duration: "4週間",
      },
    ],
    estimatedDuration: "2.5ヶ月",
    tags: ["商品開発", "地域資源", "新規事業"],
  },
  {
    id: "dx-transformation",
    title: "業務のDX推進・デジタル化",
    industry: "全業種",
    region: "全国",
    challenge: "紙・電話中心の業務を効率化したい。どこから始めればいいか分からない",
    description:
      "アナログな業務プロセスをデジタル化し、生産性向上とコスト削減を実現。ステップバイステップで無理のないDXを推進します。",
    requiredAgents: ["dx-advisor", "strategy-consultant", "hr-strategist"],
    phases: [
      {
        name: "業務プロセス可視化",
        agentId: "dx-advisor",
        tasks: [
          "現行業務フローのヒアリング・整理",
          "デジタル化の優先順位付け",
          "費用対効果の試算",
        ],
        deliverables: ["業務フロー図", "DXロードマップ"],
        duration: "2週間",
      },
      {
        name: "ツール選定・導入",
        agentId: "dx-advisor",
        tasks: [
          "クラウドサービス・SaaSの比較選定",
          "導入計画の策定",
          "初期設定・データ移行支援",
        ],
        deliverables: ["ツール比較表", "導入手順書"],
        duration: "4週間",
      },
      {
        name: "社員教育・定着支援",
        agentId: "hr-strategist",
        tasks: [
          "操作マニュアルの作成",
          "社内研修プログラムの設計",
          "定着度のモニタリング",
        ],
        deliverables: ["研修資料", "定着レポート"],
        duration: "継続",
      },
    ],
    estimatedDuration: "3ヶ月",
    tags: ["DX", "業務効率化", "クラウド", "ペーパーレス"],
  },
  {
    id: "marketing-sns",
    title: "SNS・デジタルマーケティング戦略",
    industry: "全業種",
    region: "全国",
    challenge: "SNSを始めたいが運用方法が分からない。効果的な集客をしたい",
    description:
      "Instagram、LINE公式、Googleマップなどを活用した地域密着型のデジタルマーケティング戦略を設計・実行支援します。",
    requiredAgents: ["market-researcher", "dx-advisor", "product-developer"],
    phases: [
      {
        name: "マーケティング現状分析",
        agentId: "market-researcher",
        tasks: [
          "現在の集客チャネルの効果分析",
          "ターゲット顧客のSNS利用状況調査",
          "競合のSNS戦略分析",
        ],
        deliverables: ["マーケティング現状レポート", "ベンチマーク分析"],
        duration: "1週間",
      },
      {
        name: "SNS戦略策定・アカウント構築",
        agentId: "market-researcher",
        tasks: [
          "最適なSNSプラットフォームの選定",
          "コンテンツカレンダーの作成",
          "ブランドガイドラインの策定",
          "Googleビジネスプロフィール最適化",
        ],
        deliverables: [
          "SNS運用戦略書",
          "コンテンツカレンダー",
          "ブランドガイドライン",
        ],
        duration: "2週間",
      },
      {
        name: "運用開始・効果測定",
        agentId: "dx-advisor",
        tasks: [
          "投稿の実行支援",
          "広告運用の設定・最適化",
          "分析ダッシュボードの構築",
          "月次レポートの作成",
        ],
        deliverables: ["月次マーケティングレポート", "改善提案書"],
        duration: "継続",
      },
    ],
    estimatedDuration: "1ヶ月+継続",
    tags: ["SNS", "Instagram", "LINE", "集客", "MEO"],
  },
  // ===== 白書2025ベース 新テンプレート =====
  {
    id: "price-pass-through",
    title: "価格転嫁・適正価格設定",
    industry: "全業種",
    region: "全国",
    challenge: "原材料費・人件費が上がっているのに価格転嫁ができない",
    description:
      "中小企業の転嫁率は49.7%にとどまる。コスト構造の可視化、交渉戦略、付加価値向上による適正価格設定を支援します。",
    requiredAgents: ["strategy-consultant", "market-researcher", "dx-advisor"],
    phases: [
      {
        name: "コスト構造分析・転嫁率診断",
        agentId: "strategy-consultant",
        tasks: [
          "原材料費・人件費・エネルギー費の上昇率分析",
          "現在の価格転嫁率の算出",
          "損益分岐転嫁率の計算",
        ],
        deliverables: ["コスト変動レポート", "転嫁シミュレーション結果"],
        duration: "1週間",
      },
      {
        name: "価格交渉戦略の策定",
        agentId: "market-researcher",
        tasks: [
          "競合の価格動向調査",
          "取引先別の交渉優先順位付け",
          "値上げ根拠資料の作成",
          "スライド条項・自動改定条項の設計",
        ],
        deliverables: ["価格交渉ハンドブック", "取引先別交渉シナリオ"],
        duration: "2週間",
      },
      {
        name: "付加価値向上・原価管理DX",
        agentId: "dx-advisor",
        tasks: [
          "AIリアルタイム原価管理の導入",
          "付加価値向上による価値上げ戦略",
          "価格交渉促進月間（9月/3月）の活用計画",
        ],
        deliverables: ["原価管理DXプラン", "価値上げロードマップ"],
        duration: "継続",
      },
    ],
    estimatedDuration: "1.5ヶ月",
    tags: ["価格転嫁", "原価管理", "価格交渉", "収益改善"],
  },
  {
    id: "wage-increase",
    title: "持続可能な賃上げ戦略",
    industry: "全業種",
    region: "全国",
    challenge: "人材確保のために賃上げしたいが、利益が足りない",
    description:
      "労働分配率80%の壁の中で持続可能な賃上げを実現。価格転嫁・生産性向上・補助金活用の3本柱で原資を確保します。",
    requiredAgents: ["strategy-consultant", "hr-strategist", "dx-advisor"],
    phases: [
      {
        name: "賃上げ余力の診断",
        agentId: "strategy-consultant",
        tasks: [
          "労働分配率・付加価値の分析",
          "賃上げシミュレーション",
          "原資確保の方法検討",
        ],
        deliverables: ["賃上げ余力診断レポート", "原資確保プラン"],
        duration: "1週間",
      },
      {
        name: "生産性向上・省力化投資",
        agentId: "dx-advisor",
        tasks: [
          "省力化投資補助金の活用（最大1,500万円）",
          "AI/IT導入による業務効率化",
          "1人あたり生産性20%向上計画",
        ],
        deliverables: ["省力化投資計画", "補助金申請ガイド"],
        duration: "3ヶ月",
      },
      {
        name: "人材定着・エンゲージメント施策",
        agentId: "hr-strategist",
        tasks: [
          "賃上げ以外の待遇改善策（働きやすさ・心理的安全性）",
          "人事評価制度の見直し",
          "賃上げ促進税制の活用",
        ],
        deliverables: ["人材定着プラン", "評価制度改定案"],
        duration: "2ヶ月",
      },
    ],
    estimatedDuration: "3ヶ月",
    tags: ["賃上げ", "人材確保", "生産性向上", "省力化"],
  },
  {
    id: "business-succession",
    title: "事業承継計画の策定",
    industry: "全業種",
    region: "全国",
    challenge: "経営者の高齢化。後継者がいない、または育っていない",
    description:
      "経営者平均60.7歳、後継者不在率51.1%の危機に対応。承継計画の策定からM&A検討まで包括的に支援します。",
    requiredAgents: ["strategy-consultant", "hr-strategist", "dx-advisor"],
    phases: [
      {
        name: "承継緊急度診断・企業価値評価",
        agentId: "strategy-consultant",
        tasks: [
          "事業承継スコアリング",
          "簡易企業価値評価（PL/BS分析連携）",
          "承継方法の比較検討（親族・従業員・M&A）",
        ],
        deliverables: ["承継診断レポート", "企業価値評価書"],
        duration: "2週間",
      },
      {
        name: "事業承継計画書の作成",
        agentId: "strategy-consultant",
        tasks: [
          "5-10年の承継ロードマップ作成",
          "株式・財産の承継スキーム設計",
          "事業承継税制の活用検討",
        ],
        deliverables: ["事業承継計画書", "税制活用ガイド"],
        duration: "1ヶ月",
      },
      {
        name: "後継者育成・属人化解消",
        agentId: "hr-strategist",
        tasks: [
          "後継者の育成プログラム設計",
          "経営者業務の棚卸し・権限委譲計画",
          "業務マニュアルのデジタル化",
        ],
        deliverables: ["後継者育成プラン", "権限委譲ロードマップ"],
        duration: "継続",
      },
    ],
    estimatedDuration: "3ヶ月+継続",
    tags: ["事業承継", "後継者", "M&A", "企業価値"],
  },
];

// 企業の課題情報からAIが最適なケーステンプレートを選定
export function matchCaseTemplate(
  challengeType: string,
  industry: string
): CaseTemplate | undefined {
  const typeMap: Record<string, string[]> = {
    "ec-launch": ["EC", "販路", "オンライン販売", "ネット通販", "通販"],
    "hiring-strategy": ["採用", "人材", "人手不足", "求人", "離職"],
    "new-product-dev": ["商品開発", "新商品", "新規事業", "地域資源"],
    "dx-transformation": ["DX", "デジタル化", "業務改善", "効率化", "ペーパーレス"],
    "marketing-sns": ["SNS", "マーケティング", "集客", "広告", "ブランディング"],
    "price-pass-through": ["価格転嫁", "値上げ", "原価", "コスト上昇", "価格交渉"],
    "wage-increase": ["賃上げ", "給与", "人件費", "待遇", "賃金"],
    "business-succession": ["事業承継", "後継者", "引退", "M&A", "承継"],
  };

  for (const [templateId, keywords] of Object.entries(typeMap)) {
    if (keywords.some((kw) => challengeType.includes(kw))) {
      return CASE_TEMPLATES.find((t) => t.id === templateId);
    }
  }

  return CASE_TEMPLATES[0]; // デフォルトはEC立ち上げ
}

// AIが案件を分析し、オーダーメイドの提案書を生成
export function generateProposal(projectCase: ProjectCase): CaseProposal {
  const template = matchCaseTemplate(
    projectCase.challengeType + " " + projectCase.challengeDetail,
    projectCase.industry
  );

  if (!template) {
    return generateGenericProposal(projectCase);
  }

  const phases: ProposalPhase[] = template.phases.map((phase, i) => {
    const agent = AI_AGENTS.find((a) => a.id === phase.agentId);
    return {
      phase: i + 1,
      name: phase.name,
      agentId: phase.agentId,
      agentName: agent?.name || "AIコンサルタント",
      duration: phase.duration,
      actions: phase.tasks.map((task) =>
        personalizeTask(task, projectCase)
      ),
      deliverables: phase.deliverables,
    };
  });

  const kpis = generateKPIs(projectCase, template);
  const risks = generateRisks(projectCase, template);

  return {
    summary: `${projectCase.companyName}様の「${projectCase.challengeDetail}」について、${template.requiredAgents.length}名のAIエージェントが連携して解決策を提案します。${template.estimatedDuration}の期間で、段階的に成果を出していきます。`,
    phases,
    kpis,
    risks,
    estimatedBudget: estimateBudget(template),
    estimatedDuration: template.estimatedDuration,
  };
}

function personalizeTask(task: string, projectCase: ProjectCase): string {
  return task
    .replace("商品", `${projectCase.industry}の商品`)
    .replace("企業", projectCase.companyName);
}

function generateKPIs(
  projectCase: ProjectCase,
  template: CaseTemplate
): KPI[] {
  const kpiTemplates: Record<string, KPI[]> = {
    "ec-launch": [
      { name: "月間EC売上", current: "0円", target: "50万円", timeline: "6ヶ月後" },
      { name: "ECサイト月間PV", current: "0", target: "5,000PV", timeline: "3ヶ月後" },
      { name: "リピート率", current: "-", target: "20%", timeline: "6ヶ月後" },
    ],
    "hiring-strategy": [
      { name: "応募者数/月", current: "2名", target: "10名", timeline: "3ヶ月後" },
      { name: "採用コスト/人", current: "50万円", target: "20万円", timeline: "6ヶ月後" },
      { name: "1年定着率", current: "60%", target: "85%", timeline: "1年後" },
    ],
    "new-product-dev": [
      { name: "新商品売上", current: "0円", target: "100万円/月", timeline: "6ヶ月後" },
      { name: "テスト販売達成率", current: "-", target: "80%", timeline: "3ヶ月後" },
      { name: "顧客満足度", current: "-", target: "4.0/5.0", timeline: "6ヶ月後" },
    ],
    "dx-transformation": [
      { name: "業務時間削減率", current: "0%", target: "30%", timeline: "6ヶ月後" },
      { name: "ペーパーレス化率", current: "10%", target: "80%", timeline: "3ヶ月後" },
      { name: "従業員満足度", current: "3.0", target: "4.0/5.0", timeline: "6ヶ月後" },
    ],
    "marketing-sns": [
      { name: "SNSフォロワー数", current: "0", target: "1,000", timeline: "3ヶ月後" },
      { name: "Web経由問い合わせ", current: "2件/月", target: "15件/月", timeline: "3ヶ月後" },
      { name: "LINE登録者数", current: "0", target: "500", timeline: "3ヶ月後" },
    ],
  };

  return kpiTemplates[template.id] || kpiTemplates["marketing-sns"];
}

function generateRisks(
  projectCase: ProjectCase,
  template: CaseTemplate
): Risk[] {
  const commonRisks: Risk[] = [
    {
      description: "社内のデジタルリテラシー不足による導入遅延",
      impact: "medium",
      mitigation: "段階的な導入と丁寧な研修プログラムの実施",
    },
    {
      description: "予算超過のリスク",
      impact: "medium",
      mitigation: "補助金の活用と段階的な投資計画",
    },
  ];

  if (projectCase.employeeCount < 10) {
    commonRisks.push({
      description: "少人数のため担当者の負荷が高くなる可能性",
      impact: "high",
      mitigation: "AIによる業務自動化と段階的な導入で負荷を分散",
    });
  }

  return commonRisks;
}

function estimateBudget(template: CaseTemplate): string {
  const budgets: Record<string, string> = {
    "ec-launch": "月額3〜5万円（AI利用料）+ ECプラットフォーム費用",
    "hiring-strategy": "月額3〜5万円（AI利用料）+ 採用媒体費用",
    "new-product-dev": "月額3〜5万円（AI利用料）+ 試作費用",
    "dx-transformation": "月額3〜5万円（AI利用料）+ SaaSライセンス費用",
    "marketing-sns": "月額3〜5万円（AI利用料）+ 広告費用",
  };
  return budgets[template.id] || "月額3〜5万円（AI利用料）";
}

function generateGenericProposal(projectCase: ProjectCase): CaseProposal {
  return {
    summary: `${projectCase.companyName}様の課題について、最適なAIエージェントチームが分析・提案を行います。`,
    phases: [
      {
        phase: 1,
        name: "現状分析",
        agentId: "strategy-consultant",
        agentName: "経営戦略コンサルタント",
        duration: "2週間",
        actions: ["経営状況のヒアリング", "課題の構造化", "優先順位付け"],
        deliverables: ["現状分析レポート"],
      },
    ],
    kpis: [],
    risks: [],
    estimatedBudget: "月額3〜5万円",
    estimatedDuration: "要相談",
  };
}
