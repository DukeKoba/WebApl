// 英検（従来型）の試験日程。
// 一次試験（本会場）は準1級〜5級まで同じ日に実施されるため、級ごとに日付を持たない。
// 出典: 日本英語検定協会 2026年度試験日程（本会場）
//   第1回 一次 2026-05-31 / 二次A 2026-07-05 / 二次B 2026-07-12
//   第2回 一次 2026-10-04 / 二次A 2026-11-08 / 二次B 2026-11-15
//   第3回 一次 2027-01-24 / 二次A 2027-02-28 / 二次B 2027-03-07
//
// 年度が変わったらここだけ更新すればクライアント・サーバ双方に反映される
// （クライアントは GET /api/eiken/exam-info から取得する）。
export const EIKEN_EXAMS = [
  { round: '2026年度 第1回', primary: '2026-05-31', secondaryA: '2026-07-05', secondaryB: '2026-07-12' },
  { round: '2026年度 第2回', primary: '2026-10-04', secondaryA: '2026-11-08', secondaryB: '2026-11-15' },
  { round: '2026年度 第3回', primary: '2027-01-24', secondaryA: '2027-02-28', secondaryB: '2027-03-07' },
];

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function daysBetween(from, isoDate) {
  return Math.ceil((new Date(`${isoDate}T00:00:00`) - from) / (1000 * 60 * 60 * 24));
}

/**
 * 次に来る一次試験を返す。全ての回が過ぎていれば null（＝カウントダウンを出さない）。
 * 日程を追記し忘れても "あと0日" のような嘘を表示しないようにするための null 返し。
 */
export function getNextExam(today = startOfToday()) {
  for (const exam of EIKEN_EXAMS) {
    const daysUntil = daysBetween(today, exam.primary);
    if (daysUntil >= 0) {
      return {
        round: exam.round,
        primaryDate: exam.primary,
        secondaryA: exam.secondaryA,
        secondaryB: exam.secondaryB,
        daysUntil,
      };
    }
  }
  return null;
}

// カウントダウンを投稿に載せる期間。これより先だと毎回同じ煽りになって
// タイムライン上でノイズになるため出さない。
export const COUNTDOWN_WINDOW_DAYS = 90;

/** 投稿に載せてよいカウントダウンか（試験が近いときだけ true）。 */
export function getCountdown(today = startOfToday()) {
  const next = getNextExam(today);
  if (!next || next.daysUntil > COUNTDOWN_WINDOW_DAYS) return null;
  return next;
}
