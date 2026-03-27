// 大井競馬場 レースデータ & AI予想エンジン (クライアント版)

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
  7: [
    { num: 1, waku: 1, name: 'ライジングサン', sex: '牡4', weight: 474, jockey: '矢野貴之', trainer: '荒山勝徳', odds: 3.6, popularity: 1, recentResults: ['1','2','1','2','1'], runStyle: '先行', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: 0 },
    { num: 2, waku: 1, name: 'ブレイブハート', sex: '牡5', weight: 488, jockey: '森泰斗', trainer: '藤田輝信', odds: 5.0, popularity: 2, recentResults: ['2','1','3','1','4'], runStyle: '差し', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: +2 },
    { num: 3, waku: 2, name: 'パールクイーン', sex: '牝4', weight: 448, jockey: '御神本訓史', trainer: '佐宗響', odds: 7.8, popularity: 3, recentResults: ['3','2','1','4','2'], runStyle: '逃げ', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: -2 },
    { num: 4, waku: 2, name: 'ヴェルサイユ', sex: '牡6', weight: 496, jockey: '笹川翼', trainer: '村上頌', odds: 11.2, popularity: 5, recentResults: ['4','5','2','3','6'], runStyle: '追込', distanceApt: 'B', trackApt: 'A', condition: '良', weightChange: +4 },
    { num: 5, waku: 3, name: 'ミッドナイトラン', sex: '牡5', weight: 482, jockey: '的場文男', trainer: '福永敏', odds: 9.5, popularity: 4, recentResults: ['2','3','4','1','5'], runStyle: '先行', distanceApt: 'B', trackApt: 'A', condition: '稍重', weightChange: 0 },
    { num: 6, waku: 3, name: 'フローラルブーケ', sex: '牝3', weight: 436, jockey: '本田正重', trainer: '石井勝男', odds: 28.5, popularity: 8, recentResults: ['6','8','5','7','4'], runStyle: '差し', distanceApt: 'C', trackApt: 'B', condition: '良', weightChange: -4 },
    { num: 7, waku: 4, name: 'マグナムフォース', sex: '牡7', weight: 504, jockey: '真島大輔', trainer: '堀千亜樹', odds: 16.0, popularity: 6, recentResults: ['5','4','3','6','2'], runStyle: '追込', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: +6 },
    { num: 8, waku: 4, name: 'スウィートメモリー', sex: '牝5', weight: 442, jockey: '和田譲治', trainer: '佐藤裕太', odds: 20.0, popularity: 7, recentResults: ['3','7','6','5','8'], runStyle: '逃げ', distanceApt: 'B', trackApt: 'C', condition: '良', weightChange: -2 },
  ],
  8: [
    { num: 1, waku: 1, name: 'コスモバルク', sex: '牡5', weight: 492, jockey: '森泰斗', trainer: '藤田輝信', odds: 2.9, popularity: 1, recentResults: ['1','1','2','1','2'], runStyle: '先行', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: +2 },
    { num: 2, waku: 2, name: 'ネオユニヴァース', sex: '牡4', weight: 478, jockey: '矢野貴之', trainer: '荒山勝徳', odds: 4.8, popularity: 2, recentResults: ['2','1','1','3','1'], runStyle: '差し', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: 0 },
    { num: 3, waku: 3, name: 'ビューティフルデイ', sex: '牝5', weight: 454, jockey: '御神本訓史', trainer: '佐宗響', odds: 6.2, popularity: 3, recentResults: ['1','3','2','2','4'], runStyle: '逃げ', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: -2 },
    { num: 4, waku: 4, name: 'グランドスラム', sex: '牡6', weight: 508, jockey: '笹川翼', trainer: '村上頌', odds: 8.5, popularity: 4, recentResults: ['3','4','1','5','2'], runStyle: '追込', distanceApt: 'B', trackApt: 'A', condition: '良', weightChange: +4 },
    { num: 5, waku: 5, name: 'サクラプレジデント', sex: '牡5', weight: 486, jockey: '的場文男', trainer: '福永敏', odds: 12.3, popularity: 5, recentResults: ['4','2','5','3','6'], runStyle: '先行', distanceApt: 'B', trackApt: 'A', condition: '稍重', weightChange: 0 },
    { num: 6, waku: 6, name: 'ラベンダーフィールド', sex: '牝4', weight: 440, jockey: '本田正重', trainer: '石井勝男', odds: 25.0, popularity: 7, recentResults: ['5','6','7','4','9'], runStyle: '差し', distanceApt: 'C', trackApt: 'B', condition: '良', weightChange: -4 },
    { num: 7, waku: 7, name: 'ウォーリアキング', sex: '牡7', weight: 514, jockey: '真島大輔', trainer: '堀千亜樹', odds: 18.0, popularity: 6, recentResults: ['2','5','6','4','3'], runStyle: '追込', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: +8 },
    { num: 8, waku: 8, name: 'プリティウーマン', sex: '牝3', weight: 430, jockey: '和田譲治', trainer: '佐藤裕太', odds: 40.0, popularity: 8, recentResults: ['7','8','6','9','5'], runStyle: '逃げ', distanceApt: 'C', trackApt: 'C', condition: '良', weightChange: 0 },
  ],
  9: [
    { num: 1, waku: 1, name: 'ヴィクトワールピサ', sex: '牡5', weight: 490, jockey: '矢野貴之', trainer: '荒山勝徳', odds: 3.4, popularity: 1, recentResults: ['1','2','1','1','3'], runStyle: '先行', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: 0 },
    { num: 2, waku: 1, name: 'ダンスインザダーク', sex: '牡6', weight: 500, jockey: '森泰斗', trainer: '藤田輝信', odds: 4.5, popularity: 2, recentResults: ['2','1','3','2','1'], runStyle: '差し', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: +2 },
    { num: 3, waku: 2, name: 'スターオブジェンヌ', sex: '牝4', weight: 452, jockey: '御神本訓史', trainer: '佐宗響', odds: 8.0, popularity: 3, recentResults: ['3','2','4','1','2'], runStyle: '逃げ', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: -2 },
    { num: 4, waku: 2, name: 'サンデーブレイク', sex: '牡4', weight: 476, jockey: '笹川翼', trainer: '村上頌', odds: 10.0, popularity: 4, recentResults: ['1','5','3','4','2'], runStyle: '追込', distanceApt: 'B', trackApt: 'A', condition: '良', weightChange: +4 },
    { num: 5, waku: 3, name: 'レジェンドテイオー', sex: '牡7', weight: 502, jockey: '的場文男', trainer: '福永敏', odds: 13.5, popularity: 5, recentResults: ['4','3','2','6','5'], runStyle: '先行', distanceApt: 'B', trackApt: 'A', condition: '稍重', weightChange: 0 },
    { num: 6, waku: 3, name: 'スカーレットブーケ', sex: '牝5', weight: 446, jockey: '本田正重', trainer: '石井勝男', odds: 30.0, popularity: 7, recentResults: ['6','7','5','8','4'], runStyle: '差し', distanceApt: 'C', trackApt: 'C', condition: '良', weightChange: -2 },
    { num: 7, waku: 4, name: 'アグネスフライト', sex: '牡5', weight: 494, jockey: '真島大輔', trainer: '堀千亜樹', odds: 15.5, popularity: 6, recentResults: ['5','4','6','3','7'], runStyle: '追込', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: +4 },
    { num: 8, waku: 4, name: 'グレースノート', sex: '牝3', weight: 434, jockey: '和田譲治', trainer: '佐藤裕太', odds: 35.0, popularity: 8, recentResults: ['8','6','7','5','9'], runStyle: '逃げ', distanceApt: 'C', trackApt: 'B', condition: '良', weightChange: 0 },
  ],
  10: [
    { num: 1, waku: 1, name: 'ゴッドオブスピード', sex: '牡4', weight: 484, jockey: '森泰斗', trainer: '藤田輝信', odds: 4.2, popularity: 2, recentResults: ['2','1','2','1','3'], runStyle: '先行', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: +2 },
    { num: 2, waku: 1, name: 'エルコンドルパサー', sex: '牡5', weight: 494, jockey: '矢野貴之', trainer: '荒山勝徳', odds: 3.0, popularity: 1, recentResults: ['1','1','1','2','1'], runStyle: '逃げ', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: 0 },
    { num: 3, waku: 2, name: 'マーベラスクラウン', sex: '牝5', weight: 456, jockey: '御神本訓史', trainer: '佐宗響', odds: 7.0, popularity: 3, recentResults: ['1','3','2','4','1'], runStyle: '差し', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: -2 },
    { num: 4, waku: 2, name: 'メイショウドトウ', sex: '牡6', weight: 506, jockey: '笹川翼', trainer: '村上頌', odds: 9.5, popularity: 4, recentResults: ['3','4','1','5','2'], runStyle: '追込', distanceApt: 'B', trackApt: 'A', condition: '良', weightChange: +6 },
    { num: 5, waku: 3, name: 'エアグルーヴ', sex: '牝5', weight: 460, jockey: '的場文男', trainer: '福永敏', odds: 11.0, popularity: 5, recentResults: ['2','5','3','6','2'], runStyle: '先行', distanceApt: 'B', trackApt: 'A', condition: '稍重', weightChange: 0 },
    { num: 6, waku: 3, name: 'ファインモーション', sex: '牝4', weight: 444, jockey: '本田正重', trainer: '石井勝男', odds: 22.0, popularity: 7, recentResults: ['5','6','8','3','7'], runStyle: '差し', distanceApt: 'C', trackApt: 'B', condition: '良', weightChange: -4 },
    { num: 7, waku: 4, name: 'ステイゴールド', sex: '牡7', weight: 498, jockey: '真島大輔', trainer: '堀千亜樹', odds: 14.0, popularity: 6, recentResults: ['4','3','5','2','8'], runStyle: '追込', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: +4 },
    { num: 8, waku: 4, name: 'タイキシャトル', sex: '牡5', weight: 480, jockey: '和田譲治', trainer: '佐藤裕太', odds: 19.0, popularity: 8, recentResults: ['6','7','4','8','3'], runStyle: '逃げ', distanceApt: 'B', trackApt: 'C', condition: '良', weightChange: +2 },
  ],
  11: [
    { num: 1, waku: 1, name: 'フリオーソ', sex: '牡5', weight: 498, jockey: '矢野貴之', trainer: '荒山勝徳', odds: 2.4, popularity: 1, recentResults: ['1','1','1','1','2'], runStyle: '先行', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: 0 },
    { num: 2, waku: 2, name: 'カネヒキリ', sex: '牡6', weight: 510, jockey: '森泰斗', trainer: '藤田輝信', odds: 3.8, popularity: 2, recentResults: ['2','1','2','1','3'], runStyle: '差し', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: +2 },
    { num: 3, waku: 3, name: 'アジュディミツオー', sex: '牡5', weight: 486, jockey: '御神本訓史', trainer: '佐宗響', odds: 6.5, popularity: 3, recentResults: ['1','3','1','2','4'], runStyle: '逃げ', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: -2 },
    { num: 4, waku: 4, name: 'ボンネビルレコード', sex: '牡7', weight: 504, jockey: '笹川翼', trainer: '村上頌', odds: 8.8, popularity: 4, recentResults: ['3','2','4','1','5'], runStyle: '追込', distanceApt: 'B', trackApt: 'A', condition: '良', weightChange: +4 },
    { num: 5, waku: 5, name: 'サミットストーン', sex: '牡4', weight: 472, jockey: '的場文男', trainer: '福永敏', odds: 12.0, popularity: 5, recentResults: ['4','5','2','3','6'], runStyle: '先行', distanceApt: 'B', trackApt: 'A', condition: '稍重', weightChange: 0 },
    { num: 6, waku: 6, name: 'ロイヤルクイーン', sex: '牝5', weight: 450, jockey: '本田正重', trainer: '石井勝男', odds: 24.0, popularity: 7, recentResults: ['6','7','5','8','3'], runStyle: '差し', distanceApt: 'C', trackApt: 'B', condition: '良', weightChange: -4 },
    { num: 7, waku: 7, name: 'ハイセイコー', sex: '牡5', weight: 496, jockey: '真島大輔', trainer: '堀千亜樹', odds: 15.0, popularity: 6, recentResults: ['5','4','3','6','2'], runStyle: '追込', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: +6 },
    { num: 8, waku: 8, name: 'ローズプリンセス', sex: '牝3', weight: 432, jockey: '和田譲治', trainer: '佐藤裕太', odds: 32.0, popularity: 8, recentResults: ['7','8','6','5','9'], runStyle: '逃げ', distanceApt: 'C', trackApt: 'C', condition: '良', weightChange: -2 },
  ],
  12: [
    { num: 1, waku: 1, name: 'サウンドトゥルー', sex: '牡5', weight: 494, jockey: '森泰斗', trainer: '藤田輝信', odds: 3.5, popularity: 2, recentResults: ['2','1','1','2','1'], runStyle: '追込', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: +2 },
    { num: 2, waku: 1, name: 'モーニンアフター', sex: '牡4', weight: 480, jockey: '矢野貴之', trainer: '荒山勝徳', odds: 2.6, popularity: 1, recentResults: ['1','1','2','1','1'], runStyle: '先行', distanceApt: 'A', trackApt: 'A', condition: '良', weightChange: 0 },
    { num: 3, waku: 2, name: 'ゴールドドリーム', sex: '牡6', weight: 502, jockey: '御神本訓史', trainer: '佐宗響', odds: 5.5, popularity: 3, recentResults: ['1','2','3','1','2'], runStyle: '差し', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: -2 },
    { num: 4, waku: 2, name: 'ノンコノユメ', sex: '牡7', weight: 508, jockey: '笹川翼', trainer: '村上頌', odds: 9.0, popularity: 4, recentResults: ['3','4','2','5','1'], runStyle: '追込', distanceApt: 'B', trackApt: 'A', condition: '良', weightChange: +4 },
    { num: 5, waku: 3, name: 'コパノリッキー', sex: '牡5', weight: 490, jockey: '的場文男', trainer: '福永敏', odds: 10.5, popularity: 5, recentResults: ['2','5','1','4','6'], runStyle: '逃げ', distanceApt: 'A', trackApt: 'A', condition: '稍重', weightChange: 0 },
    { num: 6, waku: 3, name: 'ワイドファラオ', sex: '牡4', weight: 474, jockey: '本田正重', trainer: '石井勝男', odds: 18.0, popularity: 7, recentResults: ['5','6','4','7','3'], runStyle: '先行', distanceApt: 'C', trackApt: 'B', condition: '良', weightChange: -4 },
    { num: 7, waku: 4, name: 'アポロケンタッキー', sex: '牡6', weight: 500, jockey: '真島大輔', trainer: '堀千亜樹', odds: 14.5, popularity: 6, recentResults: ['4','3','5','2','7'], runStyle: '差し', distanceApt: 'A', trackApt: 'B', condition: '良', weightChange: +6 },
    { num: 8, waku: 4, name: 'ラストダンサー', sex: '牝4', weight: 438, jockey: '和田譲治', trainer: '佐藤裕太', odds: 36.0, popularity: 8, recentResults: ['8','7','9','6','5'], runStyle: '逃げ', distanceApt: 'C', trackApt: 'C', condition: '良', weightChange: 0 },
  ],
};

