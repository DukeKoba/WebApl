// 保険の家族共有シート — データモデル(単一の真実)
// 45号スキーマの実装版。金額・日付は文字列で保持(計算しない=業法対策の記録専用)。

export const SCHEMA_VERSION = 1;

export const CATEGORIES = [
  '生命保険(死亡)',
  '医療保険',
  'がん保険',
  '介護保険',
  '個人年金',
  '学資保険',
  '火災保険',
  '地震保険',
  '自動車保険',
  '傷害保険',
  'その他',
  '不明',
];

export function emptyPolicy() {
  return {
    id: crypto.randomUUID(),
    insurerName: '',   // 保険会社名
    productName: '',   // 商品名
    category: '',      // 種類(CATEGORIES)
    policyNumber: '',  // 証券番号
    insured: '',       // 被保険者(保険がかけられている人)
    beneficiary: '',   // 受取人
    amount: '',        // 保障額(例: 300万円 / 入院日額5,000円)
    premium: '',       // 保険料(例: 月額8,540円)
    maturity: '',      // 満期・保険期間(例: 終身 / 2040年6月)
    phone: '',         // 保険会社・代理店の連絡先
    location: '',      // 証券の保管場所
    memo: '',          // 補足メモ(特約など)
    confidence: '',    // AI読取時: high/medium/low(手入力は空)
    confirmedAt: '',   // 確認日(ISO日付)
  };
}

export function emptyContact() {
  return { id: crypto.randomUUID(), name: '', relation: '', phone: '' };
}

export function emptySheet() {
  return {
    schemaVersion: SCHEMA_VERSION,
    owner: { name: '' },       // 作成者(任意)
    policies: [],
    contacts: [],
    agencyContact: '',         // 担当の保険屋さん(任意)
    message: '',               // 家族へのひとこと
    createdAt: '',
    updatedAt: '',
  };
}

// AI抽出結果(45号スキーマ)→ 内部Policyへ正規化。未知項目は落とし、memoに畳む。
export function normalizeExtracted(raw) {
  const policies = Array.isArray(raw?.policies) ? raw.policies : [];
  const warnings = Array.isArray(raw?.warnings) ? raw.warnings : [];
  return {
    warnings,
    policies: policies.map((p) => {
      const base = emptyPolicy();
      const coverages = Array.isArray(p?.coverages) ? p.coverages : [];
      const mainCoverage = coverages[0] || {};
      const extraCoverages = coverages.slice(1)
        .map((c) => [c?.name, c?.amount].filter(Boolean).join(' '))
        .filter(Boolean);
      const beneficiaries = Array.isArray(p?.beneficiaries) ? p.beneficiaries : [];
      const bName = beneficiaries
        .map((b) => [b?.name, b?.relation && `(${b.relation})`, b?.share].filter(Boolean).join(''))
        .filter(Boolean).join('、');
      const premium = p?.premium || {};
      const premiumStr = [premium.amount, premium.method && `・${premium.method}`]
        .filter(Boolean).join('');
      const memoParts = [
        ...extraCoverages.map((c) => `特約等: ${c}`),
        premium.paidUpDate ? `払込満了: ${premium.paidUpDate}` : '',
        p?.contractDate ? `契約日: ${p.contractDate}` : '',
        p?.contact?.agency ? `取扱代理店: ${p.contact.agency}` : '',
      ].filter(Boolean);
      return {
        ...base,
        insurerName: str(p?.insurerName),
        productName: str(p?.productName),
        category: CATEGORIES.includes(p?.category) ? p.category : (p?.category ? 'その他' : ''),
        policyNumber: str(p?.policyNumber),
        insured: str(p?.insured),
        beneficiary: bName,
        amount: [str(mainCoverage.name), str(mainCoverage.amount)].filter(Boolean).join(' '),
        premium: premiumStr,
        maturity: str(p?.maturityDate),
        phone: str(p?.contact?.phone),
        memo: memoParts.join(' / '),
        confidence: ['high', 'medium', 'low'].includes(p?.confidence) ? p.confidence : '',
      };
    }),
  };
}

function str(v) {
  return v == null ? '' : String(v).trim();
}

// 表示・印刷用の1行サマリー
export function policySummary(p) {
  return [p.insurerName, p.productName].filter(Boolean).join(' ') || '(未入力の保険)';
}
