import React, { useState } from 'react';
import { ArrowLeft, Camera, Loader2, X, Lock } from 'lucide-react';
import { normalizeExtracted } from '../schema';

// 経路C: 運営APIキーがある場合の直接読み取り。証券写真をアップロード → サーバーがメモリ上でOCR → 結果を返す。
// 画像はサーバーに保存されず、AI処理後に破棄される(45号 §7.3)。キーが無いときは呼ばれない(経路Bにフォールバック)。
export default function OcrUpload({ onExtracted, onBack, onManual }) {
  const [files, setFiles] = useState([]); // {id, file, url}
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const addFiles = (list) => {
    const picked = Array.from(list || []).filter((f) => f.type.startsWith('image/')).slice(0, 4 - files.length);
    setFiles((prev) => [...prev, ...picked.map((f) => ({ id: crypto.randomUUID(), file: f, url: URL.createObjectURL(f) }))].slice(0, 4));
  };
  const remove = (id) => setFiles((prev) => {
    const target = prev.find((x) => x.id === id);
    if (target) URL.revokeObjectURL(target.url);
    return prev.filter((x) => x.id !== id);
  });

  const run = async () => {
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('images', f.file));
      const resp = await fetch('/api/family-sheet/extract', { method: 'POST', body: fd });
      const data = await resp.json();
      if (!data.ok) {
        if (data.code === 'AI_DISABLED') { onManual('paste'); return; } // 経路Bへ
        setError(data.message || 'うまく読み取れませんでした。もう一度お試しいただくか、手入力に切り替えてください。');
        return;
      }
      const { policies, warnings } = normalizeExtracted(data);
      if (policies.length === 0) {
        setError('保険の情報が見つかりませんでした。証券全体が写るように撮り直すか、手入力をご利用ください。');
        return;
      }
      onExtracted(policies, warnings);
    } catch {
      setError('通信に失敗しました。電波の良い場所でもう一度お試しください。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-stone-500 hover:text-stone-700">
        <ArrowLeft className="w-5 h-5" /> もどる
      </button>

      <div>
        <h2 className="text-2xl font-bold text-stone-900">証券の写真で読み取る</h2>
        <p className="mt-2 leading-relaxed text-stone-600">
          保険証券や、保険会社マイページの画面写真を選んでください。AIが内容を読み取って一覧にします。
        </p>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-stone-500">
          <Lock className="mt-0.5 w-4 h-4 flex-shrink-0" />
          写真は読み取りにのみ使われ、サーバーに保存されません。読み取り後すぐ破棄されます。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {files.map((f) => (
          <div key={f.id} className="relative overflow-hidden rounded-lg border border-stone-200">
            <img src={f.url} alt="証券" className="h-32 w-full object-cover" />
            <button onClick={() => remove(f.id)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {files.length < 4 && (
          <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-50">
            <Camera className="w-7 h-7" />
            <span className="text-sm font-semibold">写真を追加</span>
            <input type="file" accept="image/*" capture="environment" multiple className="hidden"
                   onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>
      <p className="text-sm text-stone-500">最大4枚まで。証券が複数ページある場合は続けて追加してください。</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={run}
        disabled={files.length === 0 || busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 py-4 text-lg font-semibold text-white hover:bg-emerald-800 disabled:bg-stone-300"
      >
        {busy ? <><Loader2 className="w-5 h-5 animate-spin" />読み取り中…（20秒ほど）</> : 'この写真を読み取る'}
      </button>

      <button onClick={() => onManual('manual')} className="w-full text-center text-emerald-700 underline">
        写真がうまくいかないときは「自分で入力する」
      </button>
    </div>
  );
}
