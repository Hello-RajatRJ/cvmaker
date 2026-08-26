'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Key, Trash2, Send, History, Sparkles, Plus, MessageSquare,
  ArrowDown, Copy, Check, X, Zap, Brain, Code2, FileText, Server,
  Container, Lock, LogIn, ArrowRight
} from 'lucide-react';
import { AI_PERSONAS, AIPersona, ChatMessage, ChatSession, GeminiModel, GeminiService } from '../../services/geminiService';
import NotepadEditor from '../../components/gemini/NotepadEditor';
import FormattedMessage from '../../components/gemini/FormattedMessage';
import AuthModal from '../../components/AuthModal';
import { UserProfile } from '../../types/auth';

const PERSONA_ICONS: Record<string, React.ReactNode> = {
  'interview-coach': <Zap className="w-4 h-4" />,
  'fullstack-architect': <Brain className="w-4 h-4" />,
  'code-optimizer': <Code2 className="w-4 h-4" />,
  'resume-reviewer': <FileText className="w-4 h-4" />,
  'system-designer': <Server className="w-4 h-4" />,
  'devops-lead': <Container className="w-4 h-4" />,
};

export default function GeminiAIStudioPage() {
  const [model, setModel] = useState<GeminiModel>('gemini-1.5-flash');
  const [personaId, setPersonaId] = useState<AIPersona>('fullstack-architect');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showNotepad, setShowNotepad] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Authentication State & Guard
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'session-default',
      title: 'Full-Stack Architecture Session',
      personaId: 'fullstack-architect',
      model: 'gemini-1.5-flash',
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-1',
          sender: 'ai',
          text: 'Welcome to Gemini AI Studio! I am your **Full-Stack Architect** coach. Ask me about system design, microservices, Next.js optimization, or code auditing.\n\nYou can switch between 6 expert personas and 4 Gemini model engines using the toolbar above.',
          timestamp: '12:00 PM',
          modelUsed: 'gemini-1.5-flash'
        }
      ]
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-default');

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const activePersona = AI_PERSONAS.find((p) => p.id === personaId) || AI_PERSONAS[0];

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
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages, loading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const userText = inputMessage.trim();
    setInputMessage('');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...activeSession.messages, userMsg];
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, messages: updatedMessages, updatedAt: new Date().toISOString() } : s))
    );

    setLoading(true);

    try {
      const replyText = await GeminiService.sendMessage(
        userText,
        model,
        personaId,
        updatedMessages,
        apiKey
      );

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: model,
        personaId
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, aiMsg], updatedAt: new Date().toISOString() }
            : s
        )
      );
    } catch (err) {
      console.warn('AI Chat Error:', err);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const createNewSession = () => {
    const newSess: ChatSession = {
      id: `session-${Date.now()}`,
      title: `${activePersona.title} Chat`,
      personaId,
      model,
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          sender: 'ai',
          text: `New **${activePersona.title}** session initialized with **${model}** engine. How can I help you today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: model
        }
      ]
    };
    setSessions((prev) => [newSess, ...prev]);
    setActiveSessionId(newSess.id);
    setShowDrawer(false);
  };

  const clearCurrentChat = () => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, messages: [] } : s))
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSaveApiKey = () => {
    setApiKey(apiKeyInput.trim());
    setShowApiKeyModal(false);
  };

  // Auth Gate: Require login for Gemini Studio
  if (authChecked && !currentUser) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative max-w-lg w-full bg-slate-900/80 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/10">
            <Bot className="w-8 h-8 text-indigo-400" />
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Member-Only AI Workspace</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Sign In to Access Gemini AI Studio
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
            Get unlimited access to 6 specialized AI engineering personas, full-stack architecture reviews, system design generators, and live developer notepad workspace.
          </p>

          <div className="grid grid-cols-3 gap-2 text-left mb-6 p-3.5 bg-slate-950/60 border border-slate-800/60 rounded-2xl">
            <div className="p-2">
              <span className="text-base">🏛️</span>
              <p className="text-[11px] font-bold text-white mt-1">6 Personas</p>
              <p className="text-[10px] text-slate-500">Tech Architecture</p>
            </div>
            <div className="p-2 border-x border-slate-800/80">
              <span className="text-base">⚡</span>
              <p className="text-[11px] font-bold text-white mt-1">4 Engines</p>
              <p className="text-[10px] text-slate-500">Gemini 2.0 / Flash</p>
            </div>
            <div className="p-2">
              <span className="text-base">📝</span>
              <p className="text-[11px] font-bold text-white mt-1">Notepad</p>
              <p className="text-[10px] text-slate-500">Auto-saved code</p>
            </div>
          </div>

          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 group"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Create Account</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u) => {
            setCurrentUser(u);
            setShowAuthModal(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-slate-800/60 bg-slate-950/95 backdrop-blur-xl px-4 py-2 flex flex-wrap items-center justify-between gap-2 sticky top-16 z-20">
        <div className="flex items-center space-x-2">
          {/* Drawer Toggle */}
          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className={`p-2 rounded-xl border transition-all ${showDrawer ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}`}
            title="Chat History"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Model Selector */}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as GeminiModel)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer hover:border-slate-700 transition-colors"
          >
            <option value="gemini-2.0-flash">⚡ Gemini 2.0 Flash</option>
            <option value="gemini-1.5-flash">🔥 Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro">🧠 Gemini 1.5 Pro</option>
            <option value="gemini-flash-8b">💡 Gemini Flash 8B</option>
          </select>

          {/* Persona Selector */}
          <select
            value={personaId}
            onChange={(e) => setPersonaId(e.target.value as AIPersona)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-violet-300 font-semibold focus:outline-none focus:border-violet-500 cursor-pointer hover:border-slate-700 transition-colors"
          >
            {AI_PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.avatar} {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNotepad(!showNotepad)}
            className={`hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${showNotepad ? 'bg-violet-600/15 border-violet-500/40 text-violet-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Notepad</span>
          </button>

          <button
            onClick={() => setShowApiKeyModal(true)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${apiKey ? 'bg-emerald-600/15 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-amber-400 hover:border-amber-500/40'}`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{apiKey ? 'Key Active' : 'API Key'}</span>
          </button>

          <button
            onClick={clearCurrentChat}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/30 transition-all"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Drawer */}
        <div
          className={`absolute lg:relative z-30 inset-y-0 left-0 w-72 bg-slate-925 border-r border-slate-800/60 transition-all duration-300 flex flex-col ${
            showDrawer ? 'translate-x-0' : '-translate-x-full lg:hidden'
          }`}
          style={{ backgroundColor: 'rgb(10, 14, 25)' }}
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800/60">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Conversations</span>
              </h3>
              <button
                onClick={createNewSession}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                title="New Chat"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
            {sessions.map((s) => {
              const sPersna = AI_PERSONAS.find((p) => p.id === s.personaId);
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setShowDrawer(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all group ${
                    s.id === activeSessionId
                      ? 'bg-indigo-600/15 border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                      : 'bg-transparent border-transparent hover:bg-slate-900/80 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{sPersna?.avatar || '💬'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${s.id === activeSessionId ? 'text-white' : 'text-slate-300'}`}>
                        {s.title}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{s.model} · {s.messages.length} msgs</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Chat */}
        <div className="flex-1 flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
          {/* Active Persona Banner */}
          <div className="px-5 py-3 border-b border-slate-800/40 bg-gradient-to-r from-slate-950 via-slate-900/50 to-slate-950">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center text-xl">
                {activePersona.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white">{activePersona.title}</h3>
                <p className="text-[11px] text-slate-400 truncate">{activePersona.description}</p>
              </div>
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar">
            {activeSession.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className={`relative group max-w-[80%] lg:max-w-2xl ${msg.sender === 'user' ? 'order-1' : 'order-1'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-br-md shadow-lg shadow-indigo-500/15'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-md shadow-xl shadow-black/20'
                    }`}
                  >
                    {msg.sender === 'ai' ? (
                      <FormattedMessage content={msg.text} isAi={true} />
                    ) : (
                      <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                    )}
                  </div>

                  {/* Meta Row */}
                  <div className={`flex items-center space-x-2 mt-1.5 px-1 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <span className="text-[10px] text-slate-600 font-mono">{msg.modelUsed}</span>
                    )}
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl rounded-bl-md px-4 py-3 shadow-xl">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-indigo-300 font-medium">{activePersona.title} is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-5 py-3 border-t border-slate-800/40 bg-slate-950/95 backdrop-blur-xl">
            <form onSubmit={handleSendMessage} className="relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${activePersona.title}...`}
                rows={1}
                className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-2xl pl-4 pr-14 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none transition-all"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-slate-600 mt-1.5 text-center">
              Powered by Google Gemini · Free to use · Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* Right Notepad Panel */}
        {showNotepad && (
          <div className="hidden lg:block w-96 h-[calc(100vh-8rem)] border-l border-slate-800/60 p-4">
            <NotepadEditor />
          </div>
        )}
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Connect Gemini API Key</span>
              </h3>
              <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Paste your Google AI Studio API key below. It&apos;s stored locally in your browser only — never sent to our servers.
            </p>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy... (your Gemini API key)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-mono mb-4"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-semibold hover:text-white hover:border-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-500 transition-all"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
