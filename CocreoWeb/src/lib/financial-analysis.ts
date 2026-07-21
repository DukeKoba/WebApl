/**
 * PL/BS AI分析エンジン
 * 企業の財務データを入力し、AIが分析・改善提案を行う
 */

export interface PLData {
  period: string;
  revenue: number;          // 売上高
  cogs: number;             // 売上原価
  grossProfit?: number;     // 売上総利益（自動計算）
  sellingExpenses: number;  // 販管費
  operatingProfit?: number; // 営業利益（自動計算）
  nonOperatingIncome: number;  // 営業外収益
  nonOperatingExpenses: number; // 営業外費用
  ordinaryProfit?: number;  // 経常利益（自動計算）
  extraordinaryGains: number;  // 特別利益
  extraordinaryLosses: number; // 特別損失
  incomeTax: number;        // 法人税等
  netProfit?: number;       // 当期純利益（自動計算）
}

export interface BSData {
  period: string;
  // 資産の部
  cashAndDeposits: number;    // 現金及び預金
  accountsReceivable: number; // 売掛金
  inventory: number;          // 棚卸資産
  otherCurrentAssets: number; // その他流動資産
  fixedAssets: number;        // 固定資産
  totalAssets?: number;       // 資産合計（自動計算）
  // 負債の部
  accountsPayable: number;    // 買掛金
  shortTermLoans: number;     // 短期借入金
  otherCurrentLiabilities: number; // その他流動負債
  longTermLoans: number;      // 長期借入金
  otherFixedLiabilities: number;   // その他固定負債
  totalLiabilities?: number;  // 負債合計（自動計算）
  // 純資産の部
  capital: number;            // 資本金
  retainedEarnings: number;   // 利益剰余金
  totalEquity?: number;       // 純資産合計（自動計算）
}

export interface FinancialRatio {
  name: string;
  value: number;
  unit: string;
  benchmark: number;
  status: "good" | "warning" | "danger";
  description: string;
}

export interface WeaknessDetail {
  weakness: string;
  severity: "high" | "medium" | "low";
  issues: string[];
  improvements: {
    action: string;
    effect: string;
    difficulty: "easy" | "medium" | "hard";
    timeframe: string;
  }[];
}

export interface FinancialAnalysisResult {
  pl: PLData;
  bs: BSData | null;
  ratios: FinancialRatio[];
  strengths: string[];
  weaknesses: string[];
  weaknessDetails: WeaknessDetail[];
  recommendations: string[];
  cashFlowWarning: string | null;
  industryComparison: IndustryComparison[];
}

export interface IndustryComparison {
  metric: string;
  companyValue: number;
  industryAvg: number;
  unit: string;
  verdict: string;
}

// PL自動計算
export function calculatePL(input: PLData): PLData {
  const grossProfit = input.revenue - input.cogs;
  const operatingProfit = grossProfit - input.sellingExpenses;
  const ordinaryProfit =
    operatingProfit + input.nonOperatingIncome - input.nonOperatingExpenses;
  const profitBeforeTax =
    ordinaryProfit + input.extraordinaryGains - input.extraordinaryLosses;
  const netProfit = profitBeforeTax - input.incomeTax;

  return {
    ...input,
    grossProfit,
    operatingProfit,
    ordinaryProfit,
    netProfit,
  };
}

// BS自動計算
export function calculateBS(input: BSData): BSData {
  const totalCurrentAssets =
    input.cashAndDeposits +
    input.accountsReceivable +
    input.inventory +
    input.otherCurrentAssets;
  const totalAssets = totalCurrentAssets + input.fixedAssets;
  const totalCurrentLiabilities =
    input.accountsPayable +
    input.shortTermLoans +
    input.otherCurrentLiabilities;
  const totalFixedLiabilities =
    input.longTermLoans + input.otherFixedLiabilities;
  const totalLiabilities = totalCurrentLiabilities + totalFixedLiabilities;
  const totalEquity = input.capital + input.retainedEarnings;

  return {
    ...input,
    totalAssets,
    totalLiabilities,
    totalEquity,
  };
}

