import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { api } from '../utils/api';
import { Users, Calendar, AlertTriangle, ArrowRightLeft, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { currentOrg } = useApp();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (currentOrg) {
      api.getDashboard(currentOrg.id).then(setStats).catch(console.error);
    }
  }, [currentOrg]);

  if (!stats) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  const cards = [
    { label: 'メンバー数', value: stats.memberCount, icon: Users, color: 'blue', link: '/members' },
    { label: 'アクティブスケジュール', value: stats.activeSchedules, icon: Calendar, color: 'green', link: '/schedules' },
    { label: '未処理の欠勤', value: stats.pendingAbsences, icon: AlertTriangle, color: 'amber', link: '/absences' },
    { label: '交代リクエスト', value: stats.openSwaps, icon: ArrowRightLeft, color: 'purple', link: '/absences' },
  ];

  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.link} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[card.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Member Hours Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-400" />
          今週のメンバー稼働時間
        </h2>
        {stats.memberHours.length === 0 ? (
          <p className="text-gray-400 text-center py-8">データがありません。メンバーを追加してスケジュールを作成してください。</p>
        ) : (
          <div className="space-y-3">
            {stats.memberHours.map(m => {
              const maxHours = Math.max(...stats.memberHours.map(x => x.total_hours), 1);
              const pct = (m.total_hours / maxHours) * 100;
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium text-gray-700 truncate">{m.name}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all flex items-center justify-end px-2"
                      style={{ width: `${Math.max(pct, 8)}%`, backgroundColor: m.color }}
                    >
                      <span className="text-xs font-medium text-white">{m.total_hours.toFixed(1)}h</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/members" className="card hover:shadow-md transition-shadow border-dashed border-2 flex items-center justify-center py-8">
          <div className="text-center">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-600">メンバーを管理</p>
          </div>
        </Link>
        <Link to="/schedules" className="card hover:shadow-md transition-shadow border-dashed border-2 flex items-center justify-center py-8">
          <div className="text-center">
            <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-600">スケジュールを作成</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
