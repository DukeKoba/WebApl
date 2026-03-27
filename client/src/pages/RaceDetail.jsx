import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, TrendingUp, Target, BarChart3, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { getPrediction } from '../data/raceData';

const wakuColors = {
  1: 'bg-white text-black border border-gray-400',
  2: 'bg-black text-white',
  3: 'bg-red-600 text-white',
  4: 'bg-blue-600 text-white',
  5: 'bg-yellow-400 text-black',
  6: 'bg-green-600 text-white',
  7: 'bg-orange-500 text-white',
  8: 'bg-pink-600 text-white',
};

const confidenceColors = {
  '◎ 本命': 'text-red-400 font-black',
  '○ 対抗': 'text-blue-400 font-bold',
  '▲ 単穴': 'text-green-400 font-bold',
  '△ 連下': 'text-yellow-400',
  '× 軽視': 'text-gray-500',
};

export default function RaceDetail() {
  const { id } = useParams();
  const [expandedHorse, setExpandedHorse] = useState(null);
  const [activeTab, setActiveTab] = useState('prediction');

  const prediction = useMemo(() => getPrediction(parseInt(id)), [id]);

  if (!prediction) {
    return <div className="text-center py-20 text-gray-400">レースデータが見つかりません</div>;
  }

  const { race, predictions, recommendations } = prediction;

  return (
    <div>
      {/* Race Header */}
      <div className="bg-gradient-to-r from-indigo-800 to-purple-800 rounded-xl p-4 mb-4 border border-indigo-600">
        <div className="flex items-center justify-between mb-1">
          <span className="badge badge-gold">{race.raceNum}R</span>
          <span className="text-yellow-400 font-mono font-bold text-lg">{race.startTime}</span>
        </div>
        <h2 className="text-xl font-bold text-white">{race.name}</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-indigo-200">
          <span>{race.course}</span>
          <span>クラス: {race.class}</span>
          <span>馬場: {race.trackCondition}</span>
          <span>賞金: {race.purse}万</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1">
        {[
          { key: 'prediction', label: 'AI予想', icon: Zap },
          { key: 'horses', label: '出馬表', icon: BarChart3 },
          { key: 'tickets', label: '買い目', icon: Target },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Prediction Tab */}
      {activeTab === 'prediction' && (
        <div className="space-y-2">
          {predictions.map((horse, i) => (
            <div
              key={horse.num}
              className={`card cursor-pointer transition-all ${
                i === 0 ? 'border-yellow-500 bg-gradient-to-r from-gray-800 to-yellow-900/20' :
                i === 1 ? 'border-blue-500/50' :
                i === 2 ? 'border-green-500/30' : ''
              }`}
              onClick={() => setExpandedHorse(expandedHorse === horse.num ? null : horse.num)}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="flex-shrink-0 w-8 text-center">
                  {i === 0 && <Trophy size={22} className="text-yellow-400 mx-auto" />}
                  {i === 1 && <Trophy size={20} className="text-gray-300 mx-auto" />}
                  {i === 2 && <Trophy size={18} className="text-amber-600 mx-auto" />}
                  {i > 2 && <span className="text-gray-500 text-sm font-bold">{i + 1}</span>}
                </div>

                {/* Waku */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${wakuColors[horse.waku]}`}>
                  {horse.num}
                </div>

                {/* Horse Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{horse.name}</span>
                    <span className={`text-sm ${confidenceColors[horse.confidence]}`}>
                      {horse.confidence.split(' ')[0]}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 flex gap-2">
                    <span>{horse.sex}</span>
                    <span>{horse.jockey}</span>
                    <span>{horse.runStyle}</span>
                  </div>
                </div>

                {/* Score */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-bold text-yellow-400">{horse.totalScore}</div>
                  <div className="text-xs text-gray-500">/ 100</div>
                </div>

                <div className="flex-shrink-0 text-gray-500">
                  {expandedHorse === horse.num ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedHorse === horse.num && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="text-xs text-gray-400">
                      <span className="text-gray-500">オッズ:</span> <span className="text-white font-bold">{horse.odds}倍</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      <span className="text-gray-500">人気:</span> <span className="text-white font-bold">{horse.popularity}番人気</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      <span className="text-gray-500">体重:</span> <span className="text-white">{horse.weight}kg ({horse.weightChange > 0 ? '+' : ''}{horse.weightChange})</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      <span className="text-gray-500">調教師:</span> <span className="text-white">{horse.trainer}</span>
                    </div>
                  </div>

                  {/* Recent Results */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">近走成績</p>
                    <div className="flex gap-1">
                      {horse.recentResults.map((r, j) => (
                        <div
                          key={j}
                          className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${
                            r === '1' ? 'bg-yellow-500 text-yellow-900' :
                            r === '2' ? 'bg-gray-300 text-gray-800' :
                            r === '3' ? 'bg-amber-700 text-amber-100' :
                            parseInt(r) <= 5 ? 'bg-gray-600 text-gray-200' :
                            'bg-gray-800 text-gray-500'
                          }`}
                        >
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Factor Bars */}
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-500">予想ファクター</p>
                    {Object.entries(horse.factors).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className="w-16 text-gray-400 flex-shrink-0">{key}</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              val.score / val.max > 0.8 ? 'bg-green-500' :
                              val.score / val.max > 0.6 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${(val.score / val.max) * 100}%` }}
                          />
                        </div>
                        <span className="text-gray-400 w-12 text-right">{val.score}/{val.max}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Horse Table Tab */}
      {activeTab === 'horses' && (
        <div className="space-y-2">
          {[...predictions].sort((a, b) => a.num - b.num).map(horse => (
            <div key={horse.num} className="card">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${wakuColors[horse.waku]}`}>
                  {horse.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm">{horse.name}</div>
                  <div className="text-xs text-gray-400">{horse.sex} / {horse.weight}kg ({horse.weightChange > 0 ? '+' : ''}{horse.weightChange})</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-yellow-400 font-bold">{horse.odds}倍</div>
                  <span className={`badge text-xs ${horse.popularity <= 3 ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'}`}>
                    {horse.popularity}番人気
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-700 grid grid-cols-3 gap-2 text-xs text-gray-400">
                <div><span className="text-gray-500">騎手</span> <span className="text-gray-200">{horse.jockey}</span></div>
                <div><span className="text-gray-500">脚質</span> <span className="text-gray-200">{horse.runStyle}</span></div>
                <div><span className="text-gray-500">調教師</span> <span className="text-gray-200">{horse.trainer}</span></div>
              </div>
              <div className="mt-2 flex gap-1">
                {horse.recentResults.map((r, j) => (
                  <div key={j} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                    r === '1' ? 'bg-yellow-500 text-yellow-900' :
                    r === '2' ? 'bg-gray-300 text-gray-800' :
                    r === '3' ? 'bg-amber-700 text-amber-100' :
                    parseInt(r) <= 5 ? 'bg-gray-600 text-gray-200' :
                    'bg-gray-800 text-gray-500'
                  }`}>{r}</div>
                ))}
                <span className="text-xs text-gray-500 self-center ml-1">近走</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-3">
          <div className="card border-yellow-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-yellow-400" />
              <h3 className="font-bold text-white">おすすめ買い目</h3>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">三連単（本命）</span>
                  <span className="badge bg-red-900 text-red-300">自信度 高</span>
                </div>
                <p className="text-xl font-mono font-bold text-white">{recommendations.sanrentan}</p>
              </div>

              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">三連複</span>
                  <span className="badge bg-blue-900 text-blue-300">自信度 中</span>
                </div>
                <p className="text-xl font-mono font-bold text-white">{recommendations.sanrenpuku}</p>
              </div>

              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">馬単</span>
                  <span className="badge bg-blue-900 text-blue-300">自信度 中</span>
                </div>
                <p className="text-xl font-mono font-bold text-white">{recommendations.umatan}</p>
              </div>

              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">馬連</span>
                  <span className="badge bg-green-900 text-green-300">堅め</span>
                </div>
                <p className="text-xl font-mono font-bold text-white">{recommendations.umaren}</p>
              </div>

              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">ワイド（3点）</span>
                  <span className="badge bg-green-900 text-green-300">手広く</span>
                </div>
                <div className="flex gap-2">
                  {recommendations.wide.map((w, i) => (
                    <span key={i} className="text-lg font-mono font-bold text-white bg-gray-800 px-3 py-1 rounded">{w}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Prediction Summary */}
          <div className="card">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-400" />
              予想印
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {predictions.slice(0, 5).map(h => (
                <div key={h.num} className="flex items-center gap-2 bg-gray-900 rounded-lg p-2">
                  <span className={`text-lg ${confidenceColors[h.confidence]}`}>
                    {h.confidence.split(' ')[0]}
                  </span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${wakuColors[h.waku]}`}>
                    {h.num}
                  </div>
                  <span className="text-sm text-white font-medium truncate">{h.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-gray-600 mt-4">
            <p>※ AI予想は参考情報です。投票は自己責任でお願いします。</p>
          </div>
        </div>
      )}
    </div>
  );
}
