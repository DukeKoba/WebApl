export interface SubsidyFormData {
  companyName: string;
  industry: string;
  employeeCount: string;
  annualRevenue: string;
  currentChallenges: string[];
  desiredTools: string[];
  customChallenge: string;
  customTool: string;
  processCount: string;
  businessDescription: string;
}

export interface SubsidyDraft {
  projectTitle: string;
  businessOverview: string;
  currentIssues: string;
  proposedSolution: string;
  toolsToIntroduce: string;
  implementationSchedule: string;
  expectedEffects: string;
  budgetEstimate: string;
  subsidyCategory: string;
  subsidyAmount: string;
  subsidyRate: string;
}

export const INDUSTRY_OPTIONS = [
  "製造業", "建設業", "小売業", "飲食業", "サービス業",
  "医療・福祉", "不動産業", "運輸・物流", "情報通信業",
  "農林水産業", "宿泊・観光業", "教育・学習支援", "その他",
];

export const CHALLENGE_OPTIONS = [
  "手作業が多く業務効率が悪い",
  "紙ベースの業務が残っている",
  "顧客管理が属人的",
  "売上・経費の管理が煩雑",
  "在庫管理が手動",
  "従業員のシフト管理が大変",
  "問い合わせ対応に時間がかかる",
  "データ分析ができていない",
  "テレワーク環境が整っていない",
  "セキュリティ対策が不十分",
];

export const TOOL_OPTIONS = [
  "会計・経理ソフト（freee, マネーフォワード等）",
  "顧客管理（CRM）システム",
  "勤怠・シフト管理システム",
  "在庫管理システム",
  "EC・ネットショップ構築",
  "AIチャットボット（問い合わせ対応）",
  "RPA（定型業務の自動化）",
  "電子契約・電子署名",
  "グループウェア（社内情報共有）",
  "AI分析・レポート自動化",
  "予約管理システム",
  "POSレジ・キャッシュレス決済",
];

