import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// パスワードは環境変数からのみ受け取る。
// 以前はここに固定値のフォールバックがあり、公開リポジトリに平文で残っていたため
// URLを知っていれば誰でも認証を通過できる状態だった。フォールバックは廃止する。
const APP_PASSWORD = process.env.APP_PASSWORD || null;

if (!APP_PASSWORD) {
  // ここでプロセスを落とすと公開ツール(家族共有シート等)まで巻き添えで停止するため、
  // サーバーは起動させたうえで「認証が必要なAPIは全て拒否」= fail-closed に倒す。
  console.error(
    '[auth] APP_PASSWORD が未設定です。認証が必要なAPIは全て401を返します。' +
    ' Render の環境変数に APP_PASSWORD を設定してください。'
  );
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * 認証トークン。APP_PASSWORD 未設定時は null を返し、
 * 呼び出し側(認証ミドルウェア)が全リクエストを拒否できるようにする。
 */
function getToken() {
  return APP_PASSWORD ? sha256(APP_PASSWORD) : null;
}

/** 長さの違いで早期リターンしないよう、ハッシュ同士を固定長で比較する */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(sha256(a), 'hex');
  const bufB = Buffer.from(sha256(b), 'hex');
  return crypto.timingSafeEqual(bufA, bufB);
}

router.post('/login', (req, res) => {
  if (!APP_PASSWORD) {
    return res.status(503).json({ error: 'サーバー側の認証設定が未完了です。' });
  }
  const { password } = req.body;
  if (typeof password === 'string' && safeEqual(password, APP_PASSWORD)) {
    res.json({ token: getToken() });
  } else {
    res.status(401).json({ error: 'パスワードが違います' });
  }
});

export { getToken, safeEqual };
export default router;
