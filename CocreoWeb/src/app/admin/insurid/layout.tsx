import Link from "next/link";
import { LayoutList, Database, LogOut, ChevronRight } from "lucide-react";

export default function AdminInsuridLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200">
          <Link href="/insurid" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-black text-xs">ID</span>
            </div>
            <div>
              <p className="font-bold text-text-primary text-sm leading-none">INSURID</p>
              <p className="text-[10px] text-text-muted leading-none mt-0.5">Admin</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          <Link
            href="/admin/insurid/queue"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-orange-50 hover:text-primary transition-colors"
          >
            <LayoutList className="w-4 h-4" />
            AI下書きキュー
          </Link>
          <Link
            href="/admin/insurid/sources"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-orange-50 hover:text-primary transition-colors"
          >
            <Database className="w-4 h-4" />
            情報源管理
          </Link>
        </nav>

        <div className="p-3 border-t border-gray-200">
          <Link
            href="/insurid"
            className="flex items-center gap-2 px-3 py-2 text-xs text-text-muted hover:text-primary transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
            公開サイトへ
          </Link>
          <form action="/api/insurid/admin-logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-muted hover:text-red-500 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              ログアウト
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
