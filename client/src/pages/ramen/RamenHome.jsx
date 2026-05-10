import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  History,
  ArrowLeft,
  MapPin,
  Calendar,
  MessageSquare,
  Store,
  BarChart2,
  Copy,
  Check,
  Globe,
  Search,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Soup,
  Camera,
  X,
} from 'lucide-react';
import { parse as parseExif } from 'exifr';
import { authFetch, api } from '../../utils/api';
import AiModeToggle, { useAiMode } from '../../components/shared/AiModeToggle';
import PromptFallbackPanel from '../../components/shared/PromptFallbackPanel';

const RAMEN_TYPES = [
  '醤油', '味噌', '豚骨', '塩', 'つけ麺', '家系', '二郎系', '担々麺', '台湾まぜそば', 'その他',
];

function StepHeader({ num, title, done, active }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          done
            ? 'bg-emerald-500 text-white'
            : active
              ? 'bg-gradient-to-br from-orange-400 to-pink-600 text-white'
              : 'bg-gray-200 text-gray-500'
        }`}
      >
        {done ? <Check className="w-3.5 h-3.5" /> : num}
      </div>
      <h2 className={`font-semibold ${done || active ? 'text-gray-900' : 'text-gray-400'}`}>{title}</h2>
    </div>
  );
}

export default function RamenHome() {
  const [aiMode] = useAiMode();
  const promptOnly = aiMode === 'prompt';

  // Photo upload
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [imageId, setImageId] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [imageDetectedRestaurant, setImageDetectedRestaurant] = useState('');
  const photoInputRef = useRef(null);

  // Step 1: input + reviews
  const [restaurantName, setRestaurantName] = useState('');
  const [location, setLocation] = useState('');
  const [ramenType, setRamenType] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [impressions, setImpressions] = useState('');

  const [reviewState, setReviewState] = useState('idle'); // idle | searching | confirm | approved | rejected | not-found | prompt
  const [reviewPreview, setReviewPreview] = useState('');
  const [approvedReviews, setApprovedReviews] = useState(null);
  const [reviewFallbackPrompt, setReviewFallbackPrompt] = useState(null);

  // Step 2: agent generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [agentMessages, setAgentMessages] = useState([]);
  const [currentAgent, setCurrentAgent] = useState('');
  const [generateFallbackPrompt, setGenerateFallbackPrompt] = useState(null);

  // Japanese + English results
  const [japanesePost, setJapanesePost] = useState('');
  const [englishPost, setEnglishPost] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateFallbackPrompt, setTranslateFallbackPrompt] = useState(null);

  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const canSearchReviews = restaurantName.trim().length > 0;
  const canGenerate =
    !isGenerating &&
    (approvedReviews || impressions.trim().length > 0) &&
    restaurantName.trim().length > 0;

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setPhotoLoading(true);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setImageId(null);
    setImageAnalysis(null);
    setImageDetectedRestaurant('');

    // 1. クライアント側で先にEXIFを読んで、即座に日時・場所を仮入力（体感速度向上）
    try {
      const exif = await parseExif(file, { gps: true, tiff: true, exif: true });
      if (exif?.DateTimeOriginal) {
        const d = new Date(exif.DateTimeOriginal);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!visitDate) setVisitDate(iso);
      }
    } catch {}

    // 2. サーバーへアップロード → Claude Vision解析 + GPS逆ジオコーディング + 近隣店舗推定
    try {
      const formData = new FormData();
      formData.append('image', file);
      const data = await api.uploadRamenImage(formData);
      if (data?.error) throw new Error(data.error);

      if (data?.image_id) setImageId(data.image_id);
      if (data?.analysis) setImageAnalysis(data.analysis);

      const detected = data?.detected || {};

      // 訪問日: サーバー側EXIFが取れていればそちらで上書き（タイムゾーン考慮済み）
      if (detected.taken_at) setVisitDate(detected.taken_at);

      // 場所: サーバーのGPS逆ジオが取れていればそれを優先
      if (detected.location) setLocation(detected.location);

      // 店名: 看板検出 or GPS近隣推定。ユーザーが既に入力していれば上書きしない
      if (detected.restaurant_name) {
        setImageDetectedRestaurant(detected.restaurant_name);
        setRestaurantName((prev) => prev.trim() ? prev : detected.restaurant_name);
      }

      // ラーメンの種類: Vision検出値が選択肢にあれば自動選択
      const detectedType = data?.analysis?.ramen_type;
      if (detectedType && !ramenType) {
        const matched = RAMEN_TYPES.find((t) => detectedType.includes(t));
        if (matched) setRamenType(matched);
      }
    } catch (err) {
      // サーバー解析が失敗してもEXIFだけは活きるのでサイレント
      console.warn('[ramen] image upload to server failed:', err?.message);
    }
    setPhotoLoading(false);
  };

  const handleSearchReviews = async () => {
    if (!canSearchReviews) return;
    setReviewState('searching');
    setReviewPreview('');
    setApprovedReviews(null);
    setReviewFallbackPrompt(null);
    try {
      const res = await authFetch('/ramen/search-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_name: restaurantName,
          location,
          ramen_type: ramenType,
          prompt_only: promptOnly,
        }),
      });
      const data = await res.json();
      if (data.fallback_prompt) {
        setReviewFallbackPrompt(data.fallback_prompt);
        setReviewState('prompt');
      } else if (data.reviews) {
        setReviewPreview(data.reviews);
        setReviewState('confirm');
      } else {
        setReviewState('not-found');
      }
    } catch {
      setReviewState('not-found');
    }
  };

  const handleTranslate = async (textOverride) => {
    const textToTranslate = textOverride !== undefined ? textOverride : japanesePost;
    if (!textToTranslate.trim()) return;
    setIsTranslating(true);
    setEnglishPost('');
    setTranslateFallbackPrompt(null);
    try {
      const res = await authFetch('/ramen/translate-to-english', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToTranslate, prompt_only: promptOnly }),
      });
      const data = await res.json();
      if (data.fallback_prompt) {
        setTranslateFallbackPrompt(data.fallback_prompt);
      } else if (data.english) {
        setEnglishPost(data.english);
      } else {
        setError('英語化に失敗しました。少し時間をおいて再度お試しください。');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage('');
    setAgentMessages([]);
    setCurrentAgent('');
    setJapanesePost('');
    setEnglishPost('');
    setGenerateFallbackPrompt(null);
    setTranslateFallbackPrompt(null);
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
          restaurant_name: restaurantName,
          location,
          ramen_type: ramenType,
          visit_date: visitDate,
          impressions,
          web_reviews: approvedReviews || null,
          image_id: imageId,
          image_analysis: imageAnalysis,
          prompt_only: promptOnly,
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
                setAgentMessages((prev) => [...prev, data]);
              } else if (event === 'final_post') {
                const postText = data.post_text;
                setJapanesePost(postText);
                setCurrentAgent('');
                if (data.post_id) {
                  authFetch(`/ramen/posts/${data.post_id}/finalize-japanese`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ post_text: postText }),
                  }).catch(() => {});
                }
                handleTranslate(postText);
              } else if (event === 'fallback_prompt') {
                setGenerateFallbackPrompt(data);
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

  const handleSaveManualJapanese = async (text) => {
    if (!text.trim()) return;
    try {
      const res = await authFetch('/ramen/save-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_text: text,
          restaurant_name: restaurantName,
          location,
          ramen_type: ramenType,
          visit_date: visitDate,
          impressions,
          image_id: imageId,
          image_analysis: imageAnalysis,
        }),
      });
      const data = await res.json();
      if (data.post_id) {
        setJapanesePost(data.post_text);
        setGenerateFallbackPrompt(null);
        authFetch(`/ramen/posts/${data.post_id}/finalize-japanese`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_text: data.post_text }),
        }).catch(() => {});
        handleTranslate(data.post_text);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const handleResetAll = () => {
    setRestaurantName('');
    setLocation('');
    setRamenType('');
    setVisitDate('');
    setImpressions('');
    setPhotoPreview('');
    setImageId(null);
    setImageAnalysis(null);
    setImageDetectedRestaurant('');
    setReviewState('idle');
    setReviewPreview('');
    setApprovedReviews(null);
    setAgentMessages([]);
    setStatusMessage('');
    setCurrentAgent('');
    setJapanesePost('');
    setEnglishPost('');
    setError('');
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
              <Soup className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg text-gray-900">Ramen Instagram キャプション</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <AiModeToggle />
            <Link to="/ramen/analytics" className="hidden sm:flex items-center gap-1.5 text-sm text-pink-500 hover:text-pink-700 font-medium">
              <BarChart2 className="w-4 h-4" />
              Analytics
            </Link>
            <Link to="/ramen/history" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <History className="w-4 h-4" />
              History
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-4">
        {/* STEP 1: 口コミを取得 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <StepHeader
            num="1"
            title="店舗・ラーメン情報を入力して口コミを取得"
            active={!japanesePost}
            done={!!approvedReviews && !!japanesePost}
          />
          <p className="text-xs text-gray-500 mb-4">店名・場所・ラーメンの種類で食べログ等のWeb口コミを検索します。</p>

          <div className="space-y-3">
            {/* Photo upload */}
            <div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e.target.files[0])}
              />
              {photoPreview ? (
                <div className="p-2.5 border border-orange-200 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img src={photoPreview} alt="uploaded" className="w-14 h-14 object-cover rounded-md flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-orange-700 mb-0.5">
                        {photoLoading ? 'AI解析中...' : '写真から読み込み済み'}
                      </p>
                      {visitDate && <p className="text-xs text-gray-600">📅 {visitDate}</p>}
                      {location && <p className="text-xs text-gray-600 truncate">📍 {location}</p>}
                      {imageDetectedRestaurant && (
                        <p className="text-xs text-gray-600 truncate">🏪 {imageDetectedRestaurant}</p>
                      )}
                      {!visitDate && !location && !imageDetectedRestaurant && !photoLoading && (
                        <p className="text-xs text-gray-500">日時・GPS情報が見つかりませんでした</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setPhotoPreview('');
                        setImageId(null);
                        setImageAnalysis(null);
                        setImageDetectedRestaurant('');
                        if (photoInputRef.current) photoInputRef.current.value = '';
                      }}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {imageAnalysis && (imageAnalysis.toppings?.length > 0 || imageAnalysis.appearance) && (
                    <div className="mt-2 pt-2 border-t border-orange-200/70 flex flex-wrap gap-1">
                      {imageAnalysis.ramen_type && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">{imageAnalysis.ramen_type}</span>
                      )}
                      {imageAnalysis.toppings?.slice(0, 4).map((t, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white text-gray-600 rounded border border-orange-200">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 disabled:opacity-50 transition-colors"
                >
                  {photoLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
                      日時・場所を読み込み中...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      写真から日時・場所を自動入力（任意）
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="店名（必須）"
                value={restaurantName}
                onChange={(e) => {
                  setRestaurantName(e.target.value);
                  setReviewState('idle');
                  setApprovedReviews(null);
                }}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="場所（例: 渋谷, 東京）"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">食べたラーメンの種類</label>
              <div className="flex flex-wrap gap-1.5">
                {RAMEN_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setRamenType(ramenType === t ? '' : t)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      ramenType === t
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                placeholder="感想・メモ（任意・日本語OK）"
                value={impressions}
                onChange={(e) => setImpressions(e.target.value)}
                rows={3}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            {reviewState === 'idle' && (
              <button
                onClick={handleSearchReviews}
                disabled={!canSearchReviews}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-orange-300 rounded-lg text-sm text-orange-600 hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Search className="w-4 h-4" />
                {restaurantName ? `「${restaurantName}」のWeb口コミを検索` : 'まず店名を入力してください'}
              </button>
            )}
            {reviewState === 'searching' && (
              <div className="flex items-center gap-2 py-2.5 px-3 bg-orange-50 rounded-lg text-sm text-orange-600">
                <span className="w-3.5 h-3.5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin flex-shrink-0" />
                Web口コミを検索中...
              </div>
            )}
            {reviewState === 'not-found' && (
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                <span>口コミが見つかりませんでした。感想欄の内容のみで生成します。</span>
                <button onClick={handleSearchReviews} className="ml-2 text-orange-400 hover:text-orange-600 flex-shrink-0">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {reviewState === 'confirm' && reviewPreview && (
              <div className="border border-orange-200 rounded-lg overflow-hidden">
                <div className="bg-orange-50 px-3 py-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-orange-700">口コミが見つかりました — 使用しますか？</span>
                  <button onClick={handleSearchReviews} className="text-orange-400 hover:text-orange-600">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-3 max-h-48 overflow-y-auto">
                  <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{reviewPreview}</p>
                </div>
                <div className="flex border-t border-orange-100">
                  <button
                    onClick={() => {
                      setApprovedReviews(reviewPreview);
                      setReviewState('approved');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    使用する
                  </button>
                  <div className="w-px bg-orange-100" />
                  <button
                    onClick={() => {
                      setApprovedReviews(null);
                      setReviewState('rejected');
                    }}
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
                <button
                  onClick={() => {
                    setReviewState('idle');
                    setApprovedReviews(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
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

            {reviewState === 'prompt' && reviewFallbackPrompt && (
              <PromptFallbackPanel
                prompts={reviewFallbackPrompt.prompts}
                reason={reviewFallbackPrompt.reason || 'prompt_only'}
                placeholder="ChatGPT等で口コミ検索を実行し、まとめた結果をここに貼り付けてください"
                saveLabel="口コミを保存"
                onSave={(text) => {
                  if (!text.trim()) return;
                  setReviewPreview(text);
                  setApprovedReviews(text);
                  setReviewState('approved');
                  setReviewFallbackPrompt(null);
                }}
              />
            )}
          </div>
        </div>

        {/* STEP 2: AIキャプションを生成（日本語＆英語） */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <StepHeader
            num="2"
            title="AIキャプションを生成（日本語＆英語）"
            active={isGenerating || isTranslating || (!!japanesePost && !englishPost)}
            done={!!englishPost}
          />
          <p className="text-xs text-gray-500 mb-4">
            マーケター → コピーライター → コンサルタントの3者で日本語キャプションを練り上げ、英語に自動翻訳します。
          </p>

          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full py-3 bg-gradient-to-r from-orange-400 to-pink-600 hover:from-orange-500 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {statusMessage || (currentAgent ? `${currentAgent} 作業中...` : '日本語ドラフト作成中...')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {japanesePost ? 'キャプションを再生成' : 'キャプションを生成'}
              </>
            )}
          </button>

          {!canGenerate && !isGenerating && !japanesePost && (
            <p className="mt-3 text-xs text-gray-400 text-center">
              店名と「口コミ承認」または「感想入力」のいずれかが必要です
            </p>
          )}

          {/* Agent stream log */}
          {agentMessages.length > 0 && (
            <details className="mt-4 border border-gray-100 rounded-lg overflow-hidden">
              <summary className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 cursor-pointer">
                エージェントの議論ログ ({agentMessages.length})
              </summary>
              <div className="divide-y divide-gray-100">
                {agentMessages.map((m, i) => (
                  <div key={i} className="p-3">
                    <div className="text-[11px] font-semibold text-orange-600 mb-1">
                      Round {m.round} · {m.name}
                    </div>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Fallback for Japanese generation (prompt mode) */}
          {generateFallbackPrompt && (
            <div className="mt-4">
              <PromptFallbackPanel
                prompts={generateFallbackPrompt.prompts}
                reason={generateFallbackPrompt.reason || 'prompt_only'}
                errorMessage={generateFallbackPrompt.message}
                placeholder="外部AIで生成した日本語Instagramキャプションをここに貼り付けてください（本文＋ハッシュタグ）"
                saveLabel="日本語キャプションを保存して英語化"
                onSave={handleSaveManualJapanese}
              />
            </div>
          )}

          {/* Japanese result (inline) */}
          {japanesePost && (
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs font-semibold text-gray-600">日本語キャプション</span>
                </div>
                <textarea
                  value={japanesePost}
                  onChange={(e) => setJapanesePost(e.target.value)}
                  rows={10}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                  <span>{japanesePost.length} 文字</span>
                  <button
                    onClick={() => copy(japanesePost, 'ja')}
                    className="flex items-center gap-1 hover:text-gray-600 transition-colors"
                  >
                    {copiedField === 'ja' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copiedField === 'ja' ? 'コピー済み' : 'コピー'}
                  </button>
                </div>
              </div>

              {/* English result */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-semibold text-blue-600">英語キャプション（自動翻訳）</span>
                </div>

                {isTranslating && (
                  <div className="flex items-center gap-2 py-2.5 px-3 bg-blue-50 rounded-lg text-sm text-blue-600">
                    <span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
                    英語に翻訳中...
                  </div>
                )}

                {translateFallbackPrompt && !isTranslating && (
                  <PromptFallbackPanel
                    prompts={translateFallbackPrompt.prompts}
                    reason={translateFallbackPrompt.reason || 'prompt_only'}
                    errorMessage={translateFallbackPrompt.message}
                    placeholder="外部AIで翻訳した英語Instagramキャプションをここに貼り付けてください"
                    saveLabel="英語版を保存"
                    onSave={(text) => {
                      if (!text.trim()) return;
                      setEnglishPost(text);
                      setTranslateFallbackPrompt(null);
                    }}
                  />
                )}

                {englishPost && !isTranslating && (
                  <div>
                    <textarea
                      value={englishPost}
                      onChange={(e) => setEnglishPost(e.target.value)}
                      rows={10}
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className={englishPost.length > 2200 ? 'text-red-500 font-semibold' : 'text-gray-400'}>
                        {englishPost.length} / 2200 characters
                        {englishPost.length > 2200 && ` — ${englishPost.length - 2200} over limit`}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleTranslate()}
                          disabled={isTranslating}
                          className="flex items-center gap-1 hover:text-gray-600 disabled:opacity-50 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          もう一度翻訳
                        </button>
                        <button
                          onClick={() => copy(englishPost, 'en')}
                          className="flex items-center gap-1 hover:text-gray-600 transition-colors"
                        >
                          {copiedField === 'en' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          {copiedField === 'en' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
        )}

        {/* Reset */}
        {(restaurantName || japanesePost) && (
          <div className="text-center pt-4">
            <button
              onClick={handleResetAll}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              すべてリセット
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
