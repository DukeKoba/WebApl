"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, ChevronDown } from "lucide-react";
import { CATEGORY_LABELS, type Category } from "@/lib/insurid/mock-articles";
import AuthButton from "@/components/insurid/AuthButton";

const CATEGORIES: Category[] = ["broker", "insurer", "market", "claims", "regulation", "strategy", "howto"];

export default function InsHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/insurid" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-black text-sm tracking-tighter">ID</span>
            </div>
            <span className="font-black text-lg tracking-tight text-text-primary group-hover:text-primary transition-colors">
              INSURID
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            <Link href="/insurid" className="px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-orange-50 rounded-lg transition-colors">
              本日の朝刊
            </Link>

            {/* カテゴリドロップダウン */}
            <div className="relative" onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
              <button className="flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-orange-50 rounded-lg transition-colors">
                カテゴリ <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {catOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-border rounded-xl shadow-lg py-1 z-50">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat}
                      href={`/insurid/category/${cat}`}
                      className="block px-4 py-2 text-sm text-text-secondary hover:bg-orange-50 hover:text-primary transition-colors"
                    >
                      {CATEGORY_LABELS[cat]}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/insurid/articles" className="px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-orange-50 rounded-lg transition-colors">
              全記事
            </Link>
            <Link href="/insurid/newsletter" className="px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-orange-50 rounded-lg transition-colors">
              メルマガ登録
            </Link>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-text-secondary hover:text-primary hover:bg-orange-50 rounded-lg transition-colors" aria-label="検索">
              <Search className="w-4.5 h-4.5" />
            </button>
            <Link href="/insurid/pricing" className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors">
              Premium
            </Link>
            <AuthButton />
            <button
              className="lg:hidden p-2 hover:bg-orange-50 rounded-lg transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="メニュー"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-border">
          <nav className="p-4 space-y-1">
            <Link href="/insurid" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-text-secondary hover:bg-orange-50 rounded-lg">本日の朝刊</Link>
            <Link href="/insurid/articles" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-text-secondary hover:bg-orange-50 rounded-lg">全記事</Link>
            <div className="pt-1 pb-1">
              <p className="px-3 text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">カテゴリ</p>
              {CATEGORIES.map((cat) => (
                <Link key={cat} href={`/insurid/category/${cat}`} onClick={() => setMenuOpen(false)} className="block px-3 py-1.5 text-sm text-text-secondary hover:bg-orange-50 rounded-lg">
                  {CATEGORY_LABELS[cat]}
                </Link>
              ))}
            </div>
            <Link href="/insurid/newsletter" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-text-secondary hover:bg-orange-50 rounded-lg">メルマガ登録</Link>
            <Link href="/insurid/account" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-text-secondary hover:bg-orange-50 rounded-lg">マイページ</Link>
            <Link href="/insurid/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-text-secondary hover:bg-orange-50 rounded-lg">ログイン / 登録</Link>
            <div className="pt-2 border-t border-border">
              <Link href="/insurid/pricing" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 bg-primary text-white text-sm font-medium rounded-xl text-center">
                Premium に登録
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
