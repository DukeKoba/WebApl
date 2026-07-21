// 経路B: 外部AIプロンプト方式(運営APIキー不要)。
// ユーザーがこのプロンプトをコピー→Claude.ai/ChatGPTに証券写真とともに貼る→
// 返ってきたJSONをアプリに貼り戻す。抽出はユーザー自身の無料AIアカウントで行う。

export const EXTRACT_PROMPT = `あなたは保険証券の読み取りアシスタントです。これから送る画像(保険証券・契約内容通知・保険会社マイページの画面など)から、記載されている情報だけを抽出してください。

ルール:
1. 画像に書かれている情報のみを抽出する。推測や一般知識で補完しない。
2. 読み取れない・不鮮明な項目は null にし、warnings に「◯◯が読み取れませんでした」と書く。
3. 金額・日付は原文の表記のまま(例:「1,000万円」「令和6年4月1日」「終身」)。
4. 複数の契約が写っている場合は policies に契約ごとに分ける。同一契約の複数ページは1つにまとめる。
5. 保険の良し悪しの評価、見直しの提案、他商品との比較は絶対に出力しない。
6. 出力は下記JSONだけを、コードブロック(\`\`\`json)で囲んで返す。前後に説明文を書かない。

出力するJSONの形式:
\`\`\`json
{
  "policies": [
    {
      "insurerName": "保険会社名",
      "productName": "商品名・愛称",
      "category": "生命保険(死亡)/医療保険/がん保険/介護保険/個人年金/学資保険/火災保険/地震保険/自動車保険/傷害保険/その他 のいずれか",
      "policyNumber": "証券番号 または null",
      "insured": "被保険者氏名 または null",
      "beneficiaries": [{ "name": "受取人氏名", "relation": "続柄 または null", "share": "受取割合 例:100% または null" }],
      "coverages": [{ "name": "保障の名前 例:死亡保険金/入院給付金日額", "amount": "金額 例:1,000万円/日額5,000円 または null", "note": null }],
      "premium": { "amount": "保険料 例:月額8,540円 または null", "frequency": "月払/半年払/年払/一時払 または null", "method": "払込方法 例:口座振替 または null", "paidUpDate": "払込満了 例:2035年6月/終身 または null" },
      "contractDate": "契約日 または null",
      "maturityDate": "満期・保険期間 例:終身/2040-06-30 または null",
      "contact": { "phone": "保険会社/代理店の電話 または null", "agency": "取扱代理店名 または null" },
      "confidence": "high/medium/low(不鮮明・推測を含むなら low)"
    }
  ],
  "warnings": ["読み取れなかった項目や不鮮明箇所をここに列挙"]
}
\`\`\``;

// AIの回答テキストからJSONを寛容に取り出す。
// (1) ```json フェンス → (2) 最初の { から最後の } → (3) JSON.parse
export function parseAiResponse(text) {
  if (!text || !text.trim()) return { ok: false, error: 'テキストが空です。' };
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : sliceBraces(text);
  if (!candidate) return { ok: false, error: 'JSONが見つかりませんでした。' };
  try {
    const data = JSON.parse(candidate.trim());
    if (!data || !Array.isArray(data.policies)) {
      return { ok: false, error: 'policies が見つかりませんでした。' };
    }
    return { ok: true, data };
  } catch {
    // フェンスの中身が壊れている場合、素の波括弧抽出でもう一度試す
    const alt = sliceBraces(text);
    if (alt && alt !== candidate) {
      try {
        const data = JSON.parse(alt.trim());
        if (data && Array.isArray(data.policies)) return { ok: true, data };
      } catch { /* fallthrough */ }
    }
    return { ok: false, error: 'JSONの形式が正しくありませんでした。' };
  }
}

function sliceBraces(text) {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}
