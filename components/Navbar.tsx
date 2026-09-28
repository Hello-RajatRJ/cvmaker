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
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-lime-500/20 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lime-400 via-lime-500 to-emerald-500 p-0.5 shadow-lg shadow-lime-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-lime-600" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                Architect<span className="text-lime-600">AI</span>
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
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                (pathname || '').startsWith('/resume-builder')
                  ? 'bg-lime-500 text-slate-950 border border-lime-400 shadow-sm shadow-lime-500/20'
                  : 'text-slate-600 hover:text-lime-700 hover:bg-lime-50/60'
              }`}
            >
              <FileText className={`w-4 h-4 ${(pathname || '').startsWith('/resume-builder') ? 'text-slate-950' : 'text-lime-600'}`} />
              <span>Resume Architect</span>
            </Link>

            <Link
              href="/gemini-studio"
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                (pathname || '').startsWith('/gemini-studio')
                  ? 'bg-lime-500 text-slate-950 border border-lime-400 shadow-sm'
                  : 'text-slate-600 hover:text-lime-700 hover:bg-lime-50/60'
              }`}
            >
              <Bot className="w-4 h-4 text-slate-700" />
              <span>Gemini AI Studio</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-lime-100 text-lime-800 rounded-full border border-lime-300">
                FREE
              </span>
            </Link>

            <Link
              href="/assessment"
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                (pathname || '').startsWith('/assessment')
                  ? 'bg-lime-500 text-slate-950 border border-lime-400 shadow-sm'
                  : 'text-slate-600 hover:text-lime-700 hover:bg-lime-50/60'
              }`}
            >
              <Trophy className="w-4 h-4 text-slate-700" />
              <span>AI Mock Test</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                1,120 Qs
              </span>
            </Link>
          </nav>

          {/* User Session & Auth Action */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2.5 bg-white border border-lime-200 rounded-full py-1 px-3 shadow-xs">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-lime-400 to-lime-600 flex items-center justify-center font-black text-slate-950 text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-900 leading-none">{user.name}</p>
                    <p className="text-[10px] font-bold text-lime-700 mt-0.5 leading-none">{user.rankTitle || 'Candidate'}</p>
                  </div>
                  {user.hasTestPass && (
                    <span title="Test Pass Active">
                      <ShieldCheck className="w-4 h-4 text-lime-600" />
                    </span>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all flex items-center space-x-1 cursor-pointer"
                  title="Log out of candidate account"
                >
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-lime-400 via-lime-500 to-lime-600 hover:from-lime-300 hover:to-lime-500 text-slate-950 shadow-md shadow-lime-500/20 transition-all cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-950" />
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
