'use client';

import React from 'react';
import { APP_NAME } from '@/lib/brand';

interface PingueLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function PingueLogo({ size = 'md', showTagline = false }: PingueLogoProps) {
  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  const fontSizes = {
    sm: '1.05rem',
    md: '1.25rem',
    lg: '1.85rem',
  };

  const currentIconSize = iconSizes[size];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size === 'sm' ? 8 : 10 }}>
      {/* Ping Motif: Clean white core dot with subtle concentric ripples */}
      <div
        style={{
          position: 'relative',
          width: currentIconSize,
          height: currentIconSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {/* Outer ripple */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        />

        {/* Inner ripple */}
        <div
          style={{
            position: 'absolute',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        />

        {/* Core solid white ping dot */}
        <div
          style={{
            width: '30%',
            height: '30%',
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.7)',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: fontSizes[size],
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#F5F5F6',
            lineHeight: 1.1,
          }}
        >
          {APP_NAME}
        </span>
        {showTagline && (
          <span style={{ fontSize: '0.78rem', color: '#9A9AA3', marginTop: 2 }}>
            Bills that ping before they&apos;re due
          </span>
        )}
      </div>
    </div>
  );
}
