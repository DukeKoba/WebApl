import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * サーバー側SVG→PNG(sharp/librsvg)で日本語を描くためのフォント設定。
 *
 * 背景: `Hiragino Sans` は macOS 専用、`Noto Sans JP` は Render の Node ランタイムに
 * 含まれない。どちらも解決できないと fontconfig は CJK グリフを持たない
 * DejaVu Sans にフォールバックし、**日本語が全て豆腐(□)になる**。
 * ローカル(mac)では正常に見えるため、本番だけ壊れて発覚しにくい。
 *
 * 対策は2段構え:
 *  1. リポジトリ同梱フォント(server/assets/fonts)を fontconfig に認識させる
 *  2. 起動時に実描画で検証し、駄目なら画像生成APIを止める(豆腐画像の投稿を防ぐ)
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts');

// 複数語のファミリ名は引用符が必要(裸の `Hiragino Sans` は librsvg でパースが不安定)
export const JP_FONT = '"Noto Sans JP", "Hiragino Sans", sans-serif';

/**
 * fonts.conf を生成して FONTCONFIG_FILE を設定する。
 * fontconfig は絶対パスを要求し環境変数展開もしないため、起動時に実パスで書き出す。
 *
 * このモジュールの import 時に同期実行される。sharp が fontconfig を初期化する前に
 * 環境変数を立てたいので、index.js では**最初に**このモジュールを import すること。
 */
function initFontsSync() {
  try {
    if (!fs.existsSync(FONT_DIR)) return false;
    const fontFiles = fs.readdirSync(FONT_DIR).filter(f => /\.(otf|ttf|ttc|otc)$/i.test(f));
    if (fontFiles.length === 0) return false;

    const cacheDir = path.join(os.tmpdir(), 'cocreo-fc-cache');
    const confDir = path.join(os.tmpdir(), 'cocreo-fc');
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.mkdirSync(confDir, { recursive: true });

    const confPath = path.join(confDir, 'fonts.conf');
    fs.writeFileSync(confPath, `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONT_DIR}</dir>
  <cachedir>${cacheDir}</cachedir>
  <!-- 総称ファミリからも同梱フォントに解決させる -->
  <match target="pattern">
    <test name="family"><string>sans-serif</string></test>
    <edit name="family" mode="prepend" binding="strong"><string>Noto Sans JP</string></edit>
  </match>
</fontconfig>
`);
    process.env.FONTCONFIG_FILE = confPath;
    return true;
  } catch (err) {
    console.error('[fonts] fonts.conf の生成に失敗しました:', err.message);
    return false;
  }
}

export const fontsConfigured = initFontsSync();

let jpFontAvailable = false;

export function isJpFontAvailable() {
  return jpFontAvailable;
}

export function setJpFontAvailable(value) {
  jpFontAvailable = Boolean(value);
}

/**
 * 実際に文字を描画して日本語フォントの有無を判定する。
 *
 * 「非空ピクセルがあるか」だけでは検出できない: フォント欠落時は
 * 「あ」も「漢」も**同一の豆腐(□)**として描かれ、どちらも非空になるため。
 * そこで2文字を描き比べ、(1)十分に描画されている (2)互いに異なる の両方を要求する。
 */
export async function assertJpFontAvailable() {
  try {
    const { default: sharp } = await import('sharp');

    const draw = (ch) => sharp(Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">` +
      `<rect width="64" height="64" fill="#fff"/>` +
      // JP_FONT 自体が二重引用符を含むため、属性は単引用符で囲む（XMLパースエラー防止）
      `<text x="4" y="52" font-family='${JP_FONT}' font-size="48" fill="#000">${ch}</text>` +
      `</svg>`
    )).greyscale().raw().toBuffer();

    const [a, kanji] = await Promise.all([draw('あ'), draw('漢')]);
    const inked = buf => buf.reduce((n, v) => n + (v < 128 ? 1 : 0), 0);

    // 50px以上のインクがあり、かつ2文字の描画結果が異なること
    const ok = inked(a) > 50 && inked(kanji) > 50 && Buffer.compare(a, kanji) !== 0;
    setJpFontAvailable(ok);
    return ok;
  } catch (err) {
    console.error('[fonts] 日本語フォントの検証に失敗しました:', err.message);
    setJpFontAvailable(false);
    return false;
  }
}
