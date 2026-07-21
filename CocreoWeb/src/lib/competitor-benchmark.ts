/**
 * 競合ベンチマーク分析 & AI代替メニュー
 * 船井総研（funaisoken.co.jp）のサービス体系をベンチマークとし、
 * AIで代替可能なコンサルティングメニューを定義
 */

// === 競合（船井総研）サービス体系 ===
export interface CompetitorService {
  id: string;
  category: string;
  name: string;
  description: string;
  priceRange: string;
  deliveryMethod: string;
  aiReplaceability: "full" | "partial" | "supplement";
  aiReplaceabilityReason: string;
}

export const FUNAI_SERVICES: CompetitorService[] = [
  // 月次支援
  {
    id: "monthly-consulting",
    category: "月次支援",
    name: "月次支援コンサルティング",
    description: "経営者への顧問契約型の実行支援。月1〜2回の訪問で経営戦略から現場改善まで伴走",
    priceRange: "月額30〜50万円",
    deliveryMethod: "訪問型（月1〜2回）",
    aiReplaceability: "partial",
    aiReplaceabilityReason: "戦略立案・分析・レポートはAI化可能。現場での人間関係調整や実行の伴走は人的支援が必要",
  },
  // 経営診断
  {
    id: "management-diagnosis",
    category: "経営戦略",
    name: "経営診断・戦略策定",
    description: "経営状況の可視化、SWOT分析、中長期戦略の策定支援",
    priceRange: "100〜300万円（プロジェクト）",
    deliveryMethod: "プロジェクト型",
    aiReplaceability: "full",
    aiReplaceabilityReason: "財務データ分析、業界比較、SWOT分析、戦略提案はAIが即時かつ低コストで実行可能",
  },
  // マーケティング
  {
    id: "marketing",
    category: "マーケティング",
    name: "集客・マーケティング支援",
    description: "デジタルマーケティング、Webサイト改善、SNS集客、広告運用の戦略策定・実行支援",
    priceRange: "月額20〜40万円",
    deliveryMethod: "月次支援＋プロジェクト型",
    aiReplaceability: "partial",
    aiReplaceabilityReason: "戦略立案・施策提案・効果測定分析はAI化可能。広告クリエイティブ制作・運用代行は別途必要",
  },
  // DX推進
  {
    id: "dx",
    category: "DX推進",
    name: "DXコンサルティング",
    description: "業務のデジタル化戦略、ツール選定、RPA・AI導入、クラウド移行支援",
    priceRange: "月額30〜60万円",
    deliveryMethod: "プロジェクト型＋月次支援",
    aiReplaceability: "partial",
    aiReplaceabilityReason: "DX戦略立案・ツール選定・ロードマップ策定はAI化可能。システム導入・設定作業は人的支援が必要",
  },
  // 人材・組織
  {
    id: "hr",
    category: "人材・組織",
    name: "人事制度構築・採用支援",
    description: "人事評価制度設計、賃金体系構築、採用戦略、人材育成プログラム設計",
    priceRange: "月額20〜50万円",
    deliveryMethod: "プロジェクト型＋研修",
    aiReplaceability: "partial",
    aiReplaceabilityReason: "制度設計・ベンチマーク分析・研修資料作成はAI化可能。面接代行・組織風土改革は人的支援が必要",
  },
  // 財務
  {
    id: "finance",
    category: "財務",
    name: "財務コンサルティング・CFO代行",
    description: "資金調達計画、財務分析、予算管理、補助金申請支援、事業計画書作成",
    priceRange: "月額30〜50万円",
    deliveryMethod: "月次支援",
    aiReplaceability: "full",
    aiReplaceabilityReason: "PL/BS分析、財務指標算出、事業計画書作成、補助金マッチングはAI化可能。融資交渉のみ人的支援推奨",
  },
  // 事業承継・M&A
  {
    id: "succession",
    category: "事業承継",
    name: "事業承継・M&Aアドバイザリー",
    description: "後継者育成計画、企業価値算定、M&Aマッチング、PMI支援",
    priceRange: "成功報酬型（数百万〜）",
    deliveryMethod: "プロジェクト型",
    aiReplaceability: "supplement",
    aiReplaceabilityReason: "事業承継スコアリング・企業価値試算はAI化可能。法的手続き・交渉・PMIは専門家が必要",
  },
  // 経営研究会
  {
    id: "study-group",
    category: "経営研究会",
    name: "経営研究会（業種別勉強会）",
    description: "業種別の経営者コミュニティ。成功事例共有、ゲスト講話、企業視察",
    priceRange: "月額2〜5万円",
    deliveryMethod: "定期開催（オンライン/オフライン）",
    aiReplaceability: "partial",
    aiReplaceabilityReason: "業界トレンド・事例分析・ナレッジ提供はAI化可能。経営者同士のネットワーキングは代替不可",
  },
  // セミナー
  {
    id: "seminar",
    category: "セミナー",
    name: "経営セミナー（年間1,500件超）",
    description: "業種別・テーマ別の経営セミナー。最新トレンドや実践ノウハウを提供",
    priceRange: "無料〜数万円/回",
    deliveryMethod: "オンライン/オフライン",
    aiReplaceability: "full",
    aiReplaceabilityReason: "知識提供・ノウハウ解説・Q&A対応はAIチャットで24時間即時対応可能",
  },
  // 補助金
  {
    id: "subsidy",
    category: "補助金",
    name: "補助金・助成金申請支援",
    description: "事業再構築補助金、IT導入補助金、ものづくり補助金等の申請書作成・代行",
    priceRange: "成功報酬10〜20%",
    deliveryMethod: "プロジェクト型",
    aiReplaceability: "partial",
    aiReplaceabilityReason: "補助金マッチング・申請書ドラフト作成はAI化可能。行政とのやり取り・最終申請は専門家推奨",
  },
];

