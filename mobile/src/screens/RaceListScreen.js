import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { races, VENUE, WEATHER, TRACK_CONDITION, SESSION_INFO } from '../data/raceSchedule';
import { fetchAllRaces } from '../data/fetchRaceData';

const classColors = {
  'S':  '#b45309', 'A1': '#991b1b', 'A2': '#b91c1c',
  'B1': '#1e40af', 'B2': '#1d4ed8', 'B3': '#2563eb',
  'C1': '#15803d', 'C2': '#16a34a', 'C3': '#22c55e',
};

export default function RaceListScreen({ navigation }) {
  const [liveData, setLiveData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchAllRaces(races.length);
      setLiveData(data);
    } catch (e) {
      console.warn('データ取得エラー:', e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const hasAnyLiveData = Object.values(liveData).some(d => d?.hasRealHorses || d?.hasRealOdds);

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />}
      >
        {/* ヘッダー */}
        <View style={s.header}>
          <Text style={s.headerTitle}>🏇 大井競馬AI予想</Text>
          <Text style={s.headerSub}>{SESSION_INFO}</Text>
          <View style={s.headerInfo}>
            <Text style={s.headerTag}>📍 {VENUE}</Text>
            <Text style={s.headerTag}>☀️ {WEATHER}</Text>
            <Text style={s.headerTag}>🏁 ダ{TRACK_CONDITION}</Text>
            <Text style={s.headerTag}>全{races.length}R</Text>
          </View>
          {/* データステータス */}
          <View style={[s.statusBadge, hasAnyLiveData ? s.statusLive : s.statusSim]}>
            <Text style={s.statusText}>
              {loading ? '⏳ データ取得中...' : hasAnyLiveData ? '🟢 LIVE データ取得済' : '🔵 シミュレーションモード'}
            </Text>
          </View>
        </View>

        {/* レースカード */}
        {races.map(race => {
          const live = liveData[race.id];
          const realHorseCount = live?.hasRealHorses ? live.horses.horses.length : race.horseCount;
          const hasOdds = live?.hasRealOdds;

          return (
            <TouchableOpacity
              key={race.id}
              style={s.raceCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('RaceDetail', { raceId: race.id, liveData: live })}
            >
              <View style={s.raceRow}>
                {/* レース番号 */}
                <View style={[s.raceNumBox, { backgroundColor: classColors[race.class] || '#4b5563' }]}>
                  <Text style={s.raceNumText}>{race.raceNum}R</Text>
                  <Text style={s.raceClassText}>{race.class}</Text>
                </View>

                {/* レース情報 */}
                <View style={s.raceInfo}>
                  <Text style={s.raceName} numberOfLines={1}>{race.name}</Text>
                  <View style={s.raceMeta}>
                    <Text style={s.raceMetaText}>{race.course}</Text>
                    <Text style={s.raceMetaText}>{realHorseCount}頭</Text>
                    <Text style={s.raceMetaText}>賞金{race.purse}万</Text>
                    {hasOdds && <Text style={s.liveBadge}>LIVE</Text>}
                  </View>
                </View>

                {/* 発走時刻 */}
                <View style={s.timeBox}>
                  <Text style={s.timeText}>{race.startTime}</Text>
                  <Text style={s.condText}>ダ{TRACK_CONDITION}</Text>
                </View>
                <Text style={s.arrow}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={s.footer}>※ AI予想は参考情報です。投票は自己責任でお願いします。</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flex: 1 },
  header: {
    margin: 16, padding: 16, borderRadius: 16,
    backgroundColor: '#312e81', borderWidth: 1, borderColor: '#4338ca',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
  headerSub: { fontSize: 13, color: '#a5b4fc', marginBottom: 8 },
  headerInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  headerTag: { fontSize: 12, color: '#c7d2fe' },
  statusBadge: {
    marginTop: 10, paddingVertical: 5, paddingHorizontal: 10,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  statusLive: { backgroundColor: '#064e3b' },
  statusSim: { backgroundColor: '#1e3a5f' },
  statusText: { fontSize: 11, color: '#a7f3d0', fontWeight: '600' },
  raceCard: {
    marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12,
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
  },
  raceRow: { flexDirection: 'row', alignItems: 'center' },
  raceNumBox: {
    width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  raceNumText: { fontSize: 12, fontWeight: '600', color: '#fff', opacity: 0.9 },
  raceClassText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  raceInfo: { flex: 1, marginLeft: 12 },
  raceName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  raceMeta: { flexDirection: 'row', marginTop: 3, gap: 8 },
  raceMetaText: { fontSize: 11, color: '#94a3b8' },
  liveBadge: {
    fontSize: 9, fontWeight: '800', color: '#34d399',
    backgroundColor: '#064e3b', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
  },
  timeBox: { alignItems: 'flex-end', marginRight: 4 },
  timeText: { fontSize: 15, fontWeight: '700', color: '#facc15', fontVariant: ['tabular-nums'] },
  condText: { fontSize: 10, color: '#64748b', marginTop: 2 },
  arrow: { fontSize: 22, color: '#475569', marginLeft: 2 },
  footer: { textAlign: 'center', fontSize: 11, color: '#475569', padding: 20 },
});
