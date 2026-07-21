// X（Twitter）の加重文字数カウント（twitter-text 準拠）。
// 標準（Premium認証なし）アカウントの投稿上限は「加重280文字」。
// 日本語・絵文字・全角記号などは1文字=2、Latin系の一部レンジは1、URLは常に23として数える。
// 認証なしで確実に投稿できる文字数に収めるための基準として使う。

export const X_MAX_WEIGHTED = 280;

const URL_RE = /https?:\/\/\S+/g;

// twitter-text のデフォルト weight=1 レンジ（それ以外は weight=2）
function isWeightOne(cp) {
  return (
    (cp >= 0x0000 && cp <= 0x10ff) ||
    (cp >= 0x2000 && cp <= 0x200d) ||
    (cp >= 0x2010 && cp <= 0x201f) ||
    (cp >= 0x2032 && cp <= 0x2037)
  );
}

// 加重文字数（Xの実際の投稿カウントに一致）
export function xWeightedLength(text) {
  if (!text) return 0;
  const urls = text.match(URL_RE) || [];
  const stripped = text.replace(URL_RE, '');
  let weight = urls.length * 23;
  for (const ch of stripped) {
    weight += isWeightOne(ch.codePointAt(0)) ? 1 : 2;
  }
  return weight;
}

// 末尾を削って加重長を budget 以下に収める
export function trimToWeighted(text, budget) {
  if (xWeightedLength(text) <= budget) return text;
  const chars = Array.from(text);
  while (chars.length && xWeightedLength(chars.join('')) > budget) chars.pop();
  return chars.join('').trimEnd();
}

// 固定文（プレフィックス・サフィックス）を除いた本文に使える加重予算から、
// 生成AIに提示する「実文字数」の目安を返す。日本語は2倍で数えられるため /2 で安全側に寄せる。
export function actualCharBudget(weightedBudget) {
  return Math.max(20, Math.floor(weightedBudget / 2));
}
