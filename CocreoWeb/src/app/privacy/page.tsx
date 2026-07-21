import type { Metadata } from "next";
import LegalPageShell from "@/components/cocreo/LegalPageShell";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Cocreo",
  description: "Cocreo公式WebサイトおよびiOSアプリにおける利用者情報の取り扱いについてご案内します。",
};

const sections = [
  {
    title: "基本方針",
    body: (
      <p>
        Cocreo（以下「運営者」）は、公式WebサイトおよびiOSアプリ「Cocreo代理店DX」（以下「本アプリ」）において、利用者のプライバシーを尊重します。本アプリにアカウント機能、広告、行動分析SDKはありません。
      </p>
    ),
  },
  {
    title: "公式Webサイトのアクセス解析",
    body: (
      <>
        <p>
          公式Webサイトでは、利用状況を把握し、情報設計やサービスを改善するためにGoogle Analytics 4を利用します。Google AnalyticsはCookie等を用いて、閲覧ページ、滞在時間、利用端末、参照元、サイト内での操作などを収集する場合があります。
        </p>
        <p>
          これらの情報は個人を直接特定する目的では利用しません。データはGoogleのプライバシーポリシーおよび利用規約に基づいて処理されます。ブラウザの設定でCookieを無効にすることでも収集を制限できます。
        </p>
        <ul>
          <li><a href="https://policies.google.com/privacy?hl=ja" target="_blank" rel="noopener noreferrer">Google プライバシーポリシー</a></li>
          <li><a href="https://tools.google.com/dlpage/gaoptout?hl=ja" target="_blank" rel="noopener noreferrer">Google Analytics オプトアウト アドオン</a></li>
        </ul>
      </>
    ),
  },
  {
    title: "端末内に保存する情報",
    body: (
      <>
        <p>次の情報を利用者の端末内に保存します。</p>
        <ul>
          <li>通知とニュースカテゴリの設定</li>
          <li>今日のチェック状況</li>
          <li>ニュースのブックマーク、既読、検索履歴</li>
          <li>利用者が作成した相談メモ</li>
        </ul>
        <p>これらは運営者のサーバーへ送信しません。アプリを削除すると端末から削除されます。</p>
      </>
    ),
  },
  {
    title: "外部サービスとの通信",
    body: (
      <>
        <ul>
          <li>ニュース表示のため、RSS配信元およびニュース検索サービスへ接続します。</li>
          <li>商品比較では、運営者が提供する商品比較Webサービスをアプリ内に表示します。</li>
          <li>商品比較Webサービスでは、セキュリティ確保と障害対応のため、ホスティング事業者がIPアドレス、User-Agent、アクセス日時などのリクエスト情報を一時的に記録します。現在の保存期間は最大1時間です。これらを広告、追跡、利用者の特定には使用しません。</li>
          <li>記事や外部リンクを開いた場合、リンク先へIPアドレス、ブラウザ情報など通常のWebアクセス情報が送信される場合があります。</li>
          <li>お問い合わせは、利用者が送信操作をした場合に限りメールアプリへ内容を引き渡します。</li>
        </ul>
        <p>
          氏名、住所、電話番号、証券番号、健康情報など、個人を特定できる情報を商品比較や相談メモへ入力しないでください。
        </p>
      </>
    ),
  },
  {
    title: "通知",
    body: (
      <p>
        通知は利用者が許可した場合のみ、端末内で毎朝8時にスケジュールされます。運営者はデバイストークンを収集しません。通知はアプリまたはiOSの設定で停止できます。
      </p>
    ),
  },
  {
    title: "掲載情報について",
    body: (
      <>
        <p>
          ニュース、Office時短レシピ、商品比較は参考情報です。募集、契約、法令対応など重要な判断では、保険会社の公式資料や監督官庁の一次情報を確認してください。
        </p>
        <p>
          本アプリ自身は生成AIのAPIを呼び出しません。Office時短レシピの指示例を外部のAIサービスで利用する場合は、所属先の規程と各サービスのプライバシー条件に従ってください。
        </p>
      </>
    ),
  },
  {
    title: "変更とお問い合わせ",
    body: (
      <p>
        本ポリシーは必要に応じて改定します。お問い合わせは{" "}
        <a href="mailto:contact@cocreo.jp">contact@cocreo.jp</a> または{" "}
        <a href="https://cocreo.jp">Cocreo公式サイト</a> からご連絡ください。
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy"
      title="プライバシーポリシー"
      description="Cocreo公式WebサイトおよびiOSアプリにおける利用者情報の取り扱いについてご案内します。"
    >
      <p className="mb-8 text-[12px] text-[var(--color-text-muted)]">最終更新日：2026年7月20日</p>
      <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
        {sections.map((section) => (
          <section
            key={section.title}
            className="py-8 text-[14px] leading-[2] text-[var(--color-text-secondary)] md:py-10 md:text-[15px] [&_a]:text-[var(--color-primary-dark)] [&_a]:underline [&_a]:underline-offset-4 [&_li]:mb-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6"
          >
            <h2 className="font-serif-jp mb-4 text-[20px] font-medium text-[var(--color-text-primary)] md:text-[22px]">
              {section.title}
            </h2>
            <div className="space-y-4">{section.body}</div>
          </section>
        ))}
      </div>
    </LegalPageShell>
  );
}
