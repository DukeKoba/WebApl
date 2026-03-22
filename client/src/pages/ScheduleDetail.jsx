import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Wand2, Plus, Trash2, UserPlus, ArrowLeft, AlertCircle, Send } from 'lucide-react';

const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function ScheduleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { members, templates, showToast, currentOrg } = useApp();
  const [schedule, setSchedule] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);
  const [showReplacements, setShowReplacements] = useState(null);
  const [replacements, setReplacements] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [shiftForm, setShiftForm] = useState({ member_id: '', date: '', start_time: '09:00', end_time: '17:00', template_id: '' });

  const loadSchedule = async () => {
    try {
      const data = await api.getSchedule(id);
      setSchedule(data);
      setShifts(data.shifts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSchedule(); }, [id]);

  // Generate date range
  const dates = useMemo(() => {
    if (!schedule) return [];
    const result = [];
    const start = new Date(schedule.start_date);
    const end = new Date(schedule.end_date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      result.push(d.toISOString().split('T')[0]);
    }
    return result;
  }, [schedule]);

  // Group shifts by date
  const shiftsByDate = useMemo(() => {
    const map = {};
    dates.forEach(d => { map[d] = []; });
    shifts.forEach(s => {
      if (map[s.date]) map[s.date].push(s);
    });
    return map;
  }, [shifts, dates]);

  const handleAutoGenerate = async () => {
    if (templates.length === 0) {
      showToast('先にシフト枠テンプレートを作成してください', 'error');
      return;
    }
    setGenerating(true);
    try {
      const result = await api.autoGenerate(id);
      setShifts(result.shifts);
      setWarnings(result.warnings || []);
      showToast(`${result.generated} 件のシフトを自動生成しました`);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddShift = async () => {
    const shift = await api.createShift({ ...shiftForm, schedule_id: id });
    setShifts([...shifts, shift]);
    setShowAddShift(false);
    showToast('シフトを追加しました');
  };

  const handleDeleteShift = async (shiftId) => {
    await api.deleteShift(shiftId);
    setShifts(shifts.filter(s => s.id !== shiftId));
    showToast('シフトを削除しました');
  };

  const handleFindReplacements = async (shift) => {
    const candidates = await api.getReplacements(shift.id);
    setReplacements(candidates);
    setShowReplacements(shift);
  };

  const handleAssignReplacement = async (shift, memberId) => {
    await api.updateShift(shift.id, { member_id: memberId, status: 'reassigned' });
    await loadSchedule();
    setShowReplacements(null);
    showToast('代替スタッフを割り当てました');
  };

  const handlePublish = async () => {
    await api.publishSchedule(id);
    setSchedule({ ...schedule, status: 'published' });
    showToast('スケジュールを公開しました');
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  if (!schedule) {
    return <div className="card text-center py-12"><p className="text-gray-500">スケジュールが見つかりません</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/schedules')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold">{schedule.name}</h2>
            <p className="text-sm text-gray-500">{schedule.start_date} 〜 {schedule.end_date}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleAutoGenerate} disabled={generating} className="btn-primary flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            {generating ? '生成中...' : '自動生成'}
          </button>
          <button onClick={() => setShowAddShift(true)} className="btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" /> 手動追加
          </button>
          {schedule.status === 'draft' && (
            <button onClick={handlePublish} className="btn-success flex items-center gap-2">
              <Send className="w-4 h-4" /> 公開
            </button>
          )}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="font-medium text-amber-800">注意事項</span>
          </div>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-sm text-amber-700">{w.date} {w.template}: {w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Calendar View */}
      <div className="space-y-4">
        {dates.map(date => {
          const d = new Date(date);
          const dayShifts = shiftsByDate[date] || [];
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;

          return (
            <div key={date} className={`card ${isWeekend ? 'bg-gray-50' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${isWeekend ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {DAYS[d.getDay()]}
                  </span>
                  <span className="font-medium">{date}</span>
                  <span className="text-sm text-gray-400">{dayShifts.length} シフト</span>
                </div>
              </div>

              {dayShifts.length === 0 ? (
                <p className="text-sm text-gray-400 ml-10">シフトなし</p>
              ) : (
                <div className="ml-10 space-y-2">
                  {dayShifts.map(shift => (
                    <div key={shift.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 group">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-gray-600">{shift.start_time}〜{shift.end_time}</span>
                        {shift.member_id ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: shift.member_color || '#ccc' }} />
                            <span className="text-sm font-medium">{shift.member_name}</span>
                          </span>
                        ) : (
                          <span className="text-sm text-red-500 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> 未割当
                          </span>
                        )}
                        {shift.template_name && <span className="badge bg-gray-200 text-gray-600">{shift.template_name}</span>}
                        {shift.status === 'reassigned' && <span className="badge bg-yellow-100 text-yellow-700">代替</span>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleFindReplacements(shift)} className="p-1.5 hover:bg-white rounded" title="代替を探す">
                          <UserPlus className="w-4 h-4 text-blue-500" />
                        </button>
                        <button onClick={() => handleDeleteShift(shift.id)} className="p-1.5 hover:bg-white rounded">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Shift Modal */}
      <Modal isOpen={showAddShift} onClose={() => setShowAddShift(false)} title="シフト手動追加">
        <div className="space-y-4">
          <div>
            <label className="label">日付</label>
            <input className="input" type="date" value={shiftForm.date} onChange={e => setShiftForm({ ...shiftForm, date: e.target.value })}
              min={schedule.start_date} max={schedule.end_date} />
          </div>
          <div>
            <label className="label">テンプレート（任意）</label>
            <select className="input" value={shiftForm.template_id} onChange={e => {
              const tpl = templates.find(t => t.id === e.target.value);
              if (tpl) {
                setShiftForm({ ...shiftForm, template_id: e.target.value, start_time: tpl.start_time, end_time: tpl.end_time });
              } else {
                setShiftForm({ ...shiftForm, template_id: '' });
              }
            }}>
              <option value="">テンプレートなし</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.start_time}〜{t.end_time})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">開始時間</label>
              <input className="input" type="time" value={shiftForm.start_time} onChange={e => setShiftForm({ ...shiftForm, start_time: e.target.value })} />
            </div>
            <div>
              <label className="label">終了時間</label>
              <input className="input" type="time" value={shiftForm.end_time} onChange={e => setShiftForm({ ...shiftForm, end_time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">担当者</label>
            <select className="input" value={shiftForm.member_id} onChange={e => setShiftForm({ ...shiftForm, member_id: e.target.value })}>
              <option value="">未割当</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setShowAddShift(false)}>キャンセル</button>
            <button className="btn-primary" onClick={handleAddShift}>追加</button>
          </div>
        </div>
      </Modal>

      {/* Replacements Modal */}
      <Modal isOpen={!!showReplacements} onClose={() => setShowReplacements(null)} title="代替スタッフを探す" size="lg">
        {showReplacements && (
          <div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {showReplacements.date} {showReplacements.start_time}〜{showReplacements.end_time}
                {showReplacements.member_name && ` (現在: ${showReplacements.member_name})`}
              </p>
            </div>
            {replacements.length === 0 ? (
              <p className="text-center text-gray-400 py-8">対応可能なスタッフが見つかりません</p>
            ) : (
              <div className="space-y-2">
                {replacements.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: r.color }}>
                        {r.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{r.name}</p>
                        <p className="text-xs text-gray-500">今週 {r.current_weekly_hours.toFixed(1)}h / 残 {r.hours_remaining.toFixed(1)}h</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">適合度</div>
                        <div className={`text-sm font-bold ${r.score >= 80 ? 'text-green-600' : r.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {Math.round(r.score)}%
                        </div>
                      </div>
                      <button onClick={() => handleAssignReplacement(showReplacements, r.id)} className="btn-primary text-sm py-1.5">
                        割当
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
