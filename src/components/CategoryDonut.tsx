'use client';

import React, { useState, useEffect } from 'react';
import { Payment, BillCategory } from '@/lib/types';
import { CATEGORY_META } from '@/lib/constants';

interface CategoryDonutProps {
  payments: Payment[];
}

// High-contrast monochrome palette designed for dark background
// Ordered from brightest to distinct visible greys (all > 4.5:1 contrast against dark background)
const CONTRAST_MONO_SHADES = [
  '#FFFFFF', // 100% luminance - Pure White (largest segment)
  '#D4D4D8', // 84% luminance - Bright Silver Zinc
  '#A1A1AA', // 68% luminance - Crisp Medium Zinc
  '#8E8E93', // 55% luminance - Cool Platinum
  '#71717A', // 46% luminance - Solid Visible Grey
  '#5C5C66', // 38% luminance - Muted Slate with border
];

export function CategoryDonut({ payments }: CategoryDonutProps) {
  const [activeCategory, setActiveCategory] = useState<BillCategory | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>('');

  useEffect(() => {
    setCurrentMonth(new Date().toISOString().slice(0, 7));
  }, []);

  // Filter payments for current calendar month
  const currentPayments = currentMonth
    ? payments.filter((p) => p.paid_date && p.paid_date.startsWith(currentMonth))
    : payments;
  const fallbackPayments = currentPayments.length > 0 ? currentPayments : payments;

  const totalSpent = fallbackPayments.reduce((acc, p) => acc + p.amount_paid, 0);

  // Group by category
  const categoryTotals: Record<string, number> = {};
  fallbackPayments.forEach((p) => {
    const cat = p.bill_category || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + p.amount_paid;
  });

  // Sort descending FIRST so the largest category gets the brightest, most visible color (#FFFFFF)
  const sortedEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  const slices = sortedEntries.map(([cat, amount], index) => {
    const category = cat as BillCategory;
    const meta = CATEGORY_META[category] || CATEGORY_META.other;
    const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
    return {
      category,
      amount,
      percentage,
      color: CONTRAST_MONO_SHADES[index % CONTRAST_MONO_SHADES.length],
      label: meta.label,
    };
  });

  // Calculate SVG stroke segments with clean separation gaps
  let cumulativePercentage = 0;
  const segments = slices.map((slice) => {
    // If more than 1 segment, leave a 1.2% gap between slices for crisp distinction
    const hasMultiple = slices.length > 1;
    const gap = hasMultiple ? 1.2 : 0;
    const arcLength = Math.max(0.5, slice.percentage - gap);
    const strokeDasharray = `${arcLength} ${100 - arcLength}`;
    const strokeDashoffset = -(cumulativePercentage + gap / 2);
    cumulativePercentage += slice.percentage;
    return {
      ...slice,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSlice = slices.find((s) => s.category === activeCategory) || null;

  return (
    <div
      className="glass-card"
      style={{
        padding: 22,
        borderRadius: 22,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
          Category Breakdown
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
          Spend distribution for this month
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', flex: 1 }}>
        {/* SVG Donut with high contrast distinct segments and precision gaps */}
        <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
          <svg viewBox="0 0 42 42" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            {/* Background Track */}
            <circle
              cx="21"
              cy="21"
              r="15.91549430918954"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="5"
            />
            {/* Slices with clean butt linecap and gaps */}
            {segments.map((seg) => {
              const isHovered = activeCategory === seg.category;
              return (
                <circle
                  key={seg.category}
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isHovered ? '6.8' : '5'}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="butt"
                  style={{
                    transition: 'stroke-width 0.18s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease',
                    cursor: 'pointer',
                    opacity: activeCategory && !isHovered ? 0.35 : 1,
                    filter: isHovered ? 'drop-shadow(0 0 4px rgba(255,255,255,0.4))' : 'none',
                  }}
                  onMouseEnter={() => setActiveCategory(seg.category)}
                  onMouseLeave={() => setActiveCategory(null)}
                />
              );
            })}
          </svg>

          {/* Center Info: Dynamic on hover */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 4,
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {activeSlice ? activeSlice.label.split(' ')[0] : 'TOTAL'}
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)', fontFamily: 'var(--font-mono)' }}>
              ₹{(activeSlice ? activeSlice.amount : totalSpent).toLocaleString('en-IN')}
            </span>
            {activeSlice && (
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                {Math.round(activeSlice.percentage)}%
              </span>
            )}
          </div>
        </div>

        {/* Legend in sorted high-contrast monochrome */}
        <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {slices.slice(0, 5).map((slice) => {
            const isHovered = activeCategory === slice.category;
            return (
              <div
                key={slice.category}
                onMouseEnter={() => setActiveCategory(slice.category)}
                onMouseLeave={() => setActiveCategory(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: 8,
                  background: isHovered ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  border: isHovered ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: slice.color,
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '0.82rem', color: isHovered ? '#FFFFFF' : 'var(--color-text-main)', fontWeight: isHovered ? 700 : 500 }}>
                    {slice.label}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-text-main)', fontFamily: 'var(--font-mono)' }}>
                    {Math.round(slice.percentage)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
