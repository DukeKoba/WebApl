// 大井競馬場 2026/3/27(金) 第19回大井競馬5日目 レースデータ & AI予想エンジン
// 天候: 晴 / 馬場: ダート重

const today = '2026-03-27';

// 大井所属・南関東の実在騎手リスト
const jockeys = [
  '矢野貴之', '森泰斗', '御神本訓史', '笹川翼', '的場文男',
  '真島大輔', '本田正重', '和田譲治', '達城龍次', '吉井章',
  '藤田凌', '瀧川寿希也', '町田直希', '岡村健司', '保園翔也'
];

// 大井所属の実在調教師リスト
const trainers = [
  '荒山勝徳', '佐宗響', '藤田輝信', '村上頌', '福永敏',
  '堀千亜樹', '石井勝男', '佐藤裕太', '月岡健二', '的場均',
  '高橋三郎', '寺田新太郎', '渡辺和雄', '鷹見浩', '阪本一栄'
];

const runStyles = ['逃げ', '先行', '差し', '追込'];
const aptitudes = ['A', 'B', 'C'];
const sexList3yo = ['牡3', '牝3', '牡3', '牝3', '牡3', 'セ3'];
const sexListOlder = ['牡4', '牡5', '牡6', '牝4', '牝5', '牡7', 'セ5', 'セ6', '牡4', '牝6'];

// シード付き疑似乱数（再現性のため）
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// レースごとの出走馬データを生成
function generateHorses(raceId, count, is3yo) {
  const rng = seededRandom(raceId * 1000 + 327);
  const result = [];
  const usedJockeys = new Set();

  for (let i = 1; i <= count; i++) {
    // 枠番計算（大井は最大8枠）
    const waku = count <= 8 ? i : Math.min(8, Math.ceil(i * 8 / count));

    // 騎手（重複なし）
    let jIdx;
    do { jIdx = Math.floor(rng() * jockeys.length); } while (usedJockeys.has(jIdx) && usedJockeys.size < jockeys.length);
    usedJockeys.add(jIdx);

    const tIdx = Math.floor(rng() * trainers.length);
    const sex = is3yo ? sexList3yo[Math.floor(rng() * sexList3yo.length)] : sexListOlder[Math.floor(rng() * sexListOlder.length)];
    const isFemale = sex.includes('牝');
    const baseWeight = isFemale ? 440 + Math.floor(rng() * 30) : 460 + Math.floor(rng() * 50);

    // 近走成績（ランダムだが上位人気ほど良い傾向）
    const strength = rng();
    const recentResults = [];
    for (let j = 0; j < 5; j++) {
      const base = strength < 0.3 ? 1 : strength < 0.6 ? 3 : 5;
      recentResults.push(String(Math.max(1, Math.min(14, base + Math.floor(rng() * 5) - 1))));
    }

    const distApt = aptitudes[Math.floor(rng() * 2.3)]; // Aが多め
    const trackApt = aptitudes[Math.floor(rng() * 2.3)];
    const weightChange = Math.floor(rng() * 14) - 6; // -6 ~ +7

    // オッズ生成（強さに基づく）
    const baseOdds = 2 + strength * 80;
    const odds = Math.round(baseOdds * 10) / 10;

    result.push({
      num: i,
      waku,
      name: `${raceId}R-${i}番馬`,  // プレースホルダー
      sex,
      weight: baseWeight,
      jockey: jockeys[jIdx],
      trainer: trainers[tIdx],
      odds,
      popularity: 0, // 後で設定
      recentResults,
      runStyle: runStyles[Math.floor(rng() * runStyles.length)],
      distanceApt: distApt,
      trackApt: trackApt,
      condition: rng() > 0.4 ? '重' : '良',
      weightChange,
    });
  }

  // 人気順（オッズ順）
  const sorted = [...result].sort((a, b) => a.odds - b.odds);
  sorted.forEach((h, i) => { h.popularity = i + 1; });

  return result;
}