// === AI代替メニュー（Cocreoで提供） ===
export interface AIServiceMenu {
  id: string;
  name: string;
  description: string;
  benchmarkService: string;
  benchmarkPrice: string;
  aiPrice: string;
  costReduction: string;
  features: string[];
  availableIn: string;
  category: string;
  icon: string;
  status: "available" | "coming_soon";
  linkedPage: string | null;
}

export const AI_SERVICE_MENUS: AIServiceMenu[] = [
  {
    id: "ai-diagnosis",
    name: "AI経営診断",
    description: "財務データ・業界データに基づく即時経営診断。SWOT分析、KPI評価、業界ベンチマーク比較を自動生成",
    benchmarkService: "経営診断・戦略策定（100〜300万円）",
    benchmarkPrice: "100〜300万円",
    aiPrice: "月額9,800円〜",
    costReduction: "約97%削減",
    features: [
      "PL/BS自動分析＋経営指標算出",
      "業種別ベンチマーク比較",
      "強み・弱み・課題の自動抽出",
      "改善提案（難易度・期間・効果付き）",
      "キャッシュフロー警告",
    ],
    availableIn: "スタータープラン以上",
    category: "経営戦略",
    icon: "BarChart3",
    status: "available",
    linkedPage: "/financial-analysis",
  },
  {
    id: "ai-marketing",
    name: "AI集客・マーケティング分析",
    description: "業種×地域に特化した集客戦略をAIが立案。デジタルマーケティング施策の提案と効果予測",
    benchmarkService: "集客・マーケティング支援（月額20〜40万円）",
    benchmarkPrice: "月額20〜40万円",
    aiPrice: "月額9,800円〜",
    costReduction: "約95%削減",
    features: [
      "業種×地域の集客チャネル最適化提案",
      "SEO・MEO対策のアクションプラン",
      "SNS活用戦略の自動生成",
      "広告予算配分のシミュレーション",
      "競合分析レポート",
    ],
    availableIn: "スタータープラン以上",
    category: "マーケティング",
    icon: "TrendingUp",
    status: "available",
    linkedPage: "/consulting",
  },
  {
    id: "ai-dx-roadmap",
    name: "AI DX推進ロードマップ",
    description: "業務フローのデジタル化優先度を診断し、最適なツール選定とロードマップを自動策定",
    benchmarkService: "DXコンサルティング（月額30〜60万円）",
    benchmarkPrice: "月額30〜60万円",
    aiPrice: "月額9,800円〜",
    costReduction: "約96%削減",
    features: [
      "現状業務のDX成熟度診断",
      "業種別おすすめDXツール提案",
      "導入優先度マトリクス生成",
      "投資対効果（ROI）シミュレーション",
      "段階的導入ロードマップ作成",
    ],
    availableIn: "スタータープラン以上",
    category: "DX推進",
    icon: "Monitor",
    status: "available",
    linkedPage: "/consulting",
  },
  {
    id: "ai-hr-design",
    name: "AI人事制度設計",
    description: "等級制度・評価制度・賃金テーブルのドラフトをAIが自動生成。業種別ベストプラクティスを反映",
    benchmarkService: "人事制度構築・採用支援（月額20〜50万円）",
    benchmarkPrice: "月額20〜50万円",
    aiPrice: "月額29,800円〜",
    costReduction: "約85%削減",
    features: [
      "等級制度の設計ドラフト",
      "業種別賃金テーブル生成",
      "人事評価シート自動作成",
      "採用戦略・求人票の最適化",
      "離職率改善のための施策提案",
    ],
    availableIn: "プロプラン以上",
    category: "人材・組織",
    icon: "Users",
    status: "available",
    linkedPage: "/consulting",
  },
  {
    id: "ai-finance",
    name: "AI財務分析・CFOレポート",
    description: "毎月の財務データを自動分析し、CFO視点のレポートを生成。資金繰り予測と改善提案",
    benchmarkService: "財務コンサルティング・CFO代行（月額30〜50万円）",
    benchmarkPrice: "月額30〜50万円",
    aiPrice: "月額29,800円〜",
    costReduction: "約90%削減",
    features: [
      "月次PL/BS自動分析",
      "キャッシュフロー予測（3ヶ月先）",
      "財務KPIダッシュボード",
      "資金調達・補助金マッチング",
      "経営改善計画書の自動生成",
    ],
    availableIn: "プロプラン以上",
    category: "財務",
    icon: "DollarSign",
    status: "available",
    linkedPage: "/financial-analysis",
  },
  {
    id: "ai-succession",
    name: "AI事業承継スコアリング",
    description: "事業承継の準備度を多角的にスコアリング。後継者育成計画と企業価値試算を自動生成",
    benchmarkService: "事業承継・M&Aアドバイザリー（成功報酬数百万〜）",
    benchmarkPrice: "数百万円〜",
    aiPrice: "月額29,800円〜",
    costReduction: "約90%削減",
    features: [
      "事業承継準備度スコア（5軸評価）",
      "簡易企業価値算定",
      "後継者育成ロードマップ",
      "事業承継税制の活用提案",
      "M&A候補業種のマッチング分析",
    ],
    availableIn: "プロプラン以上",
    category: "事業承継",
    icon: "Shield",
    status: "available",
    linkedPage: "/succession-score",
  },
  {
    id: "ai-knowledge",
    name: "AI経営ナレッジベース",
    description: "業種別の経営ノウハウ・成功事例・最新トレンドを24時間いつでもAIチャットで即時提供",
    benchmarkService: "経営研究会（月額2〜5万円）+ セミナー",
    benchmarkPrice: "月額2〜5万円",
    aiPrice: "月額0円〜",
    costReduction: "100%削減",
    features: [
      "業種別経営ノウハウの即時検索",
      "成功事例・失敗事例のデータベース",
      "最新の業界トレンド情報",
      "経営者向けQ&A（24時間対応）",
      "補助金・制度変更の最新情報",
    ],
    availableIn: "フリープラン以上",
    category: "ナレッジ",
    icon: "BookOpen",
    status: "available",
    linkedPage: "/knowledge-base",
  },
  {
    id: "ai-subsidy",
    name: "AI補助金マッチング",
    description: "企業プロフィールに基づき、申請可能な補助金・助成金を自動マッチング。申請書ドラフトも生成",
    benchmarkService: "補助金・助成金申請支援（成功報酬10〜20%）",
    benchmarkPrice: "成功報酬10〜20%",
    aiPrice: "月額29,800円〜",
    costReduction: "固定費化で大幅削減",
    features: [
      "適用可能な補助金の自動スクリーニング",
      "申請要件の適合度スコアリング",
      "申請書ドラフトの自動生成",
      "申請スケジュール管理",
      "過去の採択傾向分析",
    ],
    availableIn: "プロプラン以上",
    category: "補助金",
    icon: "FileText",
    status: "coming_soon",
    linkedPage: null,
  },
  {
    id: "ai-pricing-strategy",
    name: "AI価格戦略・価格転嫁支援",
    description: "原材料高騰に対する価格転嫁戦略をAIが分析。値上げ交渉のシナリオ・トークスクリプト生成",
    benchmarkService: "月次支援コンサルティングの一部",
    benchmarkPrice: "月額30〜50万円の一部",
    aiPrice: "月額9,800円〜",
    costReduction: "個別テーマで大幅削減",
    features: [
      "価格転嫁シミュレーション",
      "業界別の価格動向分析",
      "値上げ交渉シナリオ生成",
      "顧客別影響度分析",
      "段階的値上げプラン策定",
    ],
    availableIn: "スタータープラン以上",
    category: "経営戦略",
    icon: "TrendingUp",
    status: "available",
    linkedPage: "/price-pass-through",
  },
  {
    id: "ai-wage-capacity",
    name: "AI賃上げ余力診断",
    description: "財務データから賃上げ可能額を試算。人件費シミュレーションと生産性向上施策を提案",
    benchmarkService: "人事制度構築の一部",
    benchmarkPrice: "月額20〜50万円の一部",
    aiPrice: "月額9,800円〜",
    costReduction: "個別テーマで大幅削減",
    features: [
      "賃上げ余力の自動試算",
      "人件費率の業界比較",
      "生産性向上による原資確保シナリオ",
      "助成金（キャリアアップ等）の活用提案",
      "段階的賃上げプラン策定",
    ],
    availableIn: "スタータープラン以上",
    category: "人材・組織",
    icon: "Users",
    status: "available",
    linkedPage: "/wage-capacity",
  },
];

