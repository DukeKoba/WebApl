import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scroll, Clock, CheckCircle, XCircle, FileText, Trash2, CornerDownRight } from 'lucide-react';
import XLogo from '../../components/shared/XLogo';
import { authFetch } from '../../utils/api';

const STATUS_CONFIG = {
  draft: { label: '下書き', icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100' },
  posted: { label: '投稿済み', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  failed: { label: '失敗', icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
};

const HISTORY_TYPE_LABELS = {
  japanese_center_qa: '🇯🇵 日本史 センター1問1答',
  world_center_qa: '🌍 世界史 センター1問1答',
  same_era_qa: '🔄 同時代 センター1問1答',
  japanese_history: '日本史 要点解説',
  world_history: '世界史 要点解説',
  same_era: '同時代比較',
  mnemonic: '年号の覚え方',
  exam_tips: '歴史の勉強法',
};

function postTags(meta = {}) {
  const tags = [];
  if (meta.day) tags.push({ text: meta.day, color: 'bg-amber-100 text-amber-900 font-bold' });
  if (meta.contentType) {
    tags.push({
      text: HISTORY_TYPE_LABELS[meta.contentType] || meta.contentType,
      color: 'bg-amber-100 text-amber-800 font-medium',
    });
  }
  return tags;
}

export default function KoyomiHistory() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/koyomi/posts')
      .then(r => r.json())
      .then(data => { setPosts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('この投稿を削除しますか？')) return;
    await authFetch(`/koyomi/posts/${id}`, { method: 'DELETE' });
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/koyomi" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-700 rounded-lg flex items-center justify-center">
              <Scroll className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg text-gray-900">日本史・世界史 投稿履歴</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Scroll className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">投稿履歴がありません</p>
            <Link to="/koyomi" className="text-amber-700 text-sm hover:underline mt-2 inline-block font-semibold">
              最初の歴史問題を生成する →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const st = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
              const StatusIcon = st.icon;
              const meta = post.metadata || {};

              return (
                <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
                  <div className="flex items-start gap-3">
                    <XLogo className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${st.bg} ${st.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                        {postTags(meta).map((tag, i) => (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${tag.color}`}>
                            {tag.text}
                          </span>
                        ))}
                        <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {new Date(post.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.post_text}</p>

                      {meta.reply_text && (
                        <div className="mt-3 flex items-start gap-2 bg-amber-50/50 border border-dashed border-amber-200 rounded-lg p-2.5 text-xs text-gray-700">
                          <CornerDownRight className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-amber-900 block mb-0.5">ぶら下げリプライ（正解・解説・アプリ導線）:</span>
                            <p className="whitespace-pre-wrap break-all">{meta.reply_text}</p>
                          </div>
                        </div>
                      )}

                      {post.error_message && (
                        <p className="text-xs text-red-500 mt-2">エラー: {post.error_message}</p>
                      )}

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