export function generateSubsidyDraft(data: SubsidyFormData): SubsidyDraft {
  const challenges = [
    ...data.currentChallenges,
    ...(data.customChallenge ? [data.customChallenge] : []),
  ];
  const tools = [
    ...data.desiredTools,
    ...(data.customTool ? [data.customTool] : []),
  ];

  const processNum = parseInt(data.processCount) || 1;
  const isHighTier = processNum >= 4;
  const subsidyMax = isHighTier ? "450万円" : "150万円";
  const subsidyMin = isHighTier ? "150万円" : "5万円";

  const employeeNum = parseInt(data.employeeCount) || 5;
  const estimatedBudget = Math.min(
    isHighTier ? 4500000 : 1500000,
    Math.max(employeeNum * 200000, 500000)
  );
  const estimatedSubsidy = Math.floor(estimatedBudget / 2);

  const projectTitle = `${data.industry}における${tools.length > 0 ? tools[0].split("（")[0] : "ITツール"}導入による業務プロセス改善事業`;

  const businessOverview = `${data.companyName}は${data.industry}を営む企業であり、従業員${data.employeeCount}名、年商${data.annualRevenue}の規模で事業を展開している。${data.businessDescription ? data.businessDescription + "。" : ""}当社は地域に根差した事業運営を行っているが、業務プロセスの多くが手作業・紙ベースで行われており、生産性向上が喫緊の課題となっている。本事業では、デジタルツール・AIを導入することにより、業務プロセスの抜本的な改善を図り、労働生産性の向上と従業員の働き方改革を同時に実現する。`;

  const currentIssues = challenges.map((c, i) =>
    `（${i + 1}）${c}`
  ).join("\n") +
  "\n\n上記の課題により、従業員1人あたりの業務負荷が高く、本来注力すべき営業活動や顧客対応に十分な時間を割くことができていない状況にある。このまま現状を放置すれば、競合他社に対する競争力の低下、従業員の離職リスク増大、事業の持続可能性への影響が懸念される。";

  const proposedSolution = `本事業では、以下のデジタルツール・AIを導入し、${processNum}つの業務プロセスを改善する。

導入するツール・サービスにより、現在手作業で行われている業務を自動化・効率化する。具体的には、データ入力・集計作業の自動化、情報の一元管理によるリアルタイム経営判断の実現、AI活用による顧客対応の迅速化を実現する。

これにより、従業員が付加価値の高い業務（顧客対応、新規開拓、サービス品質向上）に集中できる環境を整備し、企業全体の労働生産性を向上させる。`;

  const toolsToIntroduce = tools.map((t, i) =>
    `【ツール${i + 1}】${t}\n  ・導入目的：${challenges[i] || challenges[0]}の解決\n  ・対象業務：関連する業務プロセス全般\n  ・利用者：全従業員（${data.employeeCount}名）`
  ).join("\n\n");

  const implementationSchedule = `【Month 1】要件定義・ツール選定
  ・現状業務フローの詳細調査
  ・ツールベンダーとの打ち合わせ・見積取得
  ・導入計画の策定

【Month 2】環境構築・初期設定
  ・ツールの契約・アカウント設定
  ・既存データの移行準備
  ・テスト環境での動作確認

【Month 3】データ移行・並行運用
  ・既存システムからのデータ移行
  ・新旧システムの並行運用
  ・従業員向け操作研修の実施

【Month 4-5】本格運用・定着化
  ・新システムへの完全移行
  ・運用マニュアルの整備
  ・効果測定の開始

【Month 6】効果検証・改善
  ・KPIに基づく導入効果の測定
  ・業務フローの改善・最適化
  ・次フェーズの計画策定`;

  const expectedEffects = `【定量的効果（見込み）】
  ・業務時間削減：月間約${Math.max(20, employeeNum * 5)}時間の削減（従業員1人あたり月${Math.max(4, Math.floor(employeeNum * 5 / employeeNum))}時間）
  ・労働生産性向上：${Math.min(30, 10 + processNum * 5)}%の向上を目標
  ・人的ミス削減：手作業に起因するミスを年間${Math.min(90, 50 + processNum * 10)}%削減
  ・コスト削減：年間約${Math.floor(estimatedBudget * 0.3 / 10000)}万円の業務コスト削減

【定性的効果】
  ・従業員の業務負荷軽減による働き方改革の推進
  ・リアルタイムのデータ活用による迅速な経営判断
  ・顧客満足度の向上（対応スピード・品質の改善）
  ・テレワーク・柔軟な働き方への対応基盤の構築
  ・BCP（事業継続計画）の強化`;

  const budgetEstimate = `【経費内訳（税込見込み）】
  ・ソフトウェア費：${Math.floor(estimatedBudget * 0.5 / 10000)}万円
  ・クラウド利用費（1年分）：${Math.floor(estimatedBudget * 0.15 / 10000)}万円
  ・導入設定・カスタマイズ費：${Math.floor(estimatedBudget * 0.2 / 10000)}万円
  ・研修・マニュアル作成費：${Math.floor(estimatedBudget * 0.1 / 10000)}万円
  ・保守・サポート費（1年分）：${Math.floor(estimatedBudget * 0.05 / 10000)}万円

  合計（税込）：約${Math.floor(estimatedBudget / 10000)}万円
  補助金申請額：約${Math.floor(estimatedSubsidy / 10000)}万円（補助率1/2）`;

  return {
    projectTitle,
    businessOverview,
    currentIssues,
    proposedSolution,
    toolsToIntroduce,
    implementationSchedule,
    expectedEffects,
    budgetEstimate,
    subsidyCategory: isHighTier
      ? "複数プロセス（4プロセス以上）"
      : "通常枠（1〜3プロセス）",
    subsidyAmount: `${subsidyMin}〜${subsidyMax}`,
    subsidyRate: "1/2以内（小規模事業者・最低賃金近傍は2/3以内）",
  };
}
