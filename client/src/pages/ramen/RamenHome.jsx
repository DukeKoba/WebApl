import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Sparkles, History, ArrowLeft, MapPin, Calendar, MessageSquare, Store, BarChart2, Wand2, Copy, Check, Globe, Search, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import PostPreview from '../../components/shared/PostPreview';

import ImageUploader from '../../components/shared/ImageUploader';
import { authFetch } from '../../utils/api';

export default function RamenHome() {
  const [imageId, setImageId] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [autoFilled, setAutoFilled] = useState({ restaurant: null, location: null, date: null });

  const [restaurantName, setRestaurantName] = useState('');
  const [location, setLocation] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [impressions, setImpressions] = useState('');

  // restaurant name review search state
  const [reviewState, setReviewState] = useState('idle');
  const [reviewPreview, setReviewPreview] = useState('');
  const [approvedReviews, setApprovedReviews] = useState(null);

  // ramen type review search state: 'idle' | 'searching' | 'confirm' | 'approved' | 'rejected' | 'not-found'
  const [ramenTypeReviewState, setRamenTypeReviewState] = useState('idle');
  const [ramenTypeReviewPreview, setRamenTypeReviewPreview] = useState('');
  const [approvedRamenTypeReviews, setApprovedRamenTypeReviews] = useState(null);

  // impression conversion state
  const [isConvertingImpression, setIsConvertingImpression] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentAgent, setCurrentAgent] = useState('');
  const [postText, setPostText] = useState('');
  const [japaneseOriginal, setJapaneseOriginal] = useState('');
  const [isTranslatingToEnglish, setIsTranslatingToEnglish] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [hasWebReviews, setHasWebReviews] = useState(false);
  const [postId, setPostId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

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

      // EXIF GPS / Claude Vision から自動入力（ユーザーが既に入れた値は尊重）
      const detected = data.detected || {};
      const filled = { restaurant: null, location: null, date: null };
      if (detected.restaurant_name && !restaurantName) {
        setRestaurantName(detected.restaurant_name);
        filled.restaurant = detected.sources?.restaurant || 'auto';
      }
      if (detected.location && !location) {
        setLocation(detected.location);
        filled.location = detected.sources?.location || 'auto';
      }
      if (detected.taken_at && !visitDate) {
        setVisitDate(detected.taken_at);
        filled.date = 'exif';
      }
      setAutoFilled(filled);
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
    setJapaneseOriginal('');
    setIsTranslated(false);
    setHasWebReviews(false);
    setPostId(null);
    setStatus('draft');
    setAutoFilled({ restaurant: null, location: null, date: null });
    setReviewState('idle');
    setReviewPreview('');
    setApprovedReviews(null);
    setRamenTypeReviewState('idle');
    setRamenTypeReviewPreview('');
    setApprovedRamenTypeReviews(null);
  };

  const handleSearchRamenTypeReviews = async () => {
    if (!imageAnalysis?.ramen_type) return;
    setRamenTypeReviewState('searching');
    setRamenTypeReviewPreview('');
    setApprovedRamenTypeReviews(null);
    try {
      const res = await authFetch('/ramen/search-ramen-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ramen_type: imageAnalysis.ramen_type, location }),
      });
      const data = await res.json();
      if (data.reviews) {
        setRamenTypeReviewPreview(data.reviews);
        setRamenTypeReviewState('confirm');
      } else {
        setRamenTypeReviewState('not-found');
      }
    } catch {
      setRamenTypeReviewState('not-found');
    }
  };

  const handleConvertImpression = async () => {
    if (!impressions.trim()) return;
    setIsConvertingImpression(true);
    try {
      const res = await authFetch('/ramen/convert-impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: impressions }),
      });
      const data = await res.json();
      if (data.english) setImpressions(data.english);
    } catch {}
    finally { setIsConvertingImpression(false); }
  };

  const handleSearchReviews = async () => {
    if (!restaurantName) return;
    setReviewState('searching');
    setReviewPreview('');
    setApprovedReviews(null);
    try {
      const res = await authFetch('/ramen/search-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_name: restaurantName, location }),
      });
      const data = await res.json();
      if (data.reviews) {
        setReviewPreview(data.reviews);
        setReviewState('confirm');
      } else {
        setReviewState('not-found');
      }
    } catch {
      setReviewState('not-found');
    }
  };

  const handleApproveReviews = () => {
    setApprovedReviews(reviewPreview);
    setReviewState('approved');
  };

  const handleRejectReviews = () => {
    setApprovedReviews(null);
    setReviewState('rejected');
  };

  const copyField = (value, fieldName) => {
    navigator.clipboard.writeText(value);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const copyAllShopInfo = () => {
    const parts = [];
    if (restaurantName) parts.push(`店名: ${restaurantName}`);
    if (location) parts.push(`場所: ${location}`);
    if (visitDate) parts.push(`訪問日: ${visitDate}`);
    if (impressions) parts.push(`感想: ${impressions}`);
    navigator.clipboard.writeText(parts.join('\n'));
    setCopiedField('all');
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage('');
    setMessages([]);
    setPostText('');
    setJapaneseOriginal('');
    setIsTranslated(false);
    setHasWebReviews(false);
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
          web_reviews: [approvedReviews, approvedRamenTypeReviews].filter(Boolean).join('\n\n---\n\n') || null,
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
              if (event === 'status') {
                setStatusMessage(data.message);
              } else if (event === 'agent_message') {
                setStatusMessage('');
                setCurrentAgent(agentNames[data.agent] || data.name);
                setMessages(prev => [...prev, data]);
              } else if (event === 'final_post') {
                setPostText(data.post_text);
                setJapaneseOriginal('');
                setIsTranslated(false);
                setHasWebReviews(!!data.has_web_reviews);
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

  const handleTranslateToEnglish = async () => {
    if (!postText || isTranslated) return;
    setIsTranslatingToEnglish(true);
    try {
      const res = await authFetch('/ramen/translate-to-english', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: postText }),
      });
      const data = await res.json();
      if (data.english) {
        setJapaneseOriginal(postText);
        setPostText(data.english);
        setIsTranslated(true);
      }
    } catch {}
    finally { setIsTranslatingToEnglish(false); }
  };

  const sourceLabel = (src) => {
    if (src === 'image') return 'from signage';
    if (src === 'gps') return 'from GPS';
    if (src === 'exif') return 'from photo EXIF';
    return 'auto-filled';
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
            <h1 className="font-bold text-lg text-gray-900">Ramen Instagram Post</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/ramen/analytics"
              className="flex items-center gap-1.5 text-sm text-pink-500 hover:text-pink-700 font-medium"
            >
              <BarChart2 className="w-4 h-4" />
              Analytics
            </Link>
            <Link
              to="/ramen/history"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <History className="w-4 h-4" />
              History
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
                ラーメン写真をアップロード
              </h2>
              <ImageUploader
                onUpload={handleUpload}
                isUploading={isUploading}
                imageUrl={imageUrl}
                onClear={handleClearImage}
              />

              {/* Vision Analysis Result */}
              {imageAnalysis && (
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <p className="text-xs font-semibold text-orange-700 mb-2">Claude AI 画像分析</p>
                    <div className="space-y-1 text-xs text-orange-800">
                      {imageAnalysis.ramen_type && <p>スタイル: <span className="font-medium">{imageAnalysis.ramen_type}</span></p>}
                      {imageAnalysis.toppings?.length > 0 && <p>トッピング: {imageAnalysis.toppings.join('、')}</p>}
                      {imageAnalysis.appearance && <p>見た目: {imageAnalysis.appearance}</p>}
                      {imageAnalysis.atmosphere && <p>雰囲気: {imageAnalysis.atmosphere}</p>}
                    </div>
                  </div>

                  {/* Ramen type review search */}
                  {imageAnalysis.ramen_type && ramenTypeReviewState === 'idle' && (
                    <button
                      onClick={handleSearchRamenTypeReviews}
                      className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-orange-300 rounded-lg text-sm text-orange-500 hover:bg-orange-50 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      「{imageAnalysis.ramen_type}」のWeb口コミを検索
                    </button>
                  )}
                  {ramenTypeReviewState === 'searching' && (
                    <div className="flex items-center gap-2 py-2 px-3 bg-orange-50 rounded-lg text-sm text-orange-600">
                      <span className="w-3.5 h-3.5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin flex-shrink-0" />
                      {imageAnalysis.ramen_type}の口コミを検索中...
                    </div>
                  )}
                  {ramenTypeReviewState === 'not-found' && (
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                      <span>このラーメン種別の口コミが見つかりませんでした。下の感想欄に入力してください。</span>
                      <button onClick={handleSearchRamenTypeReviews} className="ml-2 text-orange-400 hover:text-orange-600 flex-shrink-0">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {ramenTypeReviewState === 'confirm' && ramenTypeReviewPreview && (
                    <div className="border border-orange-200 rounded-lg overflow-hidden">
                      <div className="bg-orange-50 px-3 py-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-orange-700">{imageAnalysis.ramen_type}の口コミが見つかりました — 使用しますか？</span>
                        <button onClick={handleSearchRamenTypeReviews} className="text-orange-400 hover:text-orange-600">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-3 max-h-40 overflow-y-auto">
                        <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{ramenTypeReviewPreview}</p>
                      </div>
                      <div className="flex border-t border-orange-100">
                        <button
                          onClick={() => { setApprovedRamenTypeReviews(ramenTypeReviewPreview); setRamenTypeReviewState('approved'); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          使用する
                        </button>
                        <div className="w-px bg-orange-100" />
                        <button
                          onClick={() => { setApprovedRamenTypeReviews(null); setRamenTypeReviewState('rejected'); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          スキップ
                        </button>
                      </div>
                    </div>
                  )}
                  {ramenTypeReviewState === 'approved' && (
                    <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                        ラーメン種別口コミを使用します
                      </div>
                      <button onClick={() => { setRamenTypeReviewState('idle'); setApprovedRamenTypeReviews(null); }} className="text-gray-400 hover:text-gray-600 ml-2">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {ramenTypeReviewState === 'rejected' && (
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                      <span>ラーメン種別口コミはスキップします。</span>
                      <button onClick={handleSearchRamenTypeReviews} className="text-orange-400 hover:text-orange-600 ml-2">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Details Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-gray-900">店舗情報 <span className="text-xs font-normal text-gray-400">（任意）</span></h2>
                {(restaurantName || location || visitDate || impressions) && (
                  <button
                    onClick={copyAllShopInfo}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    title="全てコピー"
                  >
                    {copiedField === 'all' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'all' ? 'コピーしました！' : '全てコピー'}</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                <Wand2 className="w-3 h-3" />
                写真のGPSと看板から自動入力します。
              </p>
              <div className="space-y-3">
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="店名"
                    value={restaurantName}
                    onChange={e => { setRestaurantName(e.target.value); setReviewState('idle'); setApprovedReviews(null); }}
                    className="w-full pl-9 pr-28 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  {restaurantName && (
                    <button onClick={() => copyField(restaurantName, 'name')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                      {copiedField === 'name' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {autoFilled.restaurant && (
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                      {sourceLabel(autoFilled.restaurant)}
                    </span>
                  )}
                </div>

                {/* Review search button + confirmation card */}
                {restaurantName && reviewState === 'idle' && (
                  <button
                    onClick={handleSearchReviews}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-orange-300 rounded-lg text-sm text-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    「{restaurantName}」のWeb口コミを検索
                  </button>
                )}
                {reviewState === 'searching' && (
                  <div className="flex items-center gap-2 py-2 px-3 bg-orange-50 rounded-lg text-sm text-orange-600">
                    <span className="w-3.5 h-3.5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin flex-shrink-0" />
                    口コミを検索中...
                  </div>
                )}
                {reviewState === 'not-found' && (
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                    <span>口コミが見つかりませんでした。写真分析をもとに生成します。</span>
                    <button onClick={handleSearchReviews} className="ml-2 text-orange-400 hover:text-orange-600 flex-shrink-0">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {reviewState === 'confirm' && reviewPreview && (
                  <div className="border border-orange-200 rounded-lg overflow-hidden">
                    <div className="bg-orange-50 px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-orange-700">口コミが見つかりました — この店舗で合っていますか？</span>
                      <button onClick={handleSearchReviews} className="text-orange-400 hover:text-orange-600">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-3 max-h-40 overflow-y-auto">
                      <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{reviewPreview}</p>
                    </div>
                    <div className="flex border-t border-orange-100">
                      <button
                        onClick={handleApproveReviews}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        使用する
                      </button>
                      <div className="w-px bg-orange-100" />
                      <button
                        onClick={handleRejectReviews}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        別の店舗
                      </button>
                    </div>
                  </div>
                )}
                {reviewState === 'approved' && (
                  <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <Check className="w-3.5 h-3.5" />
                      口コミを使用します
                    </div>
                    <button onClick={() => { setReviewState('idle'); setApprovedReviews(null); }} className="text-gray-400 hover:text-gray-600 ml-2">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {reviewState === 'rejected' && (
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                    <span>口コミなしで生成します。</span>
                    <button onClick={handleSearchReviews} className="text-orange-400 hover:text-orange-600 ml-2">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="場所（例: 渋谷, 東京）"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full pl-9 pr-28 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  {location && (
                    <button onClick={() => copyField(location, 'location')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                      {copiedField === 'location' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {autoFilled.location && (
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                      {sourceLabel(autoFilled.location)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={visitDate}
                    onChange={e => setVisitDate(e.target.value)}
                    className="w-full pl-9 pr-28 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  {visitDate && (
                    <button onClick={() => copyField(visitDate, 'date')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                      {copiedField === 'date' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {autoFilled.date && (
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                      {sourceLabel(autoFilled.date)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    placeholder="感想・メモ（日本語OK）"
                    value={impressions}
                    onChange={e => setImpressions(e.target.value)}
                    rows={3}
                    className="w-full pl-9 pr-16 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  {impressions && (
                    <div className="absolute right-2 top-2 flex flex-col gap-1">
                      <button
                        onClick={handleConvertImpression}
                        disabled={isConvertingImpression}
                        title="日本語→英語 AI変換"
                        className="p-1 rounded text-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"
                      >
                        {isConvertingImpression
                          ? <span className="w-3.5 h-3.5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin block" />
                          : <Wand2 className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => copyField(impressions, 'impressions')} className="p-1 text-gray-300 hover:text-gray-500">
                        {copiedField === 'impressions' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
                {(ramenTypeReviewState === 'not-found' || reviewState === 'not-found') && !impressions && (
                  <p className="text-xs text-orange-500 flex items-center gap-1">
                    <Wand2 className="w-3 h-3" />
                    口コミが見つかりませんでした。感想欄に日本語でメモを入力してください。
                  </p>
                )}
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
                    {statusMessage || (currentAgent ? `${currentAgent} 作業中...` : 'AIエージェントが下書き中...')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    日本語で投稿文を生成
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

            {/* 英語に変換ボタン + 日本語オリジナル表示 */}
            {postText && (
              <div className="space-y-3">
                {hasWebReviews && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                    Web口コミ情報を参考に生成しました
                  </div>
                )}
                {!isTranslated ? (
                  <button
                    onClick={handleTranslateToEnglish}
                    disabled={isTranslatingToEnglish}
                    className="w-full py-2.5 border border-orange-300 rounded-lg text-sm font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isTranslatingToEnglish ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                        英語に翻訳中...
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        英語に変換してInstagram用に仕上げる
                      </>
                    )}
                  </button>
                ) : (
                  japaneseOriginal && (
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400">日本語オリジナル</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(japaneseOriginal);
                            setCopiedField('jaoriginal');
                            setTimeout(() => setCopiedField(''), 2000);
                          }}
                          className="text-gray-300 hover:text-gray-500 transition-colors"
                          title="日本語版をコピー"
                        >
                          {copiedField === 'jaoriginal' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">{japaneseOriginal}</p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
