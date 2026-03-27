// 大井競馬場 レースデータ & AI予想エンジン

const today = new Date().toISOString().split('T')[0];

const horses = {
  1: [
    { num: 1, waku: 1, name: 'ゴールドスパーク', sex: '牡4', weight: 480, jockey: '矢野貴之', trainer: '荒山勝徳', odds: 3.2, popularity: 1, recentResults: ['1','2','1','3','2'], runStyle: '先行', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: -2 },
    { num: 2, waku: 1, name: 'サンライズフォルテ', sex: '牡5', weight: 472, jockey: '御神本訓史', trainer: '佐宗響', odds: 5.8, popularity: 2, recentResults: ['2','1','4','1','3'], runStyle: '差し', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: 0 },
    { num: 3, waku: 2, name: 'ブルーサンダー', sex: '牡6', weight: 490, jockey: '森泰斗', trainer: '藤田輝信', odds: 8.4, popularity: 4, recentResults: ['3','5','2','1','4'], runStyle: '追込', distanceApt: 'B', trackApt: 'A', condition: '良', weightChange: +4 },
    { num: 4, waku: 2, name: 'ミラクルウィング', sex: '牝4', weight: 452, jockey: '笹川翼', trainer: '村上頌', odds: 12.1, popularity: 5, recentResults: ['4','3','6','2','5'], runStyle: '先行', distanceApt: 'B', trackApt: 'B', condition: '稍重', weightChange: -4 },
    { num: 5, waku: 3, name: 'エクセルマスター', sex: '牡5', weight: 486, jockey: '的場文男', trainer: '福永敏', odds: 6.5, popularity: 3, recentResults: ['1','4','2','5','1'], runStyle: '逃げ', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: +2 },
    { num: 6, waku: 3, name: 'ハッピードリーム', sex: '牝5', weight: 446, jockey: '本田正重', trainer: '石井勝男', odds: 25.3, popularity: 8, recentResults: ['6','8','5','7','3'], runStyle: '差し', distanceApt: 'C', trackApt: 'B', condition: '良', weightChange: 0 },
    { num: 7, waku: 4, name: 'トーセンレジェンド', sex: '牡7', weight: 498, jockey: '和田譲治', trainer: '堀千亜樹', odds: 15.6, popularity: 6, recentResults: ['5','2','3','6','4'], runStyle: '追込', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: +6 },
    { num: 8, waku: 4, name: 'キングオブスター', sex: '牡4', weight: 476, jockey: '真島大輔', trainer: '佐藤裕太', odds: 18.9, popularity: 7, recentResults: ['3','7','4','8','2'], runStyle: '先行', distanceApt: 'B', trackApt: 'A', condition: '良', weightChange: -2 },
  ],
  2: [
    { num: 1, waku: 1, name: 'レッドファルコン', sex: '牡5', weight: 484, jockey: '矢野貴之', trainer: '荒山勝徳', odds: 2.8, popularity: 1, recentResults: ['1','1','2','1','3'], runStyle: '逃げ', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: 0 },
    { num: 2, waku: 1, name: 'ダークナイトⅡ', sex: '牡6', weight: 494, jockey: '森泰斗', trainer: '藤田輝信', odds: 4.1, popularity: 2, recentResults: ['2','3','1','2','1'], runStyle: '差し', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: +2 },
    { num: 3, waku: 2, name: 'スカイランナー', sex: '牡4', weight: 468, jockey: '笹川翼', trainer: '佐宗響', odds: 7.2, popularity: 3, recentResults: ['3','2','5','1','4'], runStyle: '先行', distanceApt: 'B', trackApt: 'A', condition: '良', weightChange: -2 },
    { num: 4, waku: 2, name: 'プラチナローズ', sex: '牝5', weight: 450, jockey: '御神本訓史', trainer: '村上頌', odds: 9.8, popularity: 4, recentResults: ['1','5','3','4','2'], runStyle: '差し', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: 0 },
    { num: 5, waku: 3, name: 'ビクトリーロード', sex: '牡5', weight: 488, jockey: '的場文男', trainer: '福永敏', odds: 11.5, popularity: 5, recentResults: ['4','3','2','6','1'], runStyle: '追込', distanceApt: 'B', trackApt: 'A', condition: '稍重', weightChange: +4 },
    { num: 6, waku: 3, name: 'シルバーストリーム', sex: '牝4', weight: 444, jockey: '本田正重', trainer: '石井勝男', odds: 22.0, popularity: 7, recentResults: ['5','6','7','3','8'], runStyle: '先行', distanceApt: 'C', trackApt: 'B', condition: '良', weightChange: -4 },
    { num: 7, waku: 4, name: 'サムライスピリット', sex: '牡6', weight: 496, jockey: '真島大輔', trainer: '堀千亜樹', odds: 14.3, popularity: 6, recentResults: ['2','4','6','5','3'], runStyle: '追込', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: +2 },
    { num: 8, waku: 4, name: 'ラッキーチャンス', sex: '牝3', weight: 438, jockey: '和田譲治', trainer: '佐藤裕太', odds: 35.8, popularity: 8, recentResults: ['7','8','4','9','6'], runStyle: '差し', distanceApt: 'C', trackApt: 'C', condition: '良', weightChange: 0 },
  ],
  3: [
    { num: 1, waku: 1, name: 'ワンダーボルト', sex: '牡4', weight: 478, jockey: '森泰斗', trainer: '藤田輝信', odds: 4.5, popularity: 2, recentResults: ['2','1','3','1','2'], runStyle: '先行', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: +2 },
    { num: 2, waku: 1, name: 'フェニックスライト', sex: '牡5', weight: 486, jockey: '矢野貴之', trainer: '荒山勝徳', odds: 3.5, popularity: 1, recentResults: ['1','2','1','2','1'], runStyle: '逃げ', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: 0 },
    { num: 3, waku: 2, name: 'マジックアワー', sex: '牝4', weight: 454, jockey: '御神本訓史', trainer: '佐宗響', odds: 6.3, popularity: 3, recentResults: ['1','3','2','4','1'], runStyle: '差し', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: -2 },
    { num: 4, waku: 2, name: 'テンペストキング', sex: '牡6', weight: 502, jockey: '笹川翼', trainer: '村上頌', odds: 8.9, popularity: 4, recentResults: ['3','4','1','5','2'], runStyle: '追込', distanceApt: 'B', trackApt: 'A', condition: '良', weightChange: +4 },
    { num: 5, waku: 3, name: 'グランドノーブル', sex: '牡5', weight: 492, jockey: '的場文男', trainer: '福永敏', odds: 10.2, popularity: 5, recentResults: ['4','2','5','3','6'], runStyle: '先行', distanceApt: 'B', trackApt: 'A', condition: '稍重', weightChange: 0 },
    { num: 6, waku: 3, name: 'リバティベル', sex: '牝5', weight: 448, jockey: '本田正重', trainer: '石井勝男', odds: 28.0, popularity: 8, recentResults: ['6','7','8','5','9'], runStyle: '差し', distanceApt: 'C', trackApt: 'C', condition: '良', weightChange: -2 },
    { num: 7, waku: 4, name: 'ドラゴンフライ', sex: '牡4', weight: 470, jockey: '真島大輔', trainer: '堀千亜樹', odds: 13.4, popularity: 6, recentResults: ['5','3','4','2','7'], runStyle: '逃げ', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: +2 },
    { num: 8, waku: 4, name: 'スターダストナイト', sex: '牡7', weight: 500, jockey: '和田譲治', trainer: '佐藤裕太', odds: 20.5, popularity: 7, recentResults: ['3','6','5','8','4'], runStyle: '追込', distanceApt: 'B', trackApt: 'B', condition: '良', weightChange: +6 },
  ],
  4: [
    { num: 1, waku: 1, name: 'インペリアルガード', sex: '牡5', weight: 492, jockey: '矢野貴之', trainer: '荒山勝徳', odds: 2.5, popularity: 1, recentResults: ['1','1','1','2','1'], runStyle: '先行', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: 0 },
    { num: 2, waku: 2, name: 'クロノスタイム', sex: '牡4', weight: 474, jockey: '森泰斗', trainer: '藤田輝信', odds: 5.2, popularity: 2, recentResults: ['2','1','3','1','4'], runStyle: '差し', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: +2 },
    { num: 3, waku: 3, name: 'エメラルドクイーン', sex: '牝5', weight: 456, jockey: '御神本訓史', trainer: '佐宗響', odds: 7.8, popularity: 3, recentResults: ['3','2','4','1','2'], runStyle: '逃げ', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: -2 },
    { num: 4, waku: 4, name: 'バトルクライ', sex: '牡6', weight: 504, jockey: '笹川翼', trainer: '村上頌', odds: 9.1, popularity: 4, recentResults: ['4','3','2','5','1'], runStyle: '追込', distanceApt: 'B', trackApt: 'A', condition: '良', weightChange: +4 },
    { num: 5, waku: 5, name: 'ナイトフォース', sex: '牡5', weight: 488, jockey: '的場文男', trainer: '福永敏', odds: 12.0, popularity: 5, recentResults: ['2','5','3','6','2'], runStyle: '先行', distanceApt: 'B', trackApt: 'A', condition: '稍重', weightChange: 0 },
    { num: 6, waku: 6, name: 'アクアマリン', sex: '牝4', weight: 442, jockey: '本田正重', trainer: '石井勝男', odds: 30.5, popularity: 8, recentResults: ['7','6','8','4','9'], runStyle: '差し', distanceApt: 'C', trackApt: 'C', condition: '良', weightChange: -4 },
    { num: 7, waku: 7, name: 'ロイヤルアーマー', sex: '牡7', weight: 510, jockey: '真島大輔', trainer: '堀千亜樹', odds: 16.2, popularity: 6, recentResults: ['5','4','6','3','5'], runStyle: '追込', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: +8 },
    { num: 8, waku: 8, name: 'ルビーハート', sex: '牝3', weight: 436, jockey: '和田譲治', trainer: '佐藤裕太', odds: 22.0, popularity: 7, recentResults: ['6','8','5','7','3'], runStyle: '逃げ', distanceApt: 'C', trackApt: 'B', condition: '良', weightChange: -2 },
  ],
  5: [
    { num: 1, waku: 1, name: 'サンダーストーム', sex: '牡5', weight: 496, jockey: '森泰斗', trainer: '藤田輝信', odds: 3.8, popularity: 1, recentResults: ['1','2','1','1','3'], runStyle: '先行', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: +2 },
    { num: 2, waku: 2, name: 'ダイヤモンドキング', sex: '牡4', weight: 482, jockey: '矢野貴之', trainer: '荒山勝徳', odds: 4.2, popularity: 2, recentResults: ['2','1','2','3','1'], runStyle: '差し', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: 0 },
    { num: 3, waku: 3, name: 'ムーンライトソナタ', sex: '牝5', weight: 458, jockey: '御神本訓史', trainer: '佐宗響', odds: 6.0, popularity: 3, recentResults: ['1','3','1','2','4'], runStyle: '逃げ', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: -2 },
    { num: 4, waku: 4, name: 'アイアンウィル', sex: '牡6', weight: 506, jockey: '笹川翼', trainer: '村上頌', odds: 10.5, popularity: 5, recentResults: ['3','5','2','4','6'], runStyle: '追込', distanceApt: 'B', trackApt: 'A', condition: '良', weightChange: +6 },
    { num: 5, waku: 5, name: 'フラッシュポイント', sex: '牡4', weight: 470, jockey: '的場文男', trainer: '福永敏', odds: 8.3, popularity: 4, recentResults: ['2','4','1','5','2'], runStyle: '先行', distanceApt: 'A', trackApt: 'A', condition: '稍重', weightChange: 0 },
    { num: 6, waku: 6, name: 'チェリーブロッサム', sex: '牝4', weight: 440, jockey: '本田正重', trainer: '石井勝男', odds: 18.5, popularity: 7, recentResults: ['5','6','7','3','8'], runStyle: '差し', distanceApt: 'C', trackApt: 'B', condition: '良', weightChange: -2 },
    { num: 7, waku: 7, name: 'タイガーブレイブ', sex: '牡5', weight: 494, jockey: '真島大輔', trainer: '堀千亜樹', odds: 14.8, popularity: 6, recentResults: ['4','3','5','2','7'], runStyle: '追込', distanceApt: 'B', trackApt: 'B', condition: '良', weightChange: +4 },
    { num: 8, waku: 8, name: 'ホワイトエンジェル', sex: '牝3', weight: 434, jockey: '和田譲治', trainer: '佐藤裕太', odds: 42.0, popularity: 8, recentResults: ['8','7','9','6','5'], runStyle: '逃げ', distanceApt: 'C', trackApt: 'C', condition: '良', weightChange: 0 },
  ],
  6: [
    { num: 1, waku: 1, name: 'シャドウファントム', sex: '牡5', weight: 488, jockey: '矢野貴之', trainer: '荒山勝徳', odds: 4.0, popularity: 2, recentResults: ['2','1','3','1','2'], runStyle: '差し', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: 0 },
    { num: 2, waku: 1, name: 'セレスティアル', sex: '牡4', weight: 476, jockey: '森泰斗', trainer: '藤田輝信', odds: 3.1, popularity: 1, recentResults: ['1','1','2','1','1'], runStyle: '先行', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: +2 },
    { num: 3, waku: 2, name: 'オーロラプリンセス', sex: '牝5', weight: 450, jockey: '御神本訓史', trainer: '佐宗響', odds: 7.5, popularity: 3, recentResults: ['3','2','1','4','2'], runStyle: '逃げ', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: -2 },
    { num: 4, waku: 2, name: 'マッスルパワー', sex: '牡7', weight: 512, jockey: '笹川翼', trainer: '村上頌', odds: 11.0, popularity: 5, recentResults: ['4','5','3','6','1'], runStyle: '追込', distanceApt: 'B', trackApt: 'A', condition: '良', weightChange: +8 },
    { num: 5, waku: 3, name: 'クリムゾンタイド', sex: '牡5', weight: 490, jockey: '的場文男', trainer: '福永敏', odds: 8.8, popularity: 4, recentResults: ['1','4','5','2','3'], runStyle: '先行', distanceApt: 'B', trackApt: 'A', condition: '稍重', weightChange: 0 },
    { num: 6, waku: 3, name: 'シルクロード', sex: '牝4', weight: 446, jockey: '本田正重', trainer: '石井勝男', odds: 26.0, popularity: 7, recentResults: ['6','7','4','8','5'], runStyle: '差し', distanceApt: 'C', trackApt: 'B', condition: '良', weightChange: -4 },
    { num: 7, waku: 4, name: 'バーニングソウル', sex: '牡6', weight: 498, jockey: '真島大輔', trainer: '堀千亜樹', odds: 15.0, popularity: 6, recentResults: ['5','3','6','4','7'], runStyle: '追込', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: +4 },
    { num: 8, waku: 4, name: 'エンジェルウィスパー', sex: '牝3', weight: 432, jockey: '和田譲治', trainer: '佐藤裕太', odds: 38.0, popularity: 8, recentResults: ['7','9','6','5','8'], runStyle: '逃げ', distanceApt: 'C', trackApt: 'C', condition: '良', weightChange: -2 },
  ],
};