// 3歳馬名プール
const names3yo = [
  'コスモブライト', 'ルナフェスタ', 'ヴェルデグリーン', 'サクラウィナー', 'グランフォルテ',
  'ミヤコノハナ', 'ダンスウィズミー', 'アポロンスター', 'ハクサンムーン', 'トーセンジョーダン',
  'ゼファーウィンド', 'ニシノラピート', 'シャインブライト', 'アスクビクター', 'コパノリチャード',
  'マイティスワロー', 'フジノパール', 'キングフェスタ', 'プリンセスモア', 'ダークヴェール',
  'ライトオブホープ', 'スマートアロー', 'エスケープショット', 'ブルーサファイア', 'ストームブレイク',
  'ナイトフォーチュン', 'ゴールデンヒーロー', 'リバティクロス', 'クリスタルレイン', 'フラワーガーデン',
  'マジックスピード', 'レッドアゲート', 'サンライズフレア', 'トップオブワールド', 'ルーチェドーロ',
  'ハッピーアワー', 'スカイプロミス', 'ファルコンウィング', 'ダイヤモンドキッス', 'ヴァンキッシュ',
];

// 古馬名プール
const namesOlder = [
  'マイネルファンロン', 'トーセンスーリヤ', 'コスモカレント', 'サクラアリュール', 'ゴールドクイーン',
  'ミッキーブリランテ', 'プレシャスルージュ', 'ワンダフルタウン', 'リュウノシンゲン', 'ハナノパレード',
  'マイネルプロンプト', 'グランデウィーク', 'ダノンキングダム', 'ケイアイドリーム', 'サトノグラン',
  'テーオーケインズ', 'ロードレガリス', 'マイネルウィルトス', 'グランアレグリア', 'コパノキッキング',
  'オーメンスター', 'ラブリービター', 'サンライズハイツ', 'ニューモニュメント', 'キタノコマンドール',
  'トーセンブライト', 'リアルスティール', 'アーバンシック', 'ナムラカメタロー', 'ブラックアーメット',
  'サノサムライ', 'コンバットマーチ', 'レインボーフラッグ', 'トーセンバジル', 'ダイワスカーレット',
  'タガノグランパ', 'メイショウボーラー', 'リンクスターゲイザー', 'サンビスタ', 'フジキセキスター',
  'ケイティブレイブ', 'ゴライアス', 'マジェスティハーツ', 'スズカマンサク', 'プリモンディアル',
  'カガノカムイ', 'キャッスルトップ', 'エスポワールシチー', 'ハヤブサマカオー', 'トーセンジャガー',
  'シゲルヒトツボシ', 'モズアトラクション', 'アドマイヤムーン', 'サクセスブロッケン', 'フサイチジャンク',
  'ゴーディー', 'レッドルーラー', 'テイエムジンソク', 'アキノスマート', 'ドリームスイープ',
  'コウエイハート', 'タカラシャーディー', 'マイネルエスパス', 'ジュンライトボルト', 'ラストインパクト',
  'サンライズソア', 'ペイシャフェリス', 'ダノンザキッド', 'スマートレイアー', 'クリスタルブラック',
  'ブルベアイリーデ', 'シンメデージー', 'クレスコグランド', 'プリモシーン', 'リンゴアメ',
  'カイザーミノル', 'エアファンディタ', 'ランスオブプラーナ', 'ラヴァンダ', 'サノノカガヤキ',
  'ベルダーイメル', 'メイショウカドマツ', 'トウケイニセイ', 'テーオーフォルテ', 'ランフォザドリーム',
  'ミステリオーソ', 'シュバルツガイスト', 'コスモインペリウム', 'スパーキングジョイ', 'ダノンシティ',
  'グラスワンダー', 'ケンブリッジナイト', 'オメガスラッシュ', 'エルデュクラージュ', 'フォルコン',
  'バルターガイスト', 'プリエミネンス', 'サンマルデューク', 'メテオスウォーム', 'ポラリスシチー',
];

// 馬名を割り当て
function assignNames(horses, raceId, is3yo) {
  const pool = is3yo ? names3yo : namesOlder;
  const offset = (raceId * 7) % pool.length;
  horses.forEach((h, i) => {
    h.name = pool[(offset + i) % pool.length];
  });
}

