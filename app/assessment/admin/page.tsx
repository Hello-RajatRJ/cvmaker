'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert, Settings, Plus, Trash2, Edit3, CheckCircle,
  AlertTriangle, Eye, Clock, Users, BookOpen, Award, ArrowLeft,
  Search, Filter, Lock, Unlock, Calendar, Check, X
} from 'lucide-react';
import { TECHNOLOGY_PACKS } from '../../../data/questionBank';
import { TechnologyPack, CandidateAttemptRecord, ProctorViolationEvent } from '../../../types/assessment';
import toast from 'react-hot-toast';

export default function AdminProctoringDashboardPage() {
  const [activeTab, setActiveTab] = useState<'attempts' | 'tests'>('attempts');
  const [techPacks, setTechPacks] = useState<TechnologyPack[]>(TECHNOLOGY_PACKS);
  const [selectedAttempt, setSelectedAttempt] = useState<CandidateAttemptRecord | null>(null);
  const [search, setSearch] = useState('');

  // Sample candidate attempts with real proctoring logs for admin review
  const [attempts, setAttempts] = useState<CandidateAttemptRecord[]>([
    {
      id: 'att_001',
      userId: 'usr_rajat_1',
      userName: 'Rajat Gautam',
      userEmail: 'rajat@yopmail.com',
      techId: 'react',
      techName: 'React.js 19',
      date: '2026-08-26 14:15',
      scorePercentage: 88,
      correctAnswers: 62,
      totalQuestions: 70,
      earnedRank: '⚡ Senior Engineer',
      timeTakenMinutes: 42,
      status: 'COMPLETED',
      proctoringReport: {
        totalViolations: 1,
        warningCount: 1,
        criticalCount: 0,
        lookingAwaySeconds: 15,
        tabSwitches: 0,
        fullscreenExits: 0,
        isTerminated: false,
        events: [
          {
            id: 'v1',
            timestamp: '14:25:10',
            type: 'LOOKING_AWAY',
            message: 'Candidate looked away from screen for 15 seconds.',
            severity: 'warning'
          }
        ]
      }
    },
    {
      id: 'att_002',
      userId: 'usr_alex_2',
      userName: 'Alex Rivera',
      userEmail: 'alex.dev@yopmail.com',
      techId: 'nextjs',
      techName: 'Next.js App Router',
      date: '2026-08-26 13:40',
      scorePercentage: 34,
      correctAnswers: 24,
      totalQuestions: 70,
      earnedRank: '🌱 Associate Engineer',
      timeTakenMinutes: 18,
      status: 'CANCELLED_SUSPICIOUS',
      terminationReason: 'Continuous off-screen gaze for over 1 minute (Cheating suspect).',
      restrictedUntil: '2026-08-28 13:40',
      proctoringReport: {
        totalViolations: 4,
        warningCount: 2,
        criticalCount: 2,
        lookingAwaySeconds: 75,
        tabSwitches: 1,
        fullscreenExits: 1,
        isTerminated: true,
        terminationReason: 'Continuous off-screen gaze for over 1 minute.',
        events: [
          {
            id: 'v2',
            timestamp: '13:45:02',
            type: 'FULLSCREEN_EXIT',
            message: 'Candidate exited full-screen mode.',
            severity: 'warning'
          },
          {
            id: 'v3',
            timestamp: '13:48:15',
            type: 'TAB_SWITCH',
            message: 'Window unfocused / switched to another tab.',
            severity: 'critical'
          },
          {
            id: 'v4',
            timestamp: '13:52:00',
            type: 'LOOKING_AWAY',
            message: 'Looking away from laptop screen for 60+ seconds.',
            severity: 'critical'
          }
        ]
      }
    }
  ]);

  // Modal for creating/editing test
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingPack, setEditingPack] = useState<TechnologyPack | null>(null);
  const [packName, setPackName] = useState('');
  const [packCategory, setPackCategory] = useState<any>('frontend');
  const [packDesc, setPackDesc] = useState('');
  const [packDuration, setPackDuration] = useState(90);
  const [packPassing, setPackPassing] = useState(70);

  const handleOpenEditModal = (pack?: TechnologyPack) => {
    if (pack) {
      setEditingPack(pack);
      setPackName(pack.name);
      setPackCategory(pack.category);
      setPackDesc(pack.description);
      setPackDuration(pack.durationMinutes || 90);
      setPackPassing(pack.passingScore || 70);
    } else {
      setEditingPack(null);
      setPackName('');
      setPackCategory('frontend');
      setPackDesc('');
      setPackDuration(90);
      setPackPassing(70);
    }
    setShowTestModal(true);
  };

  const handleSavePack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packName.trim()) {
      toast.error('Test name is required');
      return;
    }

    if (editingPack) {
      setTechPacks((prev) =>
        prev.map((p) =>
          p.id === editingPack.id
            ? {
                ...p,
                name: packName,
                category: packCategory,
                description: packDesc,
                durationMinutes: packDuration,
                passingScore: packPassing
              }
            : p
        )
      );
      toast.success(`Updated test "${packName}"`);
    } else {
      const newId = packName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const newPack: TechnologyPack = {
        id: newId,
        name: packName,
        icon: '⚡',
        category: packCategory,
        questionCount: 70,
        description: packDesc,
        durationMinutes: packDuration,
        passingScore: packPassing
      };
      setTechPacks((prev) => [newPack, ...prev]);
      toast.success(`Created new test stack "${packName}"`);
    }

    setShowTestModal(false);
  };

  const handleDeletePack = (id: string) => {
    setTechPacks((prev) => prev.filter((p) => p.id !== id));
    toast.success('Test stack deleted');
  };

  const handleClearRestriction = (attemptId: string) => {
    setAttempts((prev) =>
      prev.map((a) => (a.id === attemptId ? { ...a, restrictedUntil: undefined } : a))
    );
    toast.success('Cooldown restriction waived for candidate.');
  };

  const filteredAttempts = attempts.filter((a) =>
    a.userName.toLowerCase().includes(search.toLowerCase()) ||
    a.userEmail.toLowerCase().includes(search.toLowerCase()) ||
    a.techName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <Link
              href="/assessment"
              className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Assessment Platform</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center space-x-3">
              <ShieldAlert className="w-7 h-7 text-indigo-400" />
              <span>Admin AI Proctoring & Mock Test Console</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live candidate session audits, anti-cheat event logs, violation reviews & test configuration
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('attempts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeTab === 'attempts'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Candidate Attempts & Logs ({attempts.length})
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeTab === 'tests'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Manage Test Stacks ({techPacks.length})
            </button>
          </div>
        </div>

        {/* TAB 1: Candidate Attempts & Proctoring Audit Timeline */}
        {activeTab === 'attempts' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Search Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search candidate by name, email, or stack..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Attempts Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-4">Candidate</th>
                      <th className="p-4">Stack</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Score</th>
                      <th className="p-4">Proctor Status</th>
                      <th className="p-4">Violations</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredAttempts.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-semibold text-white">
                          <div>{att.userName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{att.userEmail}</div>
                        </td>
                        <td className="p-4 font-bold text-indigo-300">{att.techName}</td>
                        <td className="p-4 text-slate-400">{att.date}</td>
                        <td className="p-4">
                          <span className="font-extrabold text-white">{att.scorePercentage}%</span>
                          <span className="text-[10px] text-slate-500 ml-1">({att.correctAnswers}/{att.totalQuestions})</span>
                        </td>
                        <td className="p-4">
                          {att.status === 'COMPLETED' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                              <CheckCircle className="w-3 h-3" />
                              <span>Verified Clean</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-[10px]">
                              <ShieldAlert className="w-3 h-3" />
                              <span>Cancelled (Suspicious)</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`font-bold ${
                              att.proctoringReport.totalViolations > 0 ? 'text-amber-400' : 'text-slate-500'
                            }`}
                          >
                            {att.proctoringReport.totalViolations} events
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedAttempt(att)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
                          >
                            Audit Timeline
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Manage Mock Test Stacks */}
        {activeTab === 'tests' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Configure questions, passing thresholds, and duration for 16 domains.</p>
              <button
                onClick={() => handleOpenEditModal()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Test Stack</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {techPacks.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{pack.icon}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase">
                        {pack.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">{pack.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{pack.description}</p>

                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950 rounded-2xl text-center text-[10px] text-slate-400 mb-4">
                      <div>
                        <p className="font-bold text-white">{pack.questionCount}</p>
                        <span>Questions</span>
                      </div>
                      <div className="border-x border-slate-800">
                        <p className="font-bold text-white">{pack.durationMinutes || 90}m</p>
                        <span>Duration</span>
                      </div>
                      <div>
                        <p className="font-bold text-emerald-400">{pack.passingScore || 70}%</p>
                        <span>Passing</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleOpenEditModal(pack)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeletePack(pack.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Stack"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Proctoring Timeline Audit Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-400" />
                  <span>Proctoring Audit: {selectedAttempt.userName}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedAttempt.techName} • {selectedAttempt.date}</p>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <p className="text-lg font-black text-white">{selectedAttempt.scorePercentage}%</p>
                <p className="text-[10px] text-slate-500 uppercase">Score</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <p className="text-lg font-black text-amber-400">{selectedAttempt.proctoringReport.lookingAwaySeconds}s</p>
                <p className="text-[10px] text-slate-500 uppercase">Looking Away</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <p className="text-lg font-black text-rose-400">{selectedAttempt.proctoringReport.tabSwitches}</p>
                <p className="text-[10px] text-slate-500 uppercase">Tab Switches</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <p className="text-lg font-black text-indigo-400">{selectedAttempt.proctoringReport.fullscreenExits}</p>
                <p className="text-[10px] text-slate-500 uppercase">FS Exits</p>
              </div>
            </div>

            {/* Timeline of events */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Chronological Event Timeline
              </h4>
              {selectedAttempt.proctoringReport.events.length === 0 ? (
                <div className="p-4 bg-slate-950 rounded-2xl text-center text-xs text-slate-500">
                  No suspicious events recorded. Clean candidate session.
                </div>
              ) : (
                selectedAttempt.proctoringReport.events.map((evt) => (
                  <div
                    key={evt.id}
                    className={`p-3 rounded-2xl border flex items-start space-x-3 text-xs ${
                      evt.severity === 'critical'
                        ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                        : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between font-bold">
                        <span>{evt.type}</span>
                        <span className="text-[10px] opacity-80">{evt.timestamp}</span>
                      </div>
                      <p className="text-[11px] mt-0.5 opacity-90">{evt.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              {selectedAttempt.restrictedUntil && (
                <button
                  onClick={() => handleClearRestriction(selectedAttempt.id)}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/30 transition-all flex items-center space-x-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Waive 2-Day Cool-Off</span>
                </button>
              )}
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs ml-auto"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              {editingPack ? `Edit Test Stack: ${editingPack.name}` : 'Create New Assessment Stack'}
            </h3>
            <form onSubmit={handleSavePack} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Stack Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kubernetes & Cloud DevOps"
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Category</label>
                <select
                  value={packCategory}
                  onChange={(e) => setPackCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="database">Database</option>
                  <option value="cloud">Cloud</option>
                  <option value="core">Core Engineering</option>
                  <option value="ai_devops">DevOps & AI</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={packDuration}
                    onChange={(e) => setPackDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    min="40"
                    max="95"
                    value={packPassing}
                    onChange={(e) => setPackPassing(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={packDesc}
                  onChange={(e) => setPackDesc(e.target.value)}
                  placeholder="Topics, skills evaluated, and syllabus overview"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20"
                >
                  Save Test Stack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
