/**
 * 依存を増やさない最小のレート制限（インメモリ・IP単位の固定ウィンドウ）。
 *
 * 公開エンドポイント（認証なし）が外部AIのAPIを叩く場合、
 * 無制限だと第三者に課金を焼かれるため必ず噛ませる。
 * プロセス内に閉じているため、インスタンスが複数になったら Redis 等に置き換えること。
 */
export function rateLimit({ windowMs = 60 * 60 * 1000, max = 10, message } = {}) {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const hits = new Map();

  // 期限切れエントリの掃除（メモリ肥大の防止）。ウィンドウごとに1回。
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  // 掃除タイマーだけでプロセスを生かし続けない
  if (typeof sweep.unref === 'function') sweep.unref();

  return function rateLimitMiddleware(req, res, next) {
    // プロキシ配下（Render）では X-Forwarded-For の先頭が実クライアント
    const forwarded = req.headers['x-forwarded-for'];
    const key = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '')
      || req.ip
      || req.socket?.remoteAddress
      || 'unknown';

    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: message || 'リクエストが多すぎます。しばらく待ってから再度お試しください。',
      });
    }

    entry.count += 1;
    next();
  };
}