// === 実データ: レーススケジュール ===
const races = [
  { id: 1,  raceNum: 1,  name: '３歳(一)(二)(三)',            course: 'ダ1600m', class: 'C3', startTime: '14:30', trackCondition: '重', weather: '晴', purse: 150, horseCount: 9,  is3yo: true },
  { id: 2,  raceNum: 2,  name: '３歳(一)(二)(三)',            course: 'ダ1200m', class: 'C3', startTime: '15:02', trackCondition: '重', weather: '晴', purse: 150, horseCount: 12, is3yo: true },
  { id: 3,  raceNum: 3,  name: 'Ｃ１(二)Ｃ２(二)',            course: 'ダ1000m', class: 'C1', startTime: '15:35', trackCondition: '重', weather: '晴', purse: 250, horseCount: 12, is3yo: false },
  { id: 4,  raceNum: 4,  name: 'Ｃ２(四)(五)(六)',            course: 'ダ1600m', class: 'C2', startTime: '16:07', trackCondition: '重', weather: '晴', purse: 200, horseCount: 6,  is3yo: false },
  { id: 5,  raceNum: 5,  name: 'Ｃ２(四)(五)(六)',            course: 'ダ1400m', class: 'C2', startTime: '16:40', trackCondition: '重', weather: '晴', purse: 200, horseCount: 14, is3yo: false },
  { id: 6,  raceNum: 6,  name: 'Ｃ２(四)(五)(六)',            course: 'ダ1200m', class: 'C2', startTime: '17:12', trackCondition: '重', weather: '晴', purse: 200, horseCount: 14, is3yo: false },
  { id: 7,  raceNum: 7,  name: 'つくし特別',                  course: 'ダ1400m', class: 'C3', startTime: '17:45', trackCondition: '重', weather: '晴', purse: 300, horseCount: 8,  is3yo: true },
  { id: 8,  raceNum: 8,  name: 'パリジャン賞',               course: 'ダ1400m', class: 'C1', startTime: '18:20', trackCondition: '重', weather: '晴', purse: 350, horseCount: 11, is3yo: false },
  { id: 9,  raceNum: 9,  name: '八丈島フリージア賞',         course: 'ダ1200m', class: 'C1', startTime: '18:55', trackCondition: '重', weather: '晴', purse: 350, horseCount: 11, is3yo: false },
  { id: 10, raceNum: 10, name: '春灯特別',                    course: 'ダ1600m', class: 'C1', startTime: '19:30', trackCondition: '重', weather: '晴', purse: 400, horseCount: 11, is3yo: false },
  { id: 11, raceNum: 11, name: 'ブラッドストーン賞',         course: 'ダ1600m', class: 'A2', startTime: '20:10', trackCondition: '重', weather: '晴', purse: 800, horseCount: 12, is3yo: false },
  { id: 12, raceNum: 12, name: '桜坂賞',                      course: 'ダ2000m', class: 'B3', startTime: '20:50', trackCondition: '重', weather: '晴', purse: 500, horseCount: 15, is3yo: false },
];

// 全レースの出走馬データを生成
const horses = {};
races.forEach(race => {
  const h = generateHorses(race.id, race.horseCount, race.is3yo);
  assignNames(h, race.id, race.is3yo);
  horses[race.id] = h;
});

