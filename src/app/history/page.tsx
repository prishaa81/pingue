'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { CategoryIcon } from '@/components/CategoryIcon';
import { exportPaymentsToCSV } from '@/lib/export';
import { BillCategory } from '@/lib/types';
import { CATEGORY_META } from '@/lib/constants';
import {
  Search,
  Trash2,
  FileSpreadsheet,
  ChevronDown,
  TrendingUp,
  BarChart3,
  PieChart,
} from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { payments, deletePayment, showToast, isLoggedIn, isLoading } = useAppStore();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/welcome');
    }
  }, [isLoading, isLoggedIn, router]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract unique available months from payments
  const availableMonths = useMemo(() => {
    return Array.from(
      new Set(payments.map((p) => (p.paid_date ? p.paid_date.slice(0, 7) : '')))
    ).filter(Boolean).sort().reverse();
  }, [payments]);

  // Filter payments by search query, selected month, and category
  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        (p.bill_name || '').toLowerCase().includes(q) ||
        (p.txn_ref || '').toLowerCase().includes(q) ||
        (p.bill_category || '').toLowerCase().includes(q);
      const matchesMonth = selectedMonth === 'all' || (p.paid_date && p.paid_date.startsWith(selectedMonth));
      const matchesCategory = selectedCategory === 'all' || p.bill_category === selectedCategory;
      return matchesQuery && matchesMonth && matchesCategory;
    });
  }, [payments, searchQuery, selectedMonth, selectedCategory]);

  const totalFilteredAmount = useMemo(() => {
    return filtered.reduce((acc, p) => acc + p.amount_paid, 0);
  }, [filtered]);

  // Part 9: Monthly totals calculation for detailed bar chart
  const monthlyTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of payments) {
      if (p.paid_date) {
        const key = p.paid_date.slice(0, 7);
        map.set(key, (map.get(key) || 0) + p.amount_paid);
      }
    }
    const keys = Array.from(map.keys()).sort();
    const maxVal = Math.max(...Array.from(map.values()), 1);
    return { keys, map, maxVal };
  }, [payments]);

  // Part 9: Split by bill type/category in greys and white
  const categorySplit = useMemo(() => {
    const map = new Map<BillCategory, { amount: number; count: number }>();
    let total = 0;

    for (const p of filtered) {
      const cat = (p.bill_category || 'other') as BillCategory;
      const cur = map.get(cat) || { amount: 0, count: 0 };
      cur.amount += p.amount_paid;
      cur.count += 1;
      map.set(cat, cur);
      total += p.amount_paid;
    }

    const items = Array.from(map.entries())
      .map(([cat, data]) => ({
        category: cat,
        amount: data.amount,
        count: data.count,
        percent: total > 0 ? Math.round((data.amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { items, total };
  }, [filtered]);

  const handleExport = () => {
    if (filtered.length === 0) {
      showToast('No payments to export for this selection', 'info');
      return;
    }
    exportPaymentsToCSV(filtered);
    showToast(`Exported ${filtered.length} payment records`, 'success');
  };

  const MONO_GREYS = ['#FFFFFF', '#D4D4D8', '#A1A1AA', '#71717A', '#52525B', '#3F3F46'];

  if (isLoading) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Loading history...
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 100px 16px' }}>
      {/* Top Header: Title, Total, & Export to CSV */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
            Payment History &amp; Analytics
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Showing {filtered.length} of {payments.length} transactions · Total Paid:{' '}
            <span style={{ color: '#FFFFFF', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              ₹{totalFilteredAmount.toLocaleString('en-IN')}
            </span>
          </p>
        </div>

        {/* Part 9 requirement: Put the "Export to Excel/CSV" button here */}
        <button
          onClick={handleExport}
          className="btn btn-glass"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          id="export-csv-btn"
        >
          <FileSpreadsheet size={16} color="#FFFFFF" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Part 9: Larger Spend Charts (Monthly Totals & Split by Bill Type in greys and white) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Chart 1: Monthly Totals Bar Chart */}
        <div className="glass-card" style={{ padding: 22, borderRadius: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart3 size={18} color="#FFFFFF" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              Monthly Spend Comparison
            </h3>
          </div>

          {monthlyTotals.keys.length === 0 ? (
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '36px 0' }}>
              No payments logged yet to compare.
            </p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140, padding: '10px 4px 0' }}>
              {monthlyTotals.keys.map((k, idx) => {
                const amt = monthlyTotals.map.get(k) || 0;
                const heightPct = Math.max(14, Math.round((amt / monthlyTotals.maxVal) * 100));
                const isLatest = idx === monthlyTotals.keys.length - 1;
                const label = new Date(k + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });

                return (
                  <div
                    key={k}
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
                    <span style={{ fontSize: '0.72rem', color: isLatest ? '#FFFFFF' : 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      ₹{amt > 999 ? `${Math.round(amt / 1000)}k` : amt}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        borderRadius: '6px 6px 2px 2px',
                        background: isLatest ? '#FFFFFF' : '#71717A',
                        boxShadow: isLatest ? '0 0 14px rgba(255, 255, 255, 0.25)' : 'none',
                        transition: 'height 0.3s ease',
                      }}
                      title={`${label}: ₹${amt.toLocaleString('en-IN')}`}
                    />
                    <span style={{ fontSize: '0.72rem', color: isLatest ? '#FFFFFF' : 'var(--color-text-secondary)', fontWeight: isLatest ? 700 : 500 }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 2: Split by Bill Type (in greys and white) */}
        <div className="glass-card" style={{ padding: 22, borderRadius: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <PieChart size={18} color="#FFFFFF" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              Spend by Bill Category
            </h3>
          </div>

          {categorySplit.items.length === 0 ? (
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '36px 0' }}>
              No payments for this timeframe.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Stacked Progress Bar */}
              <div style={{ display: 'flex', height: 10, borderRadius: 9999, overflow: 'hidden', background: 'rgba(255, 255, 255, 0.08)' }}>
                {categorySplit.items.map((item, idx) => (
                  <div
                    key={item.category}
                    style={{
                      width: `${item.percent}%`,
                      height: '100%',
                      background: MONO_GREYS[idx % MONO_GREYS.length],
                    }}
                    title={`${item.category}: ${item.percent}%`}
                  />
                ))}
              </div>

              {/* Category Breakdown List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {categorySplit.items.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.category}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: MONO_GREYS[idx % MONO_GREYS.length],
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>
                        {CATEGORY_META[item.category]?.label || item.category}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
                        ({item.count} bill{item.count > 1 ? 's' : ''})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.76rem' }}>
                        {item.percent}%
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-main)', fontFamily: 'var(--font-mono)' }}>
                        ₹{item.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Toolbar: Search bar + Month Dropdown + Category Filter */}
      <div
        className="glass-card"
        style={{
          padding: '12px 16px',
          borderRadius: 18,
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search Input */}
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <Search
            size={16}
            color="var(--color-text-muted)"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search by bill, category, or transaction ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input"
            style={{ paddingLeft: 38, height: 42, fontSize: '0.88rem' }}
          />
        </div>

        {/* Month Picker Dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="glass-input"
            style={{
              paddingRight: 32,
              height: 42,
              fontSize: '0.84rem',
              cursor: 'pointer',
              appearance: 'none',
              minWidth: 150,
            }}
          >
            <option value="all" style={{ background: '#18181B', color: '#FFF' }}>All Months</option>
            {availableMonths.map((m) => (
              <option key={m} value={m} style={{ background: '#18181B', color: '#FFF' }}>
                {new Date(m + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            color="var(--color-text-secondary)"
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="glass-card" style={{ padding: 20, borderRadius: 22 }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
            No transaction records found matching your filters.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((p) => (
              <div
                key={p.payment_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                  <CategoryIcon category={p.bill_category || 'other'} showTile size={18} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.bill_name || 'Bill Payment'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{p.paid_date}</span>
                      <span>·</span>
                      <span style={{ textTransform: 'capitalize' }}>via {p.source}</span>
                      {p.txn_ref && (
                        <>
                          <span>·</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                            {p.txn_ref}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-paid)', fontFamily: 'var(--font-mono)' }}>
                    ₹{p.amount_paid.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => deletePayment(p.payment_id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 6,
                    }}
                    title="Delete Payment Record"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
