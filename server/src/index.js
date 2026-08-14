import 'dotenv/config';
// sharp/librsvg が fontconfig を初期化する前に FONTCONFIG_FILE を立てたいので、
// 他のローカルモジュールより先に読み込む(import時に同期で設定される)。
import { assertJpFontAvailable, fontsConfigured, FONT_DIR } from './fonts.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import orgRoutes from './routes/organizations.js';
import memberRoutes from './routes/members.js';
import scheduleRoutes from './routes/schedules.js';
import shiftRoutes from './routes/shifts.js';
import absenceRoutes from './routes/absences.js';
import templateRoutes from './routes/templates.js';
import analyticsRoutes from './routes/analytics.js';
import eikenRoutes from './routes/eiken.js';
import ramenRoutes from './routes/ramen.js';
import aieduRoutes from './routes/aiedu.js';
import itpassRoutes from './routes/itpass.js';
import agentdxRoutes from './routes/agentdx.js';
import igAnalyticsRoutes from './routes/instagramAnalytics.js';
import familySheetRoutes from './routes/familySheet.js';
import authRoutes, { getToken } from './routes/auth.js';
import { rateLimit } from './rateLimit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded ramen photos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Auth
app.use('/api/auth', authRoutes);

// 公開ツール(認証不要): 家族共有シートのOCR。必ず /api 認証ミドルウェアより前に置く。
// 認証がない＝誰でも外部AIのAPIを叩けてしまうため、レート制限を必ず噛ませる。
app.use('/api/family-sheet', rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: '読み取りの実行回数が上限に達しました。1時間ほど空けて再度お試しください。',
}), familySheetRoutes);

// Auth middleware
app.use('/api', (req, res, next) => {
  const expected = getToken();
  // APP_PASSWORD 未設定時は getToken() が null。その場合は全て拒否する(fail-closed)
  if (!expected) return res.status(503).json({ error: 'サーバー側の認証設定が未完了です。' });
  const token = req.headers['x-auth-token'];
  if (token !== expected) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

// ShiftSync API routes
app.use('/api/organizations', orgRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/analytics', analyticsRoutes);

// SNS poster API routes
app.use('/api/eiken', eikenRoutes);
app.use('/api/ramen', ramenRoutes);
app.use('/api/aiedu', aieduRoutes);
app.use('/api/itpass', itpassRoutes);
app.use('/api/agentdx', agentdxRoutes);
app.use('/api/instagram', igAnalyticsRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, async () => {
  console.log(`API running on http://localhost:${PORT}`);

  // 日本語フォントの実描画チェック。NGなら画像生成APIは503を返す(豆腐画像の投稿防止)。
  const fontOk = await assertJpFontAvailable();
  if (fontOk) {
    console.log('[fonts] 日本語フォント OK（画像生成を有効化）');
  } else {
    console.error(
      '[fonts] 日本語フォントを検出できませんでした。カード画像の生成を停止します。\n' +
      `        ${FONT_DIR} に Noto Sans JP (.otf/.ttf) を配置して再起動してください。\n` +
      `        (同梱フォントの読み込み: ${fontsConfigured ? '成功' : '未検出'})`
    );
  }
});
