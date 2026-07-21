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

export async function searchRecentPosts(query, maxResults = 20) {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    const error = new Error('X_BEARER_TOKENが未設定です。Xの検索画面を利用してください。');
    error.code = 'X_SEARCH_NOT_CONFIGURED';
    throw error;
  }

  const params = new URLSearchParams({
    query,
    max_results: String(Math.max(10, Math.min(Number(maxResults) || 20, 100))),
    sort_order: 'relevancy',
    expansions: 'author_id,attachments.media_keys',
    'tweet.fields': 'created_at,public_metrics,entities,attachments',
    'user.fields': 'name,username,profile_image_url,verified',
    'media.fields': 'url,preview_image_url,type',
  });
  const response = await fetch(`https://api.x.com/2/tweets/search/recent?${params}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail || body.title || body.errors?.[0]?.message || 'Xの投稿検索に失敗しました。');
  }

  const users = new Map((body.includes?.users || []).map(user => [user.id, user]));
  const media = new Map((body.includes?.media || []).map(item => [item.media_key, item]));
  return (body.data || []).map(post => {
    const author = users.get(post.author_id) || {};
    const mediaItem = post.attachments?.media_keys?.map(key => media.get(key)).find(Boolean);
    return {
      id: post.id,
      text: post.text,
      created_at: post.created_at,
      metrics: post.public_metrics || {},
      author: {
        name: author.name || '',
        username: author.username || '',
        profile_image_url: author.profile_image_url || '',
        verified: Boolean(author.verified),
      },
      media_url: mediaItem?.url || mediaItem?.preview_image_url || null,
      url: `https://x.com/${author.username || 'i'}/status/${post.id}`,
    };
  });
}

export async function repostPost(postId) {
  if (!/^\d{1,19}$/.test(String(postId))) throw new Error('投稿IDが不正です。');
  const client = getClient();
  const me = await client.v2.me();
  return client.v2.retweet(me.data.id, String(postId));
}
