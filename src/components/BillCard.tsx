'use client';

import React, { useState } from 'react';
import { Bill } from '@/lib/types';
import { CategoryIcon } from './CategoryIcon';
import { Check, Clock, AlertTriangle, Pause, Play, Trash2, Edit2, MoreVertical } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface BillCardProps {
  bill: Bill;
  onPayClick: (bill: Bill) => void;
  onEditClick?: (bill: Bill) => void;
}

export function BillCard({ bill, onPayClick, onEditClick }: BillCardProps) {
  const { togglePauseBill, deleteBill } = useAppStore();
  const [showMenu, setShowMenu] = useState(false);

  // Compute status and days difference
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = bill.next_due_date ? new Date(bill.next_due_date) : null;
  if (due) due.setHours(0, 0, 0, 0);

  let daysDiff = 999;
  if (due) {
    const diffTime = due.getTime() - today.getTime();
    daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const isPaused = bill.status === 'paused';
  // Requirement 3: "Bills with ignored alerts stay under Active with an Overdue chip."
  const isOverdue = !isPaused && (daysDiff < 0 || bill.status === 'ignored');
  const isDueToday = !isPaused && !isOverdue && daysDiff === 0;
  const isDueSoon = !isPaused && !isOverdue && daysDiff > 0 && daysDiff <= 3;

  const cycleText =
    bill.cycle_type === 'days'
      ? `Every ${bill.cycle_value}d`
      : bill.cycle_type === 'months'
      ? bill.cycle_value === 1
        ? 'Monthly'
        : `Every ${bill.cycle_value}m`
      : 'One-time';

  // Part 6: Paid button is disabled until reminder window opens
  const remindLeadDays = (bill.remind_days || '3,1,0')
    .split(',')
    .map((d) => parseInt(d.trim(), 10))
    .filter((n) => !isNaN(n));
  const maxRemindWindow = Math.max(3, ...(remindLeadDays.length > 0 ? remindLeadDays : [3]));
  const isPaidRecently = Boolean(bill.last_paid_date && daysDiff > maxRemindWindow);

  const formattedLastPaid = bill.last_paid_date
    ? `Paid ${new Date(bill.last_paid_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : null;

  return (
    <div
      className={`glass-card glass-card-interactive bill-card ${isOverdue ? 'glass-card-overdue' : ''}`}
      style={{
        padding: '18px 20px',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 14,
        opacity: isPaused ? 0.65 : 1,
      }}
    >
      {/* Top Header: Category Tile + Name + Action Menu */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          {/* Requirement 1 & 3: Icon tile in rounded grey glass tile with white icon */}
          <CategoryIcon category={bill.category} showTile size={20} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--color-text-main)',
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={bill.name}
            >
              {bill.name}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span className="status-chip status-chip-neutral" style={{ fontSize: '0.68rem', padding: '1px 8px' }}>
                {cycleText}
              </span>
              {isPaused && (
                <span className="status-chip status-chip-neutral" style={{ fontSize: '0.68rem', padding: '1px 8px' }}>
                  Paused
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Menu (Pause or Resume, Edit, Delete - Requirement 3) */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
            }}
            title="Options"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: 28,
                right: 0,
                width: 145,
                background: 'rgba(20, 20, 22, 0.98)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                zIndex: 20,
                padding: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <button
                onClick={() => {
                  togglePauseBill(bill.bill_id);
                  setShowMenu(false);
                }}
                className="btn btn-sm"
                style={{
                  justifyContent: 'flex-start',
                  background: 'transparent',
                  color: 'var(--color-text-main)',
                  padding: '6px 10px',
                }}
              >
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                onClick={() => {
                  onEditClick?.(bill);
                  setShowMenu(false);
                }}
                className="btn btn-sm"
                style={{
                  justifyContent: 'flex-start',
                  background: 'transparent',
                  color: 'var(--color-text-main)',
                  padding: '6px 10px',
                }}
              >
                <Edit2 size={14} />
                <span>Edit</span>
              </button>

              <button
                onClick={() => {
                  deleteBill(bill.bill_id);
                  setShowMenu(false);
                }}
                className="btn btn-sm"
                style={{
                  justifyContent: 'flex-start',
                  background: 'transparent',
                  color: 'var(--color-overdue)',
                  padding: '6px 10px',
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Optional Instructions / Notes (User requested: lets them add instructions/description) */}
      {bill.notes && (
        <div
          style={{
            padding: '7px 10px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            fontSize: '0.78rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
          title={bill.notes}
        >
          <span style={{ color: 'var(--color-accent)', fontWeight: 600, marginRight: 5 }}>Note:</span>
          {bill.notes}
        </div>
      )}

      {/* Due Date Indicator with Solid Status Chips (Requirement 2 & 3) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block' }}>
            NEXT DUE
          </span>
          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
            {bill.next_due_date || 'No due date'}
          </span>
        </div>

        <div>
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
          {isDueSoon && (
            <span className="status-chip status-chip-due-soon">
              <Clock size={12} strokeWidth={2.5} />
              <span>Due in {daysDiff}d</span>
            </span>
          )}
          {isPaidRecently && formattedLastPaid && (
            <span className="status-chip status-chip-paid">
              <Check size={12} strokeWidth={2.5} />
              <span>{formattedLastPaid}</span>
            </span>
          )}
          {!isOverdue && !isDueToday && !isDueSoon && !isPaidRecently && !isPaused && bill.next_due_date && (
            <span className="status-chip status-chip-neutral">
              <Clock size={12} />
              <span>In {daysDiff}d</span>
            </span>
          )}
        </div>
      </div>

      {/* Bottom: Amount in large numerals & solid white "Paid" button (disabled outside reminder window) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTop: '1px solid var(--glass-border)',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--color-text-main)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ₹{bill.amount.toLocaleString('en-IN')}
          </span>
        </div>

        <button
          onClick={() => !isPaidRecently && onPayClick(bill)}
          disabled={isPaidRecently}
          className="btn btn-primary btn-sm"
          style={{
            padding: '7px 16px',
            borderRadius: 10,
            opacity: isPaidRecently ? 0.4 : 1,
            cursor: isPaidRecently ? 'default' : 'pointer',
            background: isPaidRecently ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
            color: isPaidRecently ? 'var(--color-text-secondary)' : '#0A0A0B',
          }}
          id={`bill-pay-btn-${bill.bill_id}`}
          title={isPaidRecently ? 'Paid for current cycle. Disabled until reminder window opens.' : 'Mark as paid'}
        >
          <Check size={14} strokeWidth={2.8} />
          <span>Paid</span>
        </button>
      </div>

      <style jsx>{`
        .bill-card:hover {
          border-color: rgba(167, 139, 250, 0.28) !important;
        }
      `}</style>
    </div>
  );
}