const races = [
  { id: 1, raceNum: 1, name: 'サラ系3歳', course: 'ダ1200m', class: 'C3', startTime: '14:30', trackCondition: '良', weather: '晴', purse: 150 },
  { id: 2, raceNum: 2, name: 'サラ系3歳以上', course: 'ダ1400m', class: 'C3', startTime: '15:00', trackCondition: '良', weather: '晴', purse: 200 },
  { id: 3, raceNum: 3, name: 'サラ系3歳以上', course: 'ダ1200m', class: 'C2', startTime: '15:30', trackCondition: '良', weather: '晴', purse: 250 },
  { id: 4, raceNum: 4, name: 'サラ系3歳以上', course: 'ダ1600m', class: 'C1', startTime: '16:00', trackCondition: '良', weather: '晴', purse: 300 },
  { id: 5, raceNum: 5, name: 'スプリングカップ', course: 'ダ1400m', class: 'B3', startTime: '16:30', trackCondition: '良', weather: '曇', purse: 400 },
  { id: 6, raceNum: 6, name: 'サラ系3歳以上', course: 'ダ1800m', class: 'B2', startTime: '17:00', trackCondition: '稍重', weather: '曇', purse: 500 },
  { id: 7, raceNum: 7, name: '大井記念トライアル', course: 'ダ2000m', class: 'B1', startTime: '17:30', trackCondition: '稍重', weather: '曇', purse: 600 },
  { id: 8, raceNum: 8, name: 'スターライト賞', course: 'ダ1600m', class: 'A2', startTime: '18:00', trackCondition: '稍重', weather: '曇', purse: 800 },
  { id: 9, raceNum: 9, name: 'サラ系3歳以上', course: 'ダ1400m', class: 'A1', startTime: '18:30', trackCondition: '稍重', weather: '曇', purse: 1000 },
  { id: 10, raceNum: 10, name: 'ムーンライト特別', course: 'ダ1800m', class: 'A1', startTime: '19:00', trackCondition: '稍重', weather: '曇', purse: 1200 },
  { id: 11, raceNum: 11, name: 'トゥインクルステークス', course: 'ダ2000m', class: 'S', startTime: '19:35', trackCondition: '稍重', weather: '曇', purse: 1500 },
  { id: 12, raceNum: 12, name: 'ナイトフィナーレ', course: 'ダ1600m', class: 'B1', startTime: '20:10', trackCondition: '稍重', weather: '曇', purse: 700 },
];

