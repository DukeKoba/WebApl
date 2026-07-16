import React from 'react';
import { Twitter, Instagram, Copy, Check, ExternalLink } from 'lucide-react';

export default function PostPreview({ platform, text, onChange, imageUrl, postId, onPublish, isPublishing, status }) {
  const [copied, setCopied] = React.useState(false);
  const isX = platform === 'x';
  const charLimit = isX ? 280 : 2200;
  // Instagram モードはラーメン専用で英語UI、X モードは日本語UI（英検/AI教育/ITパスポート）
  const t = isX
    ? { header: 'X (Twitter) プレビュー', posted: '投稿済み', postText: '投稿文', copyTitle: 'コピー', copied: 'コピーしました！', copyBtn: 'テキストをコピー', placeholder: '投稿文が生成されるとここに表示されます...', overLimit: 'Xの文字数制限を超えています', posting: '投稿中...', publish: 'Xに自動投稿', hint: '' }
    : { header: 'Instagram preview', posted: 'Posted', postText: 'Caption', copyTitle: 'Copy', copied: 'Copied!', copyBtn: 'Copy caption', placeholder: 'Your caption will appear here once generated...', overLimit: 'Caption exceeds Instagram limit', posting: '', publish: '', hint: 'Copy the caption, then paste it into a new Instagram post in the app.' };
  // Xの加重文字数: URLは一律23単位、全角(CJK・かな・絵文字等)は2単位、半角は1単位。上限280単位
  const calcXLength = (t) => {
    if (!t) return 0;
    const URL_SENTINEL = '\u0000';
    const stripped = t.replace(/https?:\/\/\S+/g, URL_SENTINEL);
    let units = 0;
    for (const ch of stripped) {
      if (ch === URL_SENTINEL) units += 23;
      else units += ch.codePointAt(0) > 0x10ff ? 2 : 1;
    }
    return units;
  };
  const charCount = isX ? calcXLength(text) : (text?.length || 0);
  const overLimit = charCount > charLimit;

  const handleCopy = () => {
    navigator.clipboard.writeText(text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b border-gray-100 ${isX ? 'bg-black' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}>
        {isX ? (
          <Twitter className="w-5 h-5 text-white" />
        ) : (
          <Instagram className="w-5 h-5 text-white" />
        )}
        <span className="text-white font-semibold text-sm">
          {t.header}
        </span>
        {status === 'posted' && (
          <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">{t.posted}</span>
        )}
      </div>

      {/* Image preview (Instagram only) */}
      {!isX && imageUrl && (
        <div className="aspect-square bg-gray-100 overflow-hidden">
          <img src={imageUrl} alt="ramen" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Post text */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">{t.postText}</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${overLimit ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
              {charCount} / {charLimit}
            </span>
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title={t.copyTitle}
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {onChange ? (
          <textarea
            value={text || ''}
            onChange={e => onChange(e.target.value)}
            rows={isX ? 4 : 6}
            className={`w-full text-sm border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 ${
              overLimit
                ? 'border-red-300 focus:ring-red-300'
                : 'border-gray-200 focus:ring-blue-300'
            }`}
            placeholder={t.placeholder}
          />
        ) : (
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{text}</p>
        )}

        {overLimit && (
          <p className="text-xs text-red-500 mt-1">{t.overLimit}</p>
        )}
      </div>

      {/* Action buttons */}
      {postId && text && (
        <div className="px-4 pb-4 space-y-2">
          {/* Copy button (both platforms) */}
          <button
            onClick={handleCopy}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
              copied
                ? 'bg-green-500 text-white'
                : isX
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
            }`}
          >
            {copied ? (
              <><Check className="w-4 h-4" />{t.copied}</>
            ) : (
              <><Copy className="w-4 h-4" />{t.copyBtn}</>
            )}
          </button>

          {/* X direct post button */}
          {isX && onPublish && (
            <button
              onClick={() => onPublish(postId)}
              disabled={isPublishing || overLimit}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white disabled:bg-gray-300"
            >
              {isPublishing ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t.posting}</>
              ) : (
                <><Twitter className="w-4 h-4" />{t.publish}</>
              )}
            </button>
          )}

          {/* Instagram open app hint */}
          {!isX && (
            <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {t.hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
