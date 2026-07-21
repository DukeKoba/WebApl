import React, { useState } from 'react';
import { CATEGORIES, emptyPolicy } from '../schema';

// 保険1件の入力フォーム。手入力・AI結果の確認/修正で共用(45号 実装1本化)。
// 必須確認は6項目(会社名/種類/金額/証券番号/受取人/連絡先)。その他は「補足メモ」に畳む。

const FIELDS = [
  { key: 'insurerName', label: '保険会社', placeholder: '例: ○○生命保険', required: true },
  { key: 'category', label: '保険の種類', type: 'select', required: true },
  { key: 'amount', label: '保障の内容(もしものときの金額)', placeholder: '例: 300万円 / 入院日額5,000円', required: true },
  { key: 'policyNumber', label: '証券番号', placeholder: '例: 12-3456789' },
  { key: 'beneficiary', label: '受取人(保険金を受け取る人)', placeholder: '例: 山田 花子(長女)' },
  { key: 'phone', label: '保険会社・代理店の電話', placeholder: '例: 0120-000-000', inputMode: 'tel' },
  { key: 'productName', label: '商品名(わかれば)', placeholder: '例: 終身保険○○' },
  { key: 'insured', label: '保険がかけられている人', placeholder: '例: 山田 太郎' },
  { key: 'maturity', label: '満期・保険期間', placeholder: '例: 終身 / 2040年6月' },
  { key: 'premium', label: '保険料', placeholder: '例: 月額8,540円' },
  { key: 'location', label: '証券の保管場所', placeholder: '例: 寝室のたんす2段目' },
  { key: 'memo', label: '補足メモ(特約など)', type: 'textarea' },
];

export default function PolicyEditor({ policy, onSave, onCancel, showConfidence }) {
  const [draft, setDraft] = useState(() => ({ ...emptyPolicy(), ...policy }));
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  const low = showConfidence && draft.confidence === 'low';

  const save = () => {
    onSave({ ...draft, confirmedAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-4">
      {low && (
        <div className="rounded-lg bg-amber-50 border border-amber-300 p-3 text-sm text-amber-900">
          ⚠ この保険は読み取りの確信度が低めです。特に「金額」と「証券番号」を、お手元の証券と見くらべて確かめてください。
        </div>
      )}

      {FIELDS.map((f) => (
        <div key={f.key}>
          <label className="block text-base font-medium text-stone-700 mb-1">
            {f.label}
            {f.required && <span className="text-orange-600 text-sm">（必須）</span>}
          </label>
          {f.type === 'select' ? (
            <select
              value={draft[f.key] || ''}
              onChange={set(f.key)}
              className="w-full rounded-lg border border-stone-300 px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">選んでください</option>
              {CATEGORIES.filter((c) => c !== '不明').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : f.type === 'textarea' ? (
            <textarea
              value={draft[f.key] || ''}
              onChange={set(f.key)}
              rows={2}
              placeholder={f.placeholder}
              className="w-full rounded-lg border border-stone-300 px-3 py-3 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          ) : (
            <input
              type="text"
              inputMode={f.inputMode}
              value={draft[f.key] || ''}
              onChange={set(f.key)}
              placeholder={f.placeholder}
              className="w-full rounded-lg border border-stone-300 px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-stone-300 py-3 text-lg font-semibold text-stone-600 hover:bg-stone-50"
          >
            もどる
          </button>
        )}
        <button
          onClick={save}
          disabled={!draft.insurerName?.trim()}
          className="flex-1 rounded-lg bg-emerald-700 py-3 text-lg font-semibold text-white hover:bg-emerald-800 disabled:bg-stone-300"
        >
          この内容で保存
        </button>
      </div>
    </div>
  );
}
