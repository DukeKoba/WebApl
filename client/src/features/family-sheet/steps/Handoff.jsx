import React, { useRef, useState } from 'react';
import { Download, Upload, Check } from 'lucide-react';
import { serializeSheet, parseSheetHandoff } from '../schema';

// 引き継ぎ・バックアップ。サーバーを介さずファイルで手渡しする(プライバシー維持)。
// 使いどころ:
//  ・代理店が入力を手伝い、下書きファイルを契約者に渡す
//  ・別の端末に移す / あとで続きを入力する(バックアップ)

function download(sheet) {
  const blob = new Blob([serializeSheet(sheet)], { type: 'application/json' });
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = URL.createObjectURL(blob);
  a.download = `保険家族シート下書き_${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// 下書きの保存(書き出し)ボタン
export function HandoffExport({ sheet, note }) {
  const [done, setDone] = useState(false);
  const handle = () => {
    download(sheet);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };
  return (
    <div className="rounded-xl border border-amber-100 bg-white p-4">
      <div className="font-semibold text-stone-500">下書きを保存・引き継ぐ</div>
      <p className="mt-1 text-sm text-stone-600">
        {note || '入力した内容をファイルに保存できます。別の端末に移したいときや、あとで続きを入力したいときにどうぞ。'}
      </p>
      <button
        onClick={handle}
        className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 font-semibold text-emerald-800 hover:bg-emerald-100"
      >
        {done ? <><Check className="w-5 h-5" />保存しました</> : <><Download className="w-5 h-5" />下書きファイルを保存</>}
      </button>
    </div>
  );
}

// 下書きの取り込み(読み込み)。onImport(sheet) で丸ごと置き換える。
export function HandoffImport({ onImport, onCancel }) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');

  const pick = () => inputRef.current?.click();
  const onFile = async (e) => {
    setError('');
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const res = parseSheetHandoff(text);
    if (!res.ok) { setError(res.error); return; }
    onImport(res.sheet);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-stone-900">下書きを読み込む</h2>
        <p className="mt-2 leading-relaxed text-stone-600">
          代理店の担当者に作ってもらった下書きファイル、または以前保存したファイルを読み込みます。
        </p>
      </div>
      <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
      <button
        onClick={pick}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 py-4 text-lg font-semibold text-white hover:bg-emerald-800"
      >
        <Upload className="w-5 h-5" />ファイルを選ぶ
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-sm text-stone-500">
        ※ 読み込むと、いま入力している内容は置きかわります。
      </p>
      {onCancel && (
        <button onClick={onCancel} className="w-full text-center text-stone-500 underline">もどる</button>
      )}
    </div>
  );
}
