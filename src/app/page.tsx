'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { HeroDueCard } from '@/components/HeroDueCard';
import { CalendarCard } from '@/components/CalendarCard';
import { CompactSpendCard } from '@/components/CompactSpendCard';
import { MarkPaidModal } from '@/components/MarkPaidModal';
import { Bill } from '@/lib/types';
import { AlertTriangle, Check, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading, bills, payments } = useAppStore();

  const [activePayBill, setActivePayBill] = useState<Bill | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [todayStr, setTodayStr] = useState<string>('');

  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0]);
  }, []);

  // Protect page: Redirect logged-out visitor to /welcome (Part 2 requirement)
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/welcome');
    }
  }, [isLoading, isLoggedIn, router]);

  // Find next due bill (earliest next_due_date among active bills)
  const activeBills = bills.filter((b) => b.status === 'active' && b.next_due_date);
  const sortedBills = [...activeBills].sort((a, b) => {
    return new Date(a.next_due_date!).getTime() - new Date(b.next_due_date!).getTime();
  });
  const nextDueBill = sortedBills[0] || null;

  // Find overdue bills
  const overdueBills = todayStr
    ? activeBills.filter((b) => b.next_due_date && b.next_due_date < todayStr)
    : [];
  const totalOverdueAmount = overdueBills.reduce((acc, b) => acc + b.amount, 0);

  // Calculate total paid this calendar month
  const currentMonth = todayStr ? todayStr.slice(0, 7) : '';
  const paidThisMonth = payments
    .filter((p) => p.paid_date && currentMonth && p.paid_date.startsWith(currentMonth))
    .reduce((acc, p) => acc + p.amount_paid, 0);

  const handlePayClick = (bill: Bill) => {
    setActivePayBill(bill);
    setIsPayModalOpen(true);
  };

  if (isLoading) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Loading dashboard...
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 100px 16px' }}>
      {/* Greeting Banner */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
          Hello, {user?.display_name || 'there'}
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
          {overdueBills.length > 0
            ? `You have ${overdueBills.length} bill${overdueBills.length > 1 ? 's' : ''} overdue for payment.`
            : 'All your recurring renewals are currently on track.'}
        </p>
      </div>

      {/* Part 4: Bento Grid with NO empty gaps at 360px, 768px, and 1280px widths */}
      <div className="bento-grid">
        {/* Row 1, Left: Due Next Card (Span 7 on desktop) */}
        <div className="bento-cell-hero">
          <HeroDueCard bill={nextDueBill} onPayClick={handlePayClick} />
        </div>

        {/* Row 1, Right: Overdue Card above Paid This Month Card (Span 5 on desktop) */}
        <div className="bento-cell-metrics-stack">
          {/* Overdue Card */}
          <div
            className={`glass-card ${overdueBills.length > 0 ? 'glass-card-overdue' : ''}`}
            style={{
              padding: '18px 20px',
              borderRadius: 20,
              flex: 1,
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>
                OVERDUE
              </span>
              {overdueBills.length > 0 ? (
                <span className="status-chip status-chip-overdue" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  <AlertTriangle size={12} strokeWidth={2.5} />
                  <span>Action Needed</span>
                </span>
              ) : (
                <span className="status-chip status-chip-paid" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  <Check size={12} strokeWidth={2.5} />
                  <span>All Clear</span>
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: overdueBills.length > 0 ? '#F43F5E' : 'var(--color-text-main)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                  {overdueBills.length}
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  {overdueBills.length > 0 ? `₹${totalOverdueAmount.toLocaleString('en-IN')} total` : '0 bills overdue'}
                </span>
              </div>

              {overdueBills.length > 0 && (
                <button
                  onClick={() => handlePayClick(overdueBills[0])}
                  className="btn btn-sm btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  Pay Now
                </button>
              )}
            </div>
          </div>

          {/* Paid This Month Card */}
          <div
            className="glass-card"
            style={{
              padding: '18px 20px',
              borderRadius: 20,
              flex: 1,
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>
                PAID THIS MONTH
              </span>
              <span className="status-chip status-chip-paid" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                <CheckCircle2 size={12} strokeWidth={2.5} />
                <span>On Track</span>
              </span>
            </div>

            <div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#34D399', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                ₹{paidThisMonth.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {payments.filter((p) => p.paid_date && currentMonth && p.paid_date.startsWith(currentMonth)).length} payments logged
              </span>
            </div>
          </div>
        </div>

        {/* Row 2, Left: Calendar Card (Span 7 on desktop) */}
        <div className="bento-cell-calendar">
          <CalendarCard bills={bills} onPayClick={handlePayClick} />
        </div>

        {/* Row 2, Right: Compact Spend Card (Span 5 on desktop) */}
        <div className="bento-cell-spend">
          <CompactSpendCard payments={payments} />
        </div>
      </div>

      {/* Interactive Mark as Paid Modal */}
      <MarkPaidModal
        bill={activePayBill}
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setActivePayBill(null);
        }}
      />

      <style jsx>{`
        .bento-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--gap-bento, 16px);
        }

        .bento-cell-hero,
        .bento-cell-metrics-stack,
        .bento-cell-calendar,
        .bento-cell-spend {
          grid-column: span 1;
          height: 100%;
        }

        .bento-cell-metrics-stack {
          display: flex;
          flex-direction: column;
          gap: var(--gap-bento, 16px);
          height: 100%;
        }

        /* Tablet Breakpoint (768px - 1023px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .bento-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .bento-cell-hero {
            grid-column: span 2;
          }
          .bento-cell-metrics-stack {
            grid-column: span 2;
            flex-direction: row;
          }
          .bento-cell-calendar {
            grid-column: span 2;
          }
          .bento-cell-spend {
            grid-column: span 2;
          }
        }

        /* Desktop Breakpoint (>= 1024px) */
        @media (min-width: 1024px) {
          .bento-grid {
            grid-template-columns: repeat(12, 1fr);
          }
          .bento-cell-hero {
            grid-column: span 7;
          }
          .bento-cell-metrics-stack {
            grid-column: span 5;
          }
          .bento-cell-calendar {
            grid-column: span 7;
          }
          .bento-cell-spend {
            grid-column: span 5;
          }
        }
      `}</style>
    </main>
  );
}
