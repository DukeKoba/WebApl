import { AI_AGENTS } from './agents';

export const CASE_TEMPLATES = [
  {
    id: "ec-launch",
    title: "EC事業の立ち上げ・販路拡大",
    industry: "食品・飲食",
    region: "全国",
    challenge: "地元で人気の商品を全国に届けたいが、ECのノウハウがない",
    description: "地域の特産品や人気商品をECサイトを通じて全国展開するプロジェクト。物流体制の構築からブランディング、集客戦略まで包括的に支援します。",
    requiredAgents: ["dx-advisor","market-researcher","strategy-consultant"],
    phases: [
      { name: "現状分析・EC戦略策定", agentId: "strategy-consultant", tasks: ["商品ラインナップの整理と価格戦略","競合EC店舗の調査","ターゲット顧客の明確化"], deliverables: ["EC事業計画書","競合分析レポート"], duration: "2週間" },
      { name: "ECサイト構築・物流設計", agentId: "dx-advisor", tasks: ["ECプラットフォーム選定（Shopify/BASE/楽天）","商品ページ作成ガイドライン","物流・配送体制の設計","決済システムの導入"], deliverables: ["ECサイト構築ロードマップ","物流フロー設計書"], duration: "4週間" },
      { name: "集客・マーケティング", agentId: "market-researcher", tasks: ["SNSアカウント設計・コンテンツ戦略","Google/SNS広告の設計","ふるさと納税返礼品としての登録","インフルエンサー連携企画"], deliverables: ["マーケティング実行計画","SNS運用マニュアル"], duration: "継続" },
    ],
    estimatedDuration: "3ヶ月",
    tags: ["EC","販路拡大","DX","地域特産品"],
  },
  {
    id: "hiring-strategy",
    title: "採用戦略の立案・採用ブランディング",
    industry: "全業種",
    region: "全国",
    challenge: "人材が集まらない。地方で優秀な人材を確保したい",
    description: "採用難に直面する地方企業向けに、AIを活用した採用戦略を構築。採用ブランディングからリモートワーク体制まで包括的に支援します。",
    requiredAgents: ["hr-strategist","market-researcher","dx-advisor"],
    phases: [
      { name: "採用課題の分析", agentId: "hr-strategist", tasks: ["現在の採用フローの課題整理","求める人材像の明確化","採用市場の調査"], deliverables: ["採用課題レポート","ペルソナ設計書"], duration: "1週間" },
      { name: "採用ブランディング戦略", agentId: "market-researcher", tasks: ["企業の魅力の言語化・ストーリー設計","採用サイト・SNSの設計","社員インタビュー企画"], deliverables: ["採用ブランドコンセプト","コンテンツ計画"], duration: "2週間" },
      { name: "リモートワーク・採用基盤整備", agentId: "dx-advisor", tasks: ["リモートワーク環境の整備","プロジェクト管理ツールの導入","採用管理システム（ATS）の選定"], deliverables: ["リモートワーク導入マニュアル","採用DXガイド"], duration: "2週間" },
    ],
    estimatedDuration: "1.5ヶ月",
    tags: ["採用","人材","組織","リモートワーク"],
  },
  {
    id: "new-product-dev",
    title: "地域資源を活かした新商品開発",
    industry: "製造・食品・工芸",
    region: "全国",
    challenge: "既存事業が縮小傾向。地域の強みを活かした新商品を作りたい",
    description: "地域の特産品、伝統技術、自然資源を活かした新商品を企画・開発。市場調査からプロトタイプ、テスト販売まで一貫して支援します。",
    requiredAgents: ["product-developer","market-researcher","strategy-consultant"],
    phases: [
      { name: "市場調査・アイデア創出", agentId: "market-researcher", tasks: ["トレンド分析・消費者ニーズ調査","競合商品のベンチマーク","地域資源の棚卸し"], deliverables: ["市場調査レポート","アイデアリスト"], duration: "2週間" },
      { name: "商品コンセプト設計", agentId: "product-developer", tasks: ["商品コンセプトの策定","ターゲット顧客とのフィット検証","パッケージデザインの方向性","試作品の仕様策定"], deliverables: ["商品企画書","プロトタイプ仕様書"], duration: "3週間" },
      { name: "テスト販売・事業計画", agentId: "strategy-consultant", tasks: ["テスト販売計画の策定","原価計算・価格設定","事業収支シミュレーション","補助金活用の検討"], deliverables: ["テスト販売レポート","事業計画書"], duration: "4週間" },
    ],
    estimatedDuration: "2.5ヶ月",
    tags: ["商品開発","地域資源","新規事業"],
  },
  {
    id: "dx-transformation",
    title: "業務のDX推進・デジタル化",
    industry: "全業種",
    region: "全国",
    challenge: "紙・電話中心の業務を効率化したい。どこから始めればいいか分からない",
    description: "アナログな業務プロセスをデジタル化し、生産性向上とコスト削減を実現。ステップバイステップで無理のないDXを推進します。",
    requiredAgents: ["dx-advisor","strategy-consultant","hr-strategist"],
    phases: [
      { name: "業務プロセス可視化", agentId: "dx-advisor", tasks: ["現行業務フローのヒアリング・整理","デジタル化の優先順位付け","費用対効果の試算"], deliverables: ["業務フロー図","DXロードマップ"], duration: "2週間" },
      { name: "ツール選定・導入", agentId: "dx-advisor", tasks: ["クラウドサービス・SaaSの比較選定","導入計画の策定","初期設定・データ移行支援"], deliverables: ["ツール比較表","導入手順書"], duration: "4週間" },
      { name: "社員教育・定着支援", agentId: "hr-strategist", tasks: ["操作マニュアルの作成","社内研修プログラムの設計","定着度のモニタリング"], deliverables: ["研修資料","定着レポート"], duration: "継続" },
    ],
    estimatedDuration: "3ヶ月",
    tags: ["DX","業務効率化","クラウド","ペーパーレス"],
  },
  {
    id: "marketing-sns",
    title: "SNS・デジタルマーケティング戦略",
    industry: "全業種",
    region: "全国",
    challenge: "SNSを始めたいが運用方法が分からない。効果的な集客をしたい",
    description: "Instagram、LINE公式、Googleマップなどを活用した地域密着型のデジタルマーケティング戦略を設計・実行支援します。",
    requiredAgents: ["market-researcher","dx-advisor","product-developer"],
    phases: [
      { name: "マーケティング現状分析", agentId: "market-researcher", tasks: ["現在の集客チャネルの効果分析","ターゲット顧客のSNS利用状況調査","競合のSNS戦略分析"], deliverables: ["マーケティング現状レポート","ベンチマーク分析"], duration: "1週間" },
      { name: "SNS戦略策定・アカウント構築", agentId: "market-researcher", tasks: ["最適なSNSプラットフォームの選定","コンテンツカレンダーの作成","ブランドガイドラインの策定","Googleビジネスプロフィール最適化"], deliverables: ["SNS運用戦略書","コンテンツカレンダー","ブランドガイドライン"], duration: "2週間" },
      { name: "運用開始・効果測定", agentId: "dx-advisor", tasks: ["投稿の実行支援","広告運用の設定・最適化","分析ダッシュボードの構築","月次レポートの作成"], deliverables: ["月次マーケティングレポート","改善提案書"], duration: "継続" },
    ],
    estimatedDuration: "1ヶ月+継続",
    tags: ["SNS","Instagram","LINE","集客","MEO"],
  },
];