// 財務指標の算出
export function calculateRatios(pl: PLData, bs: BSData | null): FinancialRatio[] {
  const ratios: FinancialRatio[] = [];

  // 収益性指標
  const grossMargin = ((pl.grossProfit || 0) / pl.revenue) * 100;
  ratios.push({
    name: "売上総利益率",
    value: Math.round(grossMargin * 10) / 10,
    unit: "%",
    benchmark: 40,
    status: grossMargin >= 40 ? "good" : grossMargin >= 25 ? "warning" : "danger",
    description: "売上に対する粗利の割合。業種平均は30-50%",
  });

  const operatingMargin = ((pl.operatingProfit || 0) / pl.revenue) * 100;
  ratios.push({
    name: "営業利益率",
    value: Math.round(operatingMargin * 10) / 10,
    unit: "%",
    benchmark: 5,
    status: operatingMargin >= 5 ? "good" : operatingMargin >= 2 ? "warning" : "danger",
    description: "本業の稼ぐ力。中小企業の目安は3-8%",
  });

  const ordinaryMargin = ((pl.ordinaryProfit || 0) / pl.revenue) * 100;
  ratios.push({
    name: "経常利益率",
    value: Math.round(ordinaryMargin * 10) / 10,
    unit: "%",
    benchmark: 4,
    status: ordinaryMargin >= 4 ? "good" : ordinaryMargin >= 1 ? "warning" : "danger",
    description: "財務活動を含めた総合的な収益力",
  });

  const sellingExpenseRatio = (pl.sellingExpenses / pl.revenue) * 100;
  ratios.push({
    name: "販管費率",
    value: Math.round(sellingExpenseRatio * 10) / 10,
    unit: "%",
    benchmark: 30,
    status: sellingExpenseRatio <= 30 ? "good" : sellingExpenseRatio <= 45 ? "warning" : "danger",
    description: "売上に対する販管費の割合。低いほど効率的",
  });

  if (bs) {
    // 安全性指標
    const currentAssets =
      bs.cashAndDeposits + bs.accountsReceivable + bs.inventory + bs.otherCurrentAssets;
    const currentLiabilities =
      bs.accountsPayable + bs.shortTermLoans + bs.otherCurrentLiabilities;

    if (currentLiabilities > 0) {
      const currentRatio = (currentAssets / currentLiabilities) * 100;
      ratios.push({
        name: "流動比率",
        value: Math.round(currentRatio),
        unit: "%",
        benchmark: 200,
        status: currentRatio >= 200 ? "good" : currentRatio >= 120 ? "warning" : "danger",
        description: "短期の支払い能力。200%以上が理想",
      });
    }

    const totalEquity = bs.capital + bs.retainedEarnings;
    const totalAssets = bs.totalAssets || currentAssets + bs.fixedAssets;
    if (totalAssets > 0) {
      const equityRatio = (totalEquity / totalAssets) * 100;
      ratios.push({
        name: "自己資本比率",
        value: Math.round(equityRatio * 10) / 10,
        unit: "%",
        benchmark: 40,
        status: equityRatio >= 40 ? "good" : equityRatio >= 20 ? "warning" : "danger",
        description: "財務の安定性。40%以上が望ましい",
      });

      // ROA
      const roa = ((pl.netProfit || 0) / totalAssets) * 100;
      ratios.push({
        name: "ROA（総資産利益率）",
        value: Math.round(roa * 10) / 10,
        unit: "%",
        benchmark: 5,
        status: roa >= 5 ? "good" : roa >= 2 ? "warning" : "danger",
        description: "資産をどれだけ効率的に活用しているか",
      });
    }

    if (totalEquity > 0) {
      const roe = ((pl.netProfit || 0) / totalEquity) * 100;
      ratios.push({
        name: "ROE（自己資本利益率）",
        value: Math.round(roe * 10) / 10,
        unit: "%",
        benchmark: 8,
        status: roe >= 8 ? "good" : roe >= 3 ? "warning" : "danger",
        description: "株主資本の収益効率。8%以上が目標",
      });
    }

    // 効率性
    if (pl.revenue > 0) {
      const receivableDays = (bs.accountsReceivable / pl.revenue) * 365;
      ratios.push({
        name: "売上債権回転日数",
        value: Math.round(receivableDays),
        unit: "日",
        benchmark: 60,
        status: receivableDays <= 60 ? "good" : receivableDays <= 90 ? "warning" : "danger",
        description: "売掛金の回収速度。短いほど良い",
      });

      if (pl.cogs > 0) {
        const inventoryDays = (bs.inventory / pl.cogs) * 365;
        ratios.push({
          name: "棚卸資産回転日数",
          value: Math.round(inventoryDays),
          unit: "日",
          benchmark: 30,
          status: inventoryDays <= 30 ? "good" : inventoryDays <= 60 ? "warning" : "danger",
          description: "在庫の回転速度。短いほど効率的",
        });
      }
    }
  }

  return ratios;
}