const races = [
  { id: 1, raceNum: 1, name: 'サラ系3歳以上', course: 'ダ1200m', class: 'C3', startTime: '14:30', trackCondition: '良', weather: '晴', purse: 200 },
  { id: 2, raceNum: 2, name: 'サラ系3歳以上', course: 'ダ1400m', class: 'C2', startTime: '15:05', trackCondition: '良', weather: '晴', purse: 250 },
  { id: 3, raceNum: 3, name: 'スプリングカップ', course: 'ダ1600m', class: 'B3', startTime: '15:40', trackCondition: '良', weather: '晴', purse: 400 },
  { id: 4, raceNum: 4, name: '大井記念トライアル', course: 'ダ1800m', class: 'B1', startTime: '16:15', trackCondition: '稍重', weather: '曇', purse: 600 },
  { id: 5, raceNum: 5, name: 'スターライト賞', course: 'ダ2000m', class: 'A2', startTime: '16:50', trackCondition: '稍重', weather: '曇', purse: 800 },
  { id: 6, raceNum: 6, name: 'トゥインクルステークス', course: 'ダ1600m', class: 'S', startTime: '17:30', trackCondition: '稍重', weather: '曇', purse: 1500 },
];

// AI予想エンジン
function calculateScore(horse, race) {
  let score = 0;
  const factors = {};

  // 1. 近走成績 (max 30pts)
  const recentScore = horse.recentResults.reduce((sum, r, i) => {
    const pos = parseInt(r);
    const weight = 5 - i; // 直近ほど重み大
    const pts = pos <= 1 ? 6 * weight : pos <= 2 ? 4 * weight : pos <= 3 ? 2.5 * weight : pos <= 5 ? 1 * weight : 0;
    return sum + pts;
  }, 0);
  const recentNorm = Math.min(30, (recentScore / 90) * 30);
  factors['近走成績'] = { score: Math.round(recentNorm * 10) / 10, max: 30 };
  score += recentNorm;

  // 2. 距離適性 (max 15pts)
  const distMap = { 'A': 15, 'B': 9, 'C': 4 };
  factors['距離適性'] = { score: distMap[horse.distanceApt], max: 15 };
  score += distMap[horse.distanceApt];

  // 3. コース適性 (max 15pts)
  const trackMap = { 'A': 15, 'B': 9, 'C': 4 };
  factors['コース適性'] = { score: trackMap[horse.trackApt], max: 15 };
  score += trackMap[horse.trackApt];

  // 4. 騎手評価 (max 15pts)
  const jockeyRatings = {
    '矢野貴之': 15, '森泰斗': 14, '御神本訓史': 13, '笹川翼': 11,
    '的場文男': 12, '真島大輔': 10, '本田正重': 8, '和田譲治': 7
  };
  const jockeyScore = jockeyRatings[horse.jockey] || 7;
  factors['騎手'] = { score: jockeyScore, max: 15 };
  score += jockeyScore;

  // 5. 馬場適性 (max 10pts)
  let trackCondScore = 7;
  if (race.trackCondition === '良' && horse.condition === '良') trackCondScore = 10;
  else if (race.trackCondition === '稍重' && horse.condition === '稍重') trackCondScore = 10;
  else if (race.trackCondition === '稍重' && horse.condition === '良') trackCondScore = 6;
  factors['馬場適性'] = { score: trackCondScore, max: 10 };
  score += trackCondScore;

  // 6. 脚質 (max 10pts) - 距離とコースに応じた脚質評価
  const dist = parseInt(race.course.match(/\d+/)[0]);
  let styleScore = 7;
  if (dist <= 1400) {
    if (horse.runStyle === '逃げ') styleScore = 10;
    else if (horse.runStyle === '先行') styleScore = 9;
    else if (horse.runStyle === '差し') styleScore = 6;
    else styleScore = 4;
  } else if (dist <= 1800) {
    if (horse.runStyle === '先行') styleScore = 10;
    else if (horse.runStyle === '差し') styleScore = 9;
    else if (horse.runStyle === '逃げ') styleScore = 7;
    else styleScore = 6;
  } else {
    if (horse.runStyle === '差し') styleScore = 10;
    else if (horse.runStyle === '追込') styleScore = 9;
    else if (horse.runStyle === '先行') styleScore = 7;
    else styleScore = 5;
  }
  factors['脚質'] = { score: styleScore, max: 10 };
  score += styleScore;

  // 7. 体重変動 (max 5pts)
  const absChange = Math.abs(horse.weightChange);
  let weightScore = absChange <= 2 ? 5 : absChange <= 4 ? 3 : absChange <= 6 ? 2 : 1;
  factors['体重変動'] = { score: weightScore, max: 5 };
  score += weightScore;

  return { totalScore: Math.round(score * 10) / 10, factors };
}

