// X（Twitter）の加重文字数カウント（twitter-text 準拠）。
// 標準（Premium認証なし）アカウントの投稿上限は「加重280」。
// 日本語・絵文字・全角記号は1文字=2、Latin系の一部レンジは1、URLは常に23として数える。
// サーバー側 server/src/services/xText.js と同一ロジック。

export const X_MAX_WEIGHTED = 280;

const URL_RE = /https?:\/\/\S+/g;

function isWeightOne(cp) {
  return (
    (cp >= 0x0000 && cp <= 0x10ff) ||
    (cp >= 0x2000 && cp <= 0x200d) ||
    (cp >= 0x2010 && cp <= 0x201f) ||
    (cp >= 0x2032 && cp <= 0x2037)
  );
}

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
