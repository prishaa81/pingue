'use client';

import React from 'react';
import { Bill } from '@/lib/types';
import { CategoryIcon } from './CategoryIcon';
import { Check, Clock, AlertTriangle } from 'lucide-react';

interface HeroDueCardProps {
  bill: Bill | null;
  onPayClick: (bill: Bill) => void;
}

export function HeroDueCard({ bill, onPayClick }: HeroDueCardProps) {
  if (!bill) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '28px 24px',
          borderRadius: 22,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'var(--color-paid-bg)',
            border: '1px solid var(--color-paid-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={24} color="#34D399" strokeWidth={2.5} />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
          All caught up!
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: 300 }}>
          No upcoming bills due right now. You are completely on track with your renewals.
        </p>
      </div>
    );
  }

  // Calculate days remaining
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = bill.next_due_date ? new Date(bill.next_due_date) : today;
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const maxWindow = 14;
  const progressRatio = Math.max(0, Math.min(1, (maxWindow - Math.max(0, daysDiff)) / maxWindow));
  const strokeDashoffset = 100 - progressRatio * 100;

  const isOverdue = daysDiff < 0 || bill.status === 'ignored';
  const isDueToday = !isOverdue && daysDiff === 0;
  const isDueSoon = !isOverdue && daysDiff > 0 && daysDiff <= 3;

  // Ring stroke color: status color if flagged, purple for normal upcoming
  const ringColor = isOverdue
    ? '#F43F5E'
    : isDueToday || isDueSoon
    ? '#FBBF24'
    : '#A78BFA'; // purple accent for normal upcoming state

  return (
    <div
      className={`glass-card glass-card-interactive ${isOverdue ? 'glass-card-overdue' : ''}`}
      style={{
        padding: '24px 28px',
        borderRadius: 22,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      {/* Top Header: Label & Progress Ring */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--color-text-muted)',
              }}
            >
              DUE NEXT
            </span>

            {/* Requirement 2: Status chips with 15% opacity bg, 30% border, full color text/icon */}
            {isOverdue && (
              <span className="status-chip status-chip-overdue">
                <AlertTriangle size={12} strokeWidth={2.5} />
                <span>{Math.abs(daysDiff) > 0 ? `${Math.abs(daysDiff)}d Overdue` : 'Overdue'}</span>
              </span>
            )}
            {isDueToday && (
              <span className="status-chip status-chip-due-today">
                <Clock size={12} strokeWidth={2.5} />
                <span>Due Today</span>
              </span>
            )}
            {!isOverdue && !isDueToday && isDueSoon && (
              <span className="status-chip status-chip-due-soon">
                <Clock size={12} strokeWidth={2.5} />
                <span>Due in {daysDiff}d</span>
              </span>
            )}
            {!isOverdue && !isDueToday && !isDueSoon && (
              <span className="status-chip status-chip-neutral">
                <Clock size={12} />
                <span>In {daysDiff} days</span>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Grey glass tile with white icon */}
            <CategoryIcon category={bill.category} showTile size={22} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: 'var(--color-text-main)',
                  letterSpacing: '-0.025em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                }}
                title={bill.name}
              >
                {bill.name}
              </h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                Due on {bill.next_due_date}
              </span>
            </div>
          </div>
        </div>

        {/* Circular Days Progress Ring */}
        <div style={{ position: 'relative', width: 62, height: 62, flexShrink: 0 }}>
          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="3.2"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={ringColor}
              strokeWidth="3.2"
              strokeDasharray="100, 100"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
              {isOverdue ? `-${Math.abs(daysDiff)}` : daysDiff}
            </span>
            <span style={{ fontSize: '0.58rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              days
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Amount in large bold numerals & solid white "Tap to Pay" button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingTop: 16,
          borderTop: '1px solid var(--glass-border)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>
            AMOUNT DUE
          </span>
          <span
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              color: 'var(--color-text-main)',
              letterSpacing: '-0.03em',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ₹{bill.amount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Primary solid white button with black text (Requirement 1 & 2) */}
        <button
          onClick={() => onPayClick(bill)}
          className="btn btn-primary"
          style={{
            padding: '10px 22px',
            fontSize: '0.925rem',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          id={`hero-pay-${bill.bill_id}`}
        >
          <Check size={18} strokeWidth={2.5} />
          <span>Tap to Pay</span>
        </button>
      </div>
    </div>
  );
}
