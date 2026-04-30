import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Calendar, Eye, Trash2, Send } from 'lucide-react';

export default function Schedules() {
  const { currentOrg, schedules, setSchedules, showToast } = useApp();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);

  const today = new Date();
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + (8 - today.getDay()) % 7);
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);

  const [form, setForm] = useState({
    name: '',
    start_date: nextMonday.toISOString().split('T')[0],
    end_date: nextSunday.toISOString().split('T')[0]
  });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const schedule = await api.createSchedule({ ...form, org_id: currentOrg.id });
    setSchedules([schedule, ...schedules]);
    setShowAdd(false);
    showToast('スケジュールを作成しました');
    navigate(`/schedules/${schedule.id}`);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await api.deleteSchedule(id);
    setSchedules(schedules.filter(s => s.id !== id));
    showToast('スケジュールを削除しました');
  };

  const handlePublish = async (id, e) => {
    e.stopPropagation();
    await api.publishSchedule(id);
    setSchedules(schedules.map(s => s.id === id ? { ...s, status: 'published' } : s));
    showToast('スケジュールを公開しました');
  };

  const statusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-600',
      published: 'bg-green-100 text-green-700',
      archived: 'bg-yellow-100 text-yellow-700',
    };
    const labels = { draft: '下書き', published: '公開中', archived: 'アーカイブ' };
    return <span className={`badge ${styles[status] || styles.draft}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-500">{schedules.length} 件のスケジュール</p>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> 新規スケジュール
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">スケジュールがまだありません</p>
          <button className="btn-primary mt-4" onClick={() => setShowAdd(true)}>最初のスケジュールを作成</button>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map(s => (
            <div
              key={s.id}
              onClick={() => navigate(`/schedules/${s.id}`)}
              className="card flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">{s.name}</h3>
                  <p className="text-sm text-gray-500">{s.start_date} 〜 {s.end_date}</p>
                </div>
                {statusBadge(s.status)}
              </div>
              <div className="flex items-center gap-2">
                {s.status === 'draft' && (
                  <button onClick={(e) => handlePublish(s.id, e)} className="p-2 hover:bg-green-50 rounded-lg" title="公開">
                    <Send className="w-4 h-4 text-green-600" />
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); navigate(`/schedules/${s.id}`); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Eye className="w-4 h-4 text-gray-400" />
                </button>
                <button onClick={(e) => handleDelete(s.id, e)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="新規スケジュール">
        <div className="space-y-4">
          <div>
            <label className="label">スケジュール名 *</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="例: 3月第4週" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">開始日</label>
              <input className="input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="label">終了日</label>
              <input className="input" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>キャンセル</button>
            <button className="btn-primary" onClick={handleAdd}>作成</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
