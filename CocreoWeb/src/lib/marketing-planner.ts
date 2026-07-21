/**
 * Webマーケティングプランナー
 * 中小企業向けのデジタルマーケティング戦略を診断・提案
 */

export interface MarketingPlannerInput {
  industry: string;
  region: string;
  prefecture: string;
  employeeCount: number;
  annualRevenue: number;
  // ビジネスモデル
  businessType: "BtoB" | "BtoC" | "both";
  mainProducts: string;                    // 主力商品・サービス
  targetCustomer: string;                  // ターゲット顧客
  // 現在のWeb状況
  hasWebsite: boolean;
  hasSsl: boolean;
  hasMobileFriendly: boolean;
  monthlyPV: number;                       // 月間PV
  monthlyInquiries: number;                // 月間問い合わせ数
  conversionRate: number;                  // CVR (%)
  // SNS状況
  sns: {
    instagram: boolean;
    x: boolean;                            // 旧Twitter
    facebook: boolean;
    line: boolean;
    tiktok: boolean;
    youtube: boolean;
  };
  totalFollowers: number;                  // SNS合計フォロワー
  // Google系ツール
  hasGoogleBusinessProfile: boolean;       // Googleビジネスプロフィール
  hasGoogleAnalytics: boolean;
  hasSearchConsole: boolean;
  // 広告
  monthlyAdBudget: number;                 // 月間広告予算（円）
  currentChannels: {
    seo: boolean;
    meo: boolean;                          // MEO（Googleマップ対策）
    listingAd: boolean;                    // リスティング広告
    snsAd: boolean;                        // SNS広告
    displayAd: boolean;                    // ディスプレイ広告
    email: boolean;                        // メルマガ
    contentMarketing: boolean;             // コンテンツマーケティング
  };
  // 目標
  primaryGoal: "awareness" | "leads" | "sales" | "retention";
  monthlyBudget: number;                   // マーケティング月間予算（円）
}

export interface MarketingPlannerResult {
  overallScore: number;
  grade: "S" | "A" | "B" | "C" | "D";
  categories: MarketingCategory[];
  // Web診断
  webDiagnosis: {
    score: number;
    issues: string[];
    quickWins: string[];
  };
  // チャネル推奨
  channelStrategy: ChannelStrategy[];
  // アクションプラン
  actionPlan: MarketingPhase[];
  // 予算配分提案
  budgetAllocation: BudgetItem[];
  // KPI
  kpis: MarketingKPI[];
  // 業界インサイト
  industryInsight: string;
}

export interface MarketingCategory {
  name: string;
  score: number;
  maxScore: number;
  status: "good" | "warning" | "danger";
  details: string;
}

export interface ChannelStrategy {
  channel: string;
  priority: "must" | "recommended" | "optional";
  currentlyUsed: boolean;
  estimatedImpact: "high" | "medium" | "low";
  monthlyCost: string;
  description: string;
  actions: string[];
}

export interface MarketingPhase {
  phase: number;
  name: string;
  duration: string;
  actions: string[];
  expectedOutcome: string;
  budget: string;
}

export interface BudgetItem {
  category: string;
  percentage: number;
  amount: number;
  description: string;
}

export interface MarketingKPI {
  name: string;
  current: string;
  target: string;
  timeline: string;
}

