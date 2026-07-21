/**
 * 5業種ペルソナデータモジュール
 * 各業種の経営者ペルソナと全診断ツール用のシナリオデータを定義
 */

import { PricePassThroughInput } from "./sme-challenges";
import { WageCapacityInput } from "./sme-challenges";
import { SuccessionInput } from "./sme-challenges";
import { ManagementPowerInput } from "./sme-challenges";
import { PLData, BSData } from "./financial-analysis";

// ペルソナ定義
export interface Persona {
  id: string;
  name: string;           // 経営者名（架空）
  companyName: string;     // 会社名（架空）
  industry: string;        // 業種
  industryKey: string;     // 業種キー（財務分析用）
  region: string;          // 地域
  prefecture: string;      // 都道府県
  employeeCount: number;
  annualRevenue: string;   // 表示用
  description: string;     // ペルソナ概要
  challenges: string[];    // 主な経営課題
  icon: string;            // アイコン絵文字
  color: string;           // テーマカラー

  // 各診断ツール用入力データ
  wageCapacity: WageCapacityInput;
  pricePassThrough: PricePassThroughInput;
  financial: { pl: PLData; bs: BSData };
  succession: SuccessionInput;
  managementPower: ManagementPowerInput;
}

export const personas: Persona[] = [
  // ============================
  // 1. 食品・飲食業
  // ============================
  {
    id: "food-beverage",
    name: "田中 美咲",
    companyName: "田中食品工房",
    industry: "食品・飲食",
    industryKey: "食品・飲食",
    region: "関東",
    prefecture: "埼玉県",
    employeeCount: 12,
    annualRevenue: "6,000万円",
    description:
      "地元の老舗漬物・惣菜メーカー。創業40年、2代目経営者。原材料高騰と人手不足で利益が圧迫されている。EC展開を検討中だが、デジタル化が遅れている。",
    challenges: [
      "原材料費の高騰（前年比12%増）",
      "パート従業員の確保が困難",
      "EC販路の開拓が進まない",
      "後継者が未定",
    ],
    icon: "🍱",
    color: "#ea580c",

    wageCapacity: {
      annualRevenue: 60000000,
      operatingProfit: 2400000,
      totalLaborCost: 21600000,
      employeeCount: 12,
      currentAvgWage: 3200000,
      targetRaiseRate: 4.0,
      pricePassThroughPlan: 80,
      productivityGainPlan: 50,
    },

    pricePassThrough: {
      currentRevenue: 60000000,
      materialCostRatio: 42,
      laborCostRatio: 28,
      costIncreaseRate: 12,
      currentPassThroughRate: 35,
      targetPassThroughRate: 70,
      mainCustomerType: "both",
    },

    financial: {
      pl: {
        period: "2025年度",
        revenue: 60000000,
        cogs: 36000000,
        sellingExpenses: 20000000,
        nonOperatingIncome: 100000,
        nonOperatingExpenses: 800000,
        extraordinaryGains: 0,
        extraordinaryLosses: 0,
        incomeTax: 900000,
      },
      bs: {
        period: "2025年度",
        cashAndDeposits: 6000000,
        accountsReceivable: 5000000,
        inventory: 4500000,
        otherCurrentAssets: 500000,
        fixedAssets: 18000000,
        accountsPayable: 4000000,
        shortTermLoans: 3000000,
        otherCurrentLiabilities: 1500000,
        longTermLoans: 12000000,
        otherFixedLiabilities: 500000,
        capital: 5000000,
        retainedEarnings: 8000000,
      },
    },

    succession: {
      ownerAge: 58,
      hasSuccessor: false,
      successorType: "undecided",
      yearsToPlannedRetirement: 7,
      hasWrittenPlan: false,
      hasStartedTransition: false,
      keyPersonDependency: "high",
      financialHealth: "fair",
      employeeCount: 12,
      hasIntellectualProperty: false,
      businessValuationDone: false,
    },

    managementPower: {
      networkActivity: 2 as 1 | 2 | 3 | 4 | 5,
      learningHabit: 2 as 1 | 2 | 3 | 4 | 5,
      digitalLiteracy: 1 as 1 | 2 | 3 | 4 | 5,
      riskTolerance: 2 as 1 | 2 | 3 | 4 | 5,
      hasBusinessPlan: false,
      planExecutionRate: 2 as 1 | 2 | 3 | 4 | 5,
      pricingStrategy: 2 as 1 | 2 | 3 | 4 | 5,
      differentiationLevel: 3 as 1 | 2 | 3 | 4 | 5,
      investmentInDX: 1 as 1 | 2 | 3 | 4 | 5,
      missionSharing: 3 as 1 | 2 | 3 | 4 | 5,
      infoTransparency: 2 as 1 | 2 | 3 | 4 | 5,
      psychologicalSafety: 3 as 1 | 2 | 3 | 4 | 5,
      talentDevelopment: 2 as 1 | 2 | 3 | 4 | 5,
      wageCompetitiveness: 2 as 1 | 2 | 3 | 4 | 5,
    },
  },

  // ============================
  // 2. 製造業
  // ============================
  {
    id: "manufacturing",
    name: "鈴木 一郎",
    companyName: "鈴木精密工業",
    industry: "製造業",
    industryKey: "製造業",
    region: "中部",
    prefecture: "愛知県",
    employeeCount: 35,
    annualRevenue: "2億5,000万円",
    description:
      "自動車部品の精密加工メーカー。創業55年、3代目。EV化の波で主力製品の需要減少が見込まれ、新分野への転換が急務。技術力は高いが、営業力が弱い。",
    challenges: [
      "EV化による主力製品の需要減",
      "新規顧客開拓が不十分",
      "熟練工の高齢化と技術伝承",
      "3代目への事業承継が進行中",
    ],
    icon: "🏭",
    color: "#2563eb",

    wageCapacity: {
      annualRevenue: 250000000,
      operatingProfit: 12500000,
      totalLaborCost: 98000000,
      employeeCount: 35,
      currentAvgWage: 4200000,
      targetRaiseRate: 5.0,
      pricePassThroughPlan: 200,
      productivityGainPlan: 150,
    },

    pricePassThrough: {
      currentRevenue: 250000000,
      materialCostRatio: 38,
      laborCostRatio: 32,
      costIncreaseRate: 8,
      currentPassThroughRate: 55,
      targetPassThroughRate: 80,
      mainCustomerType: "BtoB",
    },

    financial: {
      pl: {
        period: "2025年度",
        revenue: 250000000,
        cogs: 175000000,
        sellingExpenses: 55000000,
        nonOperatingIncome: 500000,
        nonOperatingExpenses: 3500000,
        extraordinaryGains: 0,
        extraordinaryLosses: 2000000,
        incomeTax: 4500000,
      },
      bs: {
        period: "2025年度",
        cashAndDeposits: 25000000,
        accountsReceivable: 30000000,
        inventory: 18000000,
        otherCurrentAssets: 2000000,
        fixedAssets: 80000000,
        accountsPayable: 15000000,
        shortTermLoans: 10000000,
        otherCurrentLiabilities: 5000000,
        longTermLoans: 45000000,
        otherFixedLiabilities: 5000000,
        capital: 30000000,
        retainedEarnings: 45000000,
      },
    },

    succession: {
      ownerAge: 68,
      hasSuccessor: true,
      successorType: "family",
      yearsToPlannedRetirement: 3,
      hasWrittenPlan: true,
      hasStartedTransition: true,
      keyPersonDependency: "medium",
      financialHealth: "fair",
      employeeCount: 35,
      hasIntellectualProperty: true,
      businessValuationDone: true,
    },

    managementPower: {
      networkActivity: 3 as 1 | 2 | 3 | 4 | 5,
      learningHabit: 3 as 1 | 2 | 3 | 4 | 5,
      digitalLiteracy: 3 as 1 | 2 | 3 | 4 | 5,
      riskTolerance: 3 as 1 | 2 | 3 | 4 | 5,
      hasBusinessPlan: true,
      planExecutionRate: 3 as 1 | 2 | 3 | 4 | 5,
      pricingStrategy: 3 as 1 | 2 | 3 | 4 | 5,
      differentiationLevel: 4 as 1 | 2 | 3 | 4 | 5,
      investmentInDX: 3 as 1 | 2 | 3 | 4 | 5,
      missionSharing: 4 as 1 | 2 | 3 | 4 | 5,
      infoTransparency: 3 as 1 | 2 | 3 | 4 | 5,
      psychologicalSafety: 3 as 1 | 2 | 3 | 4 | 5,
      talentDevelopment: 3 as 1 | 2 | 3 | 4 | 5,
      wageCompetitiveness: 3 as 1 | 2 | 3 | 4 | 5,
    },
  },

  // ============================
  // 3. 小売・卸売業
  // ============================
  {
    id: "retail",
    name: "佐藤 恵子",
    companyName: "佐藤商事",
    industry: "小売・卸売",
    industryKey: "小売・卸売",
    region: "関西",
    prefecture: "大阪府",
    employeeCount: 8,
    annualRevenue: "4,500万円",
    description:
      "地域密着型の雑貨・日用品卸売業。創業30年。大手ECとの価格競争が激化し売上が減少傾向。独自セレクト力と対面接客力が強みだが、顧客高齢化が課題。",
    challenges: [
      "EC大手との価格競争",
      "顧客層の高齢化",
      "在庫管理の非効率",
      "後継者不在で廃業も視野",
    ],
    icon: "🏪",
    color: "#16a34a",

    wageCapacity: {
      annualRevenue: 45000000,
      operatingProfit: 1350000,
      totalLaborCost: 14400000,
      employeeCount: 8,
      currentAvgWage: 3000000,
      targetRaiseRate: 3.5,
      pricePassThroughPlan: 30,
      productivityGainPlan: 20,
    },

    pricePassThrough: {
      currentRevenue: 45000000,
      materialCostRatio: 55,
      laborCostRatio: 25,
      costIncreaseRate: 10,
      currentPassThroughRate: 30,
      targetPassThroughRate: 65,
      mainCustomerType: "BtoC",
    },

    financial: {
      pl: {
        period: "2025年度",
        revenue: 45000000,
        cogs: 31500000,
        sellingExpenses: 11500000,
        nonOperatingIncome: 50000,
        nonOperatingExpenses: 600000,
        extraordinaryGains: 0,
        extraordinaryLosses: 0,
        incomeTax: 400000,
      },
      bs: {
        period: "2025年度",
        cashAndDeposits: 3500000,
        accountsReceivable: 3000000,
        inventory: 6000000,
        otherCurrentAssets: 300000,
        fixedAssets: 8000000,
        accountsPayable: 4500000,
        shortTermLoans: 2000000,
        otherCurrentLiabilities: 800000,
        longTermLoans: 5000000,
        otherFixedLiabilities: 500000,
        capital: 3000000,
        retainedEarnings: 5000000,
      },
    },

    succession: {
      ownerAge: 63,
      hasSuccessor: false,
      successorType: "undecided",
      yearsToPlannedRetirement: 5,
      hasWrittenPlan: false,
      hasStartedTransition: false,
      keyPersonDependency: "high",
      financialHealth: "poor",
      employeeCount: 8,
      hasIntellectualProperty: false,
      businessValuationDone: false,
    },

    managementPower: {
      networkActivity: 2 as 1 | 2 | 3 | 4 | 5,
      learningHabit: 2 as 1 | 2 | 3 | 4 | 5,
      digitalLiteracy: 2 as 1 | 2 | 3 | 4 | 5,
      riskTolerance: 1 as 1 | 2 | 3 | 4 | 5,
      hasBusinessPlan: false,
      planExecutionRate: 2 as 1 | 2 | 3 | 4 | 5,
      pricingStrategy: 2 as 1 | 2 | 3 | 4 | 5,
      differentiationLevel: 3 as 1 | 2 | 3 | 4 | 5,
      investmentInDX: 1 as 1 | 2 | 3 | 4 | 5,
      missionSharing: 3 as 1 | 2 | 3 | 4 | 5,
      infoTransparency: 2 as 1 | 2 | 3 | 4 | 5,
      psychologicalSafety: 4 as 1 | 2 | 3 | 4 | 5,
      talentDevelopment: 1 as 1 | 2 | 3 | 4 | 5,
      wageCompetitiveness: 1 as 1 | 2 | 3 | 4 | 5,
    },
  },

  // ============================
  // 4. IT・通信業
  // ============================
  {
    id: "it-telecom",
    name: "山田 大輝",
    companyName: "テックブリッジ",
    industry: "IT・通信",
    industryKey: "IT・通信",
    region: "関東",
    prefecture: "東京都",
    employeeCount: 20,
    annualRevenue: "1億8,000万円",
    description:
      "受託開発中心のIT企業。創業12年。SES依存の収益構造から自社SaaS製品への転換を目指す。人材の流動性が高く、採用コストが経営を圧迫。",
    challenges: [
      "SES依存からの脱却",
      "エンジニア採用コストの増大",
      "自社SaaS開発リソースの不足",
      "プロジェクト管理の属人化",
    ],
    icon: "💻",
    color: "#7c3aed",

    wageCapacity: {
      annualRevenue: 180000000,
      operatingProfit: 14400000,
      totalLaborCost: 108000000,
      employeeCount: 20,
      currentAvgWage: 5200000,
      targetRaiseRate: 5.5,
      pricePassThroughPlan: 300,
      productivityGainPlan: 200,
    },

    pricePassThrough: {
      currentRevenue: 180000000,
      materialCostRatio: 5,
      laborCostRatio: 55,
      costIncreaseRate: 6,
      currentPassThroughRate: 60,
      targetPassThroughRate: 85,
      mainCustomerType: "BtoB",
    },

    financial: {
      pl: {
        period: "2025年度",
        revenue: 180000000,
        cogs: 90000000,
        sellingExpenses: 68000000,
        nonOperatingIncome: 300000,
        nonOperatingExpenses: 1200000,
        extraordinaryGains: 500000,
        extraordinaryLosses: 0,
        incomeTax: 6500000,
      },
      bs: {
        period: "2025年度",
        cashAndDeposits: 30000000,
        accountsReceivable: 20000000,
        inventory: 0,
        otherCurrentAssets: 3000000,
        fixedAssets: 12000000,
        accountsPayable: 8000000,
        shortTermLoans: 5000000,
        otherCurrentLiabilities: 4000000,
        longTermLoans: 8000000,
        otherFixedLiabilities: 2000000,
        capital: 10000000,
        retainedEarnings: 28000000,
      },
    },

    succession: {
      ownerAge: 45,
      hasSuccessor: false,
      successorType: "undecided",
      yearsToPlannedRetirement: 20,
      hasWrittenPlan: false,
      hasStartedTransition: false,
      keyPersonDependency: "medium",
      financialHealth: "good",
      employeeCount: 20,
      hasIntellectualProperty: true,
      businessValuationDone: false,
    },

    managementPower: {
      networkActivity: 4 as 1 | 2 | 3 | 4 | 5,
      learningHabit: 5 as 1 | 2 | 3 | 4 | 5,
      digitalLiteracy: 5 as 1 | 2 | 3 | 4 | 5,
      riskTolerance: 4 as 1 | 2 | 3 | 4 | 5,
      hasBusinessPlan: true,
      planExecutionRate: 4 as 1 | 2 | 3 | 4 | 5,
      pricingStrategy: 3 as 1 | 2 | 3 | 4 | 5,
      differentiationLevel: 3 as 1 | 2 | 3 | 4 | 5,
      investmentInDX: 5 as 1 | 2 | 3 | 4 | 5,
      missionSharing: 4 as 1 | 2 | 3 | 4 | 5,
      infoTransparency: 4 as 1 | 2 | 3 | 4 | 5,
      psychologicalSafety: 4 as 1 | 2 | 3 | 4 | 5,
      talentDevelopment: 3 as 1 | 2 | 3 | 4 | 5,
      wageCompetitiveness: 4 as 1 | 2 | 3 | 4 | 5,
    },
  },

  // ============================
  // 5. 建設・不動産業
  // ============================
  {
    id: "construction",
    name: "高橋 健二",
    companyName: "高橋建設",
    industry: "建設・不動産",
    industryKey: "建設・不動産",
    region: "東北",
    prefecture: "宮城県",
    employeeCount: 25,
    annualRevenue: "3億円",
    description:
      "地域密着型の総合建設会社。創業50年、2代目。公共工事依存の収益構造からの脱却が課題。2024年問題（残業規制）への対応と、若手採用が急務。",
    challenges: [
      "2024年問題（残業規制）対応",
      "公共工事依存からの脱却",
      "若手人材の確保と育成",
      "代表の高齢化と承継準備",
    ],
    icon: "🏗️",
    color: "#ca8a04",

    wageCapacity: {
      annualRevenue: 300000000,
      operatingProfit: 12000000,
      totalLaborCost: 105000000,
      employeeCount: 25,
      currentAvgWage: 4500000,
      targetRaiseRate: 4.5,
      pricePassThroughPlan: 250,
      productivityGainPlan: 100,
    },

    pricePassThrough: {
      currentRevenue: 300000000,
      materialCostRatio: 40,
      laborCostRatio: 30,
      costIncreaseRate: 9,
      currentPassThroughRate: 45,
      targetPassThroughRate: 75,
      mainCustomerType: "BtoB",
    },

    financial: {
      pl: {
        period: "2025年度",
        revenue: 300000000,
        cogs: 234000000,
        sellingExpenses: 48000000,
        nonOperatingIncome: 200000,
        nonOperatingExpenses: 4000000,
        extraordinaryGains: 0,
        extraordinaryLosses: 1000000,
        incomeTax: 3600000,
      },
      bs: {
        period: "2025年度",
        cashAndDeposits: 20000000,
        accountsReceivable: 40000000,
        inventory: 5000000,
        otherCurrentAssets: 3000000,
        fixedAssets: 65000000,
        accountsPayable: 25000000,
        shortTermLoans: 15000000,
        otherCurrentLiabilities: 8000000,
        longTermLoans: 40000000,
        otherFixedLiabilities: 5000000,
        capital: 15000000,
        retainedEarnings: 25000000,
      },
    },

    succession: {
      ownerAge: 72,
      hasSuccessor: true,
      successorType: "employee",
      yearsToPlannedRetirement: 2,
      hasWrittenPlan: false,
      hasStartedTransition: true,
      keyPersonDependency: "high",
      financialHealth: "fair",
      employeeCount: 25,
      hasIntellectualProperty: false,
      businessValuationDone: false,
    },

    managementPower: {
      networkActivity: 3 as 1 | 2 | 3 | 4 | 5,
      learningHabit: 2 as 1 | 2 | 3 | 4 | 5,
      digitalLiteracy: 2 as 1 | 2 | 3 | 4 | 5,
      riskTolerance: 2 as 1 | 2 | 3 | 4 | 5,
      hasBusinessPlan: false,
      planExecutionRate: 2 as 1 | 2 | 3 | 4 | 5,
      pricingStrategy: 2 as 1 | 2 | 3 | 4 | 5,
      differentiationLevel: 2 as 1 | 2 | 3 | 4 | 5,
      investmentInDX: 2 as 1 | 2 | 3 | 4 | 5,
      missionSharing: 3 as 1 | 2 | 3 | 4 | 5,
      infoTransparency: 2 as 1 | 2 | 3 | 4 | 5,
      psychologicalSafety: 3 as 1 | 2 | 3 | 4 | 5,
      talentDevelopment: 2 as 1 | 2 | 3 | 4 | 5,
      wageCompetitiveness: 3 as 1 | 2 | 3 | 4 | 5,
    },
  },
];
