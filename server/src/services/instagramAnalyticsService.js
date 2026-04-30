import { generateTextFull } from './claudeService.js';

const IG_API_BASE = 'https://graph.instagram.com/v21.0';

export async function fetchRecentPosts(accessToken, limit = 20) {
  const fields = 'id,caption,like_count,comments_count,timestamp,media_type,media_url,thumbnail_url,permalink';
  const res = await fetch(
    `${IG_API_BASE}/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to fetch Instagram posts');
  }
  const data = await res.json();
  return data.data || [];
}

export async function fetchProfile(accessToken) {
  const fields = 'id,username,followers_count,media_count';
  const res = await fetch(
    `${IG_API_BASE}/me?fields=${fields}&access_token=${accessToken}`
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to fetch Instagram profile');
  }
  return res.json();
}

export function calcEngagement(post, followersCount) {
  const likes = post.like_count || 0;
  const comments = post.comments_count || 0;
  const total = likes + comments;
  const rate = followersCount > 0 ? ((total / followersCount) * 100).toFixed(2) : '0.00';
  return { likes, comments, total, rate: parseFloat(rate) };
}

export async function analyzeWithClaude(profile, posts) {
  const postsData = posts.slice(0, 10).map(p => ({
    caption: p.caption?.slice(0, 200) || '(キャプションなし)',
    likes: p.like_count || 0,
    comments: p.comments_count || 0,
    engagement_rate: calcEngagement(p, profile.followers_count || 1).rate,
    date: p.timestamp,
    type: p.media_type,
  }));

  const avgEngagement = postsData.length > 0
    ? (postsData.reduce((sum, p) => sum + p.engagement_rate, 0) / postsData.length).toFixed(2)
    : 0;

  const topPost = [...postsData].sort((a, b) => b.engagement_rate - a.engagement_rate)[0];

  const prompt = `InstagramアカウントのデータをAIが分析します。

## アカウント情報
- ユーザー名: @${profile.username}
- フォロワー数: ${profile.followers_count?.toLocaleString() || '不明'}
- 投稿数: ${profile.media_count || '不明'}
- 直近10投稿の平均エンゲージメント率: ${avgEngagement}%

## 直近の投稿データ
${JSON.stringify(postsData, null, 2)}

## 分析リクエスト
以下を日本語で分析・提案してください：

1. **エンゲージメント評価**（現在の${avgEngagement}%は良い/普通/要改善？）
2. **パフォーマンスが良い投稿の特徴**（最高エンゲージメント: ${topPost?.engagement_rate}%）
3. **キャプションの改善点**（具体的に3点）
4. **ハッシュタグ戦略の提案**（現在のキャプションから分析）
5. **今後の投稿で試すべきこと**（具体的なアクション3点）

簡潔で実用的なアドバイスをお願いします。`;

  const advice = await generateTextFull(
    'あなたはInstagramマーケティングの専門家です。データに基づいた具体的で実用的なアドバイスを日本語で提供してください。',
    prompt,
    { maxTokens: 1500 }
  );

  return { advice, avgEngagement, topPost, postsData };
}
