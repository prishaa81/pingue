'use client';

import React from 'react';
import Link from 'next/link';
import { PingueLogo } from '@/components/PingueLogo';
import { APP_TAGLINE } from '@/lib/brand';
import { ArrowRight, LogIn, Sparkles } from 'lucide-react';

export default function WelcomePage() {
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
          maxWidth: 480,
          width: '100%',
          padding: '48px 36px',
          textAlign: 'center',
          borderRadius: 28,
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: 'var(--glass-shadow)',
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <PingueLogo size="lg" />
        </div>

        {/* One bold line (Part 2 requirement) */}
        <h1
          style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            color: 'var(--color-text-main)',
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          {APP_TAGLINE}
        </h1>

        <p
          style={{
            fontSize: '0.94rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            marginBottom: 36,
            maxWidth: 380,
          }}
        >
          Automated renewal reminders, receipt scanning with Gemini AI, and one-tap payment logging directly through Telegram and the web.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <Link
            href="/signup"
            className="btn btn-primary"
            style={{
              padding: '14px 20px',
              fontSize: '1rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              textDecoration: 'none',
            }}
            id="welcome-signup-btn"
          >
            <span>Create account</span>
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>

          <Link
            href="/demo"
            className="btn btn-glass"
            style={{
              padding: '13px 20px',
              fontSize: '0.96rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              textDecoration: 'none',
              background: 'rgba(167, 139, 250, 0.08)',
              borderColor: 'var(--color-accent-border)',
              color: 'var(--color-text-main)',
            }}
            id="welcome-demo-btn"
          >
            <Sparkles size={16} color="var(--color-accent)" />
            <span>Try demo (no login required)</span>
          </Link>

          <Link
            href="/login"
            className="btn btn-glass"
            style={{
              padding: '13px 20px',
              fontSize: '0.96rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              textDecoration: 'none',
            }}
            id="welcome-login-btn"
          >
            <LogIn size={16} />
            <span>Log in</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
