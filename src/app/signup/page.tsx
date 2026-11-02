'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { PingueLogo } from '@/components/PingueLogo';
import { User, Mail, Lock, AlertCircle, ArrowLeft, Send, Check, Copy, ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { signup, generateTelegramLinkCode, linkCode } = useAppStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Steps: 'signup' -> 'check_email' | 'onboarding'
  const [step, setStep] = useState<'signup' | 'check_email' | 'onboarding'>('signup');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await signup(name.trim(), email.trim(), password);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create account.');
      } else if (res.requiresEmailConfirmation) {
        // Supabase requires email verification
        setStep('check_email');
      } else {
        // Active session exists, proceed to Telegram linking
        await generateTelegramLinkCode();
        setStep('onboarding');
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(`/start ${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleFinishOnboarding = () => {
    router.push('/');
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
          maxWidth: 460,
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
          {step === 'signup' ? (
            <Link href="/welcome" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
          ) : (
            <span style={{ fontSize: '0.78rem', color: 'var(--color-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {step === 'check_email' ? 'Verify Email' : 'Step 2 of 2'}
            </span>
          )}
          <PingueLogo size="sm" />
        </div>

        {step === 'signup' && (
          <>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--color-text-main)',
                letterSpacing: '-0.02em',
                marginBottom: 6,
              }}
            >
              Create Your Account
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: 24 }}>
              Start tracking renewals and automated reminder pings
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
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Your Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    color="var(--color-text-muted)"
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="e.g. Alex"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input"
                    style={{ paddingLeft: 40 }}
                    autoFocus
                    id="signup-name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Email Address
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
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input"
                    style={{ paddingLeft: 40 }}
                    id="signup-email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    color="var(--color-text-muted)"
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input"
                    style={{ paddingLeft: 40 }}
                    id="signup-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: 8 }}
                disabled={isSubmitting}
                id="signup-submit-btn"
              >
                {isSubmitting ? (
                  <span>Creating Account...</span>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#FFFFFF', fontWeight: 700, textDecoration: 'none' }}>
                Log in
              </Link>
            </div>
          </>
        )}

        {/* Step: Check Email (Verification link dispatched) */}
        {step === 'check_email' && (
          <div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: 'var(--color-accent-bg)',
                border: '1px solid var(--color-accent-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Mail size={24} color="var(--color-accent)" />
            </div>

            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: 'var(--color-text-main)',
                letterSpacing: '-0.02em',
                marginBottom: 8,
              }}
            >
              Check Your Email
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              We sent a confirmation link to <b style={{ color: '#FFFFFF' }}>{email}</b>. Click the verification link in that email to activate your account.
            </p>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                marginBottom: 24,
                fontSize: '0.82rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5,
              }}
            >
              Once confirmed, return to Pingue and log in to begin managing your bills and reminders.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                href="/login"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', textAlign: 'center', textDecoration: 'none' }}
              >
                Go to Log In
              </Link>
              <button
                type="button"
                onClick={() => setStep('signup')}
                className="btn btn-glass"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
              >
                Back to Sign Up
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Telegram Onboarding (when user has active session) */}
        {step === 'onboarding' && (
          <div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--color-accent-bg)',
                border: '1px solid var(--color-accent-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Send size={22} color="var(--color-accent)" />
            </div>

            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: 'var(--color-text-main)',
                letterSpacing: '-0.02em',
                marginBottom: 6,
              }}
            >
              Link Telegram Bot
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              Receive reminder alerts on Telegram and mark bills as paid in one tap by replying with an SMS or bill screenshot.
            </p>

            {linkCode && (
              <div
                style={{
                  padding: 18,
                  borderRadius: 16,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--glass-border)',
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Send this command to our Telegram Bot:
                </div>
                <div
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: 'var(--color-text-main)',
                    fontFamily: 'var(--font-mono)',
                    margin: '6px 0 12px 0',
                    letterSpacing: '0.05em',
                  }}
                >
                  /start {linkCode}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleCopyCode(linkCode)}
                    className="btn btn-sm btn-glass"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {copied ? <Check size={14} color="var(--color-paid)" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href={`https://t.me/Pingue1_bot?start=${linkCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
                  >
                    <span>Open Bot</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleFinishOnboarding}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                id="onboarding-continue-btn"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={handleFinishOnboarding}
                className="btn btn-glass"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                id="onboarding-skip-btn"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