function matchCaseTemplate(challengeType, industry) {
  const typeMap = {
    "ec-launch": ["EC","販路","オンライン販売","ネット通販","通販"],
    "hiring-strategy": ["採用","人材","人手不足","求人","離職"],
    "new-product-dev": ["商品開発","新商品","新規事業","地域資源"],
    "dx-transformation": ["DX","デジタル化","業務改善","効率化","ペーパーレス"],
    "marketing-sns": ["SNS","マーケティング","集客","広告","ブランディング"],
  };

  for (const [templateId, keywords] of Object.entries(typeMap)) {
    if (keywords.some((kw) => challengeType.includes(kw))) {
      return CASE_TEMPLATES.find((t) => t.id === templateId);
    }
  }
  return CASE_TEMPLATES[0];
}

function personalizeTask(task, projectCase) {
  return task
    .replace("商品", `${projectCase.industry}の商品`)
    .replace("企業", projectCase.companyName);
}

function generateKPIs(projectCase, template) {
  const kpiTemplates = {
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

function generateRisks(projectCase, template) {
  const risks = [
    { description: "社内のデジタルリテラシー不足による導入遅延", impact: "medium", mitigation: "段階的な導入と丁寧な研修プログラムの実施" },
    { description: "予算超過のリスク", impact: "medium", mitigation: "補助金の活用と段階的な投資計画" },
  ];
  if (projectCase.employeeCount < 10) {
    risks.push({ description: "少人数のため担当者の負荷が高くなる可能性", impact: "high", mitigation: "AIによる業務自動化と段階的な導入で負荷を分散" });
  }
  return risks;
}

function estimateBudget(template) {
  const budgets = {
    "ec-launch": "月額3〜5万円（AI利用料）+ ECプラットフォーム費用",
    "hiring-strategy": "月額3〜5万円（AI利用料）+ 採用媒体費用",
    "new-product-dev": "月額3〜5万円（AI利用料）+ 試作費用",
    "dx-transformation": "月額3〜5万円（AI利用料）+ SaaSライセンス費用",
    "marketing-sns": "月額3〜5万円（AI利用料）+ 広告費用",
  };
  return budgets[template.id] || "月額3〜5万円（AI利用料）";
}

export function generateProposal(projectCase) {
  const template = matchCaseTemplate(
    projectCase.challengeType + " " + projectCase.challengeDetail,
    projectCase.industry
  );

  if (!template) {
    return {
      summary: `${projectCase.companyName}様の課題について、最適なAIエージェントチームが分析・提案を行います。`,
      phases: [{ phase: 1, name: "現状分析", agentId: "strategy-consultant", agentName: "経営戦略コンサルタント", duration: "2週間", actions: ["経営状況のヒアリング","課題の構造化","優先順位付け"], deliverables: ["現状分析レポート"] }],
      kpis: [],
      risks: [],
      estimatedBudget: "月額3〜5万円",
      estimatedDuration: "要相談",
    };
  }

  const phases = template.phases.map((phase, i) => {
    const agent = AI_AGENTS.find((a) => a.id === phase.agentId);
    return {
      phase: i + 1,
      name: phase.name,
      agentId: phase.agentId,
      agentName: agent?.name || "AIコンサルタント",
      duration: phase.duration,
      actions: phase.tasks.map((task) => personalizeTask(task, projectCase)),
      deliverables: phase.deliverables,
    };
  });

  return {
    summary: `${projectCase.companyName}様の「${projectCase.challengeDetail}」について、${template.requiredAgents.length}名のAIエージェントが連携して解決策を提案します。${template.estimatedDuration}の期間で、段階的に成果を出していきます。`,
    phases,
    kpis: generateKPIs(projectCase, template),
    risks: generateRisks(projectCase, template),
    estimatedBudget: estimateBudget(template),
    estimatedDuration: template.estimatedDuration,
  };
}
