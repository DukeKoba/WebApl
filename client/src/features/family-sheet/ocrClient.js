// テスト版OCR: ブラウザ内で完結する無料OCR(Tesseract.js)。
// 画像は端末から一切出ず、サーバー費用もAPIキーも不要。精度は簡易(=ベータ)で、
// 読み取れた文字を手がかりに項目を自動入力し、利用者が確認・修正する前提。
// 有料版では サーバーの Claude Vision(/api/family-sheet/extract) に切り替える。
import { emptyPolicy, CATEGORIES } from './schema';

// 複数画像を1つのworkerで順にOCR。Tesseractは重い(数MB)ので、この画面で初めて動的読み込みする。
// worker/コア/言語データは既定でCDN(jsdelivr・tessdata)から取得しブラウザにキャッシュされる。
export async function runOcr(files, onProgress) {
  const { createWorker } = await import('tesseract.js');
  let idx = 0;
  const worker = await createWorker('jpn', 1, {
    // 進捗は「(処理済み枚数 + 現在画像の進捗) / 全枚数」で全体割合に換算
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) onProgress((idx + m.progress) / files.length);
    },
  });
  try {
    const texts = [];
    for (idx = 0; idx < files.length; idx++) {
      const { data } = await worker.recognize(files[idx]);
      texts.push(data?.text || '');
    }
    return texts;
  } finally {
    await worker.terminate();
  }
}

// ---- 以下、読み取り文字から項目を推定するヒューリスティック ----

const toHalf = (s) => s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
  .replace(/[，]/g, ',').replace(/[－―ー‐]/g, '-');

// 主要保険会社(部分一致)。辞書外でも「○○生命/海上/共済」等は総称パターンで拾う。
const INSURERS = [
  '日本生命', '第一生命', '明治安田生命', '住友生命', 'かんぽ生命', 'ソニー生命', 'アクサ生命',
  'プルデンシャル生命', 'メットライフ生命', 'オリックス生命', 'アフラック', 'ジブラルタ生命',
  '朝日生命', '富国生命', '大同生命', '太陽生命', 'FWD生命', 'なないろ生命', 'ネオファースト生命',
  'ライフネット生命', 'チューリッヒ', '東京海上日動', '損保ジャパン', '三井住友海上',
  'あいおいニッセイ同和', '共栄火災', 'AIG損保', 'セコム損保', 'ソニー損保', 'SBI損保',
  '県民共済', '都民共済', '府民共済', 'コープ共済', 'こくみん共済', '全労済', 'JA共済', 'CO・OP共済',
];
const INSURER_GENERIC = /([一-龥ぁ-んァ-ヶー゠-ヿA-Za-z]{2,12}(?:生命保険|生命|海上日動|海上火災|損害保険|損保|火災海上|共済|少額短期))/;

const CATEGORY_HINTS = [
  [/(がん|癌|悪性新生物)/, 'がん保険'],
  [/(医療|入院|手術給付)/, '医療保険'],
  [/(介護)/, '介護保険'],
  [/(学資|こども|子ども|育英)/, '学資保険'],
  [/(個人年金|年金保険)/, '個人年金'],
  [/(終身保険|定期保険|収入保障|死亡保険|生命保険)/, '生命保険(死亡)'],
  [/(地震)/, '地震保険'],
  [/(火災|住宅総合|家財)/, '火災保険'],
  [/(自動車|自賠責|ドライバー)/, '自動車保険'],
  [/(傷害|障害保険|レジャー)/, '傷害保険'],
];

function pick(re, text) {
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

// 1画像分のテキスト → Policyの部分項目
export function parseOcrPolicy(text) {
  const raw = text || '';
  const flat = toHalf(raw.replace(/\s+/g, ' '));

  // 保険会社
  let insurerName = INSURERS.find((n) => raw.includes(n)) || '';
  if (!insurerName) insurerName = pick(INSURER_GENERIC, raw);

  // 種類
  let category = '';
  for (const [re, cat] of CATEGORY_HINTS) { if (re.test(raw)) { category = cat; break; } }

  // 証券番号(見出しの後ろの英数字列)
  const policyNumber = pick(
    /(?:証券(?:記号)?番号|保険証券番号|証券No\.?|証券Ｎｏ|Policy\s*No\.?)[\s:：]*([A-Za-z0-9\-]{4,})/i,
    toHalf(raw),
  );

  // 電話(0120優先、なければ一般の固定/フリーダイヤル形)
  const tel0120 = pick(/(0120[-\s]?\d{2,4}[-\s]?\d{2,4})/, flat);
  const telAny = tel0120 || pick(/(0\d{1,3}[-\s]?\d{1,4}[-\s]?\d{3,4})/, flat);
  const phone = telAny ? telAny.replace(/\s/g, '-').replace(/-+/g, '-') : '';

  // 保障額(「○○万円」を最初に拾う。日額表現も拾う)
  const amountMan = pick(/([0-9,]{1,}\s*万円)/, flat);
  const amountNichi = pick(/(日額[\s:：]?[0-9,]{1,}\s*円)/, flat);
  const amount = [amountNichi, amountMan].filter(Boolean).join(' / ');

  // 保険料(月額/年額の円)
  const premium = pick(/((?:月[額払]|年[額払]|保険料)[\s:：]?[0-9,]{1,}\s*円)/, flat);

  return {
    insurerName, category: CATEGORIES.includes(category) ? category : '',
    policyNumber, phone, amount, premium,
  };
}

// OCRテキスト配列 → Policy配列 + 警告。読めた原文は ocrRaw に保持(印刷されない)。
export function ocrToPolicies(texts) {
  const policies = texts
    .map((t) => ({ t, p: parseOcrPolicy(t) }))
    .filter(({ t }) => t && t.trim().length > 0)
    .map(({ t, p }) => ({
      ...emptyPolicy(),
      ...p,
      confidence: 'low',
      ocrRaw: t.trim().slice(0, 1500),
    }));
  const warnings = policies.length
    ? ['ブラウザ内の簡易読み取り（ベータ）です。会社名・金額・証券番号は、必ずお手元の証券と見くらべて直してください。']
    : [];
  return { policies, warnings };
}
