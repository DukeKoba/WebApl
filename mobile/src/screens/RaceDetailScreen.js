import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import { races, TRACK_CONDITION } from '../data/raceSchedule';
import { fetchFullRaceData } from '../data/fetchRaceData';
import { calculatePrediction } from '../data/predictionEngine';

const wakuColors = {
  1: { bg: '#e5e7eb', text: '#000' }, 2: { bg: '#1f2937', text: '#fff' },
  3: { bg: '#dc2626', text: '#fff' }, 4: { bg: '#2563eb', text: '#fff' },
  5: { bg: '#facc15', text: '#000' }, 6: { bg: '#16a34a', text: '#fff' },
  7: { bg: '#f97316', text: '#fff' }, 8: { bg: '#ec4899', text: '#fff' },
};

const confColors = { '◎': '#f87171', '○': '#60a5fa', '▲': '#4ade80', '△': '#fbbf24', '×': '#6b7280' };

export default function RaceDetailScreen({ route }) {
  const { raceId, liveData: initialLive } = route.params;
  const race = races.find(r => r.id === raceId);
  const [liveData, setLiveData] = useState(initialLive || null);
  const [loading, setLoading] = useState(!initialLive);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('prediction');
  const [expandedHorse, setExpandedHorse] = useState(null);

  const loadData = async () => {
    try {
      const data = await fetchFullRaceData(race.raceNum);
      setLiveData(data);
    } catch (e) {
      console.warn('取得エラー:', e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { if (!initialLive) loadData(); }, []);

  // 馬データ構築（リアルデータ優先）
  const horses = useMemo(() => {
    if (liveData?.hasRealHorses) {
      return liveData.horses.horses.map(h => ({
        ...h,
        odds: liveData.hasRealOdds ? (liveData.odds[h.num] || 0) : 0,
        popularity: 0,
        recentResults: [],
        runStyle: '先行',
        distanceApt: 'B',
        trackApt: 'B',
        condition: '重',
        weightChange: 0,
        weight: 470,
      }));
    }
    return null;
  }, [liveData]);

  // 人気順設定
  if (horses) {
    const sorted = [...horses].sort((a, b) => (a.odds || 999) - (b.odds || 999));
    sorted.forEach((h, i) => {
      const orig = horses.find(x => x.num === h.num);
      if (orig) orig.popularity = i + 1;
    });
  }

  // AI予想
  const prediction = useMemo(() => {
    if (!horses || !race) return null;
    return calculatePrediction(horses, race);
  }, [horses, race]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (!race) return <View style={s.container}><Text style={s.noData}>レースが見つかりません</Text></View>;

  const raceNo = String(race.raceNum).padStart(2, '0');
  const netkeibaUrl = `https://nar.netkeiba.com/race/shutuba.html?race_id=2026440327${raceNo}`;
  const oddsUrl = `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/OddsTanFuku?k_raceDate=2026/03/27&k_raceNo=${race.raceNum}&k_babaCode=20`;

  return (
    <View style={s.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />}
      >
        {/* レースヘッダー */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View style={s.badge}><Text style={s.badgeText}>{race.raceNum}R</Text></View>
            <Text style={s.timeText}>{race.startTime}</Text>
          </View>
          <Text style={s.raceName}>{race.name}</Text>
          <View style={s.metaRow}>
            <Text style={s.metaText}>{race.course}</Text>
            <Text style={s.metaText}>クラス: {race.class}</Text>
            <Text style={s.metaText}>馬場: ダ{TRACK_CONDITION}</Text>
            <Text style={s.metaText}>賞金: {race.purse}万</Text>
          </View>
          {/* データ状態 */}
          <View style={[s.dataBadge, liveData?.hasRealHorses ? s.dataLive : s.dataSim]}>
            <Text style={s.dataText}>
              {loading ? '取得中...' :
                liveData?.hasRealHorses ? `✓ 実データ (${horses?.length || 0}頭)` :
                'シミュレーション'}
              {liveData?.hasRealOdds ? ' + LIVEオッズ' : ''}
            </Text>
          </View>
        </View>

        {/* 外部リンク */}
        <View style={s.linkRow}>
          <TouchableOpacity style={[s.linkBtn, { backgroundColor: '#1d4ed8' }]} onPress={() => Linking.openURL(oddsUrl)}>
            <Text style={s.linkText}>公式オッズ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.linkBtn, { backgroundColor: '#15803d' }]} onPress={() => Linking.openURL(netkeibaUrl)}>
            <Text style={s.linkText}>netkeiba</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.linkBtn, { backgroundColor: '#7c3aed' }]} onPress={() => loadData()}>
            <Text style={s.linkText}>🔄 更新</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#818cf8" style={{ marginTop: 40 }} />
        ) : !prediction ? (
          <Text style={s.noData}>データを取得できませんでした。下に引いて再読み込みしてください。</Text>
        ) : (
          <>
            {/* タブ */}
            <View style={s.tabRow}>
              {[
                { key: 'prediction', label: '⚡ AI予想' },
                { key: 'horses', label: '📋 出馬表' },
                { key: 'tickets', label: '🎯 買い目' },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[s.tab, activeTab === tab.key && s.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* AI予想タブ */}
            {activeTab === 'prediction' && prediction.predictions.map((horse, i) => (
              <TouchableOpacity
                key={horse.num}
                style={[s.card, i === 0 && s.card1st, i === 1 && s.card2nd, i === 2 && s.card3rd]}
                activeOpacity={0.8}
                onPress={() => setExpandedHorse(expandedHorse === horse.num ? null : horse.num)}
              >
                <View style={s.predRow}>
                  <View style={s.rankBox}>
                    <Text style={[s.rankText, i < 3 && s.rankTop]}>{i < 3 ? ['🥇','🥈','🥉'][i] : `${i+1}`}</Text>
                  </View>
                  <View style={[s.wakuCircle, { backgroundColor: (wakuColors[horse.waku] || wakuColors[1]).bg }]}>
                    <Text style={[s.wakuText, { color: (wakuColors[horse.waku] || wakuColors[1]).text }]}>{horse.num}</Text>
                  </View>
                  <View style={s.horseInfo}>
                    <View style={s.nameRow}>
                      <Text style={s.horseName}>{horse.name}</Text>
                      <Text style={{ color: confColors[horse.confidence?.charAt(0)] || '#888', fontSize: 14, fontWeight: '700' }}>
                        {horse.confidence?.charAt(0)}
                      </Text>
                    </View>
                    <Text style={s.horseMeta}>
                      {horse.sex} {horse.jockey} {horse.runStyle || ''}
                    </Text>
                  </View>
                  <View style={s.scoreBox}>
                    <Text style={s.scoreNum}>{horse.totalScore}</Text>
                    <Text style={s.scoreMax}>/100</Text>
                  </View>
                </View>

                {/* 展開詳細 */}
                {expandedHorse === horse.num && (
                  <View style={s.expanded}>
                    {horse.odds > 0 && (
                      <View style={s.oddsRow}>
                        <Text style={s.oddsLabel}>単勝オッズ:</Text>
                        <Text style={s.oddsValue}>{horse.odds}倍</Text>
                        {liveData?.hasRealOdds && <Text style={s.liveTag}>LIVE</Text>}
                      </View>
                    )}
                    <Text style={s.expandMeta}>
                      {horse.popularity > 0 ? `${horse.popularity}番人気` : ''} / 騎手: {horse.jockey} / 調教師: {horse.trainer}
                    </Text>
                    {/* ファクターバー */}
                    {Object.entries(horse.factors).map(([key, val]) => (
                      <View key={key} style={s.factorRow}>
                        <Text style={s.factorLabel}>{key}</Text>
                        <View style={s.factorBarBg}>
                          <View style={[s.factorBarFg, {
                            width: `${(val.score / val.max) * 100}%`,
                            backgroundColor: val.score / val.max > 0.8 ? '#22c55e' : val.score / val.max > 0.6 ? '#eab308' : '#ef4444',
                          }]} />
                        </View>
                        <Text style={s.factorScore}>{val.score}/{val.max}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* 出馬表タブ */}
            {activeTab === 'horses' && prediction.predictions
              .slice().sort((a,b) => a.num - b.num)
              .map(horse => (
              <View key={horse.num} style={s.card}>
                <View style={s.predRow}>
                  <View style={[s.wakuCircle, { width: 40, height: 40, backgroundColor: (wakuColors[horse.waku] || wakuColors[1]).bg }]}>
                    <Text style={[s.wakuText, { fontSize: 15, color: (wakuColors[horse.waku] || wakuColors[1]).text }]}>{horse.num}</Text>
                  </View>
                  <View style={s.horseInfo}>
                    <Text style={s.horseName}>{horse.name}</Text>
                    <Text style={s.horseMeta}>{horse.sex}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {horse.odds > 0 && <Text style={[s.oddsValue, { fontSize: 14 }]}>{horse.odds}倍</Text>}
                    {horse.popularity > 0 && (
                      <View style={[s.popBadge, horse.popularity <= 3 && s.popTop]}>
                        <Text style={s.popText}>{horse.popularity}番人気</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={s.horseDetailRow}>
                  <Text style={s.detailItem}>騎手: {horse.jockey}</Text>
                  <Text style={s.detailItem}>調教師: {horse.trainer}</Text>
                </View>
              </View>
            ))}

            {/* 買い目タブ */}
            {activeTab === 'tickets' && (
              <View>
                <View style={[s.card, { borderColor: '#854d0e40' }]}>
                  <Text style={s.ticketTitle}>🎯 おすすめ買い目</Text>
                  {[
                    { label: '三連単（本命）', value: prediction.recommendations.sanrentan, conf: '自信度 高', confColor: '#991b1b' },
                    { label: '三連複', value: prediction.recommendations.sanrenpuku, conf: '自信度 中', confColor: '#1e40af' },
                    { label: '馬単', value: prediction.recommendations.umatan, conf: '自信度 中', confColor: '#1e40af' },
                    { label: '馬連', value: prediction.recommendations.umaren, conf: '堅め', confColor: '#15803d' },
                  ].map(item => (
                    <View key={item.label} style={s.ticketRow}>
                      <View style={s.ticketHeader}>
                        <Text style={s.ticketLabel}>{item.label}</Text>
                        <View style={[s.confBadge, { backgroundColor: item.confColor }]}>
                          <Text style={s.confText}>{item.conf}</Text>
                        </View>
                      </View>
                      <Text style={s.ticketValue}>{item.value}</Text>
                    </View>
                  ))}
                  <View style={s.ticketRow}>
                    <View style={s.ticketHeader}>
                      <Text style={s.ticketLabel}>ワイド（3点）</Text>
                      <View style={[s.confBadge, { backgroundColor: '#15803d' }]}>
                        <Text style={s.confText}>手広く</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      {prediction.recommendations.wide.map((w, i) => (
                        <View key={i} style={s.wideBadge}><Text style={s.wideText}>{w}</Text></View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* 予想印 */}
                <View style={s.card}>
                  <Text style={s.ticketTitle}>📊 予想印</Text>
                  {prediction.predictions.slice(0, 5).map(h => (
                    <View key={h.num} style={s.markRow}>
                      <Text style={{ fontSize: 20, color: confColors[h.confidence?.charAt(0)] || '#888' }}>
                        {h.confidence?.charAt(0)}
                      </Text>
                      <View style={[s.wakuCircle, { width: 26, height: 26, backgroundColor: (wakuColors[h.waku] || wakuColors[1]).bg }]}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: (wakuColors[h.waku] || wakuColors[1]).text }}>{h.num}</Text>
                      </View>
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{h.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        <Text style={s.footer}>※ AI予想は参考情報です。投票は自己責任でお願いします。</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  noData: { color: '#64748b', textAlign: 'center', marginTop: 40, fontSize: 14 },
  header: {
    margin: 16, padding: 16, borderRadius: 16,
    backgroundColor: '#312e81', borderWidth: 1, borderColor: '#4338ca',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  badge: { backgroundColor: '#eab308', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: '#422006', fontWeight: '800', fontSize: 12 },
  timeText: { color: '#facc15', fontWeight: '800', fontSize: 20, fontVariant: ['tabular-nums'] },
  raceName: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaText: { color: '#c7d2fe', fontSize: 13 },
  dataBadge: { marginTop: 10, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start' },
  dataLive: { backgroundColor: '#064e3b' },
  dataSim: { backgroundColor: '#1e3a5f' },
  dataText: { color: '#a7f3d0', fontSize: 11, fontWeight: '600' },
  linkRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 8 },
  linkBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  linkText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  tabRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#1e293b', borderRadius: 10, padding: 3,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#4f46e5' },
  tabText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  card: {
    marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12,
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
  },
  card1st: { borderColor: '#eab308', backgroundColor: '#1a1a2e' },
  card2nd: { borderColor: '#60a5fa40' },
  card3rd: { borderColor: '#4ade8030' },
  predRow: { flexDirection: 'row', alignItems: 'center' },
  rankBox: { width: 30, alignItems: 'center' },
  rankText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  rankTop: { fontSize: 18 },
  wakuCircle: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6,
  },
  wakuText: { fontSize: 13, fontWeight: '800' },
  horseInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  horseName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  horseMeta: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  scoreBox: { alignItems: 'flex-end' },
  scoreNum: { color: '#facc15', fontSize: 20, fontWeight: '800' },
  scoreMax: { color: '#64748b', fontSize: 10 },
  expanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  oddsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  oddsLabel: { color: '#64748b', fontSize: 12 },
  oddsValue: { color: '#34d399', fontSize: 16, fontWeight: '800' },
  liveTag: {
    fontSize: 9, fontWeight: '800', color: '#34d399',
    backgroundColor: '#064e3b', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
  },
  expandMeta: { color: '#94a3b8', fontSize: 11, marginBottom: 10 },
  factorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  factorLabel: { width: 60, color: '#94a3b8', fontSize: 11 },
  factorBarBg: { flex: 1, height: 6, backgroundColor: '#374151', borderRadius: 3 },
  factorBarFg: { height: 6, borderRadius: 3 },
  factorScore: { width: 45, color: '#94a3b8', fontSize: 11, textAlign: 'right' },
  popBadge: { backgroundColor: '#374151', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  popTop: { backgroundColor: '#7f1d1d' },
  popText: { color: '#e2e8f0', fontSize: 10 },
  horseDetailRow: { flexDirection: 'row', gap: 16, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#334155' },
  detailItem: { color: '#94a3b8', fontSize: 11 },
  ticketTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  ticketRow: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, marginBottom: 8 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketLabel: { color: '#94a3b8', fontSize: 12 },
  confBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  confText: { color: '#fecaca', fontSize: 10, fontWeight: '600' },
  ticketValue: { color: '#fff', fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: 4 },
  wideBadge: { backgroundColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  wideText: { color: '#fff', fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  markRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  footer: { textAlign: 'center', fontSize: 11, color: '#475569', padding: 20 },
});
