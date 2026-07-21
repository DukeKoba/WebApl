import React from 'react';
import { policySummary } from './schema';

// 家族共有シート(A4縦・PDF保管前提)。複数契約を「一覧表」で見やすく。
// 1枚目=表紙メッセージ+もしものときにやること+困ったら連絡
// 2枚目=保険一覧表(スキャンしやすい表)+各保険の補足+緊急連絡先+メモ欄

function fmtDate(iso) {
  const d = iso ? new Date(iso) : new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function Sheet({ sheet }) {
  const ownerName = sheet.owner?.name?.trim() || '(お名前)';
  const created = fmtDate(sheet.createdAt || sheet.updatedAt);
  const contacts = (sheet.contacts || []).filter((c) => c.name || c.phone);
  const firstContact = contacts[0];
  const policies = sheet.policies || [];

  // 補足(満期・保険料・保管場所・メモ)がある契約だけ、番号つきで下にまとめる
  const notes = policies
    .map((p, i) => ({
      no: i + 1,
      name: policySummary(p),
      items: [
        p.maturity && `満期・期間: ${p.maturity}`,
        p.premium && `保険料: ${p.premium}`,
        p.location && `証券の保管場所: ${p.location}`,
        p.memo && `メモ: ${p.memo}`,
      ].filter(Boolean),
    }))
    .filter((n) => n.items.length > 0);

  return (
    <div className="fs-sheet-root">
      {/* ============ 1枚目 ============ */}
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

        <p className="fs-foot">作成日: {created}　作成: 保険の家族共有シート　(1/2)</p>
      </section>

      {/* ============ 2枚目: 保険一覧表 ============ */}
      <section className="fs-page">
        <h2 className="fs-h2">■ 加入している保険の一覧({created} 現在・全{policies.length}件)</h2>

        {policies.length === 0 ? (
          <p className="fs-note">(保険が登録されていません)</p>
        ) : (
          <table className="fs-list-table">
            <thead>
              <tr>
                <th className="fs-col-no">No</th>
                <th className="fs-col-ins">保険会社 / 種類</th>
                <th className="fs-col-cov">保障の内容</th>
                <th className="fs-col-num">証券番号</th>
                <th className="fs-col-ben">受取人</th>
                <th className="fs-col-tel">連絡先</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p, i) => (
                <tr key={p.id}>
                  <td className="fs-col-no">{i + 1}</td>
                  <td className="fs-col-ins">
                    <span className="fs-ins-name">{p.insurerName || '―'}</span>
                    {p.productName && <span className="fs-ins-prod">{p.productName}</span>}
                    {p.category && <span className="fs-ins-cat">{p.category}</span>}
                  </td>
                  <td className="fs-col-cov">{p.amount || '―'}</td>
                  <td className="fs-col-num">{p.policyNumber || '―'}</td>
                  <td className="fs-col-ben">{p.beneficiary || '―'}</td>
                  <td className="fs-col-tel fs-emph">{p.phone || '―'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {notes.length > 0 && (
          <>
            <h3 className="fs-h3">各保険の補足</h3>
            <ul className="fs-notes">
              {notes.map((n) => (
                <li key={n.no}>
                  <span className="fs-note-no">No.{n.no}</span> {n.name}
                  <div className="fs-note-items">{n.items.join('　/　')}</div>
                </li>
              ))}
            </ul>
          </>
        )}

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
