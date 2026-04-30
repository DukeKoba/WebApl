import express from 'express';
import { fetchRecentPosts, fetchProfile, calcEngagement, analyzeWithClaude } from '../services/instagramAnalyticsService.js';

const router = express.Router();

// GET /api/instagram/profile - プロフィール取得
router.get('/profile', async (req, res) => {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return res.status(400).json({ error: 'INSTAGRAM_ACCESS_TOKEN が設定されていません' });

  try {
    const profile = await fetchProfile(token);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/instagram/posts - 投稿一覧 + エンゲージメント
router.get('/posts', async (req, res) => {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return res.status(400).json({ error: 'INSTAGRAM_ACCESS_TOKEN が設定されていません' });

  try {
    const [profile, posts] = await Promise.all([
      fetchProfile(token),
      fetchRecentPosts(token, 20),
    ]);

    const postsWithEngagement = posts.map(p => ({
      ...p,
      engagement: calcEngagement(p, profile.followers_count || 1),
    }));

    res.json({ profile, posts: postsWithEngagement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/instagram/analyze - Claude AIによる分析
router.post('/analyze', async (req, res) => {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return res.status(400).json({ error: 'INSTAGRAM_ACCESS_TOKEN が設定されていません' });

  try {
    const [profile, posts] = await Promise.all([
      fetchProfile(token),
      fetchRecentPosts(token, 20),
    ]);

    const result = await analyzeWithClaude(profile, posts);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
