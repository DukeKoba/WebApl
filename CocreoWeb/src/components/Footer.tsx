import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-surface-dark text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-1">
            <Link href="/" className="mb-4 inline-flex items-center rounded-xl bg-white px-3 py-1.5">
              <Image src="/cocreo-logo.png" alt="Cocreo" width={221} height={55} className="h-6 w-auto" />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              保険代理店の経営課題を、現場で使われる仕組みへ。
              対話から実装、運用改善まで伴走します。
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-300">経営診断ツール</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><Link href="/price-pass-through" className="hover:text-primary transition-colors">価格転嫁シミュレーター</Link></li>
              <li><Link href="/wage-capacity" className="hover:text-primary transition-colors">賃上げ余力診断</Link></li>
              <li><Link href="/succession-score" className="hover:text-primary transition-colors">事業承継スコアリング</Link></li>
              <li><Link href="/management-power" className="hover:text-primary transition-colors">経営力スコア</Link></li>
              <li><Link href="/financial-analysis" className="hover:text-primary transition-colors">PL/BS AI分析</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-300">サービス</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><Link href="/consulting" className="hover:text-primary transition-colors">AIコンサルティング</Link></li>
              <li><Link href="/knowledge-base" className="hover:text-primary transition-colors">レポートライブラリ</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors">料金プラン</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">経営ダッシュボード</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-300">お問い合わせ</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>contact@cocreo.jp</li>
              <li><a href="#" className="hover:text-primary transition-colors">利用規約</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">プライバシーポリシー</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <span>&copy; 2026 Cocreo. All rights reserved.</span>
          <Link href="/" className="text-gray-400 hover:text-primary transition-colors text-sm">
            トップページへ戻る
          </Link>
        </div>
      </div>
    </footer>
  );
}
