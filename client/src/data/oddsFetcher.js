// リアルタイムオッズ取得 (keiba.go.jp経由)
// CORSプロキシを使用してユーザーのブラウザから直接取得

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

const BABA_CODE = '20'; // 大井競馬場
const RACE_DATE = '2026/03/27';

// keiba.go.jp 単勝・複勝オッズURL
function getOddsUrl(raceNo) {
  return `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/OddsTanFuku?k_raceDate=${RACE_DATE}&k_raceNo=${raceNo}&k_babaCode=${BABA_CODE}`;
}

// HTMLからオッズデータをパース
function parseOddsHtml(html) {
  const odds = {};
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // keiba.go.jpのオッズテーブルからデータ抽出
    const rows = doc.querySelectorAll('table tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        // 馬番とオッズを取得
        const numText = cells[0]?.textContent?.trim();
        const oddsText = cells[2]?.textContent?.trim();
        const num = parseInt(numText);
        const oddsVal = parseFloat(oddsText);
        if (num > 0 && oddsVal > 0) {
          odds[num] = oddsVal;
        }
      }
    });

    // 別のテーブル構造にも対応
    if (Object.keys(odds).length === 0) {
      const allText = html;
      // 正規表現でオッズパターンを探す
      // パターン: 馬番 ... オッズ値
      const pattern = /class="(?:umaban|horse_number|num)"[^>]*>(\d+)<[\s\S]*?class="(?:odds|tanOdds)"[^>]*>([\d.]+)</g;
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const num = parseInt(match[1]);
        const oddsVal = parseFloat(match[2]);
        if (num > 0 && oddsVal > 0) {
          odds[num] = oddsVal;
        }
      }
    }

    // さらに別パターン
    if (Object.keys(odds).length === 0) {
      const pattern2 = /<td[^>]*>\s*(\d{1,2})\s*<\/td>[\s\S]*?<td[^>]*>\s*([\d.]+)\s*<\/td>/g;
      let match;
      while ((match = pattern2.exec(html)) !== null) {
        const num = parseInt(match[1]);
        const oddsVal = parseFloat(match[2]);
        if (num > 0 && num <= 16 && oddsVal > 0) {
          odds[num] = oddsVal;
        }
      }
    }
  } catch (e) {
    console.warn('オッズパース失敗:', e);
  }
  return odds;
}

// オッズ取得（プロキシをフォールバック）
export async function fetchOdds(raceNo) {
  const targetUrl = getOddsUrl(raceNo);

  for (const proxyFn of CORS_PROXIES) {
    try {
      const proxyUrl = proxyFn(targetUrl);
      const res = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;

      const html = await res.text();
      const odds = parseOddsHtml(html);

      if (Object.keys(odds).length > 0) {
        return { success: true, odds, source: 'keiba.go.jp', updatedAt: new Date().toLocaleTimeString('ja-JP') };
      }
    } catch (e) {
      console.warn('プロキシ失敗:', e.message);
      continue;
    }
  }

  return { success: false, odds: {}, source: null, updatedAt: null };
}

// 全レースオッズを一括取得
export async function fetchAllOdds(raceCount = 12) {
  const results = {};
  const promises = [];

  for (let i = 1; i <= raceCount; i++) {
    promises.push(
      fetchOdds(i).then(result => {
        results[i] = result;
      })
    );
  }

  await Promise.allSettled(promises);
  return results;
}
