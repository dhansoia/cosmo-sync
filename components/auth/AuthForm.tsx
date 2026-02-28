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

      // After register → go to onboarding to collect birth data (if not already done)
      // After login    → go to home
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
    <div className="w-full max-w-sm mx-auto">

      {/* Card */}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 space-y-5"
      >
        <div className="space-y-1 mb-2">
          <h1 className="text-2xl font-bold text-white">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-white/35 text-sm">
            {isLogin
              ? 'Sign in to your CosmoSync account'
              : 'Start your astrological journey'}
          </p>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs uppercase tracking-widest">Email</label>
          <input
            ref={emailRef}
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              px-3.5 py-2.5 text-sm text-white placeholder-white/20
              focus:outline-none focus:border-white/30 focus:bg-white/8
              transition-colors
            "
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs uppercase tracking-widest">Password</label>
          <input
            ref={passwordRef}
            type="password"
            required
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            placeholder={isLogin ? '••••••••' : 'Min. 8 characters'}
            minLength={isLogin ? 1 : 8}
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              px-3.5 py-2.5 text-sm text-white placeholder-white/20
              focus:outline-none focus:border-white/30 focus:bg-white/8
              transition-colors
            "
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full py-3 rounded-xl text-sm font-semibold
            bg-white text-black hover:bg-white/90
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors shadow-lg shadow-white/10
          "
        >
          {loading
            ? (isLogin ? 'Signing in…' : 'Creating account…')
            : (isLogin ? 'Sign in' : 'Create account')}
        </button>

        {/* Toggle */}
        <p className="text-center text-white/30 text-sm">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link
            href={isLogin ? '/register' : '/login'}
            className="text-white/60 hover:text-white underline transition-colors"
          >
            {isLogin ? 'Register' : 'Sign in'}
          </Link>
        </p>
      </form>
    </div>
  );
}
