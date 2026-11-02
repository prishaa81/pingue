'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { PingueLogo } from '@/components/PingueLogo';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPasswordForEmail } = useAppStore();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await resetPasswordForEmail(email.trim());
      if (res.success) {
        setSentSuccess(true);
      } else {
        setErrorMsg(res.error || 'Failed to send reset link.');
      }
    } catch {
      setErrorMsg('Error requesting password reset.');
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
          <Link href="/login" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            <ArrowLeft size={16} />
            <span>Back to Log in</span>
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
          Reset Password
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: 24 }}>
          Enter your email and we&apos;ll send you a password reset link
        </p>

        {sentSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={48} color="var(--color-paid)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 8 }}>
              Check your inbox
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 24 }}>
              We have sent a password reset link to <strong style={{ color: 'var(--color-text-main)' }}>{email}</strong>.
            </p>
            <Link href="/login" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
              Return to Log in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

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
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                  style={{ paddingLeft: 40 }}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: 8 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
