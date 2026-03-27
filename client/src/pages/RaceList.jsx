import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Cloud, Sun, ChevronRight, Zap } from 'lucide-react';
import { getRaces } from '../data/raceData';

export default function RaceList() {
  const races = getRaces();

  const classColors = {
    'S': 'from-yellow-600 to-yellow-500 text-yellow-100',
    'A2': 'from-red-700 to-red-600 text-red-100',
    'B1': 'from-blue-700 to-blue-600 text-blue-100',
    'B3': 'from-blue-600 to-blue-500 text-blue-100',
    'C2': 'from-green-700 to-green-600 text-green-100',
    'C3': 'from-green-600 to-green-500 text-green-100',
  };

  return (
    <div>
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-indigo-800 to-purple-800 rounded-xl p-4 mb-4 border border-indigo-600">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={18} className="text-yellow-400" />
          <h2 className="text-base font-bold text-white">本日のレース</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-1 text-indigo-200">
            <MapPin size={14} />
            <span>大井競馬場</span>
          </div>
          <div className="flex items-center gap-1 text-indigo-200">
            <Cloud size={14} />
            <span>曇/良〜稍重</span>
          </div>
          <div className="flex items-center gap-1 text-indigo-200">
            <Clock size={14} />
            <span>全{races.length}レース</span>
          </div>
        </div>
      </div>

      {/* Race Cards */}
      <div className="space-y-3">
        {races.map(race => (
          <Link
            key={race.id}
            to={`/race/${race.id}`}
            className="block card hover:border-indigo-500 transition-all hover:shadow-indigo-900/30 hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              {/* Race Number */}
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-b ${classColors[race.class] || 'from-gray-600 to-gray-500'} flex flex-col items-center justify-center flex-shrink-0`}>
                <span className="text-xs font-medium opacity-80">{race.raceNum}R</span>
                <span className="text-xs font-bold">{race.class}</span>
              </div>

              {/* Race Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm truncate">{race.name}</h3>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                  <span>{race.course}</span>
                  <span>{race.horseCount}頭</span>
                  <span>賞金{race.purse}万</span>
                </div>
              </div>

              {/* Time & Arrow */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-mono font-bold text-yellow-400">
                    <Clock size={13} />
                    {race.startTime}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    {race.weather === '晴' ? <Sun size={12} /> : <Cloud size={12} />}
                    {race.trackCondition}
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-600" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-600">
        <p>※ AI予想は参考情報です。投票は自己責任でお願いします。</p>
      </div>
    </div>
  );
}
