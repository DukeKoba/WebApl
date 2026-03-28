// リアルデータ取得モジュール
// React Native は CORS 制限なし → netkeiba / keiba.go.jp から直接取得可能

const RACE_DATE = '20260327';
const TRACK_CODE = '44'; // 大井 = 44 (netkeiba)
const BABA_CODE = '20';  // 大井 = 20 (keiba.go.jp)

// netkeiba race_id: 年4桁 + 場コード2桁 + 月日4桁 + レース番号2桁
function getRaceId(raceNum) {
  return `2026${TRACK_CODE}${RACE_DATE.slice(4)}${String(raceNum).padStart(2, '0')}`;
}

// === 出馬表 (馬名・騎手・枠番) を netkeiba から取得 ===
export async function fetchShutuba(raceNum) {
  const raceId = getRaceId(raceNum);
  const url = `https://nar.netkeiba.com/race/shutuba.html?race_id=${raceId}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'Accept': 'text/html',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // EUC-JP のページなので ArrayBuffer → デコード
    const buf = await res.arrayBuffer();
    const html = decodeEUCJP(buf);

    return parseShutuba(html, raceNum);
  } catch (e) {
    console.warn(`出馬表取得失敗 (${raceNum}R):`, e.message);
    return null;
  }
}

// EUC-JP デコード
function decodeEUCJP(buffer) {
  try {
    const decoder = new TextDecoder('euc-jp');
    return decoder.decode(buffer);
  } catch {
    // TextDecoder が euc-jp 非対応の場合、UTF-8 でフォールバック
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(buffer);
  }
}

// 出馬表HTML パーサー
function parseShutuba(html, raceNum) {
  const horses = [];

  // レース名
  const raceNameMatch = html.match(/<span class="RaceName"[^>]*>([\s\S]*?)<\/span>/);
  const raceName = raceNameMatch ? raceNameMatch[1].replace(/<[^>]+>/g, '').trim() : `${raceNum}R`;

  // コース情報
  const courseMatch = html.match(/ダ(\d+)m/) || html.match(/芝(\d+)m/);
  const course = courseMatch ? courseMatch[0] : '';

  // 各馬の情報を抽出
  // netkeiba の HorseList テーブル行を探す
  const rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/g;
  let rowMatch;

  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const row = rowMatch[0];

    // 馬番
    const numMatch = row.match(/class="[^"]*Umaban[^"]*"[^>]*>\s*(\d+)\s*</);
    if (!numMatch) continue;
    const num = parseInt(numMatch[1]);

    // 枠番
    const wakuMatch = row.match(/class="[^"]*Waku(\d)[^"]*"/);
    const waku = wakuMatch ? parseInt(wakuMatch[1]) : Math.ceil(num * 8 / 14);

    // 馬名
    const nameMatch = row.match(/class="[^"]*HorseName[^"]*"[^>]*>[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>/);
    const name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : `${num}番馬`;

    // 性齢
    const sexAgeMatch = row.match(/class="[^"]*Barei[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/(?:td|span)>/);
    const sexAge = sexAgeMatch ? sexAgeMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // 騎手
    const jockeyMatch = row.match(/class="[^"]*Jockey[^"]*"[^>]*>[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>/);
    const jockey = jockeyMatch ? jockeyMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // 調教師
    const trainerMatch = row.match(/class="[^"]*Trainer[^"]*"[^>]*>[\s\S]*?<a[^>]*>\s*([\s\S]*?)\s*<\/a>/);
    const trainer = trainerMatch ? trainerMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // 斤量
    const weightMatch = row.match(/class="[^"]*Txt_C[^"]*"[^>]*>\s*([\d.]+)\s*</);
    const impost = weightMatch ? parseFloat(weightMatch[1]) : 56;

    if (num > 0 && name) {
      horses.push({ num, waku, name, sex: sexAge, jockey, trainer, impost });
    }
  }

  // 行パターンが合わなかった場合のフォールバック (別パターン)
  if (horses.length === 0) {
    // 馬名だけでも抽出
    const namePattern = /class="HorseName"[^>]*>[\s\S]*?<a[^>]*title="([^"]+)"/g;
    let nm;
    let idx = 1;
    while ((nm = namePattern.exec(html)) !== null) {
      horses.push({
        num: idx, waku: Math.ceil(idx * 8 / 14),
        name: nm[1].trim(), sex: '', jockey: '', trainer: '', impost: 56,
      });
      idx++;
    }
  }

  // さらにフォールバック: title属性
  if (horses.length === 0) {
    const titlePattern = /title="([^"]{2,20})"[^>]*class="[^"]*HorseName/g;
    let tm;
    let idx = 1;
    while ((tm = titlePattern.exec(html)) !== null) {
      horses.push({
        num: idx, waku: Math.ceil(idx * 8 / 14),
        name: tm[1].trim(), sex: '', jockey: '', trainer: '', impost: 56,
      });
      idx++;
    }
  }

  return { raceName, course, horses };
}

// === オッズ取得 (netkeiba) ===
export async function fetchOdds(raceNum) {
  const raceId = getRaceId(raceNum);
  const url = `https://nar.netkeiba.com/odds/index.html?type=b1&race_id=${raceId}&rf=shutuba_submenu`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'Accept': 'text/html',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buf = await res.arrayBuffer();
    const html = decodeEUCJP(buf);

    return parseOdds(html);
  } catch (e) {
    console.warn(`オッズ取得失敗 (${raceNum}R):`, e.message);
    return null;
  }
}