// === 競合比較サマリー ===
export interface BenchmarkSummary {
  totalTraditionalCostMonthly: string;
  totalAICostMonthly: string;
  costReductionPercent: number;
  availabilityHours: string;
  responseTime: string;
  competitorResponseTime: string;
  competitorAvailability: string;
  aiAdvantages: string[];
  humanAdvantages: string[];
}

export const BENCHMARK_SUMMARY: BenchmarkSummary = {
  totalTraditionalCostMonthly: "月額100〜300万円",
  totalAICostMonthly: "月額9,800〜98,000円",
  costReductionPercent: 90,
  availabilityHours: "24時間365日",
  responseTime: "即時（数秒〜数分）",
  competitorResponseTime: "数日〜数週間",
  competitorAvailability: "平日9:45〜17:30",
  aiAdvantages: [
    "コスト約90%削減（月額数万円 vs 数十万円）",
    "24時間365日いつでも相談可能",
    "数秒〜数分で分析結果・提案を取得",
    "データに基づく客観的な分析",
    "何度でも繰り返しシミュレーション可能",
    "業種横断のベストプラクティスを瞬時に参照",
  ],
  humanAdvantages: [
    "現場での実行支援・伴走",
    "経営者同士のネットワーキング",
    "行政・金融機関との交渉代行",
    "複雑な法務・税務の最終判断",
    "組織の人間関係・風土改革",
  ],
};

// カテゴリ一覧
export const SERVICE_CATEGORIES = [
  "すべて",
  "経営戦略",
  "マーケティング",
  "DX推進",
  "人材・組織",
  "財務",
  "事業承継",
  "ナレッジ",
  "補助金",
];
