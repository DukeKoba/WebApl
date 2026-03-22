import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Wand2, Plus, Trash2, UserPlus, ArrowLeft, AlertCircle, Send, BarChart3, DollarSign, Scale, MessageSquare } from 'lucide-react';

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

  // New features from competitor analysis
  const [availabilityMap, setAvailabilityMap] = useState(null);
  const [fairness, setFairness] = useState(null);
  const [laborCost, setLaborCost] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showNotes, setShowNotes] = useState(null);
  const [noteText, setNoteText] = useState('');

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

  const loadExtras = async () => {
    if (!schedule || !currentOrg) return;
    try {
      const [avail, fair, cost] = await Promise.all([
        api.getAvailabilityMap(currentOrg.id, schedule.start_date, schedule.end_date),
        api.getFairness(currentOrg.id, id),
        api.getLaborCost(currentOrg.id, id),
      ]);
      setAvailabilityMap(avail);
      setFairness(fair);
      setLaborCost(cost);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadSchedule(); }, [id]);
  useEffect(() => { if (schedule) loadExtras(); }, [schedule]);

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

  const shiftsByDate = useMemo(() => {
    const map = {};
    dates.forEach(d => { map[d] = []; });
    shifts.forEach(s => {
      if (map[s.date]) map[s.date].push(s);
    });
    return map;
  }, [shifts, dates]);

  // Get available members for a specific date
  const getAvailableForDate = (date) => {
    if (!availabilityMap) return [];
    return availabilityMap.members.filter(m => {
      const dateInfo = m.dates.find(d => d.date === date);
      return dateInfo && (dateInfo.status === 'available' || dateInfo.status === 'flexible');
    });
  };

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
      loadExtras();
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
    loadExtras();
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

  const handleSaveNote = async (shift) => {
    await api.updateShift(shift.id, { notes: noteText });
    setShifts(shifts.map(s => s.id === shift.id ? { ...s, notes: noteText } : s));
    setShowNotes(null);
    setNoteText('');
    showToast('引継ぎメモを保存しました');
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
          <button onClick={() => setShowStats(!showStats)} className="btn-secondary flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> 統計
          </button>
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

      {/* Stats Panel - Fairness Score + Labor Cost */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fairness Score */}
          {fairness && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">公平性スコア</h3>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className={`text-3xl font-bold ${fairness.score >= 70 ? 'text-green-600' : fairness.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {fairness.score}
                </span>
                <span className="text-gray-400 text-sm mb-1">/ 100</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">時間配分の均等性（100 = 完全に均等）</p>
              <div className="space-y-1.5">
                {fairness.members.slice(0, 5).map(m => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                      <span className="truncate max-w-[80px]">{m.name}</span>
                    </div>
                    <span className="font-mono">{m.total_hours.toFixed(1)}h / {m.shift_count}回</span>
                  </div>
                ))}
              </div>
              {fairness.weekendFairness !== undefined && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">土日の公平性</span>
                    <span className={`font-bold ${fairness.weekendFairness >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>{fairness.weekendFairness}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Labor Cost */}
          {laborCost && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold">人件費予測</h3>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-900">¥{laborCost.totalCost.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">合計 {laborCost.totalHours}時間</p>
              {laborCost.dailyCosts.length > 0 && (
                <div className="space-y-1">
                  {laborCost.dailyCosts.map(d => {
                    const maxCost = Math.max(...laborCost.dailyCosts.map(x => x.cost), 1);
                    return (
                      <div key={d.date} className="flex items-center gap-2 text-xs">
                        <span className="w-16 text-gray-500">{d.date.slice(5)}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div className="h-full bg-green-400 rounded-full" style={{ width: `${(d.cost / maxCost) * 100}%` }} />
                        </div>
                        <span className="w-16 text-right font-mono">¥{Math.round(d.cost).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Availability Heatmap */}
          {availabilityMap && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold">勤務可能状況</h3>
              </div>
              <div className="overflow-x-auto">
                <div className="space-y-1">
                  {availabilityMap.members.slice(0, 8).map(m => (
                    <div key={m.id} className="flex items-center gap-1">
                      <span className="w-14 text-xs truncate text-gray-600">{m.name}</span>
                      <div className="flex gap-0.5">
                        {m.dates.map(d => {
                          const colors = {
                            available: 'bg-green-400',
                            flexible: 'bg-blue-300',
                            unavailable: 'bg-gray-200',
                            absent: 'bg-red-400',
                          };
                          return (
                            <div key={d.date} className={`w-5 h-5 rounded-sm ${colors[d.status] || 'bg-gray-200'}`}
                              title={`${d.date}: ${d.status === 'available' ? '出勤可' : d.status === 'flexible' ? '応相談' : d.status === 'absent' ? '欠勤' : '不可'}`} />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-400" /> 出勤可</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-300" /> 応相談</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400" /> 欠勤</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-200" /> 不可</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
          const availableCount = getAvailableForDate(date).length;

          return (
            <div key={date} className={`card ${isWeekend ? 'bg-gray-50' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${isWeekend ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {DAYS[d.getDay()]}
                  </span>
                  <span className="font-medium">{date}</span>
                  <span className="text-sm text-gray-400">{dayShifts.length} シフト</span>
                  {availabilityMap && (
                    <span className={`badge ${availableCount >= dayShifts.length ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      出勤可能 {availableCount}名
                    </span>
                  )}
                </div>
                {/* Inline availability dots */}
                {availabilityMap && (
                  <div className="flex gap-0.5">
                    {availabilityMap.members.map(m => {
                      const dateInfo = m.dates.find(dd => dd.date === date);
                      const isAssigned = dayShifts.some(s => s.member_id === m.id);
                      return (
                        <div key={m.id} title={`${m.name}: ${dateInfo?.status === 'available' ? '出勤可' : dateInfo?.status === 'flexible' ? '応相談' : '不可'}${isAssigned ? ' (割当済)' : ''}`}
                          className={`w-3 h-3 rounded-full border ${isAssigned ? 'border-gray-800 border-2' : 'border-transparent'}`}
                          style={{ backgroundColor: dateInfo?.status === 'available' || dateInfo?.status === 'flexible' ? m.color : '#e5e7eb' }} />
                      );
                    })}
                  </div>
                )}
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
                        {shift.notes && (
                          <span className="badge bg-blue-100 text-blue-600 cursor-pointer" onClick={() => { setShowNotes(shift); setNoteText(shift.notes); }}>
                            <MessageSquare className="w-3 h-3 mr-1" /> メモあり
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setShowNotes(shift); setNoteText(shift.notes || ''); }} className="p-1.5 hover:bg-white rounded" title="引継ぎメモ">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                        </button>
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
          {/* Inline availability when date is selected */}
          {shiftForm.date && availabilityMap && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 mb-2">この日の出勤可能メンバー:</p>
              <div className="flex flex-wrap gap-1.5">
                {getAvailableForDate(shiftForm.date).map(m => (
                  <button key={m.id} type="button" onClick={() => setShiftForm({ ...shiftForm, member_id: m.id })}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${shiftForm.member_id === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                    {m.name}
                  </button>
                ))}
                {getAvailableForDate(shiftForm.date).length === 0 && (
                  <span className="text-xs text-gray-400">出勤可能なメンバーがいません</span>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setShowAddShift(false)}>キャンセル</button>
            <button className="btn-primary" onClick={handleAddShift}>追加</button>
          </div>
        </div>
      </Modal>

      {/* Shift Handoff Notes Modal */}
      <Modal isOpen={!!showNotes} onClose={() => setShowNotes(null)} title="引継ぎメモ">
        {showNotes && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              {showNotes.date} {showNotes.start_time}〜{showNotes.end_time}
              {showNotes.member_name && ` / ${showNotes.member_name}`}
            </div>
            <div>
              <label className="label">引継ぎ内容</label>
              <textarea className="input min-h-[120px]" value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="次のシフトへの引継ぎ事項を記入..." />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setShowNotes(null)}>キャンセル</button>
              <button className="btn-primary" onClick={() => handleSaveNote(showNotes)}>保存</button>
            </div>
          </div>
        )}
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
