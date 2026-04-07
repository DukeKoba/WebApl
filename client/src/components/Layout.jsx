import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, ChevronLeft } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const isDetail = location.pathname.startsWith('/race/');

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 border-b border-indigo-700 shadow-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          {isDetail && (
            <Link to="/" className="text-indigo-300 hover:text-white transition-colors">
              <ChevronLeft size={24} />
            </Link>
          )}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-yellow-500 p-1.5 rounded-lg">
              <Trophy size={20} className="text-yellow-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">大井競馬場 AI予想</h1>
              <p className="text-xs text-indigo-300">TCK Prediction System</p>
            </div>
          </Link>
          <div className="ml-auto text-right">
            <p className="text-xs text-indigo-300">
              {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs text-yellow-400 font-medium">ナイター開催</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-4">
        {children}
      </main>
    </div>
  );
}
