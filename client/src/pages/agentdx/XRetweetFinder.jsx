import React, { useEffect, useState } from 'react';
import { ExternalLink, Heart, Loader2, MessageCircle, RefreshCw, Repeat2, Search } from 'lucide-react';
import { authFetch } from '../../utils/api';

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Tokyo' }).format(new Date(value));
}

export default function XRetweetFinder({ contentType, onError }) {
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [searchUrl, setSearchUrl] = useState('https://x.com/search');
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [repostingId, setRepostingId] = useState('');
  const [repostedIds, setRepostedIds] = useState(new Set());

  useEffect(() => {
    setQuery('');
    setPosts([]);
    setMessage('');
  }, [contentType]);

  const search = async () => {
    setSearching(true);
    setMessage('');
    onError('');
    try {
      const res = await authFetch('/agentdx/x-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, query: query.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xの検索に失敗しました。');
      setQuery(data.query || query);
      setSearchUrl(data.search_url || 'https://x.com/search');
      setPosts(data.posts || []);
      setMessage(data.message || (data.posts?.length ? `${data.posts.length}件の候補を取得しました。` : '候補がありません。Xの検索画面でも確認できます。'));
    } catch (err) {
      onError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const repost = async (post) => {
    if (!window.confirm(`@${post.author.username} の投稿をCocreoアカウントでリポストしますか？`)) return;
    setRepostingId(post.id);
    onError('');
    try {
      const res = await authFetch(`/agentdx/repost/${post.id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'リポストに失敗しました。');
      setRepostedIds(prev => new Set(prev).add(post.id));
    } catch (err) {
      onError(err.message);
    } finally {
      setRepostingId('');
    }
  };

  return (
    <section className="rounded-xl border border-sky-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white"><Search className="h-5 w-5" /></span>
        <div><h2 className="font-bold text-gray-900">Xからリポスト候補を探す</h2><p className="mt-0.5 text-xs leading-relaxed text-gray-500">元投稿の文章・画像は複製せず、公式発信やニュース投稿をそのままリポストします。</p></div>
      </div>

      <div className="mt-4 flex gap-2">
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="空欄なら選択カテゴリに合う検索語を自動設定" className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
        <button onClick={search} disabled={searching} className="flex shrink-0 items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-gray-300">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}候補を検索
        </button>
      </div>

      {message && <p className="mt-3 text-xs text-gray-500">{message}</p>}
      <a href={searchUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline">Xの検索画面で見る<ExternalLink className="h-3 w-3" /></a>

      <div className="mt-4 space-y-3">
        {posts.map(post => (
          <article key={post.id} className="overflow-hidden rounded-xl border border-gray-200">
            <div className="p-4">
              <div className="flex items-center gap-2">
                {post.author.profile_image_url ? <img src={post.author.profile_image_url} alt="" className="h-9 w-9 rounded-full" /> : <span className="h-9 w-9 rounded-full bg-gray-200" />}
                <div className="min-w-0"><strong className="block truncate text-sm text-gray-900">{post.author.name || post.author.username}</strong><span className="text-xs text-gray-400">@{post.author.username}・{formatDate(post.created_at)}</span></div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{post.text}</p>
              {post.media_url && <img src={post.media_url} alt="元投稿の添付" className="mt-3 max-h-72 w-full rounded-lg object-cover" />}
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.metrics.like_count || 0}</span>
                <span className="flex items-center gap-1"><Repeat2 className="h-3.5 w-3.5" />{post.metrics.retweet_count || 0}</span>
                <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.metrics.reply_count || 0}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 border-t border-gray-100">
              <a href={post.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"><ExternalLink className="h-4 w-4" />元投稿を確認</a>
              <button onClick={() => repost(post)} disabled={repostingId === post.id || repostedIds.has(post.id)} className="flex items-center justify-center gap-1.5 border-l border-gray-100 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:text-gray-400">
                {repostingId === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat2 className="h-4 w-4" />}{repostedIds.has(post.id) ? 'リポスト済み' : 'この投稿をリポスト'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
