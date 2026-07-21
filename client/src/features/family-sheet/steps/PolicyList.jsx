import React, { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowRight, AlertTriangle } from 'lucide-react';
import PolicyEditor from './PolicyEditor';
import { emptyPolicy, policySummary } from '../schema';

// 登録済み保険の一覧・追加・編集・削除 → シート作成へ。
export default function PolicyList({ policies, warnings, onSave, onDelete, onNext, onBack }) {
  const [editing, setEditing] = useState(null); // policy object or null
  const [creating, setCreating] = useState(false);

  if (creating || editing) {
    const target = editing || emptyPolicy();
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-stone-900">{editing ? '内容を直す' : '保険を追加する'}</h2>
        <PolicyEditor
          policy={target}
          showConfidence={!!editing}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSave={(p) => { onSave(p); setEditing(null); setCreating(false); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-stone-900">登録した保険({policies.length}件)</h2>

      {warnings?.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-300 p-3 text-sm text-amber-900">
          <div className="flex items-center gap-1.5 font-semibold mb-1">
            <AlertTriangle className="w-4 h-4" />読み取りで気になった点
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {policies.length === 0 && (
        <p className="text-stone-500">
          まだ保険が登録されていません。まずは1件、いちばん大事な保険から入れてみましょう。
        </p>
      )}

      {policies.map((p) => (
        <div key={p.id} className="rounded-xl border border-stone-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold text-stone-900">{policySummary(p)}</div>
              <div className="text-sm text-stone-600 mt-0.5">
                {[p.category, p.amount, p.beneficiary && `受取: ${p.beneficiary}`].filter(Boolean).join(' / ') || '（内容未入力）'}
              </div>
              {p.confidence === 'low' && (
                <div className="mt-1 text-xs text-amber-700">⚠ 金額・番号を要確認</div>
              )}
            </div>
            <div className="flex flex-shrink-0 gap-1">
              <button onClick={() => setEditing(p)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100" title="直す">
                <Pencil className="w-5 h-5" />
              </button>
              <button onClick={() => onDelete(p.id)} className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-500" title="削除">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={() => setCreating(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 py-3 text-lg font-semibold text-stone-600 hover:border-emerald-400 hover:text-emerald-700"
      >
        <Plus className="w-5 h-5" />もう1件 追加する
      </button>

      <p className="text-sm text-stone-500">
        💡 かんぽ・共済・勤務先の団体保険、自動車・火災保険も忘れずに。
      </p>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="rounded-lg border border-stone-300 px-5 py-3 text-lg font-semibold text-stone-600 hover:bg-stone-50">
          もどる
        </button>
        <button
          onClick={onNext}
          disabled={policies.length === 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 py-3 text-lg font-semibold text-white hover:bg-emerald-800 disabled:bg-stone-300"
        >
          この内容ですすむ <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
