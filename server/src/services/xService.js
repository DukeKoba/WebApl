import { TwitterApi } from 'twitter-api-v2';

function getClient() {
  return new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  });
}

// data URL ("data:image/png;base64,....") または生base64を Buffer + mimeType に変換
function decodeImageInput(image) {
  if (!image) return null;
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s.exec(image);
  const mimeType = m ? m[1] : 'image/png';
  const b64 = m ? m[2] : image;
  const buffer = Buffer.from(b64, 'base64');
  if (buffer.length === 0) return null;
  return { buffer, mimeType };
}

export async function postTweet(text, { replyToId, image } = {}) {
  const client = getClient();

  const payload = { text };
  if (replyToId) payload.reply = { in_reply_to_tweet_id: replyToId };

  const decoded = decodeImageInput(image);
  if (decoded) {
    const mediaId = await client.v1.uploadMedia(decoded.buffer, { mimeType: decoded.mimeType });
    payload.media = { media_ids: [mediaId] };
  }

  const result = await client.v2.tweet(payload);
  return result.data;
}

export async function checkConnection() {
  const client = getClient();
  const me = await client.v2.me();
  return me.data;
}
