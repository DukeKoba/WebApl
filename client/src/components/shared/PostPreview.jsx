import React from 'react';
import { Instagram, Copy, Check, ExternalLink, CornerDownRight, Layers, MessageSquare, AlertCircle } from 'lucide-react';
import { xLength } from '../../utils/xText';
import XLogo from './XLogo';

export default function PostPreview({
  platform = 'x',
  text,
  onChange,
  imageUrl,
  postId,
  onPublish,
  isPublishing,
  status,
  ctaText,
  isThread = false,
  threadPosts = [],
  onThreadChange,
}) {
  const [copied, setCopied] = React.useState(false);
  const [copiedIndex, setCopiedIndex] = React.useState(null);
  const isX = platform === 'x';
  const charLimit = isX ? 280 : 2200;

  const t = isX
    ? {
        header: isThread ? 'X (Twitter) スレッドプレビュー' : 'X (Twitter) プレビュー',
        posted: '投稿済み',
        postText: isThread ? 'スレッド投稿' : '投稿文',
        copyTitle: 'コピー',
        copied: 'コピーしました！',
        copyBtn: isThread ? '全ツイートを一括コピー' : 'テキストをコピー',
        placeholder: '投稿文が生成されるとここに表示されます...',
        overLimit: 'Xの文字数制限を超えています',
        posting: '投稿中...',
        publish: isThread ? 'スレッドを一括連投' : 'Xに自動投稿',
        hint: '',
      }
    : {
        header: 'Instagram preview',
        posted: 'Posted',
        postText: 'Caption',
        copyTitle: 'Copy',
        copied: 'Copied!',
        copyBtn: 'Copy caption',
        placeholder: 'Your caption will appear here once generated...',
        overLimit: 'Caption exceeds Instagram limit',
        posting: '',
        publish: '',
        hint: 'Copy the caption, then paste it into a new Instagram post in the app.',
      };

  const charCount = isX ? xLength(text) : (text?.length || 0);
  const overLimit = charCount > charLimit;
  const ctaOverLimit = isX && ctaText ? xLength(ctaText) > charLimit : false;

  const threadOverLimits = isThread
    ? threadPosts.map(p => xLength(p) > charLimit)
    : [];
  const anyThreadOverLimit = threadOverLimits.some(Boolean);

  const handleCopy = () => {
    if (isThread && threadPosts.length > 0) {
      navigator.clipboard.writeText(threadPosts.join('\n\n---\n\n'));
    } else {
      navigator.clipboard.writeText(text || '');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySingle = (singleText, idx) => {
    navigator.clipboard.writeText(singleText || '');
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleThreadItemChange = (idx, newText) => {
    if (!onThreadChange) return;
    const updated = [...threadPosts];
    updated[idx] = newText;
    onThreadChange(updated);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b border-gray-100 ${
          isX ? (isThread ? 'bg-gradient-to-r from-blue-900 to-indigo-900' : 'bg-black') : 'bg-gradient-to-r from-purple-500 to-pink-500'
        }`}
      >
        {isX ? (
          isThread ? <Layers className="w-4 h-4 text-cyan-400" /> : <XLogo className="w-4 h-4 text-white" />
        ) : (
          <Instagram className="w-5 h-5 text-white" />
        )}
        <span className="text-white font-semibold text-sm">{t.header}</span>
        {isThread && (
          <span className="text-xs bg-cyan-500/30 text-cyan-200 font-medium px-2 py-0.5 rounded">
            {threadPosts.length}連ツイート
          </span>
        )}
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

      {/* Thread View */}
      {isThread && threadPosts.length > 0 ? (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              スレッド（ツリー）構成
            </span>
            <button
              onClick={handleCopy}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '一括コピー完了' : '全件コピー'}
            </button>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-200">
            {threadPosts.map((postItem, idx) => {
              const count = xLength(postItem);
              const isOver = count > charLimit;
              const isFirst = idx === 0;
              const isLast = idx === threadPosts.length - 1;

              return (
                <div key={idx} className="relative">
                  <span
                    className={`absolute -left-6 top-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                      isFirst ? 'bg-blue-600' : isLast ? 'bg-indigo-600' : 'bg-gray-400'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-gray-600">
                        {isFirst ? '1. フック（第1ツイート）' : isLast ? `${idx + 1}. まとめ＆CTA（最終ツイート）` : `${idx + 1}. 解説・ポイント`}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] ${isOver ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                          {count} / {charLimit}
                        </span>
                        <button
                          onClick={() => handleCopySingle(postItem, idx)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="このツイートをコピー"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {onThreadChange ? (
                      <textarea
                        value={postItem}
                        onChange={(e) => handleThreadItemChange(idx, e.target.value)}
                        rows={3}
                        className={`w-full text-sm border rounded-lg p-2.5 resize-none bg-white focus:outline-none focus:ring-2 ${
                          isOver ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-blue-300'
                        }`}
                      />
                    ) : (
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{postItem}</p>
                    )}

                    {isOver && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        このツイートが文字数上限を超えています
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Single Post View */
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
              onChange={(e) => onChange(e.target.value)}
              rows={isX ? 5 : 6}
              className={`w-full text-sm border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 ${
                overLimit ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-blue-300'
              }`}
              placeholder={t.placeholder}
            />
          ) : (
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{text}</p>
          )}

          {overLimit && <p className="text-xs text-red-500 mt-1">{t.overLimit}</p>}
        </div>
      )}

      {/* CTA リプライ */}
      {!isThread && isX && ctaText && (
        <div className="mx-4 mb-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5" />
              自動でぶら下げるリプライ
            </span>
            <span className={`text-xs ${ctaOverLimit ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
              {xLength(ctaText)} / {charLimit}
            </span>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-all">{ctaText}</p>
          <p className="text-xs text-gray-400 mt-2">
            アプリのリンクは本文ではなくこのリプライに入ります（本文にURLを入れると表示回数が落ちるため）
          </p>
        </div>
      )}

      {/* Action buttons */}
      {postId && (text || (isThread && threadPosts.length > 0)) && (
        <div className="px-4 pb-4 space-y-2">
          {/* Copy button */}
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
              disabled={isPublishing || (isThread ? anyThreadOverLimit : overLimit || ctaOverLimit)}
              className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 text-white disabled:bg-gray-300 ${
                isThread ? 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800' : 'bg-black hover:bg-gray-800'
              }`}
            >
              {isPublishing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {isThread ? 'スレッドを投稿中...' : t.posting}
                </>
              ) : (
                <>
                  <XLogo className="w-4 h-4" />
                  {isThread ? 'Xにスレッドを一括連投' : ctaText ? 'Xに投稿（リプライも自動）' : t.publish}
                </>
              )}
            </button>
          )}

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