function calculateScore(horse, race) {
  let score = 0;
  const factors = {};

  const recentScore = horse.recentResults.reduce((sum, r, i) => {
    const pos = parseInt(r);
    const weight = 5 - i;
    const pts = pos <= 1 ? 6 * weight : pos <= 2 ? 4 * weight : pos <= 3 ? 2.5 * weight : pos <= 5 ? 1 * weight : 0;
    return sum + pts;
  }, 0);
  const recentNorm = Math.min(30, (recentScore / 90) * 30);
  factors['近走成績'] = { score: Math.round(recentNorm * 10) / 10, max: 30 };
  score += recentNorm;

  const distMap = { 'A': 15, 'B': 9, 'C': 4 };
  factors['距離適性'] = { score: distMap[horse.distanceApt], max: 15 };
  score += distMap[horse.distanceApt];

  const trackMap = { 'A': 15, 'B': 9, 'C': 4 };
  factors['コース適性'] = { score: trackMap[horse.trackApt], max: 15 };
  score += trackMap[horse.trackApt];

  const jockeyRatings = {
    '矢野貴之': 15, '森泰斗': 14, '御神本訓史': 13, '笹川翼': 11,
    '的場文男': 12, '真島大輔': 10, '本田正重': 8, '和田譲治': 7
  };
  const jockeyScore = jockeyRatings[horse.jockey] || 7;
  factors['騎手'] = { score: jockeyScore, max: 15 };
  score += jockeyScore;

  let trackCondScore = 7;
  if (race.trackCondition === '良' && horse.condition === '良') trackCondScore = 10;
  else if (race.trackCondition === '稍重' && horse.condition === '稍重') trackCondScore = 10;
  else if (race.trackCondition === '稍重' && horse.condition === '良') trackCondScore = 6;
  factors['馬場適性'] = { score: trackCondScore, max: 10 };
  score += trackCondScore;

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
