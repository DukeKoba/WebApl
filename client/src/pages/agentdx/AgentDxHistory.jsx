import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Twitter, Clock, CheckCircle, XCircle, FileText, Trash2 } from 'lucide-react';
import { authFetch } from '../../utils/api';

const STATUS_CONFIG = {
  draft: { label: '下書き', icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100' },
  posted: { label: '投稿済み', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  failed: { label: '失敗', icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
};

const CONTENT_TYPE_LABELS = {
  dx_trend: 'DXトレンド',
  insurtech: 'InsurTech動向',
  compliance: 'コンプライアンス',
  customer_mgmt: '顧客管理DX',
  digital_sales: 'デジタル営業',
  ai_usecase: 'AI活用事例',
  paperless: 'ペーパーレス化',
  remote_meeting: 'リモート商談',
  subsidy: '補助金・助成金',
  case_study: '成功事例',
};

export default function AgentDxHistory() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/agentdx/posts')
      .then(r => r.json())
      .then(data => { setPosts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('この投稿を削除しますか？')) return;
    await authFetch(`/agentdx/posts/${id}`, { method: 'DELETE' });
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/agentdx" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg text-gray-900">代理店DX 投稿履歴</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">投稿履歴がありません</p>
            <Link to="/agentdx" className="text-indigo-600 text-sm hover:underline mt-2 inline-block">
              最初の投稿を生成する →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => {
              const st = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
              const StatusIcon = st.icon;
              return (
                <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start gap-3">
                    <Twitter className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                        {post.metadata?.contentType && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            {CONTENT_TYPE_LABELS[post.metadata.contentType] || post.metadata.contentType}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {new Date(post.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-3 whitespace-pre-wrap">{post.post_text}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
