import React from 'react';
import { policySummary } from './schema';

// 家族共有シート本体(A4縦2枚)。画面プレビューと印刷で共用。
// 46号帳票デザイン: 1枚目=メッセージ+請求手順チェックリスト、2枚目=保険一覧+連絡先+メモ欄。
// 高齢の家族が緊急時に辿れることを最優先(大きめ文字・1契約1カード・台詞つき手順)。

function fmtDate(iso) {
  const d = iso ? new Date(iso) : new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function Sheet({ sheet }) {
  const ownerName = sheet.owner?.name?.trim() || '(お名前)';
  const created = fmtDate(sheet.createdAt || sheet.updatedAt);
  const contacts = (sheet.contacts || []).filter((c) => c.name || c.phone);
  const firstContact = contacts[0];

  return (
    <div className="fs-sheet-root">
      {/* ============ 1枚目: 表紙メッセージ + もしものときにやること ============ */}
      <section className="fs-page">
        <h1 className="fs-title">わたしの保険のこと ― 家族のためのシート</h1>

        <div className="fs-msg-box">
          <p className="fs-msg-from">{ownerName} から、家族のみなさんへ</p>
          <p className="fs-msg-body">
            {sheet.message?.trim()
              || 'いままでありがとう。お金のことで困らないように、保険のことをまとめておきました。落ちついたら、この紙のとおりに進めてください。'}
          </p>
        </div>

        <h2 className="fs-h2">■ もしものとき、やること(この順番で)</h2>
        <ol className="fs-steps">
          <li>
            <strong>落ちついてから始めて大丈夫です。</strong>
            保険金の請求は、亡くなってから <strong>3年間</strong> できます。あわてなくて大丈夫です。
          </li>
          <li>
            死亡診断書(死体検案書)のコピーを、何枚か取っておく。
            <span className="fs-note">(病院でもらえます。請求などで使います)</span>
          </li>
          <li>
            裏面の「保険の一覧」を見て、それぞれの保険会社に電話する。<br />
            電話でこう言います:<br />
            <span className="fs-quote">「契約者の {ownerName} が亡くなりました。保険金の請求をしたいです」</span><br />
            <span className="fs-note">→ 証券番号を聞かれます(裏面の一覧にあります)</span>
          </li>
          <li>
            保険会社から届く請求書類に記入して返送する。<br />
            <span className="fs-note">主に必要なもの: 死亡診断書のコピー / 受取人の本人確認書類 / 受取人の口座がわかるもの</span>
          </li>
          <li>
            保険金が受取人の口座に振り込まれます。
            <span className="fs-note">(書類が届いてから おおむね1週間ほど)</span>
          </li>
        </ol>

        <h2 className="fs-h2">■ 困ったら、まずこの人に連絡</h2>
        <div className="fs-contact-emph">
          {firstContact ? (
            <div>{firstContact.name}{firstContact.relation ? `(${firstContact.relation})` : ''}　TEL {firstContact.phone || '__________'}</div>
          ) : (
            <div>お名前 __________(続柄 ____)　TEL __________</div>
          )}
          {sheet.agencyContact?.trim() && (
            <div>担当の保険屋さん: {sheet.agencyContact}</div>
          )}
        </div>

        <p className="fs-foot">作成日: {created}　作成: 保険の家族共有シート</p>
      </section>

      {/* ============ 2枚目: 保険の一覧 + 連絡先 + メモ ============ */}
      <section className="fs-page">
        <h2 className="fs-h2">■ 加入している保険の一覧({created} 現在)</h2>

        {sheet.policies.length === 0 && (
          <p className="fs-note">(保険が登録されていません)</p>
        )}

        {sheet.policies.map((p, i) => (
          <div className="fs-policy-card" key={p.id}>
            <div className="fs-policy-head">保険 {i + 1}　{policySummary(p)}</div>
            <table className="fs-policy-table"><tbody>
              <Row label="保険会社" value={p.insurerName} />
              <Row label="電話番号" value={p.phone} emph />
              <Row label="保険の種類" value={p.category} />
              <Row label="証券番号" value={p.policyNumber} />
              <Row label="保障の内容" value={p.amount} />
              <Row label="受取人" value={p.beneficiary} />
              <Row label="満期・期間" value={p.maturity} />
              <Row label="保険料" value={p.premium} />
              <Row label="証券の場所" value={p.location} />
              <Row label="メモ" value={p.memo} />
            </tbody></table>
          </div>
        ))}

        {contacts.length > 0 && (
          <>
            <h2 className="fs-h2">■ 緊急連絡先</h2>
            <table className="fs-contact-table"><tbody>
              <tr><th>お名前</th><th>続き柄</th><th>電話番号</th></tr>
              {contacts.map((c) => (
                <tr key={c.id}><td>{c.name}</td><td>{c.relation}</td><td>{c.phone}</td></tr>
              ))}
            </tbody></table>
          </>
        )}

        <h2 className="fs-h2">■ 手書きメモ欄(あとから書き足せます)</h2>
        <div className="fs-memo-lines"><div /><div /><div /></div>

        <p className="fs-disclaimer">
          ⚠ このシートの内容が最新・正確とは限りません。正式な内容は保険証券・保険会社の通知が優先します。
          年に1回、内容の見直しをおすすめします。AI読み取りを含む場合は、必ず原本と見くらべてください。
        </p>
        <p className="fs-foot">作成日: {created}　(2/2)</p>
      </section>
    </div>
  );
}

function Row({ label, value, emph }) {
  return (
    <tr>
      <th>{label}</th>
      <td className={emph ? 'fs-emph' : ''}>{value?.trim() || '―'}</td>
    </tr>
  );
}
