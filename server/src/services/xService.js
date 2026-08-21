import { TwitterApi } from 'twitter-api-v2';

function getClient() {
  return new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  });
}

/**
 * ツイートを投稿する。replyToId を渡すとそのツイートへのリプライになる。
 * quoteTweetId を渡すとそのツイートの引用ポストになる。
 */
export async function postTweet(text, { replyToId, quoteTweetId } = {}) {
  const client = getClient();
  const payload = { text };
  if (replyToId) payload.reply = { in_reply_to_tweet_id: replyToId };
  if (quoteTweetId) payload.quote_tweet_id = quoteTweetId;
  const result = await client.v2.tweet(payload);
  return result.data;
}

export async function checkConnection() {
  const client = getClient();
  const me = await client.v2.me();
  return me.data;
}
