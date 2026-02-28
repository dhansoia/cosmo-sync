'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const emailRef    = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const email    = emailRef.current?.value.trim()    ?? '';
    const password = passwordRef.current?.value.trim() ?? '';

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const json = await res.json() as { error?: string; userId?: string };

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong');
        setLoading(false);
        return;
      }

      if (mode === 'register') {
        router.push('/onboarding');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch {
      setError('Network error — please try again');
      setLoading(false);
    }
  }

  const isLogin = mode === 'login';

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-up">

      {/* Glow accent */}
      <div className="
        absolute left-1/2 -translate-x-1/2 -translate-y-8
        w-64 h-32 rounded-full
        bg-violet-600/20 blur-3xl pointer-events-none
      " aria-hidden />

      {/* Card */}
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden">

        {/* Subtle top gradient stripe */}
        <div className="h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="p-8 space-y-5"
        >
          {/* Heading */}
          <div className="space-y-1 mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-white/40 text-sm">
              {isLogin
                ? 'Sign in to continue your cosmic journey'
                : 'Begin your astrological journey'}
            </p>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-white/35 text-xs uppercase tracking-widest font-medium">
              Email
            </label>
            <input
              ref={emailRef}
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="
                w-full rounded-xl border border-white/10 bg-white/[0.06]
                px-4 py-3 text-sm text-white placeholder-white/20
                focus:outline-none focus:border-violet-400/50 focus:bg-white/[0.08]
                transition-colors
              "
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-white/35 text-xs uppercase tracking-widest font-medium">
              Password
            </label>
            <input
              ref={passwordRef}
              type="password"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder={isLogin ? '••••••••' : 'Min. 8 characters'}
              minLength={isLogin ? 1 : 8}
              className="
                w-full rounded-xl border border-white/10 bg-white/[0.06]
                px-4 py-3 text-sm text-white placeholder-white/20
                focus:outline-none focus:border-violet-400/50 focus:bg-white/[0.08]
                transition-colors
              "
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3">
              <span className="text-red-400 text-sm leading-relaxed">{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full mt-2 py-3 rounded-xl text-sm font-semibold
              bg-white text-black
              hover:bg-white/92 active:bg-white/85
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all shadow-lg shadow-white/8
            "
          >
            {loading
              ? (isLogin ? 'Signing in…' : 'Creating account…')
              : (isLogin ? 'Sign in' : 'Create account')}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-white/20 text-xs">or</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          {/* Toggle */}
          <p className="text-center text-white/35 text-sm">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link
              href={isLogin ? '/register' : '/login'}
              className="text-white/65 hover:text-white underline underline-offset-2 transition-colors"
            >
              {isLogin ? 'Register' : 'Sign in'}
            </Link>
          </p>
        </form>

        {/* Bottom gradient stripe */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />
      </div>
    </div>
  );
}
