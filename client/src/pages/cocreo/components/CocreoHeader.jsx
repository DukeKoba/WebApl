import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Menu, X, Home, ChevronRight } from 'lucide-react';

export default function CocreoHeader({ onBack, currentPage, breadcrumb }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // 「AIコンサル」は生成部分を作り直すまで導線から外している
  // （CocreoConsulting.jsx の CONSULTING_ENABLED を参照）
  const navItems = [
    { label: 'ホーム', href: '/cocreo' },
    { label: '補助金 申請書テンプレート', href: '/cocreo/subsidy-generator' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg transition-colors hover:bg-orange-50 text-gray-500 hover:text-primary"
                aria-label="戻る"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Link to="/cocreo" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-colors" style={{ backgroundColor: 'var(--color-primary)' }}>
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>Cocreo</span>
                <span className="text-[10px] leading-tight hidden sm:block" style={{ color: 'var(--color-text-secondary)' }}>AI経営コンサルティング</span>
              </div>
            </Link>
          </div>

          {breadcrumb && breadcrumb.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <Link to="/cocreo" className="hover:text-primary transition-colors">
                <Home className="w-3.5 h-3.5" />
              </Link>
              {breadcrumb.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  {item.href ? (
                    <Link to={item.href} className="hover:text-primary transition-colors">{item.label}</Link>
                  ) : (
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.slice(1).map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  currentPage === item.label
                    ? 'text-primary bg-orange-50 font-medium'
                    : 'hover:text-primary hover:bg-orange-50'
                }`}
                style={{ color: currentPage === item.label ? undefined : 'var(--color-text-secondary)' }}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="mailto:contact@cocreo.jp?subject=Cocreo%20%E3%81%94%E7%9B%B8%E8%AB%87"
              className="ml-2 px-5 py-2 text-white rounded-xl text-sm font-medium hover:shadow-md transition-all"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              メールで相談する
            </a>
          </nav>

          <button
            className="lg:hidden p-2 rounded-lg transition-colors hover:bg-orange-50"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="メニュー"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden bg-white border-t animate-fade-in" style={{ borderColor: 'var(--color-border)' }}>
          <nav className="flex flex-col p-4 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  currentPage === item.label
                    ? 'text-primary bg-orange-50 font-medium'
                    : 'hover:bg-orange-50 hover:text-primary'
                }`}
                style={{ color: currentPage === item.label ? undefined : 'var(--color-text-secondary)' }}
              >
                {item.label === 'ホーム' && <Home className="w-4 h-4" />}
                {item.label !== 'ホーム' && <span className="w-4" />}
                {item.label}
              </Link>
            ))}
            <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <a
                href="mailto:contact@cocreo.jp?subject=Cocreo%20%E3%81%94%E7%9B%B8%E8%AB%87"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-white rounded-xl font-medium text-center text-sm transition-colors"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                メールで相談する
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
