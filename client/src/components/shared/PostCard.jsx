import React, { useEffect, useImperativeHandle, useRef, forwardRef, useCallback } from 'react';

/**
 * 投稿本文からブランド統一されたクイズ/Tipsカード画像を生成する（ブラウザcanvasで描画）。
 * 日本語・絵文字はユーザーのブラウザフォントで描画されるため確実に表示される。
 *
 * ref.getDataURL() で PNG の data URL を取得できる（X投稿への添付・ダウンロードに使用）。
 *
 * props:
 *  - text: 投稿本文（固定文・ハッシュタグ込みでよい。内部でカード用に整形する）
 *  - tag: バッジに出す文字列（例: "英検2級 語彙クイズ"）
 *  - kind: 'post' | 'reply'（reply は解答カード用のスタイル）
 *  - appLabel: 右上・フッターのアプリ名（例: "AI英検Pass"）
 */

const W = 1200;
const H = 675;

// 全角丸数字 → 選択肢の行判定
const CHOICE_RE = /^\s*([①②③④⑤A-Da-d1-5][\.．)）]?)\s*(.+)$/;

function parsePost(text) {
  const raw = String(text || '').replace(/\r/g, '');
  const lines = raw.split('\n').map(l => l.trim());

  let countdown = null;
  const kept = [];
  for (const line of lines) {
    if (!line) { kept.push(''); continue; }
    // カウントダウン固定文
    const cd = line.match(/1次試験まであと\s*(\d+)\s*日/);
    if (cd) { countdown = `あと${cd[1]}日`; continue; }
    // ハッシュタグ行・アプリリンク行はカードから除外
    if (/^#/.test(line)) continue;
    if (/https?:\/\//.test(line)) continue;
    if (/^📲/.test(line)) continue;
    kept.push(line);
  }

  // 連続空行を1つに畳む
  const body = [];
  for (const l of kept) {
    if (l === '' && body[body.length - 1] === '') continue;
    body.push(l);
  }
  while (body.length && body[0] === '') body.shift();
  while (body.length && body[body.length - 1] === '') body.pop();

  const headline = body.shift() || '';
  // 締め行（答えはリプ欄）はフッターに回す
  let closer = null;
  if (body.length && /答えはリプ|答えは下|リプ欄|コメント欄/.test(body[body.length - 1])) {
    closer = body.pop();
  }

  const choices = [];
  const rest = [];
  for (const l of body) {
    if (l === '') { rest.push(l); continue; }
    const m = l.match(CHOICE_RE);
    if (m && m[2].length <= 40) choices.push(l);
    else rest.push(l);
  }
  while (rest.length && rest[0] === '') rest.shift();
  while (rest.length && rest[rest.length - 1] === '') rest.pop();

  return { headline, bodyLines: rest, choices, countdown, closer };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 幅内で折り返して行配列を返す（日本語は文字単位、英語は単語単位で折る）
function wrap(ctx, text, maxW) {
  const out = [];
  let line = '';
  const pushTest = (candidate) => ctx.measureText(candidate).width <= maxW;
  const tokens = text.split(/(\s+)/);
  for (const tok of tokens) {
    if (pushTest(line + tok)) { line += tok; continue; }
    // 単語単体でも溢れる場合は文字単位で割る
    if (ctx.measureText(tok).width > maxW) {
      for (const ch of tok) {
        if (pushTest(line + ch)) line += ch;
        else { if (line) out.push(line); line = ch; }
      }
    } else {
      if (line) out.push(line.replace(/\s+$/, ''));
      line = tok.replace(/^\s+/, '');
    }
  }
  if (line.trim()) out.push(line.replace(/\s+$/, ''));
  return out;
}

function draw(canvas, { text, tag, kind, appLabel }) {
  const ctx = canvas.getContext('2d');
  const { headline, bodyLines, choices, countdown, closer } = parsePost(text);
  const isReply = kind === 'reply';

  // 背景グラデーション（英検アプリ=グリーン系）
  const bg = ctx.createLinearGradient(0, 0, W, H);
  if (isReply) { bg.addColorStop(0, '#0f766e'); bg.addColorStop(1, '#065f46'); }
  else { bg.addColorStop(0, '#047857'); bg.addColorStop(1, '#064e3b'); }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 白パネル
  const M = 44;
  roundRect(ctx, M, M, W - M * 2, H - M * 2, 36);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  const padX = M + 56;
  const contentW = W - padX * 2;
  let y = M + 78;

  ctx.textBaseline = 'alphabetic';

  // ── ヘッダー行: タグバッジ ＋ カウントダウン ＋ アプリ名 ──
  ctx.font = '600 30px "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
  const badgeText = tag || '英検';
  const bw = ctx.measureText(badgeText).width + 40;
  roundRect(ctx, padX, y - 34, bw, 48, 24);
  ctx.fillStyle = isReply ? '#0d9488' : '#059669';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(badgeText, padX + 20, y);

  let hx = padX + bw + 16;
  if (countdown) {
    ctx.font = '700 28px "Hiragino Sans", "Noto Sans JP", sans-serif';
    const cw = ctx.measureText('📅 ' + countdown).width + 36;
    roundRect(ctx, hx, y - 34, cw, 48, 24);
    ctx.fillStyle = '#fef3c7';
    ctx.fill();
    ctx.fillStyle = '#b45309';
    ctx.fillText('📅 ' + countdown, hx + 18, y);
  }

  // 右上アプリ名
  ctx.font = '700 28px "Hiragino Sans", "Noto Sans JP", sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.textAlign = 'right';
  ctx.fillText(appLabel || 'AI英検Pass', W - padX, y);
  ctx.textAlign = 'left';

  y += 62;

  // ── 見出し ──
  let headSize = 54;
  ctx.fillStyle = isReply ? '#0f766e' : '#111827';
  const fitHead = (size) => {
    ctx.font = `800 ${size}px "Hiragino Sans", "Noto Sans JP", sans-serif`;
    return wrap(ctx, headline, contentW);
  };
  let headLines = fitHead(headSize);
  while (headLines.length > 2 && headSize > 38) { headSize -= 4; headLines = fitHead(headSize); }
  for (const l of headLines) { y += headSize + 6; ctx.fillText(l, padX, y); }

  y += 34;

  // 区切り線
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(W - padX, y);
  ctx.stroke();
  y += 20;

  // ── 本文（問題文 / Tips本文 / 解答解説） ──
  const bodyBottomLimit = H - M - 96;
  let bodySize = choices.length ? 38 : 40;
  ctx.fillStyle = '#1f2937';
  const bodyText = bodyLines.join('\n');
  const renderBody = (size) => {
    ctx.font = `600 ${size}px "Hiragino Sans", "Noto Sans JP", sans-serif`;
    const ls = [];
    for (const para of bodyText.split('\n')) {
      if (para === '') { ls.push(''); continue; }
      for (const wl of wrap(ctx, para, contentW)) ls.push(wl);
    }
    return ls;
  };
  let bodyRendered = renderBody(bodySize);
  // 選択肢の高さも見込んで、溢れるなら本文を縮める
  const choiceBlockH = choices.length ? Math.ceil(choices.length / 2) * 74 + 20 : 0;
  const lineH = () => bodySize + 14;
  while (
    y + bodyRendered.length * lineH() + choiceBlockH > bodyBottomLimit &&
    bodySize > 26
  ) { bodySize -= 2; bodyRendered = renderBody(bodySize); }

  for (const l of bodyRendered) {
    y += lineH();
    if (y > bodyBottomLimit) break;
    ctx.fillText(l, padX, y);
  }

  // ── 選択肢（2列のピル） ──
  if (choices.length) {
    y += 26;
    const gap = 20;
    const colW = (contentW - gap) / 2;
    ctx.font = '700 34px "Hiragino Sans", "Noto Sans JP", sans-serif';
    choices.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = padX + col * (colW + gap);
      const cy = y + row * 74;
      roundRect(ctx, cx, cy - 6, colW, 60, 16);
      ctx.fillStyle = '#f3f4f6';
      ctx.fill();
      ctx.fillStyle = '#065f46';
      // 長すぎる選択肢は縮小
      let cs = 34;
      let label = c;
      ctx.font = `700 ${cs}px "Hiragino Sans", "Noto Sans JP", sans-serif`;
      while (ctx.measureText(label).width > colW - 32 && cs > 22) {
        cs -= 2; ctx.font = `700 ${cs}px "Hiragino Sans", "Noto Sans JP", sans-serif`;
      }
      ctx.fillText(label, cx + 18, cy + 34);
    });
    y += Math.ceil(choices.length / 2) * 74;
  }

  // ── フッター（締め行 / アプリ導線） ──
  ctx.font = '700 30px "Hiragino Sans", "Noto Sans JP", sans-serif';
  ctx.fillStyle = isReply ? '#0d9488' : '#059669';
  let footer;
  if (isReply) footer = `📲 ${appLabel || 'AI英検Pass'}で続けて演習`;
  else if (choices.length) footer = closer || '答えはリプ欄で👇'; // クイズのみ
  else footer = `📲 ${appLabel || 'AI英検Pass'}`; // Tips/価値提供はアプリ導線
  ctx.fillText(footer, padX, H - M - 40);
}

const PostCard = forwardRef(function PostCard({ text, tag, kind = 'post', appLabel }, ref) {
  const canvasRef = useRef(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    try { draw(canvas, { text, tag, kind, appLabel }); } catch { /* noop */ }
  }, [text, tag, kind, appLabel]);

  useEffect(() => { redraw(); }, [redraw]);

  useImperativeHandle(ref, () => ({
    getDataURL: () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL('image/png');
    },
  }), []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-auto rounded-xl border border-gray-200"
      style={{ aspectRatio: `${W} / ${H}` }}
    />
  );
});

export default PostCard;