// 業種別デジタルマーケティングベンチマーク
const industryBenchmarks: Record<string, {
  avgCVR: number;
  avgPV: number;
  topChannels: string[];
  insight: string;
}> = {
  "食品・飲食": {
    avgCVR: 2.5,
    avgPV: 3000,
    topChannels: ["Instagram", "Googleマップ(MEO)", "LINE"],
    insight: "食品・飲食業界ではInstagramの写真映え訴求とGoogleマップでの口コミ対策が集客の要。LINE公式アカウントでリピーター育成が鍵。",
  },
  "製造業": {
    avgCVR: 1.8,
    avgPV: 1500,
    topChannels: ["SEO", "リスティング広告", "コンテンツマーケティング"],
    insight: "製造業BtoBでは技術力を訴求するコンテンツSEOが有効。技術ブログ・事例紹介・動画で専門性をアピール。",
  },
  "小売・卸売": {
    avgCVR: 3.0,
    avgPV: 5000,
    topChannels: ["Instagram", "リスティング広告", "LINE"],
    insight: "小売業ではEC連携とSNSでの商品訴求が重要。LINE公式でセグメント配信し、リピート率向上を狙う。",
  },
  "IT・通信": {
    avgCVR: 2.0,
    avgPV: 8000,
    topChannels: ["コンテンツマーケティング", "SEO", "SNS広告"],
    insight: "IT業界はコンテンツマーケティングとSEOが最重要。ホワイトペーパー・ウェビナーでリード獲得。",
  },
  "建設・不動産": {
    avgCVR: 1.5,
    avgPV: 2000,
    topChannels: ["リスティング広告", "Googleマップ(MEO)", "SEO"],
    insight: "建設・不動産は地域密着のMEO対策と施工事例のSEOが有効。リスティング広告で即効性のあるリード獲得も併用。",
  },
  "医療・福祉": {
    avgCVR: 3.5,
    avgPV: 4000,
    topChannels: ["Googleマップ(MEO)", "SEO", "リスティング広告"],
    insight: "医療・福祉はGoogleマップの口コミ管理が最優先。症状別のSEOコンテンツで信頼性を構築。",
  },
  "観光・宿泊": {
    avgCVR: 2.0,
    avgPV: 6000,
    topChannels: ["Instagram", "Googleマップ(MEO)", "OTA連携"],
    insight: "観光業はInstagramとGoogleマップが必須。体験コンテンツとUGC（ユーザー投稿）活用で認知拡大。",
  },
  "サービス業": {
    avgCVR: 2.5,
    avgPV: 3000,
    topChannels: ["Googleマップ(MEO)", "リスティング広告", "LINE"],
    insight: "サービス業は地域SEOとMEO対策が基本。LINE公式での予約・リマインド配信でリピート率向上。",
  },
};

const defaultBenchmark = {
  avgCVR: 2.0,
  avgPV: 3000,
  topChannels: ["SEO", "リスティング広告", "SNS"],
  insight: "デジタルマーケティングの基盤構築（Webサイト最適化・Googleツール導入）から始め、段階的にチャネルを拡大していくことが重要です。",
};

