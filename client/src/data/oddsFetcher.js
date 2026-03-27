// リアルタイムオッズ取得 - 複数ソース対応
// ユーザーのブラウザから CORSプロキシ経由で取得

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

// === ソース1: netkeiba NAR (地方競馬) ===
// race_id: 2026 + 44(大井) + 0327(日付) + XX(レース番号)
function getNetkeibaRaceId(raceNo) {
  return `2026440327${String(raceNo).padStart(2, '0')}`;
}

function getNetkeibaOddsUrl(raceNo) {
  const raceId = getNetkeibaRaceId(raceNo);
  return `https://nar.netkeiba.com/odds/index.html?type=b1&race_id=${raceId}&rf=shutuba_submenu`;
}

// netkeiba HTMLパーサー
function parseNetkeibaOdds(html) {
  const odds = {};
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // odds_tan_block 内のテーブルを探す
    const tanBlock = doc.querySelector('#odds_tan_block') || doc;

    // テーブル行を走査
    const rows = tanBlock.querySelectorAll('tr');
    rows.forEach(row => {
      const numEl = row.querySelector('.Umaban, .umaban, td:first-child');
      const oddsEl = row.querySelector('.Odds, .odds, .OddsTan');
      if (numEl && oddsEl) {
        const num = parseInt(numEl.textContent.trim());
        const oddsVal = parseFloat(oddsEl.textContent.trim());
        if (num > 0 && num <= 16 && oddsVal > 0) {
          odds[num] = oddsVal;
        }
      }
    });

    // テーブルが見つからなかった場合: pd.read_html互換の解析
    if (Object.keys(odds).length === 0) {
      const tables = doc.querySelectorAll('table');
      for (const table of tables) {
        const trs = table.querySelectorAll('tr');
        for (const tr of trs) {
          const tds = tr.querySelectorAll('td');
          if (tds.length >= 2) {
            for (let i = 0; i < tds.length - 1; i++) {
              const numText = tds[i].textContent.trim();
              const num = parseInt(numText);
              if (num > 0 && num <= 16 && numText.length <= 2) {
                // 次のセルまたはその後にオッズ値がないか探す
                for (let j = i + 1; j < tds.length; j++) {
                  const oText = tds[j].textContent.trim();
                  const oVal = parseFloat(oText);
                  if (oVal > 1.0 && oVal < 9999) {
                    odds[num] = oVal;
                    break;
                  }
                }
                break;
              }
            }
          }
        }
        if (Object.keys(odds).length > 0) break;
      }
    }

    // 正規表現フォールバック（複数パターン）
    if (Object.keys(odds).length === 0) {
      // パターン1: Umaban + Odds クラス
      const p1 = /class="[^"]*[Uu]maban[^"]*"[^>]*>\s*(\d{1,2})\s*<[\s\S]*?class="[^"]*[Oo]dds[^"]*"[^>]*>\s*([\d.]+)/g;
      let m;
      while ((m = p1.exec(html)) !== null) {
        const n = parseInt(m[1]), o = parseFloat(m[2]);
        if (n > 0 && n <= 16 && o > 1) odds[n] = o;
      }
    }
    if (Object.keys(odds).length === 0) {
      // パターン2: 汎用テーブル行
      const p2 = /<td[^>]*>\s*(\d{1,2})\s*<\/td>[\s\S]*?<td[^>]*>\s*([\d]+\.[\d]+)\s*<\/td>/g;
      let m;
      while ((m = p2.exec(html)) !== null) {
        const n = parseInt(m[1]), o = parseFloat(m[2]);
        if (n > 0 && n <= 16 && o > 1) odds[n] = o;
      }
    }
  } catch (e) {
    console.warn('netkeiba パース失敗:', e);
  }
  return odds;
}

// === ソース2: keiba.go.jp (地方競馬情報サイト) ===
function getKeibaGoJpUrl(raceNo) {
  return `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/OddsTanFuku?k_raceDate=2026/03/27&k_raceNo=${raceNo}&k_babaCode=20`;
}

function parseKeibaGoJpOdds(html) {
  const odds = {};
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('table tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      for (let i = 0; i < cells.length - 1; i++) {
        const numText = cells[i].textContent.trim();
        const num = parseInt(numText);
        if (num > 0 && num <= 16 && numText.length <= 2) {
          for (let j = i + 1; j < cells.length; j++) {
            const oText = cells[j].textContent.trim();
            const oVal = parseFloat(oText);
            if (oVal > 1.0 && oVal < 9999) {
              odds[num] = oVal;
              break;
            }
          }
        }
      }
    });
  } catch (e) {
    console.warn('keiba.go.jp パース失敗:', e);
  }
  return odds;
}

// === ソース3: nankankeiba.com (南関東4競馬場公式) ===
function getNankanUrl(raceNo) {
  // URL形式: odds_nin/{date}{babaCode}{session}{day}{raceNo}{page}.do
  // 大井=20, 第19回, 5日目
  const rn = String(raceNo).padStart(2, '0');
  return `https://www.nankankeiba.com/odds/tanfuku/20260327201905${rn}00.do`;
}

function parseNankanOdds(html) {
  const odds = {};
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    // nankankeiba.com のテーブルを探す
    const rows = doc.querySelectorAll('table tr, .oddsTable tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      for (let i = 0; i < cells.length - 1; i++) {
        const numText = cells[i].textContent.trim();
        const num = parseInt(numText);
        if (num > 0 && num <= 16 && numText.length <= 2) {
          for (let j = i + 1; j < cells.length; j++) {
            const oText = cells[j].textContent.trim();
            const oVal = parseFloat(oText);
            if (oVal > 1.0 && oVal < 9999) {
              odds[num] = oVal;
              break;
            }
          }
        }
      }
    });
  } catch (e) {
    console.warn('nankankeiba パース失敗:', e);
  }
  return odds;
}

// === メイン: 複数ソースを順番に試行 ===
const SOURCES = [
  { name: 'netkeiba', getUrl: getNetkeibaOddsUrl, parse: parseNetkeibaOdds },
  { name: 'keiba.go.jp', getUrl: getKeibaGoJpUrl, parse: parseKeibaGoJpOdds },
  { name: 'nankankeiba', getUrl: getNankanUrl, parse: parseNankanOdds },
];

export async function fetchOdds(raceNo) {
  for (const source of SOURCES) {
    const targetUrl = source.getUrl(raceNo);

    for (const proxyFn of CORS_PROXIES) {
      try {
        const proxyUrl = proxyFn(targetUrl);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'text/html,application/xhtml+xml,*/*',
          },
        });
        clearTimeout(timeoutId);

        if (!res.ok) continue;

        const html = await res.text();
        if (html.length < 100) continue; // 空レスポンス

        const odds = source.parse(html);

        if (Object.keys(odds).length >= 3) {
          console.log(`オッズ取得成功: ${source.name} (${Object.keys(odds).length}頭)`);
          return {
            success: true,
            odds,
            source: source.name,
            updatedAt: new Date().toLocaleTimeString('ja-JP'),
          };
        }
      } catch (e) {
        // タイムアウトまたはネットワークエラー
        continue;
      }
    }
  }

  return { success: false, odds: {}, source: null, updatedAt: null };
}

// 全レースオッズ一括取得
export async function fetchAllOdds(raceCount = 12) {
  const results = {};
  await Promise.allSettled(
    Array.from({ length: raceCount }, (_, i) =>
      fetchOdds(i + 1).then(r => { results[i + 1] = r; })
    )
  );
  return results;
}
