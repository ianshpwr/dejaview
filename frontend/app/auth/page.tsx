'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Feather, Eye, EyeOff } from 'lucide-react';
import { setToken, getToken } from '@/lib/auth';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

type AuthMode = 'signin' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && getToken()) router.replace('/');
  }, [mounted, router]);

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const endpoint = mode === 'signin' ? '/auth/login' : '/auth/register';
      const body =
        mode === 'signin'
          ? { email, password }
          : { name, email, password };

      const res = await fetch(`${BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok || res.headers.get('content-type')?.includes('text/html')) {
        const text = await res.text().catch(() => '');
        throw new Error(
          text.includes('<!DOCTYPE')
            ? `Server error: ${res.status} ${res.statusText}`
            : (() => { try { return JSON.parse(text).message; } catch { return text || `HTTP ${res.status}`; } })()
        );
      }
      const data = await res.json();


      setToken(data.token);
      router.replace('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-beige">
      {/* Left: Form */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full lg:w-[500px] flex flex-col justify-center px-8 sm:px-12 py-12 z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-16">
          <div className="w-10 h-10 rounded-xl bg-pink-light/30 border border-coral/20 flex items-center justify-center">
            <Feather size={20} className="text-coral" />
          </div>
          <span className="text-2xl font-medium text-dark font-heading">
            Dejaview
          </span>
        </div>

        <div className="mb-10">
          <h1
            className="text-[42px] sm:text-[52px] leading-[1.1] text-dark mb-4 font-heading"
          >
            Your thoughts,<br />remembered.
          </h1>
          <p className="text-[18px] text-muted font-serif">
            Write freely. Reflect deeply. Dejaview remembers it all.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence>
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-[13px] font-medium text-muted font-sans mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  className="w-full bg-surface border border-pink-light focus:border-coral focus:ring-4 focus:ring-coral/15 rounded-[12px] px-4 py-3 text-[15px] text-dark placeholder:text-muted/50 transition-all font-sans outline-none"
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-[13px] font-medium text-muted font-sans mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-surface border border-pink-light focus:border-coral focus:ring-4 focus:ring-coral/15 rounded-[12px] px-4 py-3 text-[15px] text-dark placeholder:text-muted/50 transition-all font-sans outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-muted font-sans mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface border border-pink-light focus:border-coral focus:ring-4 focus:ring-coral/15 rounded-[12px] px-4 py-3 pr-10 text-[15px] text-dark placeholder:text-muted/50 transition-all font-sans outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-dark transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-coral font-sans">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-coral hover:bg-yellow text-white hover:text-dark font-medium py-3.5 rounded-[100px] text-[16px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-sans mt-2"
          >
            {isSubmitting && (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {mode === 'signin' ? 'Start journaling' : 'Create account'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
            className="text-[14px] text-muted hover:text-coral transition-colors font-sans"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </motion.div>

      {/* Right: Animated illustration */}
      <div className="hidden lg:flex flex-1 relative bg-surface border-l border-pink-light/30 items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(#1f1a14 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <svg viewBox="0 0 400 400" className="w-full max-w-[500px] h-auto drop-shadow-sm">
          <motion.circle cx="200" cy="200" r="140" fill="#fff5d7"
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }} />
          <motion.circle cx="250" cy="150" r="60" fill="#ffaaab" opacity="0.3"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }} />
          <motion.circle cx="140" cy="260" r="80" fill="#feb300" opacity="0.15"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }} />
          <motion.path
            d="M 120 130 C 120 130, 160 110, 200 130 C 240 110, 280 130, 280 130 L 280 290 C 280 290, 240 270, 200 290 C 160 270, 120 290, 120 290 Z"
            fill="none" stroke="#ff5e6c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.5 }} />
          <motion.path d="M 200 130 L 200 290" fill="none" stroke="#ff5e6c" strokeWidth="4" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeInOut', delay: 1 }} />
          <motion.path d="M 140 160 L 180 170 M 140 190 L 180 200 M 140 220 L 170 230"
            fill="none" stroke="#a89880" strokeWidth="3" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ duration: 1, delay: 1.5 }} />
          <motion.path d="M 220 170 L 260 160 M 220 200 L 260 190 M 230 230 L 260 220"
            fill="none" stroke="#a89880" strokeWidth="3" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ duration: 1, delay: 1.7 }} />
          <motion.path d="M 260 80 C 280 100, 280 140, 250 160 C 240 140, 230 110, 260 80 Z"
            fill="#feb300" stroke="#1f1a14" strokeWidth="3" strokeLinejoin="round"
            initial={{ opacity: 0, y: -20, x: 20 }} animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ duration: 0.8, delay: 2, type: 'spring' }} />
          {[{ cx: 100, cy: 100, r: 3, delay: 2.4 }, { cx: 300, cy: 260, r: 4, delay: 2.5 },
            { cx: 130, cy: 300, r: 2.5, delay: 2.6 }, { cx: 280, cy: 90, r: 2, delay: 2.7 }].map((s, i) => (
            <motion.circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#ff5e6c"
              initial={{ scale: 0 }} animate={{ scale: [0, 1.5, 1] }}
              transition={{ duration: 0.6, delay: s.delay }} />
          ))}
        </svg>
      </div>
    </div>
  );
}
