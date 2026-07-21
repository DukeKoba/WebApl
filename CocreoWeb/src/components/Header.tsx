"use client";

import { ArrowLeft, Menu, X, Home, ChevronRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface HeaderProps {
  onBack?: () => void;
  currentPage?: string;
  breadcrumb?: { label: string; href?: string }[];
}

export default function Header({ onBack, currentPage, breadcrumb }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: "ホーム", href: "/" },
    { label: "AIコンサル", href: "/consulting" },
    { label: "経営診断ツール", href: "/#features", isAnchor: true },
    { label: "PL/BS分析", href: "/financial-analysis" },
    { label: "採用戦略", href: "/hiring-strategy" },
    { label: "料金プラン", href: "/pricing" },
    { label: "シナリオ検証", href: "/scenario-test" },
    { label: "レポート", href: "/knowledge-base" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Back button + Logo */}
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-primary-soft rounded-lg transition-colors text-text-secondary hover:text-primary"
                aria-label="戻る"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image src="/cocreo-logo.png" alt="Cocreo" width={221} height={55} className="h-7 w-auto" />
              <span className="hidden text-[10px] text-text-secondary leading-tight sm:block">
                保険代理店のAI・DX伴走
              </span>
            </Link>
          </div>

          {/* Center: Breadcrumb (if provided) */}
          {breadcrumb && breadcrumb.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 text-sm text-text-secondary">
              <Link href="/" className="hover:text-primary transition-colors">
                <Home className="w-3.5 h-3.5" />
              </Link>
              {breadcrumb.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  {item.href ? (
                    <Link href={item.href} className="hover:text-primary transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-text-primary font-medium">{item.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Right: Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.slice(1).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  currentPage === item.label
                    ? "text-primary bg-primary-soft font-medium"
                    : "text-text-secondary hover:text-primary hover:bg-primary-soft"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/consulting"
              className="ml-2 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark hover:shadow-md transition-all"
            >
              無料で始める
            </Link>
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 hover:bg-primary-soft rounded-lg transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="メニュー"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-border animate-fade-in">
          <nav className="flex flex-col p-4 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  currentPage === item.label
                    ? "text-primary bg-primary-soft font-medium"
                    : "text-text-secondary hover:bg-primary-soft hover:text-primary"
                }`}
              >
                {item.label === "ホーム" && <Home className="w-4 h-4" />}
                {item.label !== "ホーム" && <span className="w-4" />}
                {item.label}
              </Link>
            ))}
            <div className="mt-2 pt-2 border-t border-border">
              <Link
                href="/consulting"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 bg-primary text-white rounded-xl font-medium text-center text-sm hover:bg-primary-dark transition-colors"
              >
                無料で始める
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
