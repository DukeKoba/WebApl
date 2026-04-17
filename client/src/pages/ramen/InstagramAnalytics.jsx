import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, BarChart2, Heart, MessageCircle, TrendingUp, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';

export default function InstagramAnalytics() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [advice, setAdvice] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/instagram/posts');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const data = await res.json();
      setProfile(data.profile);
      setPosts(data.posts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAdvice('');
    try {
      const res = await fetch('/api/instagram/analyze', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const data = await res.json();
      setAdvice(data.advice);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const avgEngagement = posts.length > 0
    ? (posts.reduce((sum, p) => sum + (p.engagement?.rate || 0), 0) / posts.length).toFixed(2)
    : '0.00';

  const topPost = [...posts].sort((a, b) => (b.engagement?.rate || 0) - (a.engagement?.rate || 0))[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/ramen" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-600 rounded-lg flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg text-gray-900">Instagram 分析</h1>
          </div>
          <button onClick={loadData} className="ml-auto text-gray-400 hover:text-gray-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <p className="font-semibold mb-1">エラー</p>
            <p>{error}</p>
            {error.includes('INSTAGRAM_ACCESS_TOKEN') && (
              <p className="mt-2 text-red-500">.env ファイルに INSTAGRAM_ACCESS_TOKEN を設定してください。</p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
          </div>
        ) : (
          <>
            {/* Profile Stats */}
            {profile && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {profile.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">@{profile.username}</p>
                    <a
                      href={`https://instagram.com/${profile.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-pink-500 flex items-center gap-1 hover:underline"
                    >
                      Instagramで見る <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-900">{profile.followers_count?.toLocaleString() || '-'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">フォロワー</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-900">{profile.media_count || '-'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">投稿数</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-pink-600">{avgEngagement}%</p>
                    <p className="text-xs text-gray-500 mt-0.5">平均エンゲージメント</p>
                  </div>
                </div>
              </div>
            )}

            {/* Claude AI Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  Claude AIによる改善アドバイス
                </h2>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || posts.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-orange-500 hover:to-pink-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />分析中...</>
                  ) : (
                    <><Sparkles className="w-3 h-3" />分析する</>
                  )}
                </button>
              </div>

              {advice ? (
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gradient-to-br from-orange-50 to-pink-50 rounded-lg p-4">
                  {advice}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">「分析する」をクリックするとClaudeがアドバイスを生成します</p>
                </div>
              )}
            </div>

            {/* Recent Posts */}
            {posts.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-4">直近の投稿パフォーマンス</h2>
                <div className="space-y-3">
                  {posts.slice(0, 10).map(post => (
                    <div key={post.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      {/* Thumbnail */}
                      {(post.media_url || post.thumbnail_url) && (
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                          <img
                            src={post.thumbnail_url || post.media_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {post.caption || '(キャプションなし)'}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-400" />
                            {post.engagement?.likes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 text-blue-400" />
                            {post.engagement?.comments || 0}
                          </span>
                          <span className={`font-semibold ${(post.engagement?.rate || 0) >= parseFloat(avgEngagement) ? 'text-green-600' : 'text-gray-400'}`}>
                            {post.engagement?.rate || 0}%
                          </span>
                          {post.permalink && (
                            <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="ml-auto text-pink-400 hover:text-pink-600">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