// === AI予想エンジン（7ファクター方式）===
function calculateScore(horse, race) {
  let score = 0;
  const factors = {};

  // 1. 近走成績 (30点満点)
  const recentScore = horse.recentResults.reduce((sum, r, i) => {
    const pos = parseInt(r);
    const weight = 5 - i;
    const pts = pos <= 1 ? 6 * weight : pos <= 2 ? 4 * weight : pos <= 3 ? 2.5 * weight : pos <= 5 ? 1 * weight : 0;
    return sum + pts;
  }, 0);
  const recentNorm = Math.min(30, (recentScore / 90) * 30);
  factors['近走成績'] = { score: Math.round(recentNorm * 10) / 10, max: 30 };
  score += recentNorm;

  // 2. 距離適性 (15点満点)
  const distMap = { 'A': 15, 'B': 9, 'C': 4 };
  factors['距離適性'] = { score: distMap[horse.distanceApt], max: 15 };
  score += distMap[horse.distanceApt];

  // 3. コース適性 (15点満点)
  const trackMap = { 'A': 15, 'B': 9, 'C': 4 };
  factors['コース適性'] = { score: trackMap[horse.trackApt], max: 15 };
  score += trackMap[horse.trackApt];

  // 4. 騎手 (15点満点)
  const jockeyRatings = {
    '矢野貴之': 15, '森泰斗': 14, '御神本訓史': 13, '笹川翼': 11,
    '的場文男': 12, '真島大輔': 10, '本田正重': 8, '和田譲治': 7,
    '達城龍次': 9, '吉井章': 8, '藤田凌': 10, '瀧川寿希也': 9,
    '町田直希': 8, '岡村健司': 9, '保園翔也': 7,
  };
  const jockeyScore = jockeyRatings[horse.jockey] || 7;
  factors['騎手'] = { score: jockeyScore, max: 15 };
  score += jockeyScore;

  // 5. 馬場適性 (10点満点) - 今日は重馬場
  let trackCondScore = 7;
  if (race.trackCondition === '重' && horse.condition === '重') trackCondScore = 10;
  else if (race.trackCondition === '重' && horse.condition === '良') trackCondScore = 5;
  else if (race.trackCondition === '良' && horse.condition === '良') trackCondScore = 10;
  else if (race.trackCondition === '稍重' && horse.condition === '稍重') trackCondScore = 10;
  factors['馬場適性'] = { score: trackCondScore, max: 10 };
  score += trackCondScore;

  // 6. 脚質 (10点満点)
  const dist = parseInt(race.course.match(/\d+/)[0]);
  let styleScore = 7;
  if (dist <= 1200) {
    if (horse.runStyle === '逃げ') styleScore = 10;
    else if (horse.runStyle === '先行') styleScore = 9;
    else if (horse.runStyle === '差し') styleScore = 5;
    else styleScore = 3;
  } else if (dist <= 1400) {
    if (horse.runStyle === '逃げ') styleScore = 9;
    else if (horse.runStyle === '先行') styleScore = 10;
    else if (horse.runStyle === '差し') styleScore = 7;
    else styleScore = 5;
  } else if (dist <= 1600) {
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

  // 7. 体重変動 (5点満点)
  const absChange = Math.abs(horse.weightChange);
  let weightScore = absChange <= 2 ? 5 : absChange <= 4 ? 3 : absChange <= 6 ? 2 : 1;
  factors['体重変動'] = { score: weightScore, max: 5 };
  score += weightScore;

  return { totalScore: Math.round(score * 10) / 10, factors };
}

export function getRaces() {
  return races.map(r => ({
    ...r, date: today, venue: '大井', horseCount: (horses[r.id] || []).length,
  }));
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
  predictions.forEach((p, i) => {
    p.rank = i + 1;
    p.confidence = p.rank <= 1 ? '◎ 本命' : p.rank <= 2 ? '○ 対抗' : p.rank <= 3 ? '▲ 単穴' : p.rank <= 4 ? '△ 連下' : '× 軽視';
  });

  const top3 = predictions.slice(0, 3).map(p => p.num);
  const top4 = predictions.slice(0, 4).map(p => p.num);
  return {
    race: { ...race, date: today, venue: '大井' },
    predictions,
    recommendations: {
      sanrentan: `${top3[0]}-${top3[1]}-${top3[2]}`,
      sanrenpuku: [...top3].sort((a, b) => a - b).join('-'),
      umaren: [top4[0], top4[1]].sort((a, b) => a - b).join('-'),
      umatan: `${top4[0]}→${top4[1]}`,
      wide: [
        [top3[0], top3[1]].sort((a, b) => a - b).join('-'),
        [top3[0], top3[2]].sort((a, b) => a - b).join('-'),
        [top3[1], top3[2]].sort((a, b) => a - b).join('-'),
      ],
    },
  };
}
