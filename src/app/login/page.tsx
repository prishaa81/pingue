'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { PingueLogo } from '@/components/PingueLogo';
import { LogIn, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggedIn, isLoading } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace('/');
    }
  }, [isLoggedIn, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid email or password.');
      } else {
        router.push('/');
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: 440,
          width: '100%',
          padding: '40px 32px',
          borderRadius: 24,
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--glass-shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <Link href="/welcome" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>
          <PingueLogo size="sm" />
        </div>

        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--color-text-main)',
            letterSpacing: '-0.02em',
            marginBottom: 6,
          }}
        >
          Welcome Back
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: 24 }}>
          Log in to manage your bills and reminders
        </p>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'var(--color-overdue-bg)',
              border: '1px solid var(--color-overdue-border)',
              color: 'var(--color-overdue)',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                color="var(--color-text-muted)"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: 40 }}
                autoFocus
                id="login-email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Password
              </label>
              <Link
                href="/forgot-password"
                style={{ fontSize: '0.78rem', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="var(--color-text-muted)"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: 40 }}
                id="login-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: 8 }}
            disabled={isSubmitting}
            id="login-submit-btn"
          >
            {isSubmitting ? (
              <span>Signing in...</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LogIn size={16} />
                <span>Log In</span>
              </span>
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#FFFFFF', fontWeight: 700, textDecoration: 'none' }}>
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
