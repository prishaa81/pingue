'use client';

import React, { useState, useEffect } from 'react';
import { Payment } from '@/lib/types';

interface SpendChartProps {
  payments: Payment[];
}

interface MonthData {
  label: string;
  key: string;
  total: number;
}

export function SpendChart({ payments }: SpendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [months, setMonths] = useState<MonthData[]>([
    { label: 'May', key: '2026-05', total: 0 },
    { label: 'Jun', key: '2026-06', total: 0 },
    { label: 'Jul', key: '2026-07', total: 0 },
    { label: 'Aug', key: '2026-08', total: 0 },
    { label: 'Sep', key: '2026-09', total: 0 },
    { label: 'Oct', key: '2026-10', total: 0 },
  ]);

  useEffect(() => {
    const computed: MonthData[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      computed.push({ label: monthLabel, key: monthKey, total: 0 });
    }

    payments.forEach((p) => {
      const pMonth = p.paid_date ? p.paid_date.slice(0, 7) : '';
      const match = computed.find((m) => m.key === pMonth);
      if (match) {
        match.total += p.amount_paid;
      }
    });

    setMonths(computed);
  }, [payments]);

  const maxTotal = Math.max(...months.map((m) => m.total), 3000);
  const chartHeight = 140;
  const currentTotal = months.length > 0 ? months[months.length - 1].total : 0;

  return (
    <div
      className="glass-card"
      style={{
        padding: 22,
        borderRadius: 22,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            Monthly Spend Trend
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
            Past 6 months comparison
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
            ₹{currentTotal.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            this month
          </span>
        </div>
      </div>

      {/* SVG / HTML Bar Chart in Greys and White only (Requirement 1) */}
      <div style={{ height: chartHeight, position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 12, paddingBottom: 24 }}>
        {months.map((m, idx) => {
          const heightPercent = Math.max(10, Math.round((m.total / maxTotal) * 100));
          const isCurrent = idx === months.length - 1;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={m.key}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              {/* Tooltip on hover */}
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    top: -30,
                    padding: '3px 8px',
                    borderRadius: 8,
                    background: 'rgba(20, 20, 22, 0.96)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                  }}
                >
                  ₹{m.total.toLocaleString('en-IN')}
                </div>
              )}

              {/* Bar */}
              <div
                style={{
                  width: '100%',
                  height: `${heightPercent}%`,
                  borderRadius: '6px 6px 2px 2px',
                  background: isCurrent
                    ? 'var(--color-accent)'
                    : isHovered
                    ? '#D4D4D8'
                    : 'rgba(255, 255, 255, 0.18)',
                  transition: 'height 0.4s ease, background 0.15s ease',
                  boxShadow: isCurrent ? '0 0 16px rgba(167, 139, 250, 0.45)' : 'none',
                }}
              />

              {/* Month Label */}
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  fontSize: '0.72rem',
                  fontWeight: isCurrent ? 800 : 500,
                  color: isCurrent ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}
              >
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