export function planMarketing(input: MarketingPlannerInput): MarketingPlannerResult {
  const benchmark = industryBenchmarks[input.industry] || defaultBenchmark;
  const categories: MarketingCategory[] = [];

  // 1. Web基盤スコア (25点)
  let webScore = 0;
  const webIssues: string[] = [];
  const quickWins: string[] = [];

  if (input.hasWebsite) {
    webScore += 5;
    if (input.hasSsl) webScore += 3;
    else { webIssues.push("SSL未対応: SEO評価・信頼性に悪影響"); quickWins.push("SSL証明書の導入（Let's Encrypt無料）"); }
    if (input.hasMobileFriendly) webScore += 3;
    else { webIssues.push("モバイル未対応: スマホユーザーの離脱率増加"); quickWins.push("レスポンシブデザインの適用"); }
    if (input.hasGoogleAnalytics) webScore += 3;
    else { webIssues.push("Googleアナリティクス未導入: アクセス分析ができない"); quickWins.push("GA4の導入（無料・1時間で設定可能）"); }
    if (input.hasSearchConsole) webScore += 3;
    else { webIssues.push("Search Console未導入: 検索パフォーマンスが不明"); quickWins.push("Google Search Consoleの登録（無料）"); }
    if (input.hasGoogleBusinessProfile) webScore += 4;
    else { webIssues.push("Googleビジネスプロフィール未登録: 地域検索で不利"); quickWins.push("Googleビジネスプロフィールの登録・最適化"); }
    if (input.monthlyPV >= benchmark.avgPV) webScore += 4;
    else if (input.monthlyPV >= benchmark.avgPV * 0.5) webScore += 2;
    else webIssues.push(`月間PV ${input.monthlyPV}は業界平均${benchmark.avgPV}を下回っています`);
  } else {
    webIssues.push("Webサイトが存在しません。デジタルマーケティングの基盤が欠如しています");
    quickWins.push("Webサイトの開設（WordPress/Wix等で即日可能）");
  }
  webScore = Math.min(webScore, 25);

  categories.push({
    name: "Web基盤",
    score: webScore,
    maxScore: 25,
    status: webScore >= 18 ? "good" : webScore >= 10 ? "warning" : "danger",
    details: webScore >= 18
      ? "Web基盤は整っています。コンテンツ強化とCVR改善に注力しましょう"
      : webScore >= 10
      ? "基本的なWeb基盤はありますが、改善余地があります"
      : "Web基盤の構築が最優先です。サイトとGoogleツールの整備から始めましょう",
  });

  // 2. SNS・コンテンツスコア (25点)
  const snsChannelCount = Object.values(input.sns).filter(Boolean).length;
  let snsScore = 0;
  if (snsChannelCount >= 3) snsScore += 8;
  else if (snsChannelCount >= 1) snsScore += 4;
  if (input.totalFollowers >= 1000) snsScore += 7;
  else if (input.totalFollowers >= 300) snsScore += 4;
  else if (input.totalFollowers >= 50) snsScore += 2;
  if (input.currentChannels.contentMarketing) snsScore += 5;
  if (input.currentChannels.email) snsScore += 5;
  snsScore = Math.min(snsScore, 25);

  categories.push({
    name: "SNS・コンテンツ",
    score: snsScore,
    maxScore: 25,
    status: snsScore >= 18 ? "good" : snsScore >= 10 ? "warning" : "danger",
    details: snsScore >= 18
      ? "SNS活用が進んでいます。エンゲージメント率の向上とコンテンツの質を高めましょう"
      : snsChannelCount === 0
      ? "SNSが未活用です。業界に適したチャネルから開始しましょう"
      : "SNS活用の余地が大きいです。投稿頻度とコンテンツの質を改善しましょう",
  });

  // 3. 集客・広告スコア (25点)
  let adScore = 0;
  if (input.currentChannels.seo) adScore += 5;
  if (input.currentChannels.meo) adScore += 4;
  if (input.currentChannels.listingAd) adScore += 4;
  if (input.currentChannels.snsAd) adScore += 3;
  if (input.monthlyAdBudget >= 100000) adScore += 4;
  else if (input.monthlyAdBudget >= 30000) adScore += 2;
  if (input.monthlyInquiries >= 10) adScore += 5;
  else if (input.monthlyInquiries >= 3) adScore += 3;
  else adScore += 1;
  adScore = Math.min(adScore, 25);

  categories.push({
    name: "集客・広告",
    score: adScore,
    maxScore: 25,
    status: adScore >= 18 ? "good" : adScore >= 10 ? "warning" : "danger",
    details: adScore >= 18
      ? "集客チャネルが充実しています。ROI分析を行い、投資効率を最大化しましょう"
      : adScore >= 10
      ? "集客手段がありますが、チャネルの多角化で更に成果を伸ばせます"
      : "集客施策が不十分です。まずSEO/MEOの無料施策から始めましょう",
  });

  // 4. CVR・顧客育成スコア (25点)
  let cvrScore = 0;
  if (input.conversionRate >= benchmark.avgCVR) cvrScore += 8;
  else if (input.conversionRate >= benchmark.avgCVR * 0.5) cvrScore += 4;
  if (input.currentChannels.email) cvrScore += 5;
  if (input.sns.line) cvrScore += 5;
  if (input.conversionRate > 0 && input.monthlyInquiries > 0) cvrScore += 4;
  if (input.primaryGoal === "retention") cvrScore += 3;
  else cvrScore += 1;
  cvrScore = Math.min(cvrScore, 25);

  categories.push({
    name: "CVR・顧客育成",
    score: cvrScore,
    maxScore: 25,
    status: cvrScore >= 18 ? "good" : cvrScore >= 10 ? "warning" : "danger",
    details: input.conversionRate >= benchmark.avgCVR
      ? `CVR ${input.conversionRate}%は業界平均${benchmark.avgCVR}%以上。LTV向上施策に注力を`
      : `CVR ${input.conversionRate}%は業界平均${benchmark.avgCVR}%を下回っています。LP改善とCTA最適化を推奨`,
  });

  const totalScore = webScore + snsScore + adScore + cvrScore;
  const pct = totalScore;
  const grade: "S" | "A" | "B" | "C" | "D" =
    pct >= 85 ? "S" : pct >= 70 ? "A" : pct >= 55 ? "B" : pct >= 40 ? "C" : "D";

  // チャネル戦略
  const channelStrategy: ChannelStrategy[] = [];

  // SEO
  channelStrategy.push({
    channel: "SEO（検索エンジン最適化）",
    priority: "must",
    currentlyUsed: input.currentChannels.seo,
    estimatedImpact: "high",
    monthlyCost: "0〜5万円",
    description: "Googleの自然検索からの集客。中長期で最もコスト効率が高い施策。",
    actions: [
      "キーワード調査（業種×地域×サービス名）",
      "タイトル・メタディスクリプションの最適化",
      "ブログ/コラムの定期投稿（月4本〜）",
      "内部リンク構造の改善",
    ],
  });

  // MEO (地域ビジネスなら必須)
  if (input.businessType === "BtoC" || input.businessType === "both") {
    channelStrategy.push({
      channel: "MEO（Googleマップ最適化）",
      priority: "must",
      currentlyUsed: input.currentChannels.meo,
      estimatedImpact: "high",
      monthlyCost: "0円（自社運用）",
      description: "Googleマップでの上位表示。地域密着ビジネスでは最重要施策。",
      actions: [
        "Googleビジネスプロフィールの完全入力",
        "写真を週2回以上投稿",
        "口コミへの返信（24時間以内）",
        "投稿機能で最新情報を定期発信",
      ],
    });
  }

  // SNS
  const bestSns = input.businessType === "BtoB" ? "X（旧Twitter）" :
    input.industry === "食品・飲食" || input.industry === "観光・宿泊" ? "Instagram" :
    input.targetCustomer.includes("若") || input.industry === "小売・卸売" ? "Instagram" : "Instagram";

  channelStrategy.push({
    channel: `SNSマーケティング（${bestSns}中心）`,
    priority: "recommended",
    currentlyUsed: snsChannelCount > 0,
    estimatedImpact: input.businessType === "BtoC" ? "high" : "medium",
    monthlyCost: "0〜3万円",
    description: `${bestSns}を中心に、ブランド認知と見込み客の獲得を強化。`,
    actions: [
      `${bestSns}アカウントの開設・プロフィール最適化`,
      "投稿カレンダーの作成（週3回以上）",
      "社員・現場の日常コンテンツの発信",
      "ハッシュタグ戦略の策定",
    ],
  });

  // LINE
  if (input.businessType === "BtoC" || input.businessType === "both") {
    channelStrategy.push({
      channel: "LINE公式アカウント",
      priority: "recommended",
      currentlyUsed: input.sns.line,
      estimatedImpact: "high",
      monthlyCost: "0〜5,000円",
      description: "リピーター育成とCRM。開封率60%以上のLINEでダイレクトにリーチ。",
      actions: [
        "LINE公式アカウント開設（無料プランあり）",
        "友だち追加の導線設計（店頭QR・Web連携）",
        "セグメント配信の設定",
        "クーポン・ショップカードの活用",
      ],
    });
  }

  // リスティング広告
  if (input.monthlyBudget >= 50000 || input.primaryGoal === "leads" || input.primaryGoal === "sales") {
    channelStrategy.push({
      channel: "リスティング広告（Google広告）",
      priority: input.primaryGoal === "leads" ? "must" : "recommended",
      currentlyUsed: input.currentChannels.listingAd,
      estimatedImpact: "high",
      monthlyCost: "3〜30万円",
      description: "検索キーワードに連動した広告。即効性のある集客手段。",
      actions: [
        "キーワードプランナーでの調査",
        "地域ターゲティングの設定",
        "広告文のA/Bテスト",
        "LP（ランディングページ）の最適化",
      ],
    });
  }

  // コンテンツマーケティング
  if (input.businessType === "BtoB" || input.primaryGoal === "awareness") {
    channelStrategy.push({
      channel: "コンテンツマーケティング",
      priority: input.businessType === "BtoB" ? "must" : "recommended",
      currentlyUsed: input.currentChannels.contentMarketing,
      estimatedImpact: "high",
      monthlyCost: "0〜10万円",
      description: "ブログ・事例紹介・ホワイトペーパーで専門性をアピールし、見込み客を獲得。",
      actions: [
        "コンテンツカレンダーの策定（月4本〜）",
        "事例紹介・お客様の声の収集と掲載",
        "業界ノウハウ記事の定期発信",
        "ダウンロード資料（PDF）の作成",
      ],
    });
  }

  // メルマガ
  channelStrategy.push({
    channel: "メールマーケティング",
    priority: input.monthlyInquiries >= 5 ? "recommended" : "optional",
    currentlyUsed: input.currentChannels.email,
    estimatedImpact: "medium",
    monthlyCost: "0〜1万円",
    description: "見込み客・既存客へのメルマガ配信。低コストで高ROIの施策。",
    actions: [
      "メール配信ツールの導入（Mailchimp無料プラン等）",
      "メールリストの整備・セグメント化",
      "月2回のメルマガ配信開始",
      "開封率・クリック率の分析と改善",
    ],
  });

  // 予算配分
  const budget = input.monthlyBudget || 100000;
  const budgetAllocation: BudgetItem[] = [];

  if (input.primaryGoal === "leads" || input.primaryGoal === "sales") {
    budgetAllocation.push(
      { category: "リスティング広告", percentage: 40, amount: Math.round(budget * 0.4), description: "即効性のあるリード獲得" },
      { category: "SEO/コンテンツ制作", percentage: 25, amount: Math.round(budget * 0.25), description: "中長期の自然流入強化" },
      { category: "SNS運用・広告", percentage: 20, amount: Math.round(budget * 0.2), description: "認知拡大とブランディング" },
      { category: "ツール・改善費", percentage: 15, amount: Math.round(budget * 0.15), description: "CRM・分析・LP改善" },
    );
  } else if (input.primaryGoal === "awareness") {
    budgetAllocation.push(
      { category: "SNS運用・広告", percentage: 35, amount: Math.round(budget * 0.35), description: "認知拡大メイン" },
      { category: "コンテンツ制作", percentage: 30, amount: Math.round(budget * 0.3), description: "ブログ・動画・事例" },
      { category: "SEO対策", percentage: 20, amount: Math.round(budget * 0.2), description: "検索での認知獲得" },
      { category: "ツール・改善費", percentage: 15, amount: Math.round(budget * 0.15), description: "分析・改善ツール" },
    );
  } else {
    budgetAllocation.push(
      { category: "CRM・メール配信", percentage: 30, amount: Math.round(budget * 0.3), description: "顧客育成・リピート促進" },
      { category: "LINE/SNS運用", percentage: 25, amount: Math.round(budget * 0.25), description: "エンゲージメント強化" },
      { category: "コンテンツ制作", percentage: 25, amount: Math.round(budget * 0.25), description: "顧客向けコンテンツ" },
      { category: "分析・改善", percentage: 20, amount: Math.round(budget * 0.2), description: "データ分析とCVR改善" },
    );
  }

  // アクションプラン
  const actionPlan: MarketingPhase[] = [
    {
      phase: 1,
      name: "基盤構築",
      duration: "1〜2週間",
      actions: [
        ...(input.hasWebsite ? [] : ["Webサイトの開設（WordPress/Wix）"]),
        ...(!input.hasSsl ? ["SSL証明書の導入"] : []),
        ...(!input.hasGoogleAnalytics ? ["GA4の導入・初期設定"] : []),
        ...(!input.hasSearchConsole ? ["Google Search Consoleの登録"] : []),
        ...(!input.hasGoogleBusinessProfile ? ["Googleビジネスプロフィールの登録・最適化"] : []),
        "現状のアクセスデータ収集・分析",
      ].filter(a => a.length > 0),
      expectedOutcome: "Webマーケティングの基盤が整い、データ計測が可能になる",
      budget: "0〜3万円",
    },
    {
      phase: 2,
      name: "集客チャネルの構築",
      duration: "1〜2ヶ月",
      actions: [
        "ターゲットキーワードの選定とSEO対策開始",
        `${bestSns}アカウント開設・運用開始（週3回投稿）`,
        ...(input.businessType !== "BtoB" ? ["LINE公式アカウント開設・友だち獲得施策"] : []),
        "ブログ/コラムの定期投稿開始（月4本）",
        ...(input.monthlyBudget >= 50000 ? ["リスティング広告のテスト配信開始"] : []),
      ],
      expectedOutcome: "月間PV 50%増加、新規問い合わせチャネルの確立",
      budget: `${(budget * 0.3 / 10000).toFixed(0)}〜${(budget * 0.5 / 10000).toFixed(0)}万円/月`,
    },
    {
      phase: 3,
      name: "CVR改善・拡大",
      duration: "2〜3ヶ月",
      actions: [
        "LPの改善（CTAボタン・フォーム最適化）",
        "A/Bテストの実施（広告文・LP・メール件名）",
        "リターゲティング広告の導入",
        "顧客の声・事例コンテンツの充実",
        "メルマガ/LINE配信の定期運用開始",
      ],
      expectedOutcome: "CVR 30%改善、問い合わせ数の倍増",
      budget: `${(budget * 0.7 / 10000).toFixed(0)}〜${(budget / 10000).toFixed(0)}万円/月`,
    },
    {
      phase: 4,
      name: "最適化・スケール",
      duration: "3〜6ヶ月",
      actions: [
        "チャネル別ROI分析と予算再配分",
        "高成果コンテンツの横展開",
        "CRM導入と顧客セグメント別施策",
        "マーケティングオートメーションの検討",
        "四半期レビューとKPI見直し",
      ],
      expectedOutcome: "マーケティングROI 200%達成、自走する集客基盤の確立",
      budget: `${(budget / 10000).toFixed(0)}万円/月（最適化済）`,
    },
  ];

  // KPI
  const kpis: MarketingKPI[] = [
    {
      name: "月間PV",
      current: `${input.monthlyPV.toLocaleString()}`,
      target: `${Math.max(input.monthlyPV * 3, benchmark.avgPV).toLocaleString()}`,
      timeline: "6ヶ月",
    },
    {
      name: "月間問い合わせ数",
      current: `${input.monthlyInquiries}件`,
      target: `${Math.max(input.monthlyInquiries * 3, 15)}件`,
      timeline: "6ヶ月",
    },
    {
      name: "CVR",
      current: `${input.conversionRate}%`,
      target: `${Math.max(input.conversionRate * 1.5, benchmark.avgCVR).toFixed(1)}%`,
      timeline: "3ヶ月",
    },
    {
      name: "SNSフォロワー",
      current: `${input.totalFollowers.toLocaleString()}`,
      target: `${Math.max(input.totalFollowers * 3, 1000).toLocaleString()}`,
      timeline: "6ヶ月",
    },
    {
      name: "CPA（獲得単価）",
      current: input.monthlyInquiries > 0
        ? `${Math.round(input.monthlyAdBudget / Math.max(input.monthlyInquiries, 1)).toLocaleString()}円`
        : "計測不能",
      target: `${Math.round(input.annualRevenue / input.employeeCount * 0.01).toLocaleString()}円以下`,
      timeline: "6ヶ月",
    },
  ];

  return {
    overallScore: totalScore,
    grade,
    categories,
    webDiagnosis: {
      score: webScore,
      issues: webIssues,
      quickWins,
    },
    channelStrategy,
    actionPlan,
    budgetAllocation,
    kpis,
    industryInsight: benchmark.insight,
  };
}
