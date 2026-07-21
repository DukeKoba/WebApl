import type { Metadata } from "next";
import { Mail } from "lucide-react";
import LegalPageShell from "@/components/cocreo/LegalPageShell";

export const metadata: Metadata = {
  title: "サポート | Cocreo代理店DX",
  description: "iOSアプリ「Cocreo代理店DX」のサポートとよくある質問です。",
};

const faqs = [
  {
    question: "ニュースはいつ更新されますか？",
    answer: "各情報源の配信状況に応じて更新されます。画面を下へ引いて再読み込みできます。",
  },
  {
    question: "通知を止めるには？",
    answer: "アプリの「その他」→「設定」→「プッシュ通知」をオフにしてください。iOSの「設定」→「通知」からも変更できます。",
  },
  {
    question: "商品比較が表示されません。",
    answer: "インターネット接続をご確認のうえ、商品比較画面のメニューから再読み込みしてください。掲載内容は参考情報のため、提案時には必ず保険会社の公式資料をご確認ください。",
  },
  {
    question: "相談メモは他の人に見られますか？",
    answer: "相談メモは端末内だけに保存されます。個人を特定できる顧客情報は入力しないでください。",
  },
  {
    question: "Office時短のAI機能で料金は発生しますか？",
    answer: "本アプリ自身はAI APIを呼び出しません。AIへの指示例を参考に、利用者のMicrosoft 365環境などで実行します。利用可否や料金は所属先の契約をご確認ください。",
  },
  {
    question: "アプリが正常に動作しません。",
    answer: "アプリを終了して再起動し、改善しない場合は端末とiOSのバージョン、発生した画面、操作手順を添えてお問い合わせください。",
  },
];

export default function SupportPage() {
  return (
    <LegalPageShell
      eyebrow="Support"
      title="Cocreo代理店DX サポート"
      description="保険代理店の日々の情報収集と業務改善を支援するiOSアプリについて、よくある質問とお問い合わせ先をご案内します。"
    >
      <section className="border-b border-[var(--color-border)] pb-10">
        <h2 className="font-serif-jp text-[22px] font-medium text-[var(--color-text-primary)]">アプリについて</h2>
        <p className="mt-4 text-[15px] leading-[2] text-[var(--color-text-secondary)]">
          Cocreo代理店DXは、国内の保険関連ニュース、今日やること、商品比較、業務改善チェック、Office時短レシピ、相談メモをまとめた無料のiOSアプリです。ログインは不要です。
        </p>
      </section>

      <section className="py-10">
        <h2 className="font-serif-jp text-[22px] font-medium text-[var(--color-text-primary)]">よくある質問</h2>
        <div className="mt-6 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {faqs.map((faq) => (
            <div key={faq.question} className="py-6">
              <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">{faq.question}</h3>
              <p className="mt-3 text-[14px] leading-[2] text-[var(--color-text-secondary)]">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] pt-10">
        <h2 className="font-serif-jp text-[22px] font-medium text-[var(--color-text-primary)]">お問い合わせ</h2>
        <p className="mt-4 text-[15px] leading-[2] text-[var(--color-text-secondary)]">
          不具合、ご要望、代理店業務やアプリ・Webサイト開発のご相談を受け付けています。
        </p>
        <a
          href="mailto:contact@cocreo.jp?subject=Cocreo%E4%BB%A3%E7%90%86%E5%BA%97DX%20%E3%82%B5%E3%83%9D%E3%83%BC%E3%83%88"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
        >
          <Mail className="h-4 w-4" />
          メールで問い合わせる
        </a>
      </section>
    </LegalPageShell>
  );
}
