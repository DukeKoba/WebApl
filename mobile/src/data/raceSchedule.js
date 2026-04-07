// 大井競馬場 2026/3/27(金) 第19回大井競馬5日目
// 天候: 晴 / 馬場: ダート重
// レーススケジュール (実データ)

export const RACE_DATE = '2026-03-27';
export const VENUE = '大井競馬場';
export const WEATHER = '晴';
export const TRACK_CONDITION = '重';
export const SESSION_INFO = '第19回大井競馬 5日目';

export const races = [
  { id: 1,  raceNum: 1,  name: '３歳(一)(二)(三)',        course: 'ダ1600m', class: 'C3', startTime: '14:30', purse: 150, horseCount: 9,  is3yo: true },
  { id: 2,  raceNum: 2,  name: '３歳(一)(二)(三)',        course: 'ダ1200m', class: 'C3', startTime: '15:02', purse: 150, horseCount: 12, is3yo: true },
  { id: 3,  raceNum: 3,  name: 'Ｃ１(二)Ｃ２(二)',        course: 'ダ1000m', class: 'C1', startTime: '15:35', purse: 250, horseCount: 12, is3yo: false },
  { id: 4,  raceNum: 4,  name: 'Ｃ２(四)(五)(六)',        course: 'ダ1600m', class: 'C2', startTime: '16:07', purse: 200, horseCount: 6,  is3yo: false },
  { id: 5,  raceNum: 5,  name: 'Ｃ２(四)(五)(六)',        course: 'ダ1400m', class: 'C2', startTime: '16:40', purse: 200, horseCount: 14, is3yo: false },
  { id: 6,  raceNum: 6,  name: 'Ｃ２(四)(五)(六)',        course: 'ダ1200m', class: 'C2', startTime: '17:12', purse: 200, horseCount: 14, is3yo: false },
  { id: 7,  raceNum: 7,  name: 'つくし特別',              course: 'ダ1400m', class: 'C3', startTime: '17:45', purse: 300, horseCount: 8,  is3yo: true },
  { id: 8,  raceNum: 8,  name: 'パリジャン賞',           course: 'ダ1400m', class: 'C1', startTime: '18:20', purse: 350, horseCount: 11, is3yo: false },
  { id: 9,  raceNum: 9,  name: '八丈島フリージア賞',     course: 'ダ1200m', class: 'C1', startTime: '18:55', purse: 350, horseCount: 11, is3yo: false },
  { id: 10, raceNum: 10, name: '春灯特別',                course: 'ダ1600m', class: 'C1', startTime: '19:30', purse: 400, horseCount: 11, is3yo: false },
  { id: 11, raceNum: 11, name: 'ブラッドストーン賞',     course: 'ダ1600m', class: 'A2', startTime: '20:10', purse: 800, horseCount: 12, is3yo: false },
  { id: 12, raceNum: 12, name: '桜坂賞',                  course: 'ダ2000m', class: 'B3', startTime: '20:50', purse: 500, horseCount: 15, is3yo: false },
];
