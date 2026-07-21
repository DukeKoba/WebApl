import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Palette, Upload } from 'lucide-react';
import { authFetch } from '../../utils/api';

const ACCENTS = [
  { value: 'violet', label: 'Cocreo', className: 'bg-violet-600' },
  { value: 'blue', label: '信頼', className: 'bg-sky-600' },
  { value: 'emerald', label: '改善', className: 'bg-emerald-600' },
];

// 代理店B2Bで刺さる図解フォーマット。数字・Before/After・チェックは特に保存されやすい。
const TEMPLATES = [
  { value: 'quote', label: 'フック' },
  { value: 'number', label: '数字' },
  { value: 'beforeafter', label: 'Before/After' },
  { value: 'checklist', label: 'チェック' },
];

const TEMPLATE_DEFAULTS = {
  quote: {},
  number: { eyebrow: '保険代理店の事務コスト', bigNumber: '年間240時間', caption: '申込書の転記だけで、募集人1人がこれだけ使っています。', footnote: '※月20件 × 1件60分で試算' },
  beforeafter: { eyebrow: '申込書の入力業務', beforeLabel: '今', beforeText: '紙・FAX→手入力\n1件12分\nミスの確認も手作業', afterLabel: 'AI導入後', afterText: 'AIが読取→確認だけ\n1件38秒\n不備は自動で警告' },
  checklist: { eyebrow: '2026年 保険業法改正', title: '対応できていますか？', items: '意向把握の記録が募集人メモ頼りになっていない\n乗合の比較推奨理由を書面で残している\n高齢者募集の複数回面談が運用されている' },
};

const TEMPLATE_FIELDS = {
  quote: [],
  number: [
    { key: 'eyebrow', label: '上部ラベル' },
    { key: 'bigNumber', label: '大きく見せる数字' },
    { key: 'caption', label: '説明文' },
    { key: 'footnote', label: '注記' },
  ],
  beforeafter: [
    { key: 'eyebrow', label: '上部ラベル' },
    { key: 'beforeText', label: 'Before（改行可）', multiline: true },
    { key: 'afterText', label: 'After（改行可）', multiline: true },
  ],
  checklist: [
    { key: 'eyebrow', label: '上部ラベル' },
    { key: 'title', label: 'タイトル' },
    { key: 'items', label: '項目（1行=1項目・最大4）', multiline: true },
  ],
};

export default function AgentDxImageStudio({ postId, postText, imageUrl, onImageSet, onError }) {
  const [headline, setHeadline] = useState('');
  const [accent, setAccent] = useState('violet');
  const [template, setTemplate] = useState('quote');
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const firstLine = String(postText || '').split('\n').find(line => line.trim()) || '';
    setHeadline(firstLine.replace(/https?:\/\/\S+/g, '').slice(0, 44));
  }, [postId, postText]);

  // テンプレ切替時に既定値をセット（数字カード等はそのまま使える例が入る）
  useEffect(() => { setFields({ ...TEMPLATE_DEFAULTS[template] }); }, [template]);

  const setField = (k) => (e) => setFields(prev => ({ ...prev, [k]: e.target.value }));

  const generate = async () => {
    setBusy('generate');
    try {
      const res = await authFetch(`/agentdx/posts/${postId}/image/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, accent, template, fields, kicker: 'AIで、代理店の現場を前へ。' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onImageSet(`${data.image_url}?v=${Date.now()}`);
    } catch (err) {
      onError(err.message || '画像生成に失敗しました。');
    } finally {
      setBusy('');
    }
  };

  const upload = async (file) => {
    if (!file) return;
    setBusy('upload');
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await authFetch(`/agentdx/posts/${postId}/image/upload`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onImageSet(`${data.image_url}?v=${Date.now()}`);
    } catch (err) {
      onError(err.message || '画像添付に失敗しました。');
    } finally {
      setBusy('');
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (!postId) return null;

  return (
    <section className="rounded-xl border border-violet-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <ImagePlus className="h-5 w-5 text-violet-600" />
        <div><h2 className="font-bold text-gray-900">投稿イメージ</h2><p className="text-xs text-gray-500">投稿文と一緒に自動生成されます。見出し変更・再生成・手元画像への差し替えもできます。</p></div>
      </div>

      {imageUrl && <img src={imageUrl} alt="X投稿添付" className="mt-4 aspect-video w-full rounded-xl border border-gray-200 object-cover" />}

      <label className="mt-4 block text-xs font-medium text-gray-600">図解フォーマット</label>
      <div className="mt-1 grid grid-cols-4 gap-1.5">
        {TEMPLATES.map(tpl => (
          <button
            key={tpl.value}
            onClick={() => setTemplate(tpl.value)}
            className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${template === tpl.value ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {tpl.label}
          </button>
        ))}
      </div>

      {template === 'quote' ? (
        <>
          <label className="mt-3 block text-xs font-medium text-gray-600">画像の見出し</label>
          <input value={headline} onChange={event => setHeadline(event.target.value)} maxLength={44} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
        </>
      ) : (
        <div className="mt-3 space-y-2">
          {TEMPLATE_FIELDS[template].map(f => (
            <div key={f.key}>
              <label className="block text-[11px] font-medium text-gray-500">{f.label}</label>
              {f.multiline ? (
                <textarea value={fields[f.key] || ''} onChange={setField(f.key)} rows={2} className="mt-0.5 w-full resize-none rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
              ) : (
                <input value={fields[f.key] || ''} onChange={setField(f.key)} className="mt-0.5 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Palette className="h-4 w-4 text-gray-400" />
        {ACCENTS.map(item => (
          <button key={item.value} onClick={() => setAccent(item.value)} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${accent === item.value ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-500'}`}>
            <span className={`h-3 w-3 rounded-full ${item.className}`} />{item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={generate} disabled={Boolean(busy) || (template === 'quote' && !headline.trim())} className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:bg-gray-300">
          {busy === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}画像を自動生成
        </button>
        <button onClick={() => inputRef.current?.click()} disabled={Boolean(busy)} className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:text-gray-300">
          {busy === 'upload' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}手元画像を添付
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={event => upload(event.target.files?.[0])} />
      </div>
    </section>
  );
}
