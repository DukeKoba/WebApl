import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, Instagram, Clock, CheckCircle, XCircle, FileText, Trash2, MapPin } from 'lucide-react';
import { authFetch } from '../../utils/api';

const STATUS_CONFIG = {
  draft: { label: 'Draft', icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100' },
  posted: { label: 'Posted', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
};

export default function RamenHistory() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/ramen/posts')
      .then(r => r.json())
      .then(data => { setPosts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return;
    await authFetch(`/ramen/posts/${id}`, { method: 'DELETE' });
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/ramen" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-600 rounded-lg flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg text-gray-900">Ramen post history</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No posts yet</p>
            <Link to="/ramen" className="text-orange-500 text-sm hover:underline mt-2 inline-block">
              Generate your first post →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {posts.map(post => {
              const st = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
              const StatusIcon = st.icon;
              return (
                <div key={post.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {post.image_url && (
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img src={post.image_url} alt="ramen" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Instagram className="w-4 h-4 text-pink-500" />
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {st.label}
                      </span>
                      {post.metadata?.location && (
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {post.metadata.location}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        {new Date(post.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {post.metadata?.restaurant_name && (
                      <p className="text-sm font-semibold text-gray-800 mb-1">{post.metadata.restaurant_name}</p>
                    )}
                    <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-wrap">{post.post_text}</p>
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
