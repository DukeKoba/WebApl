import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';

const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function Members() {
  const { currentOrg, members, setMembers, showToast } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [showAvail, setShowAvail] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'staff', hourly_rate: 0, max_hours_per_week: 40, skills: '' });
  const [availability, setAvailability] = useState([]);

  const resetForm = () => setForm({ name: '', email: '', phone: '', role: 'staff', hourly_rate: 0, max_hours_per_week: 40, skills: '' });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const member = await api.createMember({
      ...form, org_id: currentOrg.id,
      skills: form.skills ? form.skills.split(',').map(s => s.trim()) : []
    });
    setMembers([...members, member]);
    setShowAdd(false);
    resetForm();
    showToast(`${member.name} を追加しました`);
  };

  const handleUpdate = async () => {
    const updated = await api.updateMember(editMember.id, {
      ...form,
      skills: form.skills ? form.skills.split(',').map(s => s.trim()) : []
    });
    setMembers(members.map(m => m.id === updated.id ? updated : m));
    setEditMember(null);
    resetForm();
    showToast('更新しました');
  };

  const handleDelete = async (id) => {
    await api.deleteMember(id);
    setMembers(members.filter(m => m.id !== id));
    showToast('メンバーを削除しました');
  };

  const openEdit = (m) => {
    setForm({
      name: m.name, email: m.email || '', phone: m.phone || '',
      role: m.role, hourly_rate: m.hourly_rate, max_hours_per_week: m.max_hours_per_week,
      skills: JSON.parse(m.skills || '[]').join(', ')
    });
    setEditMember(m);
  };

  const openAvailability = async (m) => {
    const avail = await api.getAvailability(m.id);
    setAvailability(DAYS.map((_, i) => {
      const existing = avail.filter(a => a.day_of_week === i);
      return existing.length > 0
        ? { day: i, enabled: existing[0].is_available, start: existing[0].start_time, end: existing[0].end_time }
        : { day: i, enabled: true, start: '09:00', end: '22:00' };
    }));
    setShowAvail(m);
  };

  const saveAvailability = async () => {
    const data = availability.filter(a => a.enabled).map(a => ({
      day_of_week: a.day, start_time: a.start, end_time: a.end, is_available: 1
    }));
    await api.setAvailability(showAvail.id, data);
    setShowAvail(null);
    showToast('勤務可能時間を更新しました');
  };

  const MemberForm = ({ onSubmit, submitLabel }) => (
    <div className="space-y-4">
      <div>
        <label className="label">名前 *</label>
        <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">メール</label>
          <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">電話番号</label>
          <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">役割</label>
          <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="staff">スタッフ</option>
            <option value="leader">リーダー</option>
            <option value="manager">マネージャー</option>
          </select>
        </div>
        <div>
          <label className="label">時給 (円)</label>
          <input className="input" type="number" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: Number(e.target.value) })} />
        </div>
      </div>
      <div>
        <label className="label">週の最大勤務時間</label>
        <input className="input" type="number" value={form.max_hours_per_week} onChange={e => setForm({ ...form, max_hours_per_week: Number(e.target.value) })} />
      </div>
      <div>
        <label className="label">スキル（カンマ区切り）</label>
        <input className="input" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="例: レジ, 調理, ドリンク" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button className="btn-secondary" onClick={() => { setShowAdd(false); setEditMember(null); resetForm(); }}>キャンセル</button>
        <button className="btn-primary" onClick={onSubmit}>{submitLabel}</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-500">{members.length} 名のメンバー</p>
        <button className="btn-primary flex items-center gap-2" onClick={() => { resetForm(); setShowAdd(true); }}>
          <Plus className="w-4 h-4" /> メンバー追加
        </button>
      </div>

      {members.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">メンバーがまだいません</p>
          <button className="btn-primary mt-4" onClick={() => { resetForm(); setShowAdd(true); }}>最初のメンバーを追加</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map(m => (
            <div key={m.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: m.color }}>
                    {m.name[0]}
                  </div>
                  <div>
                    <h3 className="font-medium">{m.name}</h3>
                    <p className="text-xs text-gray-500">{m.role === 'manager' ? 'マネージャー' : m.role === 'leader' ? 'リーダー' : 'スタッフ'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openAvailability(m)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="勤務可能時間">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => openEdit(m)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {JSON.parse(m.skills || '[]').map(s => (
                  <span key={s} className="badge bg-gray-100 text-gray-600">{s}</span>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-400">
                最大 {m.max_hours_per_week}h/週 {m.hourly_rate > 0 && `・¥${m.hourly_rate}/h`}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); resetForm(); }} title="メンバー追加">
        <MemberForm onSubmit={handleAdd} submitLabel="追加" />
      </Modal>

      <Modal isOpen={!!editMember} onClose={() => { setEditMember(null); resetForm(); }} title="メンバー編集">
        <MemberForm onSubmit={handleUpdate} submitLabel="更新" />
      </Modal>

      <Modal isOpen={!!showAvail} onClose={() => setShowAvail(null)} title={`${showAvail?.name} の勤務可能時間`}>
        <div className="space-y-3">
          {availability.map((a, i) => (
            <div key={i} className="flex items-center gap-3">
              <label className="flex items-center gap-2 w-12">
                <input
                  type="checkbox"
                  checked={a.enabled}
                  onChange={e => {
                    const next = [...availability];
                    next[i] = { ...a, enabled: e.target.checked };
                    setAvailability(next);
                  }}
                  className="rounded"
                />
                <span className="text-sm font-medium">{DAYS[i]}</span>
              </label>
              {a.enabled && (
                <>
                  <input
                    type="time"
                    value={a.start}
                    onChange={e => {
                      const next = [...availability];
                      next[i] = { ...a, start: e.target.value };
                      setAvailability(next);
                    }}
                    className="input w-auto"
                  />
                  <span className="text-gray-400">〜</span>
                  <input
                    type="time"
                    value={a.end}
                    onChange={e => {
                      const next = [...availability];
                      next[i] = { ...a, end: e.target.value };
                      setAvailability(next);
                    }}
                    className="input w-auto"
                  />
                </>
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-4">
            <button className="btn-secondary" onClick={() => setShowAvail(null)}>キャンセル</button>
            <button className="btn-primary" onClick={saveAvailability}>保存</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Users(props) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
