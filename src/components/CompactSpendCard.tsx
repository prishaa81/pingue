'use client';

import React, { useMemo } from 'react';
import { Payment } from '@/lib/types';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CompactSpendCardProps {
  payments: Payment[];
}

export function CompactSpendCard({ payments }: CompactSpendCardProps) {
  // Compute spend for the last 6 months
  const monthlyData = useMemo(() => {
    const months: { key: string; label: string; amount: number; isCurrent: boolean }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      const isCurrent = i === 0;

      const total = payments
        .filter((p) => p.paid_date && p.paid_date.startsWith(key))
        .reduce((sum, p) => sum + p.amount_paid, 0);

      months.push({ key, label, amount: total, isCurrent });
    }

    const maxVal = Math.max(...months.map((m) => m.amount), 1);
    const currentMonthSpend = months[months.length - 1]?.amount || 0;

    return { months, maxVal, currentMonthSpend };
  }, [payments]);

  return (
    <div
      className="glass-card"
      style={{
        padding: '20px 22px',
        borderRadius: 22,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
              Monthly Spend
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
              Past 6 months
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              ₹{monthlyData.currentMonthSpend.toLocaleString('en-IN')}
            </span>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              This month
            </span>
          </div>
        </div>

        {/* 6-month bar chart: current month in white (#FFFFFF), others in mid-grey (#71717A) */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 110, padding: '8px 4px 0' }}>
          {monthlyData.months.map((m) => {
            const heightPct = Math.max(12, Math.round((m.amount / monthlyData.maxVal) * 100));
            const barColor = m.isCurrent ? '#FFFFFF' : '#71717A';

            return (
              <div
                key={m.key}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${heightPct}%`,
                    borderRadius: '6px 6px 2px 2px',
                    background: barColor,
                    boxShadow: m.isCurrent ? '0 0 12px rgba(255, 255, 255, 0.3)' : 'none',
                    transition: 'height 0.3s ease',
                  }}
                  title={`${m.label}: ₹${m.amount.toLocaleString('en-IN')}`}
                />
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: m.isCurrent ? 800 : 500,
                    color: m.isCurrent ? '#FFFFFF' : 'var(--color-text-secondary)',
                  }}
                >
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
          Detailed charts &amp; split
        </span>
        <Link
          href="/history"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--color-text-main)',
            textDecoration: 'none',
          }}
        >
          <span>View History</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