// AI分析レポート生成
export function generateFinancialAnalysis(
  pl: PLData,
  bs: BSData | null,
  industry: string
): FinancialAnalysisResult {
  const calculatedPL = calculatePL(pl);
  const calculatedBS = bs ? calculateBS(bs) : null;
  const ratios = calculateRatios(calculatedPL, calculatedBS);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const weaknessDetails: WeaknessDetail[] = [];
  const recommendations: string[] = [];

  // 収益性分析
  const grossMargin = (calculatedPL.grossProfit || 0) / calculatedPL.revenue;
  if (grossMargin >= 0.4) {
    strengths.push(`売上総利益率${(grossMargin * 100).toFixed(1)}%は高水準。商品・サービスの付加価値が高い`);
  } else if (grossMargin < 0.25) {
    const w = `売上総利益率${(grossMargin * 100).toFixed(1)}%は低水準。原価構造の見直しが必要`;
    weaknesses.push(w);
    recommendations.push("仕入先の見直し・交渉、または付加価値の高い商品へのシフトを検討");
    weaknessDetails.push({
      weakness: w,
      severity: grossMargin < 0.15 ? "high" : "medium",
      issues: [
        "売上に対する原価比率が高く、利幅が薄い状態",
        "価格競争に陥っている可能性がある",
        "仕入・外注コストの管理が不十分な恐れ",
        "付加価値の低い商品・サービス構成になっている可能性",
      ],
      improvements: [
        {
          action: "仕入先の複数社比較・価格交渉を実施",
          effect: "原価率を2〜5%改善し、粗利額を増加",
          difficulty: "easy",
          timeframe: "1〜3ヶ月",
        },
        {
          action: "高付加価値商品・サービスの開発・拡充",
          effect: "単価アップにより売上総利益率を根本的に改善",
          difficulty: "hard",
          timeframe: "6〜12ヶ月",
        },
        {
          action: "製造工程・サービス提供プロセスの効率化",
          effect: "原価の直接的な低減",
          difficulty: "medium",
          timeframe: "3〜6ヶ月",
        },
      ],
    });
  }

  const opMargin = (calculatedPL.operatingProfit || 0) / calculatedPL.revenue;
  if (opMargin >= 0.05) {
    strengths.push(`営業利益率${(opMargin * 100).toFixed(1)}%。本業での収益力がある`);
  } else if (opMargin < 0.02) {
    const w = `営業利益率${(opMargin * 100).toFixed(1)}%は低く、販管費の削減余地あり`;
    weaknesses.push(w);
    recommendations.push("販管費の内訳を分析し、固定費の見直し（特に地代家賃・人件費比率）を実施");
    weaknessDetails.push({
      weakness: w,
      severity: opMargin < 0 ? "high" : "medium",
      issues: [
        "本業の稼ぐ力が弱く、環境変化に脆弱",
        "販管費（人件費・家賃・広告費等）が売上規模に対して過大",
        "営業赤字に転落するリスクがある",
        "投資余力が乏しく、成長投資ができない状態",
      ],
      improvements: [
        {
          action: "販管費の費目別分析と固定費の見直し",
          effect: "不要コストの削減で営業利益率を1〜3%改善",
          difficulty: "easy",
          timeframe: "1〜2ヶ月",
        },
        {
          action: "業務プロセスのDX化（クラウド会計・RPA導入等）",
          effect: "事務コスト20〜30%削減が見込める",
          difficulty: "medium",
          timeframe: "3〜6ヶ月",
        },
        {
          action: "売上単価の引き上げ（値上げ・アップセル戦略）",
          effect: "売上増加により固定費負担率を軽減",
          difficulty: "medium",
          timeframe: "2〜4ヶ月",
        },
      ],
    });
  }

  // 販管費分析
  const sgaRatio = calculatedPL.sellingExpenses / calculatedPL.revenue;
  if (sgaRatio > 0.45) {
    const w = `販管費率${(sgaRatio * 100).toFixed(1)}%は高い。コスト構造の改善余地あり`;
    weaknesses.push(w);
    recommendations.push("業務のデジタル化（DX）による人件費・事務コストの削減を検討");
    weaknessDetails.push({
      weakness: w,
      severity: sgaRatio > 0.6 ? "high" : "medium",
      issues: [
        "人件費・賃料などの固定費が売上に対して重い",
        "広告宣伝費の費用対効果が不十分な可能性",
        "間接部門の業務効率が低い恐れ",
        "売上増加なしには利益確保が困難な構造",
      ],
      improvements: [
        {
          action: "人件費比率の分析と適正人員配置の検討",
          effect: "人件費を5〜15%最適化",
          difficulty: "medium",
          timeframe: "3〜6ヶ月",
        },
        {
          action: "広告費のROI分析と低効果施策の見直し",
          effect: "広告費の無駄を10〜30%削減",
          difficulty: "easy",
          timeframe: "1〜2ヶ月",
        },
        {
          action: "アウトソーシング・クラウドサービスの活用",
          effect: "固定費を変動費化しコスト柔軟性を向上",
          difficulty: "medium",
          timeframe: "2〜4ヶ月",
        },
      ],
    });
  }

  // BS分析
  if (calculatedBS) {
    const currentAssets =
      calculatedBS.cashAndDeposits +
      calculatedBS.accountsReceivable +
      calculatedBS.inventory +
      calculatedBS.otherCurrentAssets;
    const currentLiabilities =
      calculatedBS.accountsPayable +
      calculatedBS.shortTermLoans +
      calculatedBS.otherCurrentLiabilities;

    if (currentLiabilities > 0) {
      const currentRatio = currentAssets / currentLiabilities;
      if (currentRatio < 1.2) {
        const w = "流動比率が120%を下回り、短期的な資金繰りに注意が必要";
        weaknesses.push(w);
        recommendations.push("売掛金の早期回収、在庫の圧縮、または短期借入の借り換えを検討");
        weaknessDetails.push({
          weakness: w,
          severity: currentRatio < 1.0 ? "high" : "medium",
          issues: [
            "短期的な支払い能力が不十分で、資金ショートのリスク",
            "取引先への支払い遅延が発生する恐れ",
            "緊急の資金需要に対応できない可能性",
            "金融機関からの信用評価が低下する懸念",
          ],
          improvements: [
            {
              action: "売掛金の回収サイト短縮（請求書早期発行・督促強化）",
              effect: "現金化を早め流動比率を10〜20%改善",
              difficulty: "easy",
              timeframe: "1〜3ヶ月",
            },
            {
              action: "過剰在庫の処分・適正在庫管理の導入",
              effect: "在庫圧縮により現金を確保",
              difficulty: "medium",
              timeframe: "2〜4ヶ月",
            },
            {
              action: "短期借入金の長期借入への借り換え交渉",
              effect: "短期返済負担を軽減し流動比率を改善",
              difficulty: "medium",
              timeframe: "1〜3ヶ月",
            },
          ],
        });
      } else if (currentRatio >= 2.0) {
        strengths.push("流動比率200%以上で短期の安全性が高い");
      }
    }

    const totalAssets = calculatedBS.totalAssets || 1;
    const equityRatio =
      (calculatedBS.capital + calculatedBS.retainedEarnings) / totalAssets;
    if (equityRatio >= 0.4) {
      strengths.push(`自己資本比率${(equityRatio * 100).toFixed(1)}%で財務基盤が安定`);
    } else if (equityRatio < 0.2) {
      const w = "自己資本比率が20%未満で、財務リスクが高い";
      weaknesses.push(w);
      recommendations.push("利益の内部留保を優先し、自己資本の充実を図る");
      weaknessDetails.push({
        weakness: w,
        severity: equityRatio < 0.1 ? "high" : "medium",
        issues: [
          "借入依存度が高く、金利上昇時の影響が大きい",
          "債務超過に陥るリスクがある",
          "新規融資・取引先開拓時の信用力が不足",
          "経営の自由度が低く、戦略的な投資判断が制約される",
        ],
        improvements: [
          {
            action: "配当・役員報酬を抑制し利益の内部留保を優先",
            effect: "年間で自己資本比率を2〜5%改善",
            difficulty: "easy",
            timeframe: "1年〜",
          },
          {
            action: "遊休資産の売却による借入金返済",
            effect: "総資産圧縮と負債削減で比率を即時改善",
            difficulty: "medium",
            timeframe: "3〜6ヶ月",
          },
          {
            action: "増資や資本性ローン（劣後ローン）の活用",
            effect: "自己資本を直接的に増強",
            difficulty: "hard",
            timeframe: "3〜12ヶ月",
          },
        ],
      });
    }

    // 在庫分析
    if (calculatedBS.inventory > 0 && calculatedPL.cogs > 0) {
      const inventoryDays = (calculatedBS.inventory / calculatedPL.cogs) * 365;
      if (inventoryDays > 60) {
        const w = `棚卸資産回転日数${Math.round(inventoryDays)}日。在庫が過大な可能性`;
        weaknesses.push(w);
        recommendations.push("滞留在庫の処分と適正在庫水準の設定を推奨");
        weaknessDetails.push({
          weakness: w,
          severity: inventoryDays > 90 ? "high" : "medium",
          issues: [
            "在庫保管コスト（倉庫代・保険・管理人件費）が増大",
            "商品の陳腐化・劣化による評価損リスク",
            "運転資金が在庫に固定され、資金効率が悪化",
            "需要予測や発注管理が適切でない可能性",
          ],
          improvements: [
            {
              action: "滞留在庫の特定と処分セール・廃棄の実施",
              effect: "在庫を即時に圧縮し、現金を回収",
              difficulty: "easy",
              timeframe: "1〜2ヶ月",
            },
            {
              action: "発注点管理・ABC分析による在庫管理の高度化",
              effect: "適正在庫水準を維持し回転日数を30%短縮",
              difficulty: "medium",
              timeframe: "3〜6ヶ月",
            },
            {
              action: "需要予測システム・在庫管理ツールの導入",
              effect: "データに基づいた発注で過剰在庫を防止",
              difficulty: "hard",
              timeframe: "6〜12ヶ月",
            },
          ],
        });
      }
    }
  }

  // キャッシュフロー警告
  let cashFlowWarning: string | null = null;
  if (calculatedBS) {
    const monthlyExpenses =
      (calculatedPL.cogs + calculatedPL.sellingExpenses) / 12;
    const cashMonths = calculatedBS.cashAndDeposits / monthlyExpenses;
    if (cashMonths < 2) {
      cashFlowWarning = `現預金で約${cashMonths.toFixed(1)}ヶ月分の支出しかカバーできません。最低3ヶ月分の手元資金確保を推奨します。`;
    }
  }

  // 業種比較（簡易）
  const industryComparison = generateIndustryComparison(
    calculatedPL,
    calculatedBS,
    industry
  );

  // 一般的な改善提案
  if ((calculatedPL.netProfit || 0) > 0 && calculatedPL.revenue < 100000000) {
    recommendations.push("売上1億円未満の場合、IT導入補助金（最大450万円）や小規模事業者持続化補助金の活用を検討");
  }

  return {
    pl: calculatedPL,
    bs: calculatedBS,
    ratios,
    strengths,
    weaknesses,
    weaknessDetails,
    recommendations,
    cashFlowWarning,
    industryComparison,
  };
}

