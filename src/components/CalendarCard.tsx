'use client';

import React, { useState, useMemo } from 'react';
import { Bill } from '@/lib/types';
import { CategoryIcon } from './CategoryIcon';
import { ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';

interface CalendarCardProps {
  bills: Bill[];
  onPayClick: (bill: Bill) => void;
}

export function CalendarCard({ bills, onPayClick }: CalendarCardProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayBills, setSelectedDayBills] = useState<{ date: string; bills: Bill[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Bills grouped by due date string 'YYYY-MM-DD'
  const billsByDate = useMemo(() => {
    const map = new Map<string, Bill[]>();
    for (const b of bills) {
      if (b.status === 'active' && b.next_due_date) {
        const list = map.get(b.next_due_date) || [];
        list.push(b);
        map.set(b.next_due_date, list);
      }
    }
    return map;
  }, [bills]);

  // Check if 3 or more bills fall within 48 hours of today
  const billsIn48HoursCount = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    end48h.setHours(23, 59, 59, 999);

    let count = 0;
    for (const b of bills) {
      if (b.status === 'active' && b.next_due_date) {
        const d = new Date(b.next_due_date);
        if (d >= now && d <= end48h) {
          count++;
        }
      }
    }
    return count;
  }, [bills]);

  // Calendar matrix calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun

  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayBills(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayBills(null);
  };

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
      {/* Header: Title, 48h note, & Month switch arrows */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
              Renewal Calendar
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              {monthLabel}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={prevMonth}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: 8,
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextMonth}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: 8,
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 48-Hour Alert Note if 3 or more bills fall within 48h */}
        {billsIn48HoursCount >= 3 && (
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 10,
              background: 'var(--color-due-soon-bg)',
              border: '1px solid var(--color-due-soon-border)',
              color: 'var(--color-due-soon)',
              fontSize: '0.76rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 12,
            }}
          >
            <AlertCircle size={13} />
            <span>{billsIn48HoursCount} bills due within 48 hours</span>
          </div>
        )}

        {/* Day of Week Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', marginBottom: 6 }}>
          {daysOfWeek.map((d, i) => (
            <span key={i} style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>
              {d}
            </span>
          ))}
        </div>

        {/* Month Day Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {/* Leading empty cells */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} style={{ height: 34 }} />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const dayBills = billsByDate.get(dateStr) || [];
            const hasBills = dayBills.length > 0;

            // Determine dot color: red if overdue, amber if due within 3 days, green if paid/normal
            let dotColor = '#34D399'; // green paid/scheduled
            if (hasBills) {
              if (dateStr < todayStr) {
                dotColor = '#F43F5E'; // red overdue
              } else {
                const diffDays = Math.ceil((new Date(dateStr).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24));
                if (diffDays <= 3) {
                  dotColor = '#FBBF24'; // amber due soon
                }
              }
            }

            const isSelected = selectedDayBills?.date === dateStr;

            return (
              <button
                key={dayNum}
                onClick={() => {
                  if (hasBills) {
                    setSelectedDayBills(isSelected ? null : { date: dateStr, bills: dayBills });
                  } else {
                    setSelectedDayBills(null);
                  }
                }}
                style={{
                  height: 34,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  border: isToday
                    ? '1px solid #FFFFFF'
                    : isSelected
                    ? '1px solid var(--color-accent)'
                    : '1px solid transparent',
                  background: isSelected
                    ? 'var(--color-accent-bg)'
                    : isToday
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'transparent',
                  color: isToday ? '#FFFFFF' : 'var(--color-text-main)',
                  cursor: hasBills ? 'pointer' : 'default',
                  position: 'relative',
                  fontWeight: isToday ? 800 : 500,
                  fontSize: '0.82rem',
                  padding: 2,
                }}
              >
                <span>{dayNum}</span>
                {hasBills && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      backgroundColor: dotColor,
                      boxShadow: `0 0 6px ${dotColor}`,
                      marginTop: 1,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspection Panel (Part 4 requirement: opens a small panel listing day's bills with Paid button) */}
      {selectedDayBills && (
        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--glass-border)',
            animation: 'pageEnter 0.15s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Due on {selectedDayBills.date}
            </span>
            <button
              onClick={() => setSelectedDayBills(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              Close
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedDayBills.bills.map((b) => (
              <div
                key={b.bill_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.03)',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                  <CategoryIcon category={b.category} showTile size={14} />
                  <span
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: 'var(--color-text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {b.name}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-text-main)' }}>
                    ₹{b.amount.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => onPayClick(b)}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', gap: 4 }}
                  >
                    <Check size={12} strokeWidth={2.8} />
                    <span>Paid</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
