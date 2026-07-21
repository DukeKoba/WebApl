import { DiagnosisResult } from "@/types";

export interface DiagnosisQuestion {
  id: string;
  category: string;
  question: string;
  options: { label: string; score: number }[];
}

export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    id: "q1",
    category: "マーケティング",
    question: "自社の商品・サービスのターゲット顧客を明確に定義していますか？",
    options: [
      { label: "明確に定義し、定期的に見直している", score: 5 },
      { label: "おおまかに把握している", score: 3 },
      { label: "特に定義していない", score: 1 },
    ],
  },
  {
    id: "q2",
    category: "マーケティング",
    question: "SNSやWebサイトを活用した集客を行っていますか？",
    options: [
      { label: "戦略的に運用し効果測定もしている", score: 5 },
      { label: "アカウントはあるが不定期の更新", score: 3 },
      { label: "ほとんど活用していない", score: 1 },
    ],
  },
  {
    id: "q3",
    category: "商品開発",
    question: "新商品・サービスの開発に取り組んでいますか？",
    options: [
      { label: "定期的に新商品を開発・リリースしている", score: 5 },
      { label: "たまにアイデアは出るが実行まで至らない", score: 3 },
      { label: "既存商品のみで新規開発は行っていない", score: 1 },
    ],
  },
  {
    id: "q4",
    category: "商品開発",
    question: "地域の資源や特性を活かした商品づくりをしていますか？",
    options: [
      { label: "積極的に地域資源を活用している", score: 5 },
      { label: "一部で活用している", score: 3 },
      { label: "特に意識していない", score: 1 },
    ],
  },
  {
    id: "q5",
    category: "DX推進",
    question: "業務のデジタル化はどの程度進んでいますか？",
    options: [
      { label: "主要業務はデジタル化済み", score: 5 },
      { label: "一部の業務でITツールを導入", score: 3 },
      { label: "紙ベース・アナログが中心", score: 1 },
    ],
  },
  {
    id: "q6",
    category: "DX推進",
    question: "ECサイトやオンライン販売チャネルを活用していますか？",
    options: [
      { label: "自社ECやモール出店で売上を上げている", score: 5 },
      { label: "検討中または準備段階", score: 3 },
      { label: "オンライン販売はしていない", score: 1 },
    ],
  },
  {
    id: "q7",
    category: "人材・組織",
    question: "必要な人材の採用・確保はできていますか？",
    options: [
      { label: "計画的に採用でき人材は充足している", score: 5 },
      { label: "採用はしているがなかなか集まらない", score: 3 },
      { label: "深刻な人材不足に悩んでいる", score: 1 },
    ],
  },
  {
    id: "q8",
    category: "人材・組織",
    question: "外部の専門家やAIツールを活用して経営課題を解決したことはありますか？",
    options: [
      { label: "すでに活用し成果を出している", score: 5 },
      { label: "興味はあるがまだ活用していない", score: 3 },
      { label: "考えたことがない", score: 1 },
    ],
  },
  {
    id: "q9",
    category: "経営戦略",
    question: "中長期の事業計画を策定していますか？",
    options: [
      { label: "3〜5年の計画を策定し定期的に見直している", score: 5 },
      { label: "大まかな方向性はあるが文書化していない", score: 3 },
      { label: "特に計画は立てていない", score: 1 },
    ],
  },
  {
    id: "q10",
    category: "経営戦略",
    question: "補助金・助成金を活用したことはありますか？",
    options: [
      { label: "定期的に情報収集し活用している", score: 5 },
      { label: "過去に1〜2回利用したことがある", score: 3 },
      { label: "利用したことがない", score: 1 },
    ],
  },
];

export function calculateDiagnosis(
  answers: Record<string, number>
): DiagnosisResult[] {
  const categories = [
    "マーケティング",
    "商品開発",
    "DX推進",
    "人材・組織",
    "経営戦略",
  ];

  return categories.map((category) => {
    const categoryQuestions = DIAGNOSIS_QUESTIONS.filter(
      (q) => q.category === category
    );
    const totalScore = categoryQuestions.reduce(
      (sum, q) => sum + (answers[q.id] || 0),
      0
    );
    const maxScore = categoryQuestions.length * 5;
    const ratio = totalScore / maxScore;

    let findings: string[] = [];
    let recommendations: string[] = [];

    if (category === "マーケティング") {
      if (ratio < 0.5) {
        findings = [
          "マーケティング戦略の体系化が必要",
          "デジタルチャネルの活用が不十分",
        ];
        recommendations = [
          "ターゲット顧客の明確化とペルソナ作成",
          "SNSマーケティングの導入（まずはInstagramから）",
          "Googleビジネスプロフィールの最適化",
        ];
      } else {
        findings = ["基本的なマーケティング活動は実施している"];
        recommendations = [
          "データ分析による効果測定の強化",
          "コンテンツマーケティングの充実",
        ];
      }
    } else if (category === "商品開発") {
      if (ratio < 0.5) {
        findings = [
          "新商品開発の仕組みが確立されていない",
          "地域資源の活用余地が大きい",
        ];
        recommendations = [
          "顧客ニーズ調査の実施",
          "地域資源の棚卸しと活用アイデアのブレスト",
          "最小限の投資で試作品を作るMVPアプローチの導入",
        ];
      } else {
        findings = ["商品開発への取り組み意識がある"];
        recommendations = [
          "開発プロセスの体系化",
          "他地域・他業種とのコラボレーション検討",
        ];
      }
    } else if (category === "DX推進") {
      if (ratio < 0.5) {
        findings = [
          "業務のデジタル化が遅れている",
          "オンライン販売チャネルが未整備",
        ];
        recommendations = [
          "まずは会計・勤怠などバックオフィスのクラウド化",
          "BASEやShopifyなど手軽なECサイトの構築",
          "LINE公式アカウントによる顧客接点のデジタル化",
        ];
      } else {
        findings = ["基本的なDXは進行中"];
        recommendations = [
          "データ活用による意思決定の高度化",
          "業務自動化（RPA）の検討",
        ];
      }
    } else if (category === "人材・組織") {
      if (ratio < 0.5) {
        findings = [
          "人材確保が経営上の大きな課題",
          "外部人材の活用が未検討",
        ];
        recommendations = [
          "AIコンサルティングツールの活用で専門知識を補完",
          "リモートワーク対応による採用エリア拡大",
          "採用ブランディングの強化（自社の魅力発信）",
        ];
      } else {
        findings = ["人材戦略への意識がある"];
        recommendations = [
          "人材育成プログラムの体系化",
          "従業員エンゲージメントの向上施策",
        ];
      }
    } else if (category === "経営戦略") {
      if (ratio < 0.5) {
        findings = [
          "中長期的な経営計画が不明確",
          "補助金・助成金の活用が不十分",
        ];
        recommendations = [
          "3年間の事業計画書の作成",
          "利用可能な補助金・助成金の調査",
          "財務指標の定期モニタリング体制の構築",
        ];
      } else {
        findings = ["経営の方向性は定まっている"];
        recommendations = [
          "KPIダッシュボードの導入",
          "事業承継計画の早期策定",
        ];
      }
    }

    return { category, score: totalScore, maxScore, findings, recommendations };
  });
}
