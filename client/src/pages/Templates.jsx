import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';

export default function Templates() {
  const { currentOrg, templates, setTemplates, showToast } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editTpl, setEditTpl] = useState(null);
  const [form, setForm] = useState({
    name: '', start_time: '09:00', end_time: '17:00', required_count: 1,
    required_skills: '', color: '#3B82F6', break_minutes: 60
  });

  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

  const resetForm = () => setForm({ name: '', start_time: '09:00', end_time: '17:00', required_count: 1, required_skills: '', color: '#3B82F6', break_minutes: 60 });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const tpl = await api.createTemplate({
      ...form, org_id: currentOrg.id,
      required_skills: form.required_skills ? form.required_skills.split(',').map(s => s.trim()) : []
    });
    setTemplates([...templates, tpl]);
    setShowAdd(false);
    resetForm();
    showToast('シフト枠を追加しました');
  };

  const handleUpdate = async () => {
    const updated = await api.updateTemplate(editTpl.id, {
      ...form,
      required_skills: form.required_skills ? form.required_skills.split(',').map(s => s.trim()) : []
    });
    setTemplates(templates.map(t => t.id === updated.id ? updated : t));
    setEditTpl(null);
    resetForm();
    showToast('更新しました');
  };

  const handleDelete = async (id) => {
    await api.deleteTemplate(id);
    setTemplates(templates.filter(t => t.id !== id));
    showToast('シフト枠を削除しました');
  };

  const openEdit = (t) => {
    setForm({
      name: t.name, start_time: t.start_time, end_time: t.end_time,
      required_count: t.required_count, break_minutes: t.break_minutes,
      required_skills: JSON.parse(t.required_skills || '[]').join(', '),
      color: t.color
    });
    setEditTpl(t);
  };

  const calcHours = (start, end) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let h = (eh + em / 60) - (sh + sm / 60);
    if (h < 0) h += 24;
    return h;
  };

  const TemplateForm = ({ onSubmit, submitLabel }) => (
    <div className="space-y-4">
      <div>
        <label className="label">シフト名 *</label>
        <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例: 朝シフト" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">開始時間</label>
          <input className="input" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
        </div>
        <div>
          <label className="label">終了時間</label>
          <input className="input" type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">必要人数</label>
          <input className="input" type="number" min="1" value={form.required_count} onChange={e => setForm({ ...form, required_count: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">休憩時間（分）</label>
          <input className="input" type="number" min="0" value={form.break_minutes} onChange={e => setForm({ ...form, break_minutes: Number(e.target.value) })} />
        </div>
      </div>
      <div>
        <label className="label">必要スキル（カンマ区切り）</label>
        <input className="input" value={form.required_skills} onChange={e => setForm({ ...form, required_skills: e.target.value })} placeholder="例: レジ, 調理" />
      </div>
      <div>
        <label className="label">色</label>
        <div className="flex gap-2">
          {colors.map(c => (
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
              className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button className="btn-secondary" onClick={() => { setShowAdd(false); setEditTpl(null); resetForm(); }}>キャンセル</button>
        <button className="btn-primary" onClick={onSubmit}>{submitLabel}</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-500">シフト枠テンプレート - スケジュール自動生成時に使用されます</p>
        <button className="btn-primary flex items-center gap-2" onClick={() => { resetForm(); setShowAdd(true); }}>
          <Plus className="w-4 h-4" /> シフト枠追加
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="card text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">シフト枠がまだありません</p>
          <button className="btn-primary mt-4" onClick={() => { resetForm(); setShowAdd(true); }}>最初のシフト枠を作成</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => (
            <div key={t.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-10 rounded-full" style={{ backgroundColor: t.color }} />
                  <div>
                    <h3 className="font-medium">{t.name}</h3>
                    <p className="text-sm text-gray-500">{t.start_time} 〜 {t.end_time}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-3 text-xs text-gray-500">
                <span>{calcHours(t.start_time, t.end_time).toFixed(1)}時間（休憩{t.break_minutes}分含む）</span>
                <span>必要人数: {t.required_count}名</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); resetForm(); }} title="シフト枠追加">
        <TemplateForm onSubmit={handleAdd} submitLabel="追加" />
      </Modal>
      <Modal isOpen={!!editTpl} onClose={() => { setEditTpl(null); resetForm(); }} title="シフト枠編集">
        <TemplateForm onSubmit={handleUpdate} submitLabel="更新" />
      </Modal>
    </div>
  );
}
