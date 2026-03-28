// AI予想エンジン（7ファクター方式）
// 近走成績30 + 距離適性15 + コース適性15 + 騎手15 + 馬場適性10 + 脚質10 + 体重変動5 = 100点満点

// 大井の有力騎手レーティング
const jockeyRatings = {
  '矢野貴之': 15, '森泰斗': 14, '御神本訓史': 13, '笹川翼': 12,
  '的場文男': 11, '真島大輔': 11, '本田正重': 9, '和田譲治': 8,
  '達城龍次': 10, '吉井章': 9, '藤田凌': 10, '瀧川寿希也': 9,
  '町田直希': 8, '岡村健司': 8, '保園翔也': 8,
};

export function calculatePrediction(horses, race) {
  if (!horses || horses.length === 0) return null;

  const dist = parseInt(race.course.match(/\d+/)?.[0] || '1400');

  const scored = horses.map(horse => {
    let score = 0;
    const factors = {};

    // 1. 近走成績 (30点) - recentResults があればそこから、なければオッズから推定
    let recentScore;
    if (horse.recentResults && horse.recentResults.length > 0) {
      recentScore = horse.recentResults.reduce((sum, r, i) => {
        const pos = parseInt(r);
        const w = 5 - i;
        return sum + (pos <= 1 ? 6*w : pos <= 2 ? 4*w : pos <= 3 ? 2.5*w : pos <= 5 ? w : 0);
      }, 0);
      recentScore = Math.min(30, (recentScore / 90) * 30);
    } else if (horse.odds) {
      // オッズから強さを推定
      recentScore = Math.max(5, 30 - (horse.odds - 1) * 0.5);
    } else {
      recentScore = 15;
    }
    factors['近走成績'] = { score: Math.round(recentScore * 10) / 10, max: 30 };
    score += recentScore;

    // 2. 距離適性 (15点) - データがあれば使用、なければ中間値
    const distApt = horse.distanceApt || 'B';
    const distMap = { 'A': 15, 'B': 9, 'C': 4 };
    factors['距離適性'] = { score: distMap[distApt] || 9, max: 15 };
    score += distMap[distApt] || 9;

    // 3. コース適性 (15点)
    const trackApt = horse.trackApt || 'B';
    factors['コース適性'] = { score: distMap[trackApt] || 9, max: 15 };
    score += distMap[trackApt] || 9;

    // 4. 騎手 (15点)
    const jScore = jockeyRatings[horse.jockey] || 7;
    factors['騎手'] = { score: jScore, max: 15 };
    score += jScore;

    // 5. 馬場適性 (10点) - 重馬場適性
    let trackCondScore = 7;
    if (horse.condition === '重') trackCondScore = 10;
    else if (horse.condition === '良') trackCondScore = 5;
    factors['馬場適性'] = { score: trackCondScore, max: 10 };
    score += trackCondScore;

    // 6. 脚質 (10点)
    let styleScore = 7;
    const style = horse.runStyle || '先行';
    if (dist <= 1400) {
      styleScore = style === '逃げ' ? 10 : style === '先行' ? 9 : style === '差し' ? 6 : 4;
    } else if (dist <= 1800) {
      styleScore = style === '先行' ? 10 : style === '差し' ? 9 : style === '逃げ' ? 7 : 6;
    } else {
      styleScore = style === '差し' ? 10 : style === '追込' ? 9 : style === '先行' ? 7 : 5;
    }
    factors['脚質'] = { score: styleScore, max: 10 };
    score += styleScore;

    // 7. 体重変動 (5点)
    const absChange = Math.abs(horse.weightChange || 0);
    const wScore = absChange <= 2 ? 5 : absChange <= 4 ? 3 : absChange <= 6 ? 2 : 1;
    factors['体重変動'] = { score: wScore, max: 5 };
    score += wScore;

    return {
      ...horse,
      totalScore: Math.round(score * 10) / 10,
      factors,
    };
  });

  // スコア順にソート
  scored.sort((a, b) => b.totalScore - a.totalScore);
  scored.forEach((p, i) => {
    p.rank = i + 1;
    p.confidence = i === 0 ? '◎ 本命' : i === 1 ? '○ 対抗' : i === 2 ? '▲ 単穴' : i === 3 ? '△ 連下' : '× 軽視';
  });

  // 買い目生成
  const top3 = scored.slice(0, 3).map(p => p.num);
  const top4 = scored.slice(0, 4).map(p => p.num);

  return {
    predictions: scored,
    recommendations: {
      sanrentan: `${top3[0]}-${top3[1]}-${top3[2]}`,
      sanrenpuku: [...top3].sort((a,b) => a-b).join('-'),
      umaren: [top4[0], top4[1]].sort((a,b) => a-b).join('-'),
      umatan: `${top4[0]}→${top4[1]}`,
      wide: [
        [top3[0], top3[1]].sort((a,b) => a-b).join('-'),
        [top3[0], top3[2]].sort((a,b) => a-b).join('-'),
        [top3[1], top3[2]].sort((a,b) => a-b).join('-'),
      ],
    },
  };
}
