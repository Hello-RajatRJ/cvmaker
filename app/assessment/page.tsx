'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy, Play, Lock, CreditCard, Sparkles, Shield,
  Clock, BarChart3, Award, ChevronRight, Zap, Users,
  Target, Star, TrendingUp, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { TECHNOLOGY_PACKS } from '../../data/questionBank';
import { UserProfile } from '../../types/auth';
import { RazorpayUtil } from '../../utils/razorpay';
import AuthModal from '../../components/AuthModal';

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  frontend: { label: 'Frontend', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  backend: { label: 'Backend', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  database: { label: 'Database', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  cloud: { label: 'Cloud', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  core: { label: 'Core', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  ai_devops: { label: 'DevOps', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
};

function AssessmentPlatformContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Handle return from payment gateway
  useEffect(() => {
    const passUnlocked = searchParams.get('passUnlocked');
    const paymentStatus = searchParams.get('payment');

    if (passUnlocked === 'true' && paymentStatus === 'success') {
      toast.success('🎉 Test Pass Unlocked! Unlimited Proctored Assessments Active.', {
        duration: 6000,
        icon: '🏆',
      });

      try {
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.5 } });
      } catch (e) { }

      setUser((prev) =>
        prev
          ? { ...prev, hasTestPass: true }
          : {
              id: 'guest_user',
              name: 'Candidate Guest',
              email: 'candidate@example.com',
              role: 'candidate',
              rankTitle: '🌱 Associate Engineer',
              highestScore: 0,
              testsTaken: 0,
              unlockedTemplates: [],
              hasTestPass: true,
              testHistory: [],
              createdAt: new Date().toISOString(),
            }
      );

      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [searchParams]);

  const [pendingBuyPass, setPendingBuyPass] = useState(false);

  const proceedWithBuyPass = (activeUser?: UserProfile | null) => {
    const u = activeUser || user;
    RazorpayUtil.initiatePayment({
      amountInINR: 199,
      itemName: 'AI Technical Mock Test Arena Pass',
      itemDescription: 'Unlimited proctored 70-question assessments across all 16 tech stacks',
      itemId: 'mock_test_pass_unlimited',
      type: 'mock_test_pass',
      userName: u?.name,
      userEmail: u?.email,
      redirectUrl: '/assessment?passUnlocked=true&payment=success',
      onSuccess: () => {
        if (u) {
          setUser({ ...u, hasTestPass: true });
        }
      },
    });
  };

  const handleBuyTestPass = () => {
    if (!user) {
      setPendingBuyPass(true);
      setShowAuthModal(true);
      return;
    }
    proceedWithBuyPass(user);
  };

  const categories = ['all', ...Array.from(new Set(TECHNOLOGY_PACKS.map((t) => t.category)))];

  const filteredPacks = selectedCategory === 'all'
    ? TECHNOLOGY_PACKS
    : TECHNOLOGY_PACKS.filter(t => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/3 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          {/* Top Badge & Admin Console Link */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 backdrop-blur-sm">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 tracking-wide">AI-Powered Technical Assessment Platform</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <Link
              href="/assessment/admin"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold transition-all shadow-sm"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Proctoring Console</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
              Technical Assessment
              <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                & Rank System
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
              70 curated questions per stack across 16 core domains. Real-time proctored timers, daily shuffling, and downloadable PDF rank certificates.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-10">
            {[
              { icon: <BookOpen className="w-4 h-4" />, label: 'Questions', value: '1,120+', color: 'text-indigo-400' },
              { icon: <Target className="w-4 h-4" />, label: 'Tech Stacks', value: '16', color: 'text-emerald-400' },
              { icon: <Clock className="w-4 h-4" />, label: 'Per Test', value: '90 min', color: 'text-amber-400' },
              { icon: <Award className="w-4 h-4" />, label: 'Certificate', value: 'PDF', color: 'text-violet-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-3.5 text-center backdrop-blur-sm">
                <div className={`${stat.color} flex justify-center mb-1.5`}>{stat.icon}</div>
                <p className="text-lg font-black text-white">{stat.value}</p>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* User Rank + CTA */}
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Rank</p>
                    <p className="text-sm font-black text-amber-400">
                      {user ? user.rankTitle : '🌱 Candidate Guest'}
                    </p>
                  </div>
                </div>
                {user?.hasTestPass && (
                  <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    <Shield className="w-3 h-3" />
                    <span>PASS ACTIVE</span>
                  </span>
                )}
              </div>

              {!user?.hasTestPass && (
                <button
                  onClick={handleBuyTestPass}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 group"
                >
                  <Zap className="w-4 h-4 group-hover:animate-pulse" />
                  <span>Unlock All Stacks — ₹199 Lifetime Pass</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {user?.hasTestPass && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-950/60 rounded-xl p-2.5">
                    <p className="text-lg font-black text-white">{user.testsTaken}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Tests</p>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl p-2.5">
                    <p className="text-lg font-black text-white">{user.highestScore}%</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Best</p>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl p-2.5">
                    <p className="text-lg font-black text-white">16</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Stacks</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stacks Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4">
        {/* Section Header + Category Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>Assessment Stacks</span>
              <span className="text-xs text-amber-400 font-semibold px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                {TECHNOLOGY_PACKS.length} Stacks
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Select a technology stack to begin your proctored assessment</p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const catInfo = CATEGORY_LABELS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 shadow-md shadow-indigo-500/10'
                      : 'bg-transparent border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'All' : catInfo?.label || cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stacks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredPacks.map((tech) => {
            const catInfo = CATEGORY_LABELS[tech.category] || { label: tech.category, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };

            return (
              <div
                key={tech.id}
                className="group relative bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/60 hover:border-indigo-500/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between backdrop-blur-sm"
              >
                {/* Top Row */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                      {tech.icon}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${catInfo.color}`}>
                      {catInfo.label}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors mb-1">
                    {tech.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mb-3">
                    {tech.description}
                  </p>

                  {/* Question Count */}
                  <div className="flex items-center space-x-3 text-[10px] text-slate-500 mb-4">
                    <span className="flex items-center space-x-1">
                      <BookOpen className="w-3 h-3" />
                      <span>{tech.questionCount} Questions</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>90 min</span>
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-3 border-t border-slate-800/60">
                  {user?.hasTestPass ? (
                    <Link
                      href={`/assessment/test/${tech.id}`}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/15 transition-all flex items-center justify-center space-x-1.5 group/btn"
                    >
                      <Play className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                      <span>Start Assessment</span>
                    </Link>
                  ) : (
                    <button
                      onClick={handleBuyTestPass}
                      className="w-full py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/30 text-slate-300 hover:text-amber-300 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-500/60" />
                      <span>Unlock (Pass Required)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingBuyPass(false);
        }}
        onSuccess={(u) => {
          setUser(u);
          setShowAuthModal(false);
          if (pendingBuyPass) {
            setPendingBuyPass(false);
            proceedWithBuyPass(u);
          }
        }}
      />
    </div>
  );
}

export default function AssessmentPlatformPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <AssessmentPlatformContent />
    </Suspense>
  );
}