function generateIndustryComparison(
  pl: PLData,
  bs: BSData | null,
  industry: string
): IndustryComparison[] {
  // 業種別ベンチマーク（中小企業実態調査ベース）
  const benchmarks: Record<string, { grossMargin: number; opMargin: number; equityRatio: number }> = {
    "食品・飲食": { grossMargin: 60, opMargin: 3, equityRatio: 30 },
    "製造業": { grossMargin: 30, opMargin: 4, equityRatio: 40 },
    "小売・卸売": { grossMargin: 28, opMargin: 2, equityRatio: 35 },
    "サービス業": { grossMargin: 55, opMargin: 5, equityRatio: 35 },
    "建設・不動産": { grossMargin: 22, opMargin: 4, equityRatio: 30 },
    "IT・通信": { grossMargin: 50, opMargin: 8, equityRatio: 45 },
  };

  const bm = benchmarks[industry] || { grossMargin: 35, opMargin: 4, equityRatio: 35 };

  const comparisons: IndustryComparison[] = [];

  const companyGrossMargin = ((pl.grossProfit || 0) / pl.revenue) * 100;
  comparisons.push({
    metric: "売上総利益率",
    companyValue: Math.round(companyGrossMargin * 10) / 10,
    industryAvg: bm.grossMargin,
    unit: "%",
    verdict: companyGrossMargin >= bm.grossMargin ? "業界平均以上" : "業界平均以下",
  });

  const companyOpMargin = ((pl.operatingProfit || 0) / pl.revenue) * 100;
  comparisons.push({
    metric: "営業利益率",
    companyValue: Math.round(companyOpMargin * 10) / 10,
    industryAvg: bm.opMargin,
    unit: "%",
    verdict: companyOpMargin >= bm.opMargin ? "業界平均以上" : "業界平均以下",
  });

  if (bs) {
    const totalAssets = bs.totalAssets || 1;
    const companyEquity =
      ((bs.capital + bs.retainedEarnings) / totalAssets) * 100;
    comparisons.push({
      metric: "自己資本比率",
      companyValue: Math.round(companyEquity * 10) / 10,
      industryAvg: bm.equityRatio,
      unit: "%",
      verdict: companyEquity >= bm.equityRatio ? "業界平均以上" : "業界平均以下",
    });
  }

  return comparisons;
}
