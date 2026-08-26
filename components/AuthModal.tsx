'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, Shield, Trophy, CheckCircle2, ArrowRight, RefreshCw, KeyRound, Sparkles } from 'lucide-react';
import { UserProfile } from '../types/auth';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

type AuthMode = 'login' | 'register' | 'verify-otp';

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [hintOtp, setHintOtp] = useState<string | null>(null);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (mode === 'verify-otp') {
      setTimeout(() => {
        otpInputs.current[0]?.focus();
      }, 100);
    }
  }, [mode]);

  if (!isOpen) return null;

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste of full 6 digits
      const pasted = value.replace(/[^0-9]/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(pasted.length, 5);
      otpInputs.current[nextIdx]?.focus();
      return;
    }

    const val = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-advance to next input
    if (val && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'verify-otp') {
      const fullOtp = otp.join('');
      if (fullOtp.length !== 6) {
        setError('Please enter the complete 6-digit verification code.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: fullOtp })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          toast.success(`🎉 Email verified! Welcome, ${data.user.name}!`);
          onSuccess(data.user);
          onClose();
        } else {
          const msg = data.error || 'Verification failed';
          setError(msg);
          toast.error(msg);
        }
      } catch (err) {
        setError('Network connection error');
        toast.error('Network connection error');
      } finally {
        setLoading(false);
      }
      return;
    }

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const body = mode === 'register' ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      // If registration requires OTP verification or unverified user logs in
      if (data.requireVerification) {
        setMode('verify-otp');
        if (data.otp) setHintOtp(data.otp);
        toast.success(`Verification code sent to ${email}`, { icon: '📩' });
        setLoading(false);
        return;
      }

      if (res.ok && data.success) {
        toast.success(`Welcome back, ${data.user.name}!`);
        onSuccess(data.user);
        onClose();
      } else {
        const msg = data.error || 'Authentication failed';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      setError('Network connection error');
      toast.error('Network connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.otp) setHintOtp(data.otp);
        toast.success(`A new verification code was sent to ${email}`);
      } else {
        toast.error(data.error || 'Failed to resend code');
      }
    } catch (err) {
      toast.error('Network error while resending code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-7 overflow-hidden">
        {/* Decorative ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
            {mode === 'verify-otp' ? (
              <KeyRound className="w-5 h-5 text-amber-400" />
            ) : mode === 'register' ? (
              <Sparkles className="w-5 h-5 text-indigo-400" />
            ) : (
              <Trophy className="w-5 h-5 text-indigo-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {mode === 'verify-otp'
                ? 'Verify Your Email'
                : mode === 'register'
                ? 'Create Candidate Account'
                : 'Candidate Sign In'}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'verify-otp'
                ? `6-digit code sent to ${email}`
                : 'Unlock AI studio, assessments & saved templates'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Mode: Verify OTP Screen */}
        {mode === 'verify-otp' ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {hintOtp && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-center">
                <p className="text-[11px] text-amber-400 font-semibold">Demo / Testing Verification Code:</p>
                <p className="text-xl font-black text-amber-300 font-mono tracking-widest mt-0.5">{hintOtp}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                Enter 6-Digit OTP Code
              </label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-2xl text-center text-xl font-mono font-black text-white outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Email & Complete Registration</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="text-slate-400 hover:text-indigo-400 font-medium flex items-center space-x-1 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Change Email
              </button>
            </div>
          </form>
        ) : (
          /* Mode: Login / Register Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="alex.rivera@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Processing...' : mode === 'register' ? 'Continue with Email Verification' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'register' ? 'login' : 'register');
                  setError('');
                }}
                className="text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium"
              >
                {mode === 'register' ? 'Already have an account? Sign In' : 'New candidate? Create account & verify'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
