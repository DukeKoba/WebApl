import React, { useState } from 'react';
import { api } from '../utils/api';
import { useApp } from '../contexts/AppContext';

export default function Setup() {
  const { loadOrgs, setCurrentOrg } = useApp();
  const [name, setName] = useState('');
  const [type, setType] = useState('general');

  const types = [
    { value: 'restaurant', label: '飲食店' },
    { value: 'retail', label: '小売店' },
    { value: 'warehouse', label: '倉庫・物流' },
    { value: 'office', label: 'オフィス' },
    { value: 'hospital', label: '医療' },
    { value: 'education', label: '教育' },
    { value: 'event', label: 'イベント' },
    { value: 'general', label: 'その他' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const org = await api.createOrg({ name: name.trim(), type });
    await loadOrgs();
    setCurrentOrg(org);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ShiftSync へようこそ</h1>
          <p className="text-gray-500 mt-2">チーム・組織を作成してシフト管理を始めましょう</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">組織・チーム名</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
              placeholder="例: カフェ渋谷店"
              required
            />
          </div>

          <div>
            <label className="label">業種</label>
            <div className="grid grid-cols-2 gap-2">
              {types.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${type === t.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3 text-base">
            開始する
          </button>
        </form>
      </div>
    </div>
  );
}
