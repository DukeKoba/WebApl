// X (Twitter) の文字数カウント。
// X は全ての文字を1文字として数えない。日本語（ひらがな・カタカナ・漢字）と絵文字は
// 2カウント、ラテン文字などは1カウントになる。URLは長さに関係なく一律23カウント。
// https://developer.x.com/en/docs/counting-characters
//
// 以前は .length をそのまま使っていたため、日本語の投稿が「180/280」と表示されたまま
// 実際には280を超えており、X APIが403で弾く（＝投稿失敗）状態になっていた。

// このコードポイント範囲だけが1カウント。それ以外は全て2カウント。
const WEIGHT_ONE_RANGES = [
  [0, 4351],
  [8192, 8205],
  [8208, 8223],
  [8242, 8247],
];

const URL_WEIGHT = 23;
const URL_REGEX = /https?:\/\/[^\s　]+/g;

function codePointWeight(cp) {
  for (const [lo, hi] of WEIGHT_ONE_RANGES) {
    if (cp >= lo && cp <= hi) return 1;
  }
  return 2;
}

/** X が数える重み付き文字数を返す（URLは1本につき23）。 */
export function xLength(text) {
  if (!text) return 0;
  // URLは長さを問わず23カウントなので、23カウント分のASCII文字に置換してから数える
  const normalized = text.replace(URL_REGEX, 'x'.repeat(URL_WEIGHT));
  let total = 0;
  for (const ch of normalized) {
    total += codePointWeight(ch.codePointAt(0));
  }
  return total;
}

/** 残り何カウント使えるか。 */
export function xRemaining(text, limit = 280) {
  return limit - xLength(text);
}

const SENTENCE_ENDS = ['\n', '。', '！', '？', '!', '?', '．'];

/**
 * 重み付き文字数で limit 以内に収まるよう末尾を落とす。
 * 文の途中でぶつ切りにすると日本語が壊れて投稿の質が落ちるので、
 * 収まる範囲の最後の文末（。！？改行）まで戻す。戻しすぎる場合だけハードカットする。
 */
export function xTruncate(text, limit) {
  if (!text) return '';
  if (xLength(text) <= limit) return text;

  // limit に収まる最長の接頭辞を探す（URLを跨いで切らないよう1文字ずつ積む）
  const chars = Array.from(text);
  let weight = 0;
  let cut = 0;
  for (let i = 0; i < chars.length; i++) {
    weight += codePointWeight(chars[i].codePointAt(0));
    if (weight > limit) break;
    cut = i + 1;
  }
  const hard = chars.slice(0, cut).join('');

  // 文末まで巻き戻す。ただし本文の6割を切るほど短くなるなら諦めてハードカット。
  let best = -1;
  for (const mark of SENTENCE_ENDS) {
    best = Math.max(best, hard.lastIndexOf(mark));
  }
  if (best >= 0 && xLength(hard.slice(0, best + 1)) >= limit * 0.6) {
    return hard.slice(0, best + 1).trimEnd();
  }
  return hard.trimEnd();
}
