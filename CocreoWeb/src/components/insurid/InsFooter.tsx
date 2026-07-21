import Link from "next/link";
import { CATEGORY_LABELS, type Category } from "@/lib/insurid/mock-articles";

const CATEGORIES: Category[] = ["broker", "insurer", "market", "claims", "regulation", "strategy", "howto"];

export default function InsFooter() {
  return (
    <footer className="bg-surface-dark text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-black text-xs tracking-tighter">ID</span>
              </div>
              <span className="font-black text-base tracking-tight">INSURID</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              保険代理店のためのAI×海外情報メディア。<br />
              毎朝7:30、世界の最前線を日本語で。
            </p>
            <p className="text-xs text-gray-500 mt-3">Cocreoの保険代理店向け情報ブランド</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">カテゴリ</h4>
            <ul className="space-y-2">
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link href={`/insurid/category/${cat}`} className="text-sm text-gray-400 hover:text-primary transition-colors">
                    {CATEGORY_LABELS[cat]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">サービス</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/insurid/newsletter" className="hover:text-primary transition-colors">メルマガ登録（無料）</Link></li>
              <li><Link href="/insurid/pricing" className="hover:text-primary transition-colors">Premiumプラン</Link></li>
              <li><Link href="/insurid/articles" className="hover:text-primary transition-colors">全記事アーカイブ</Link></li>
              <li><Link href="/insurid/weekly" className="hover:text-primary transition-colors">週次レポート</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">メディア情報</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/insurid/about" className="hover:text-primary transition-colors">編集方針・編集者紹介</Link></li>
              <li><Link href="/insurid/editorial-policy" className="hover:text-primary transition-colors">AI署名・訂正方針</Link></li>
              <li><Link href="/insurid/sources" className="hover:text-primary transition-colors">情報源リスト</Link></li>
              <li><Link href="/media" className="hover:text-primary transition-colors">Cocreo for Insurance</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <span>&copy; 2026 Cocreo. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-300 transition-colors">プライバシーポリシー</a>
            <a href="#" className="hover:text-gray-300 transition-colors">特商法表記</a>
            <a href="#" className="hover:text-gray-300 transition-colors">利用規約</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
