import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Sparkles, History, ArrowLeft, MapPin, Calendar, MessageSquare, Store, BarChart2 } from 'lucide-react';
import PostPreview from '../../components/shared/PostPreview';

import ImageUploader from '../../components/shared/ImageUploader';
import { authFetch } from '../../utils/api';

export default function RamenHome() {
  const [imageId, setImageId] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [restaurantName, setRestaurantName] = useState('');
  const [location, setLocation] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [impressions, setImpressions] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentAgent, setCurrentAgent] = useState('');
  const [postText, setPostText] = useState('');
  const [postId, setPostId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');

  const handleUpload = async (file) => {
    setIsUploading(true);
    setImageAnalysis(null);
    setError('');
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await authFetch('/ramen/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const data = await res.json();
      setImageId(data.image_id);
      setImageUrl(data.image_url);
      setImageAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearImage = () => {
    setImageId(null);
    setImageUrl(null);
    setImageAnalysis(null);
    setMessages([]);
    setPostText('');
    setPostId(null);
    setStatus('draft');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessages([]);
    setPostText('');
    setPostId(null);
    setStatus('draft');
    setError('');

    const agentNames = {
      marketer: 'マーケティングのプロ',
      copywriter: '有名コピーライター',
      consultant: 'デジタルマーケティングコンサルタント',
    };

    try {
      const res = await authFetch('/ramen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_id: imageId,
          image_analysis: imageAnalysis,
          restaurant_name: restaurantName,
          location,
          visit_date: visitDate,
          impressions,
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let event = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            event = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (event === 'agent_message') {
                setCurrentAgent(agentNames[data.agent] || data.name);
                setMessages(prev => [...prev, data]);
              } else if (event === 'final_post') {
                setPostText(data.post_text);
                setPostId(data.post_id);
                setCurrentAgent('');
              } else if (event === 'error') {
                setError(data.message);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
      setCurrentAgent('');
    }
  };

  const handlePublish = async (id) => {
    setIsPublishing(true);
    try {
      const res = await authFetch(`/ramen/posts/${id}/publish`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setStatus('posted');
    } catch (err) {
      setError(err.message);
      setStatus('failed');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-600 rounded-lg flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg text-gray-900">ラーメン Instagram投稿</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/ramen/analytics"
              className="flex items-center gap-1.5 text-sm text-pink-500 hover:text-pink-700 font-medium"
            >
              <BarChart2 className="w-4 h-4" />
              分析
            </Link>
            <Link
              to="/ramen/history"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <History className="w-4 h-4" />
              履歴
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-4">
          <div className="space-y-4">
            {/* Image Upload */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4 text-orange-500" />
                写真をアップロード
              </h2>
              <ImageUploader
                onUpload={handleUpload}
                isUploading={isUploading}
                imageUrl={imageUrl}
                onClear={handleClearImage}
              />

              {/* Vision Analysis Result */}
              {imageAnalysis && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-xs font-semibold text-orange-700 mb-2">Claude AI 分析結果</p>
                  <div className="space-y-1 text-xs text-orange-800">
                    {imageAnalysis.ramen_type && <p>種類: <span className="font-medium">{imageAnalysis.ramen_type}</span></p>}
                    {imageAnalysis.toppings?.length > 0 && <p>トッピング: {imageAnalysis.toppings.join('、')}</p>}
                    {imageAnalysis.appearance && <p>見た目: {imageAnalysis.appearance}</p>}
                    {imageAnalysis.atmosphere && <p>雰囲気: {imageAnalysis.atmosphere}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Details Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">店舗情報（任意）</h2>
              <div className="space-y-3">
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="店名"
                    value={restaurantName}
                    onChange={e => setRestaurantName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="場所（例: 渋谷、新宿）"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={visitDate}
                    onChange={e => setVisitDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    placeholder="感想（例: スープが濃厚で麺がもちもちでした）"
                    value={impressions}
                    onChange={e => setImpressions(e.target.value)}
                    rows={3}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || (!imageId && !imageAnalysis)}
                className="w-full mt-4 py-3 bg-gradient-to-r from-orange-400 to-pink-600 hover:from-orange-500 hover:to-pink-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    AIが生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    投稿を生成する
                  </>
                )}
              </button>
            </div>

            <PostPreview
              platform="instagram"
              text={postText}
              onChange={postId ? setPostText : undefined}
              imageUrl={imageUrl}
              postId={postId}
              onPublish={handlePublish}
              isPublishing={isPublishing}
              status={status}
            />
          </div>
      </div>
    </div>
  );
}
