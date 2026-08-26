'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Bot, Trophy, Sparkles, User, ShieldCheck, CreditCard } from 'lucide-react';
import AuthModal from './AuthModal';
import { UserProfile } from '../types/auth';
import toast from 'react-hot-toast';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Check user session
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      toast.success('Logged out successfully');
      window.location.reload();
    } catch (_) {
      setUser(null);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-indigo-500/10 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-500">
                Architect<span className="text-indigo-400">AI</span>
              </span>
              <span className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                CV & LLM Workspace
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/resume-builder"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                (pathname || '').startsWith('/resume-builder')
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Resume Architect</span>
            </Link>

            <Link
              href="/gemini-studio"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                (pathname || '').startsWith('/gemini-studio')
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm'
                  : 'text-slate-600 hover:text-purple-600 hover:bg-slate-50'
              }`}
            >
              <Bot className="w-4 h-4 text-purple-600" />
              <span>Gemini AI Studio</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                FREE
              </span>
            </Link>

            <Link
              href="/assessment"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                (pathname || '').startsWith('/assessment')
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
                  : 'text-slate-600 hover:text-amber-600 hover:bg-slate-50'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>AI Mock Test</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                1,120 Qs
              </span>
            </Link>
          </nav>

          {/* User Session & Auth Action */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2.5 bg-white border border-slate-200 rounded-full py-1 px-3 shadow-xs">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-900 leading-none">{user.name}</p>
                    <p className="text-[10px] font-semibold text-indigo-600 mt-0.5 leading-none">{user.rankTitle || 'Candidate'}</p>
                  </div>
                  {user.hasTestPass && (
                    <span title="Test Pass Active">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </span>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all flex items-center space-x-1"
                  title="Log out of candidate account"
                >
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition-all"
              >
                <User className="w-4 h-4" />
                <span>Candidate Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u) => setUser(u)}
        />
      )}
    </>
  );
}
