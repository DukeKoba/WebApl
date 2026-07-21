import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import Anthropic from '@anthropic-ai/sdk';

// 家族共有シート — 公開エンドポイント(認証不要)。index.js の /api 認証ミドルウェアより前にマウントする。
// 45号 §7.3 設計: 画像はメモリ上でのみ処理し、ディスク保存も外部保管もしない(プライバシーバイデザイン)。
// APIキー未設定時は AI_DISABLED を返し、クライアントは 経路B(外部AI貼り付け)にフォールバックする。
const router = express.Router();

function hasKey() {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY);
}

let clientInstance = null;
function getClient() {
  if (!clientInstance) {
    clientInstance = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY });
  }
  return clientInstance;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

// 抽出スキーマ(45号)。金額・日付は文字列で保持(計算しない=記録専用・業法対策)。
const EXTRACT_INSTRUCTION = `あなたは保険証券・保険会社マイページ画面の読み取りアシスタントです。
添付された画像から、保険契約の情報を正確に読み取り、JSONで返してください。

【厳守】
- 画像に実際に書かれている内容だけを抽出する。推測で数字・制度名・特約を補わない。
- 読み取れない項目は空文字("")または省略する。曖昧なものは confidence を "low" にする。
- 診断・比較・おすすめ・保障の過不足評価などは一切しない(記録のみ)。
- 1枚に複数契約があれば policies を複数返す。別々の画像は別契約として扱ってよい。

【出力(このJSONのみ。前後に説明文を書かない)】
{
  "policies": [
    {
      "insurerName": "保険会社名",
      "productName": "商品名",
      "category": "生命保険(死亡)|医療保険|がん保険|介護保険|個人年金|学資保険|火災保険|地震保険|自動車保険|傷害保険|その他|不明",
      "policyNumber": "証券番号",
      "insured": "被保険者名",
      "beneficiaries": [{ "name": "受取人名", "relation": "続柄", "share": "割合(あれば)" }],
      "coverages": [{ "name": "保障名(例: 死亡保険金/入院日額)", "amount": "金額(例: 1,000万円/5,000円)", "note": null }],
      "premium": { "amount": "保険料(例: 月額8,540円)", "frequency": "月払/年払など", "method": "支払方法", "paidUpDate": "払込満了" },
      "contractDate": "契約日",
      "maturityDate": "満期・保険期間(例: 終身/2040年6月)",
      "contact": { "phone": "保険会社・代理店の電話番号", "agency": "取扱代理店名" },
      "confidence": "high|medium|low"
    }
  ],
  "warnings": ["読み取りに自信がない点があれば日本語で列挙"]
}`;

router.get('/config', (_req, res) => {
  res.json({ aiEnabled: hasKey() });
});

router.post('/extract', upload.array('images', 4), async (req, res) => {
  if (!hasKey()) {
    // キー未設定: クライアントは経路B(貼り付け方式)に切り替える
    return res.json({ ok: false, code: 'AI_DISABLED' });
  }
  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ ok: false, code: 'NO_IMAGE', message: '画像が添付されていません' });
  }

  try {
    // メモリ上でリサイズ + EXIF除去(位置情報等を送らない)。長辺2000pxに抑えトークン節約。
    const imageBlocks = [];
    for (const f of files) {
      const jpeg = await sharp(f.buffer)
        .rotate() // EXIF向き情報を反映してから
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer(); // sharp はデフォルトでメタデータを落とす(EXIF除去)
      imageBlocks.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: jpeg.toString('base64') },
      });
    }

    const model = process.env.FAMILY_SHEET_MODEL || 'claude-opus-4-8';
    const response = await getClient().messages.create({
      model,
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: [...imageBlocks, { type: 'text', text: EXTRACT_INSTRUCTION }],
      }],
    });

    const text = (response.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.json({ ok: false, code: 'PARSE_FAILED', message: 'AIの応答を解釈できませんでした' });
    }
    let data;
    try {
      data = JSON.parse(jsonMatch[0]);
    } catch {
      return res.json({ ok: false, code: 'PARSE_FAILED', message: 'AIの応答を解釈できませんでした' });
    }
    const policies = Array.isArray(data.policies) ? data.policies : [];
    const warnings = Array.isArray(data.warnings) ? data.warnings : [];
    return res.json({ ok: true, policies, warnings });
  } catch (err) {
    console.error('[family-sheet/extract]', err?.message || err);
    return res.status(502).json({ ok: false, code: 'AI_ERROR', message: '読み取り中にエラーが発生しました。時間をおいてお試しください。' });
  }
});

export default router;
