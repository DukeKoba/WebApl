import React from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { emptyContact } from '../schema';

const MESSAGE_SAMPLES = [
  'いままでありがとう。お金のことで困らないように、保険のことをまとめておきました。',
  '万一のときは、この紙を見て落ちついて進めてください。あわてなくて大丈夫です。',
  'いつも支えてくれてありがとう。大切なことなので、ここに残しておきます。',
];

// 緊急連絡先(最大3人)+ 家族へのひとこと。両方スキップ可。
export default function Extra({ sheet, update, onNext, onBack }) {
  const contacts = sheet.contacts.length ? sheet.contacts : [emptyContact()];

  const setContact = (id, key, value) => {
    update({ contacts: contacts.map((c) => (c.id === id ? { ...c, [key]: value } : c)) });
  };
  const addContact = () => {
    if (contacts.length >= 3) return;
    update({ contacts: [...contacts, emptyContact()] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-stone-900">あと少しで完成です</h2>
        <p className="mt-1 text-stone-500">どちらも「あとで書く」で飛ばせます。</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-emerald-800">■ もしものときの連絡先</h3>
        <p className="text-sm text-stone-500">家族が最初に電話する相手(最大3人)</p>
        {contacts.map((c) => (
          <div key={c.id} className="grid grid-cols-1 gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-3">
            <input value={c.name} onChange={(e) => setContact(c.id, 'name', e.target.value)} placeholder="お名前 例: 山田 花子"
              className="rounded-lg border border-stone-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            <input value={c.relation} onChange={(e) => setContact(c.id, 'relation', e.target.value)} placeholder="続き柄 例: 長女"
              className="rounded-lg border border-stone-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            <input value={c.phone} onChange={(e) => setContact(c.id, 'phone', e.target.value)} inputMode="tel" placeholder="電話番号"
              className="rounded-lg border border-stone-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        ))}
        {contacts.length < 3 && (
          <button onClick={addContact} className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <Plus className="w-4 h-4" />もう1人 追加する
          </button>
        )}
        <div>
          <label className="block text-base font-medium text-stone-700 mb-1">担当の保険屋さん(いれば)</label>
          <input value={sheet.agencyContact} onChange={(e) => update({ agencyContact: e.target.value })}
            placeholder="例: ○○保険事務所 佐藤さん 03-0000-0000"
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-bold text-emerald-800">■ ご家族へのひとこと(任意)</h3>
        <textarea value={sheet.message} onChange={(e) => update({ message: e.target.value })} rows={3}
          placeholder="例: いままでありがとう。お金のことで困らないようにまとめておきました。"
          className="w-full rounded-lg border border-stone-300 p-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        <div className="flex flex-wrap gap-2">
          {MESSAGE_SAMPLES.map((s, i) => (
            <button key={i} onClick={() => update({ message: s })}
              className="rounded-full border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50">
              文例{i + 1}
            </button>
          ))}
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="rounded-lg border border-stone-300 px-5 py-3 text-lg font-semibold text-stone-600 hover:bg-stone-50">
          もどる
        </button>
        <button onClick={onNext}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 py-3 text-lg font-semibold text-white hover:bg-emerald-800">
          シートを作る <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
