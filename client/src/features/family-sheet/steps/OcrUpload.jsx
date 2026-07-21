import React, { useState } from 'react';
import { ArrowLeft, Camera, Loader2, X, Lock, Sparkles } from 'lucide-react';
import { normalizeExtracted } from '../schema';
import { runOcr, ocrToPolicies } from '../ocrClient';

// 証券写真の読み取り。
// ・テスト版(既定): ブラウザ内の無料OCR(Tesseract.js)。画像は端末から出ず、費用もキーも不要。
// ・有料版(aiEnabled=true): サーバーの Claude Vision(/api/family-sheet/extract)で高精度に。
export default function OcrUpload({ onExtracted, onBack, onManual, aiEnabled }) {
  const [files, setFiles] = useState([]); // {id, file, url}
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
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

  // 有料版: サーバーの Claude Vision に投げる
  const runServer = async () => {
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f.file));
    const resp = await fetch('/api/family-sheet/extract', { method: 'POST', body: fd });
    const data = await resp.json();
    if (!data.ok) {
      if (data.code === 'AI_DISABLED') return null; // キーが外れた等 → クライアントOCRにフォールバック
      throw new Error(data.message || 'server_failed');
    }
    return normalizeExtracted(data);
  };

  // テスト版: ブラウザ内OCR
  const runClient = async () => {
    setProgress(0);
    const texts = await runOcr(files.map((f) => f.file), setProgress);
    return ocrToPolicies(texts);
  };

  const run = async () => {
    setError('');
    setBusy(true);
    try {
      let result = null;
      if (aiEnabled) {
        try { result = await runServer(); } catch { result = null; }
      }
      if (!result) result = await runClient();
      const { policies, warnings } = result;
      if (!policies || policies.length === 0) {
        setError('文字をうまく読み取れませんでした。明るい場所で、文字が水平になるように撮り直すか、「自分で入力する」をご利用ください。');
        return;
      }
      onExtracted(policies, warnings);
    } catch {
      setError('読み取り中にエラーが発生しました。もう一度お試しいただくか、「自分で入力する」をご利用ください。');
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
        {!aiEnabled && (
          <span className="mt-1 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            ベータ版（かんたん読み取り）
          </span>
        )}
        <p className="mt-2 leading-relaxed text-stone-600">
          保険証券や、保険会社マイページの画面写真を選んでください。文字を読み取って、わかる項目を自動で入力します。
        </p>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-stone-500">
          <Lock className="mt-0.5 w-4 h-4 flex-shrink-0" />
          {aiEnabled
            ? '写真は読み取りにのみ使われ、サーバーに保存されません。読み取り後すぐ破棄されます。'
            : '読み取りはすべてこの端末（ブラウザ）の中で行われ、写真はどこにも送信されません。'}
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
        {busy
          ? <><Loader2 className="w-5 h-5 animate-spin" />読み取り中… {Math.round(progress * 100)}%</>
          : 'この写真を読み取る'}
      </button>
      {busy && !aiEnabled && (
        <p className="text-center text-xs text-stone-400">
          初回は読み取り用データ（数MB）の準備に少し時間がかかります。
        </p>
      )}

      {!aiEnabled && (
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
          <div className="flex items-center gap-1.5 font-semibold text-stone-700">
            <Sparkles className="w-4 h-4 text-emerald-600" />もっと正確に読み取りたいとき
          </div>
          <p className="mt-1">
            お手持ちの無料AI（Claude・ChatGPT）に読み取ってもらう方法もあります。細かい特約まで整理できます。
          </p>
          <button onClick={() => onManual('paste')} className="mt-1 text-emerald-700 underline">
            自分のAIで読み取る方法にする
          </button>
        </div>
      )}

      <button onClick={() => onManual('manual')} className="w-full text-center text-emerald-700 underline">
        写真がうまくいかないときは「自分で入力する」
      </button>
    </div>
  );
}
