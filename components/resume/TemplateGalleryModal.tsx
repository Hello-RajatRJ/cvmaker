'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Check, Lock, Sparkles, CreditCard, Filter, ShieldCheck } from 'lucide-react';
import ConfigurableTemplate from './templates/ConfigurableTemplate';
import { SAMPLE_RESUME_DATA } from '../../data/sampleResume';
import { TEMPLATE_CONFIGS, FREE_TEMPLATE_IDS } from '../../data/templateConfigs';
import { TemplateConfig } from '../../types/resume';
import { UserProfile } from '../../types/auth';
import { RazorpayUtil } from '../../utils/razorpay';
import AuthModal from '../AuthModal';
import toast from 'react-hot-toast';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTemplateId: string;
  unlockedTemplateIds: string[];
  onSelectTemplate: (template: TemplateConfig) => void;
  onUnlockTemplateSuccess: (templateId: string) => void;
}

export default function TemplateGalleryModal({
  isOpen,
  onClose,
  activeTemplateId,
  unlockedTemplateIds,
  onSelectTemplate,
  onUnlockTemplateSuccess,
}: TemplateGalleryModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingUnlockTemplate, setPendingUnlockTemplate] = useState<TemplateConfig | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null));
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', name: 'All Templates (100)' },
    { id: 'ats-safe', name: 'ATS Safe' },
    { id: 'developer', name: 'Developer & Tech' },
    { id: 'executive', name: 'Executive' },
    { id: 'creative', name: 'Creative' },
    { id: 'minimal', name: 'Minimalist' },
    { id: 'academic', name: 'Academic' },
    { id: 'two-page', name: 'Two-Page' },
    { id: 'startup', name: 'Startup & Growth' },
  ];

  const filteredTemplates = TEMPLATE_CONFIGS.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const proceedWithPayment = (template: TemplateConfig, user?: UserProfile | null) => {
    RazorpayUtil.initiatePayment({
      amountInINR: 50,
      itemName: `Resume Template: ${template.name}`,
      itemDescription: 'Lifetime template access & export',
      itemId: template.id,
      type: 'template',
      userName: user?.name || currentUser?.name,
      userEmail: user?.email || currentUser?.email,
      onSuccess: () => {
        toast.success(`🎉 Template "${template.name}" unlocked for ₹50!`);
        onUnlockTemplateSuccess(template.id);
        onSelectTemplate(template);
      }
    });
  };

  const handleUnlockTemplate = (template: TemplateConfig) => {
    // If not logged in, require login/signup so template binds to their account
    if (!currentUser) {
      setPendingUnlockTemplate(template);
      setShowAuthModal(true);
      return;
    }
    proceedWithPayment(template, currentUser);
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    if (pendingUnlockTemplate) {
      const tmpl = pendingUnlockTemplate;
      setPendingUnlockTemplate(null);
      proceedWithPayment(tmpl, user);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Multi-Template Gallery (100 Layouts)</h2>
                <p className="text-xs font-semibold text-slate-500">
                  Side-by-side layout selection • 2 Free templates for everyone, 98 Premium (₹50 each)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters & Search */}
          <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100">
            {/* Category Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search 100 templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400"
              />
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pr-1">
            {filteredTemplates.map((template) => {
              const isUnlocked = !template.isPaid || unlockedTemplateIds.includes(template.id);
              const isActive = activeTemplateId === template.id;

              return (
                <div
                  key={template.id}
                  className={`group relative rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-indigo-50/70 border-indigo-400 shadow-lg shadow-indigo-500/10'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  {/* Visual Layout Card */}
                  <div
                    onClick={() => {
                      if (isUnlocked) {
                        onSelectTemplate(template);
                        onClose();
                      } else {
                        handleUnlockTemplate(template);
                      }
                    }}
                    className="w-full h-80 rounded-xl border border-slate-200 bg-white overflow-hidden relative cursor-pointer group-hover:border-indigo-500 transition-all shadow-sm select-none mb-3"
                  >
                    {/* Scaled ConfigurableTemplate document */}
                    <div className="w-[780px] min-h-[1050px] transform scale-[0.38] origin-top-left pointer-events-none p-1 bg-white">
                      <ConfigurableTemplate resume={SAMPLE_RESUME_DATA} config={template} />
                    </div>

                    {/* Overlay Metadata Bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-700 font-bold z-10 shadow-md">
                      <span className="uppercase tracking-wider text-[9px] font-extrabold text-indigo-700">
                        {template.layout} • {template.fontProfile}
                      </span>
                      {template.isPaid && !isUnlocked ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black flex items-center space-x-1 shadow-sm text-[10px]">
                          <CreditCard className="w-3 h-3 inline" />
                          <span>UNLOCK ₹50</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                          {template.isPaid ? 'UNLOCKED' : 'FREE'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {template.name}
                      </h3>
                      {isUnlocked ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                          {template.isPaid ? 'UNLOCKED' : 'FREE'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200">
                          ₹50
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 line-clamp-2 mb-3">{template.description}</p>
                  </div>

                  {/* Action Button */}
                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        onSelectTemplate(template);
                        onClose();
                      }}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                          : 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                      {isActive && <Check className="w-3.5 h-3.5" />}
                      <span>{isActive ? 'Active Template' : 'Use Template'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnlockTemplate(template)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5 transform hover:scale-[1.01]"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Unlock for ₹50</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingUnlockTemplate(null);
        }}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
