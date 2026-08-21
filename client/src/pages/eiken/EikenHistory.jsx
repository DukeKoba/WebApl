import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, CheckCircle, XCircle, FileText, Trash2, CornerDownRight } from 'lucide-react';
import XLogo from '../../components/shared/XLogo';
import { authFetch } from '../../utils/api';

const STATUS_CONFIG = {
  draft: { label: '下書き', icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100' },
  posted: { label: '投稿済み', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  failed: { label: '失敗', icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
};

const QUESTION_TYPE_LABELS = {
  ai_writing_correction: '🔥 AI英作文添削',
  ai_interview: '🎙️ AI面接',
  native_vs_japanese: '💡 ネイティブ表現',
  controversial_quiz: '❓ 議論型クイズ',
  thread_summary: '🧵 要点スレッド',
  vocabulary: '語彙',
  grammar: '文法',
  reading: '読解',
  writing: 'ライティング',
  listening: 'リスニング',
  interview: '面接Tips',
  american_culture: '文化表現',
  ai_tips: 'AI活用Tips',
  study_tips: '学習のコツ',
  listening_tips: '英語耳の作り方',
};

const LEVEL_LABELS = {
  pre1: '準1級', '2': '2級', pre2: '準2級', pre2plus: '準2級プラス',
  '3': '3級', '4': '4級', '5': '5級',
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
  if (meta.day) tags.push({ text: meta.day, color: 'bg-blue-100 text-blue-800' });
  if (meta.type === 'university' && meta.university) tags.push({ text: meta.university, color: 'bg-emerald-100 text-emerald-800' });
  if (meta.type === 'koyomi') tags.push({ text: HISTORY_TYPE_LABELS[meta.contentType] || '日本史・世界史', color: 'bg-amber-100 text-amber-800' });
  if (meta.level && LEVEL_LABELS[meta.level]) tags.push({ text: `英検${LEVEL_LABELS[meta.level]}`, color: 'bg-gray-800 text-white' });
  if (meta.questionType) tags.push({ text: QUESTION_TYPE_LABELS[meta.questionType] || meta.questionType, color: 'bg-red-100 text-red-800' });
  if (meta.is_thread) tags.push({ text: `${meta.thread_posts?.length || ''}連ツイート`, color: 'bg-indigo-100 text-indigo-800' });
  return tags;
}

export default function EikenHistory() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/eiken/posts')
      .then(r => r.json())
      .then(data => { setPosts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('この投稿を削除しますか？')) return;
    await authFetch(`/eiken/posts/${id}`, { method: 'DELETE' });
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/eiken" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg text-gray-900">AI英検・歴史 投稿履歴</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">投稿履歴がありません</p>
            <Link to="/eiken" className="text-red-600 text-sm hover:underline mt-2 inline-block font-semibold">
              最初の投稿を生成する →
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
                          <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${tag.color}`}>
                            {tag.text}
                          </span>
                        ))}
                        <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {new Date(post.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {meta.is_thread && Array.isArray(meta.thread_posts) ? (
                        <div className="space-y-2 mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                          {meta.thread_posts.map((t, idx) => (
                            <div key={idx} className="text-xs text-gray-800 pb-2 border-b border-gray-200 last:border-0 last:pb-0">
                              <span className="font-bold text-indigo-600 mr-2">{idx + 1}/</span>
                              <span className="whitespace-pre-wrap">{t}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.post_text}</p>
                      )}

                      {!meta.is_thread && meta.reply_text && (
                        <div className="mt-3 flex items-start gap-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg p-2.5 text-xs text-gray-600">
                          <CornerDownRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-gray-500 block mb-0.5">ぶら下げリプライ:</span>
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