export function getRaces() {
  return races.map(r => ({
    ...r,
    date: today,
    venue: '大井',
    horseCount: (horses[r.id] || []).length,
  }));
}

export function getRaceById(id) {
  const race = races.find(r => r.id === id);
  if (!race) return null;
  return {
    ...race,
    date: today,
    venue: '大井',
    horses: horses[id] || [],
  };
}

export function getPrediction(raceId) {
  const race = races.find(r => r.id === raceId);
  if (!race) return null;
  const raceHorses = horses[raceId] || [];

  const predictions = raceHorses.map(horse => {
    const { totalScore, factors } = calculateScore(horse, race);
    return { ...horse, totalScore, factors };
  });

  predictions.sort((a, b) => b.totalScore - a.totalScore);

  // ランク付け
  predictions.forEach((p, i) => {
    p.rank = i + 1;
    p.confidence = p.rank <= 1 ? '◎ 本命' : p.rank <= 2 ? '○ 対抗' : p.rank <= 3 ? '▲ 単穴' : p.rank <= 4 ? '△ 連下' : '× 軽視';
  });

  // 買い目推奨
  const top3 = predictions.slice(0, 3).map(p => p.num);
  const top4 = predictions.slice(0, 4).map(p => p.num);
  const recommendations = {
    sanrentan: `${top3[0]}-${top3[1]}-${top3[2]}`,
    sanrenpuku: top3.sort((a,b) => a-b).join('-'),
    umaren: [top4[0], top4[1]].sort((a,b) => a-b).join('-'),
    umatan: `${top4[0]}→${top4[1]}`,
    wide: [
      [top3[0], top3[1]].sort((a,b) => a-b).join('-'),
      [top3[0], top3[2]].sort((a,b) => a-b).join('-'),
      [top3[1], top3[2]].sort((a,b) => a-b).join('-'),
    ],
  };

  return {
    race: { ...race, date: today, venue: '大井' },
    predictions,
    recommendations,
  };
}
