import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, AlertTriangle, CheckCircle, Clock, UserPlus } from 'lucide-react';

export default function Absences() {
  const { currentOrg, members, schedules, showToast } = useApp();
  const [absences, setAbsences] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ member_id: '', schedule_id: '', date: new Date().toISOString().split('T')[0], reason: '' });
  const [autoResult, setAutoResult] = useState(null);

  useEffect(() => {
    if (currentOrg) {
      api.getAbsences({ org_id: currentOrg.id }).then(setAbsences).catch(console.error);
    }
  }, [currentOrg]);

  const handleAdd = async () => {
    if (!form.member_id) return;
    try {
      const result = await api.createAbsence(form);
      // Reload absences
      const updated = await api.getAbsences({ org_id: currentOrg.id });
      setAbsences(updated);
      setShowAdd(false);

      if (result.affectedShifts) {
        setAutoResult(result);
        showToast(result.message, result.affectedShifts.some(r => !r.autoAssigned) ? 'info' : 'success');
      } else {
        showToast('欠勤を登録しました');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleApprove = async (id) => {
    await api.updateAbsence(id, { status: 'approved' });
    setAbsences(absences.map(a => a.id === id ? { ...a, status: 'approved' } : a));
    showToast('承認しました');
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'approved': case 'auto_replaced': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const statusLabel = (status) => {
    const labels = {
      pending: '未処理',
      approved: '承認済み',
      auto_replaced: '自動代替済み',
      cancelled: 'キャンセル'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-500">欠勤・シフト交代管理</p>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> 欠勤登録
        </button>
      </div>

      {/* Auto-replacement result */}
      {autoResult && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3">自動代替結果</h3>
          <p className="text-sm text-blue-700 mb-3">{autoResult.message}</p>
          {autoResult.affectedShifts.map((r, i) => (
            <div key={i} className="text-sm text-blue-600 mb-1">
              {r.shift.date} {r.shift.start_time}〜{r.shift.end_time}:
              {r.autoAssigned ? (
                <span className="ml-2 font-medium text-green-700">{r.replacement.name} が自動割当されました</span>
              ) : (
                <span className="ml-2 text-amber-700">手動割当が必要です（候補: {r.candidates?.length || 0}名）</span>
              )}
            </div>
          ))}
          <button className="text-sm text-blue-600 underline mt-2" onClick={() => setAutoResult(null)}>閉じる</button>
        </div>
      )}

      {absences.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">欠勤の記録はありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {absences.map(a => (
            <div key={a.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-4">
                {statusIcon(a.status)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.member_name}</span>
                    <span className="text-sm text-gray-500">{a.date}</span>
                    <span className={`badge ${a.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : a.status === 'auto_replaced' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {statusLabel(a.status)}
                    </span>
                  </div>
                  {a.reason && <p className="text-sm text-gray-500 mt-0.5">{a.reason}</p>}
                  {a.replacement_name && (
                    <p className="text-sm text-green-600 mt-0.5 flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5" /> 代替: {a.replacement_name}
                    </p>
                  )}
                </div>
              </div>
              {a.status === 'pending' && (
                <button onClick={() => handleApprove(a.id)} className="btn-success text-sm py-1.5">承認</button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="欠勤登録">
        <div className="space-y-4">
          <div>
            <label className="label">メンバー *</label>
            <select className="input" value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })}>
              <option value="">選択してください</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">対象スケジュール（自動代替の場合に必要）</label>
            <select className="input" value={form.schedule_id} onChange={e => setForm({ ...form, schedule_id: e.target.value })}>
              <option value="">なし</option>
              {schedules.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_date}〜{s.end_date})</option>)}
            </select>
          </div>
          <div>
            <label className="label">日付</label>
            <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">理由</label>
            <input className="input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="例: 体調不良" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>キャンセル</button>
            <button className="btn-primary" onClick={handleAdd}>登録</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