// オッズ HTML パーサー
function parseOdds(html) {
  const odds = {};

  // パターン1: Umaban + Odds クラス
  const p1 = /class="[^"]*Umaban[^"]*"[^>]*>\s*(\d{1,2})\s*<[\s\S]*?class="[^"]*Odds[^"]*"[^>]*>\s*([\d.]+)/g;
  let m;
  while ((m = p1.exec(html)) !== null) {
    const n = parseInt(m[1]), o = parseFloat(m[2]);
    if (n > 0 && n <= 16 && o > 1) odds[n] = o;
  }

  // パターン2: テーブル行内の馬番とオッズ
  if (Object.keys(odds).length === 0) {
    const p2 = /<td[^>]*>\s*(\d{1,2})\s*<\/td>[\s\S]*?<td[^>]*>\s*([\d]+\.[\d]+)\s*<\/td>/g;
    while ((m = p2.exec(html)) !== null) {
      const n = parseInt(m[1]), o = parseFloat(m[2]);
      if (n > 0 && n <= 16 && o > 1) odds[n] = o;
    }
  }

  // パターン3: span Odds
  if (Object.keys(odds).length === 0) {
    const p3 = /(\d{1,2})\s*<\/(?:td|span)>[\s\S]{0,500}?<span[^>]*class="[^"]*Odds[^"]*"[^>]*>\s*([\d.]+)/g;
    while ((m = p3.exec(html)) !== null) {
      const n = parseInt(m[1]), o = parseFloat(m[2]);
      if (n > 0 && n <= 16 && o > 1) odds[n] = o;
    }
  }

  return odds;
}

// === keiba.go.jp からも取得試行 ===
export async function fetchOddsKeibaGoJp(raceNum) {
  const url = `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/OddsTanFuku?k_raceDate=2026/03/27&k_raceNo=${raceNum}&k_babaCode=${BABA_CODE}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const odds = {};
    // keiba.go.jp のテーブル構造
    const pattern = /<td[^>]*>\s*(\d{1,2})\s*<\/td>[\s\S]*?<td[^>]*>\s*([\d]+\.[\d]+)\s*<\/td>/g;
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const n = parseInt(m[1]), o = parseFloat(m[2]);
      if (n > 0 && n <= 16 && o > 1) odds[n] = o;
    }
    return odds;
  } catch (e) {
    console.warn(`keiba.go.jp オッズ取得失敗 (${raceNum}R):`, e.message);
    return null;
  }
}

// === 統合取得: 出馬表 + オッズ ===
export async function fetchFullRaceData(raceNum) {
  const [shutuba, oddsNetkeiba, oddsKeibaGo] = await Promise.allSettled([
    fetchShutuba(raceNum),
    fetchOdds(raceNum),
    fetchOddsKeibaGoJp(raceNum),
  ]);

  const horses = shutuba.status === 'fulfilled' ? shutuba.value : null;
  const odds = (oddsNetkeiba.status === 'fulfilled' && oddsNetkeiba.value && Object.keys(oddsNetkeiba.value).length > 0)
    ? oddsNetkeiba.value
    : (oddsKeibaGo.status === 'fulfilled' ? oddsKeibaGo.value : null);

  return {
    horses,
    odds,
    hasRealHorses: !!(horses && horses.horses && horses.horses.length > 0),
    hasRealOdds: !!(odds && Object.keys(odds).length > 0),
  };
}

// 全レース一括取得
export async function fetchAllRaces(raceCount = 12) {
  const results = {};
  await Promise.allSettled(
    Array.from({ length: raceCount }, (_, i) =>
      fetchFullRaceData(i + 1).then(r => { results[i + 1] = r; })
    )
  );
  return results;
}
