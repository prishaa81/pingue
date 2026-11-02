'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Bill, Payment, BillCategory } from '@/lib/types';
import { getInitialDemoBills, getInitialDemoPayments } from '@/lib/demoData';
import { calculateNextDueDate } from '@/lib/store';
import { CATEGORY_META } from '@/lib/constants';
import { exportPaymentsToCSV } from '@/lib/export';
import { PingueLogo } from '@/components/PingueLogo';
import { HeroDueCard } from '@/components/HeroDueCard';
import { CalendarCard } from '@/components/CalendarCard';
import { CompactSpendCard } from '@/components/CompactSpendCard';
import { BillCard } from '@/components/BillCard';
import { CategoryIcon } from '@/components/CategoryIcon';
import { MarkPaidModal } from '@/components/MarkPaidModal';
import { AddBillModal } from '@/components/AddBillModal';
import { EditBillModal } from '@/components/EditBillModal';
import {
  LayoutGrid,
  CalendarDays,
  History,
  ShieldCheck,
  Plus,
  Search,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Headphones,
  Phone,
  Link2,
  FileText,
  ExternalLink,
  BarChart3,
  PieChart,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Same helper as real vault/page.tsx
function inferProvider(bill: Bill): string {
  if (bill.provider && bill.provider.trim()) return bill.provider.trim();
  const lower = bill.name.toLowerCase();
  if (lower.includes('tata power')) return 'Tata Power';
  if (lower.includes('bescom')) return 'BESCOM';
  if (lower.includes('adani')) return 'Adani';
  if (lower.includes('vi') || lower.includes('vodafone')) return 'Vi';
  if (lower.includes('airtel')) return 'Airtel';
  if (lower.includes('jio')) return 'Jio';
  if (lower.includes('act')) return 'ACT Fibernet';
  if (lower.includes('netflix')) return 'Netflix';
  if (lower.includes('spotify')) return 'Spotify';
  if (lower.includes('prime')) return 'Amazon Prime';
  if (lower.includes('gas') || lower.includes('mgl')) return 'Mahanagar Gas';
  if (lower.includes('water')) return 'Water Board';
  if (lower.includes('maintenance') || lower.includes('society')) return 'Society Maintenance';
  return bill.name;
}

export default function DemoPage() {
  // In-memory demo state (resets on refresh)
  const [demoBills, setDemoBills] = useState<Bill[]>([]);
  const [demoPayments, setDemoPayments] = useState<Payment[]>([]);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'bills' | 'history' | 'vault'>('dashboard');

  // Modals state
  const [activePayBill, setActivePayBill] = useState<Bill | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [activeEditBill, setActiveEditBill] = useState<Bill | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Bills tab state (mirrors real bills/page.tsx)
  const [billsActiveTab, setBillsActiveTab] = useState<'active' | 'paused'>('active');
  const [billsSearchQuery, setBillsSearchQuery] = useState('');

  // History tab state (mirrors real history/page.tsx)
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyMonth, setHistoryMonth] = useState('all');

  // Vault tab state (mirrors real vault/page.tsx)
  const [vaultSearchQuery, setVaultSearchQuery] = useState('');
  const [expandedVaultBills, setExpandedVaultBills] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Initialize in-memory sample data on mount
  useEffect(() => {
    setDemoBills(getInitialDemoBills());
    setDemoPayments(getInitialDemoPayments());
  }, []);

  const showDemoToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Dashboard metrics
  const activeBills = useMemo(() => demoBills.filter((b) => b.status === 'active' && b.next_due_date), [demoBills]);
  const sortedActiveBills = useMemo(() => {
    return [...activeBills].sort((a, b) => new Date(a.next_due_date!).getTime() - new Date(b.next_due_date!).getTime());
  }, [activeBills]);

  const nextDueBill = sortedActiveBills[0] || null;

  const overdueBills = useMemo(() => {
    return activeBills.filter((b) => b.next_due_date && b.next_due_date < todayStr);
  }, [activeBills, todayStr]);

  const totalOverdueAmount = useMemo(() => {
    return overdueBills.reduce((acc, b) => acc + b.amount, 0);
  }, [overdueBills]);

  const currentMonth = todayStr.slice(0, 7);
  const paidThisMonth = useMemo(() => {
    return demoPayments
      .filter((p) => p.paid_date && p.paid_date.startsWith(currentMonth))
      .reduce((acc, p) => acc + p.amount_paid, 0);
  }, [demoPayments, currentMonth]);

  // ── Bills tab computed (mirrors bills/page.tsx) ─────────────────────────
  const activeBillsList = useMemo(() => demoBills.filter((b) => b.status === 'active' || b.status === 'ignored'), [demoBills]);
  const pausedBillsList = useMemo(() => demoBills.filter((b) => b.status === 'paused'), [demoBills]);
  const currentBillsList = billsActiveTab === 'active' ? activeBillsList : pausedBillsList;
  const sortedBills = useMemo(() => [...currentBillsList].sort((a, b) => {
    if (!a.next_due_date) return 1;
    if (!b.next_due_date) return -1;
    return new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime();
  }), [currentBillsList]);
  const displayedBills = billsSearchQuery.trim()
    ? sortedBills.filter((b) => b.name.toLowerCase().includes(billsSearchQuery.toLowerCase()))
    : sortedBills;

  // ── History tab computed (mirrors history/page.tsx) ───────────────────────
  const availableHistoryMonths = useMemo(() =>
    Array.from(new Set(demoPayments.map((p) => p.paid_date?.slice(0, 7)).filter(Boolean))).sort().reverse() as string[],
  [demoPayments]);
  const filteredPayments = useMemo(() => demoPayments.filter((p) => {
    const q = historySearchQuery.toLowerCase();
    const matchQ = (p.bill_name || '').toLowerCase().includes(q) || (p.txn_ref || '').toLowerCase().includes(q);
    const matchM = historyMonth === 'all' || p.paid_date?.startsWith(historyMonth);
    return matchQ && matchM;
  }), [demoPayments, historySearchQuery, historyMonth]);
  const totalFilteredAmount = useMemo(() => filteredPayments.reduce((acc, p) => acc + p.amount_paid, 0), [filteredPayments]);
  const monthlyTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of demoPayments) { if (p.paid_date) { const k = p.paid_date.slice(0, 7); map.set(k, (map.get(k) || 0) + p.amount_paid); } }
    const keys = Array.from(map.keys()).sort();
    return { keys, map, maxVal: Math.max(...Array.from(map.values()), 1) };
  }, [demoPayments]);
  const MONO_GREYS = ['#FFFFFF', '#D4D4D8', '#A1A1AA', '#71717A', '#52525B', '#3F3F46'];
  const categorySplit = useMemo(() => {
    const map = new Map<BillCategory, { amount: number; count: number }>();
    let total = 0;
    for (const p of filteredPayments) {
      const cat = (p.bill_category || 'other') as BillCategory;
      const cur = map.get(cat) || { amount: 0, count: 0 };
      cur.amount += p.amount_paid; cur.count += 1; map.set(cat, cur); total += p.amount_paid;
    }
    return { items: Array.from(map.entries()).map(([category, d]) => ({ category, ...d, percent: total > 0 ? Math.round((d.amount / total) * 100) : 0 })).sort((a, b) => b.amount - a.amount) };
  }, [filteredPayments]);

  // ── Vault tab computed (mirrors vault/page.tsx) ───────────────────────────
  const filteredVaultBills = useMemo(() => {
    const q = vaultSearchQuery.toLowerCase();
    return demoBills.filter((b) => {
      const prov = inferProvider(b).toLowerCase();
      return b.name.toLowerCase().includes(q) || prov.includes(q) || (b.consumer_id && b.consumer_id.toLowerCase().includes(q));
    });
  }, [demoBills, vaultSearchQuery]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handlePayClick = (bill: Bill) => { setActivePayBill(bill); setIsPayModalOpen(true); };

  const executeMarkAsPaid = (billId: string, amountPaid: number, paidDate: string, txnRef?: string, validityDays?: number) => {
    const targetBill = demoBills.find((b) => b.bill_id === billId);
    if (!targetBill) return;
    const nextDate = calculateNextDueDate(targetBill.next_due_date || todayStr, targetBill.cycle_type, targetBill.cycle_value, validityDays);
    setDemoBills((prev) => prev.map((b) => b.bill_id === billId ? { ...b, next_due_date: nextDate, last_paid_date: paidDate, status: 'active' as const } : b));
    setDemoPayments((prev) => [{ payment_id: `demo-pay-${Date.now()}`, bill_id: billId, user_id: 'demo-user', amount_paid: amountPaid, paid_date: paidDate, bill_name: targetBill.name, bill_category: targetBill.category, source: 'web', input_type: txnRef ? 'sms' : 'form', txn_ref: txnRef || null, created_at: new Date().toISOString() }, ...prev]);
    try { confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 }, colors: ['#10B981', '#6EE7B7', '#34D399', '#A7F3D0', '#FFFFFF'] }); } catch {}
    showDemoToast(`Marked ${targetBill.name} as paid! Next due: ${nextDate || 'Completed'}`);
    setIsPayModalOpen(false);
  };

  // Copy helper
  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showDemoToast(`Copied "${text}"`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0A0A0B', color: '#F4F4F5' }}>
      {/* 1. Slim Demo Mode Top Banner (Part 3 requirement) */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(167, 139, 250, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
          borderBottom: '1px solid rgba(167, 139, 250, 0.4)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          position: 'sticky',
          top: 0,
          zIndex: 60,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: '#FFFFFF', fontWeight: 600 }}>
          <Sparkles size={16} color="#A78BFA" />
          <span>Demo mode: sample data, nothing is saved. Create account to use it for real.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/signup"
            className="btn btn-sm btn-primary"
            style={{ padding: '4px 12px', fontSize: '0.8rem', gap: 6, textDecoration: 'none' }}
          >
            <span>Create account</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/welcome"
            className="btn btn-sm btn-glass"
            style={{ padding: '4px 10px', fontSize: '0.78rem', textDecoration: 'none' }}
          >
            Exit
          </Link>
        </div>
      </div>

      {/* 2. Demo Navigation Header */}
      <header
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'rgba(10, 10, 11, 0.88)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 41,
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PingueLogo size="sm" />
            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 9999, background: 'rgba(167, 139, 250, 0.2)', border: '1px solid var(--color-accent-border)', color: 'var(--color-accent)', fontWeight: 700 }}>
              DEMO
            </span>
          </div>

          {/* 4 Navigation Tabs */}
          <nav
            style={{
              display: 'flex',
              gap: 4,
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '4px 6px',
              borderRadius: 9999,
              border: '1px solid var(--glass-border)',
            }}
          >
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
              { id: 'bills', label: 'Bills', icon: CalendarDays },
              { id: 'history', label: 'History', icon: History },
              { id: 'vault', label: 'Vault', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#0A0A0B' : 'var(--color-text-secondary)',
                    background: isActive ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={15} color={isActive ? '#0A0A0B' : 'currentColor'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-sm btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.82rem', gap: 5 }}
            >
              <Plus size={14} />
              <span>Add Bill</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 100,
            background: 'rgba(18, 18, 20, 0.95)',
            border: '1px solid var(--color-paid-border)',
            color: 'var(--color-paid)',
            padding: '10px 16px',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.86rem',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Check size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Container */}
      <main style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '24px 16px 100px 16px', flex: 1 }}>
        {/* ====================================================================== */}
        {/* TAB 1: DASHBOARD VIEW                                                  */}
        {/* ====================================================================== */}
        {currentTab === 'dashboard' && (
          <div>
            {/* Greeting */}
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
                Hello, Demo Explorer
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {overdueBills.length > 0
                  ? `You have ${overdueBills.length} bill overdue for payment. Tap "Mark Paid" to see the cycle advance.`
                  : 'All your recurring renewals are currently on track.'}
              </p>
            </div>

            {/* Bento Grid */}
            <div className="bento-grid">
              <div className="bento-cell-hero">
                <HeroDueCard bill={nextDueBill} onPayClick={handlePayClick} />
              </div>

              {/* Overdue & Paid this month stack */}
              <div className="bento-cell-metrics-stack">
                {/* Overdue Card */}
                <div
                  className={`glass-card ${overdueBills.length > 0 ? 'glass-card-overdue' : ''}`}
                  style={{ padding: '18px 20px', borderRadius: 20, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>OVERDUE</span>
                    {overdueBills.length > 0 ? (
                      <span className="status-chip status-chip-overdue" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        <AlertTriangle size={12} strokeWidth={2.5} /><span>Action Needed</span>
                      </span>
                    ) : (
                      <span className="status-chip status-chip-paid" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        <Check size={12} strokeWidth={2.5} /><span>All Clear</span>
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
                      <button onClick={() => handlePayClick(overdueBills[0])} className="btn btn-sm btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Pay Now</button>
                    )}
                  </div>
                </div>

                {/* Paid This Month Card */}
                <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 20, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>PAID THIS MONTH</span>
                    <span className="status-chip status-chip-paid" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                      <CheckCircle2 size={12} strokeWidth={2.5} /><span>On Track</span>
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#34D399', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                      ₹{paidThisMonth.toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                      {demoPayments.filter((p) => p.paid_date?.startsWith(currentMonth)).length} payments logged
                    </span>
                  </div>
                </div>
              </div>

              {/* Calendar Card */}
              <div className="bento-cell-calendar">
                <CalendarCard bills={activeBills} onPayClick={handlePayClick} />
              </div>

              {/* Spend summary card */}
              <div className="bento-cell-spend">
                <CompactSpendCard payments={demoPayments} />
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            TAB 2: BILLS — same layout as bills/page.tsx + real BillCard
            ═════════════════════════════════════════════════════════════ */}
        {currentTab === 'bills' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>Recurring Bills</h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>Manage renewal cycles, due dates, and automated reminders</p>
              </div>
              <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} strokeWidth={2.5} /><span>Add Bill</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <div className="segmented-control" role="tablist">
                <div className="segmented-indicator" style={{ width: 'calc(50% - 4px)', left: 4, transform: billsActiveTab === 'active' ? 'translateX(0%)' : 'translateX(100%)', transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1)' }} />
                <button role="tab" aria-selected={billsActiveTab === 'active'} onClick={() => setBillsActiveTab('active')} className={`segmented-button ${billsActiveTab === 'active' ? 'active' : ''}`} style={{ width: 140 }}>
                  <span>Active</span><span style={{ fontSize: '0.78rem', opacity: 0.85 }}>{activeBillsList.length}</span>
                </button>
                <button role="tab" aria-selected={billsActiveTab === 'paused'} onClick={() => setBillsActiveTab('paused')} className={`segmented-button ${billsActiveTab === 'paused' ? 'active' : ''}`} style={{ width: 140 }}>
                  <span>Paused</span><span style={{ fontSize: '0.78rem', opacity: 0.85 }}>{pausedBillsList.length}</span>
                </button>
              </div>
              <div style={{ position: 'relative', minWidth: 240 }}>
                <Search size={16} color="var(--color-text-secondary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder="Search bills..." value={billsSearchQuery} onChange={(e) => setBillsSearchQuery(e.target.value)} className="glass-input" style={{ paddingLeft: 36, paddingRight: 12, height: 40, fontSize: '0.86rem' }} />
              </div>
            </div>

            {displayedBills.length === 0 ? (
              <div className="glass-card" style={{ padding: 48, borderRadius: 22, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CalendarDays size={24} color="#FFFFFF" /></div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-main)' }}>No {billsActiveTab} bills found</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: 360 }}>{billsActiveTab === 'active' ? 'Add your first recurring bill!' : 'No paused bills right now.'}</p>
                {billsActiveTab === 'active' && <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>Add Bill</button>}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--gap-bento, 16px)' }}>
                {displayedBills.map((bill) => (
                  <BillCard key={bill.bill_id} bill={bill} onPayClick={handlePayClick} onEditClick={(b) => { setActiveEditBill(b); setIsEditModalOpen(true); }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            TAB 3: HISTORY — same layout as history/page.tsx
            ═════════════════════════════════════════════════════════════ */}
        {currentTab === 'history' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>Payment History &amp; Analytics</h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  Showing {filteredPayments.length} of {demoPayments.length} transactions · Total Paid:{' '}
                  <span style={{ color: '#FFFFFF', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>₹{totalFilteredAmount.toLocaleString('en-IN')}</span>
                </p>
              </div>
              <button onClick={() => exportPaymentsToCSV(filteredPayments)} className="btn btn-glass" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileSpreadsheet size={16} color="#FFFFFF" /><span>Export to CSV</span>
              </button>
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div className="glass-card" style={{ padding: 22, borderRadius: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <BarChart3 size={18} color="#FFFFFF" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Monthly Spend Comparison</h3>
                </div>
                {monthlyTotals.keys.length === 0 ? (
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '36px 0' }}>No payments to compare.</p>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140, padding: '10px 4px 0' }}>
                    {monthlyTotals.keys.map((k, idx) => {
                      const amt = monthlyTotals.map.get(k) || 0;
                      const heightPct = Math.max(14, Math.round((amt / monthlyTotals.maxVal) * 100));
                      const isLatest = idx === monthlyTotals.keys.length - 1;
                      const label = new Date(k + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
                      return (
                        <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '0.72rem', color: isLatest ? '#FFFFFF' : 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>₹{amt > 999 ? `${Math.round(amt / 1000)}k` : amt}</span>
                          <div style={{ width: '100%', height: `${heightPct}%`, borderRadius: '6px 6px 2px 2px', background: isLatest ? '#FFFFFF' : '#71717A', boxShadow: isLatest ? '0 0 14px rgba(255,255,255,0.25)' : 'none', transition: 'height 0.3s ease' }} />
                          <span style={{ fontSize: '0.72rem', color: isLatest ? '#FFFFFF' : 'var(--color-text-secondary)', fontWeight: isLatest ? 700 : 500 }}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="glass-card" style={{ padding: 22, borderRadius: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <PieChart size={18} color="#FFFFFF" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Spend by Bill Category</h3>
                </div>
                {categorySplit.items.length === 0 ? (
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '36px 0' }}>No payments for this timeframe.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', height: 10, borderRadius: 9999, overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
                      {categorySplit.items.map((item, idx) => <div key={item.category} style={{ width: `${item.percent}%`, height: '100%', background: MONO_GREYS[idx % MONO_GREYS.length] }} />)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      {categorySplit.items.slice(0, 5).map((item, idx) => (
                        <div key={item.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: MONO_GREYS[idx % MONO_GREYS.length], display: 'inline-block' }} />
                            <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{CATEGORY_META[item.category]?.label || item.category}</span>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>({item.count})</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.76rem' }}>{item.percent}%</span>
                            <span style={{ fontWeight: 700, color: 'var(--color-text-main)', fontFamily: 'var(--font-mono)' }}>₹{item.amount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filter toolbar */}
            <div className="glass-card" style={{ padding: '12px 16px', borderRadius: 18, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: '1 1 260px', position: 'relative' }}>
                <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" placeholder="Search by bill or transaction ref..." value={historySearchQuery} onChange={(e) => setHistorySearchQuery(e.target.value)} className="glass-input" style={{ paddingLeft: 38, height: 42, fontSize: '0.88rem' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <select value={historyMonth} onChange={(e) => setHistoryMonth(e.target.value)} className="glass-input" style={{ paddingRight: 32, height: 42, fontSize: '0.84rem', cursor: 'pointer', appearance: 'none', minWidth: 150 }}>
                  <option value="all">All Months</option>
                  {availableHistoryMonths.map((m) => <option key={m} value={m}>{new Date(m + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</option>)}
                </select>
                <ChevronDown size={14} color="var(--color-text-secondary)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Transaction list */}
            <div className="glass-card" style={{ padding: 20, borderRadius: 22 }}>
              {filteredPayments.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>No transaction records found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredPayments.map((p) => (
                    <div key={p.payment_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                        <CategoryIcon category={(p.bill_category as any) || 'other'} showTile size={18} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.bill_name || 'Bill Payment'}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{p.paid_date}</span><span>·</span><span style={{ textTransform: 'capitalize' }}>via {p.source}</span>
                            {p.txn_ref && (<><span>·</span><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{p.txn_ref}</span></>)}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-paid)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>₹{p.amount_paid.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            TAB 4: VAULT — same card structure as vault/page.tsx
            ═════════════════════════════════════════════════════════════ */}
        {currentTab === 'vault' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} color="var(--color-accent)" />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>Reference Vault</h1>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>Consumer IDs, account numbers, and quick access links for all your bills</p>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '12px 18px', borderRadius: 16, marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Lock size={16} color="var(--color-accent)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                <strong style={{ color: 'var(--color-text-main)' }}>Don&apos;t store passwords here.</strong> Pingue only stores public IDs, account numbers, and renewal links.
              </span>
            </div>

            <div style={{ position: 'relative', marginBottom: 20 }}>
              <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="text" placeholder="Search by provider, bill name, or consumer ID..." value={vaultSearchQuery} onChange={(e) => setVaultSearchQuery(e.target.value)} className="glass-input" style={{ paddingLeft: 42, height: 44, fontSize: '0.9rem' }} />
            </div>

            {filteredVaultBills.length === 0 ? (
              <div className="glass-card" style={{ padding: 48, borderRadius: 22, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <ShieldCheck size={36} color="var(--color-text-muted)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>No vault entries found</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: 360 }}>{vaultSearchQuery ? 'No bills match your search.' : 'Add bills to see provider IDs here.'}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {filteredVaultBills.map((bill) => {
                  const providerName = inferProvider(bill);
                  const isRecharge = bill.category === 'recharge';
                  const isExpanded = expandedVaultBills.has(bill.bill_id);
                  const mainIdLabel = isRecharge ? 'Mobile No' : 'Consumer ID';
                  const mainIdValue = bill.consumer_id;
                  const hasPhone = Boolean(bill.registered_phone);
                  const hasCare = Boolean(bill.support_number);
                  const hasPortal = Boolean(bill.portal_url);
                  const hasNote = Boolean(bill.notes);
                  const optionalCount = (hasPhone ? 1 : 0) + (hasCare ? 1 : 0) + (hasPortal ? 1 : 0) + (hasNote ? 1 : 0);

                  return (
                    <div key={bill.bill_id} className="glass-card" style={{ padding: '16px 18px', borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color 0.15s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <CategoryIcon category={bill.category} showTile size={18} />
                          <div style={{ minWidth: 0 }}>
                            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{providerName}</h3>
                            {bill.name !== providerName && <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bill.name}</span>}
                          </div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          {mainIdValue ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '5px 8px 5px 10px', borderRadius: 10 }}>
                              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-text-main)', fontFamily: 'var(--font-mono)' }}>{mainIdValue}</span>
                              <button onClick={() => copyText(mainIdValue, `main-${bill.bill_id}`)} style={{ background: 'transparent', border: 'none', color: copiedKey === `main-${bill.bill_id}` ? 'var(--color-paid)' : 'var(--color-text-secondary)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }} title={`Copy ${mainIdLabel}`}>
                                {copiedKey === `main-${bill.bill_id}` ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', padding: '4px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>No {mainIdLabel}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
                        <button
                          onClick={() => setExpandedVaultBills((prev) => { const next = new Set(prev); if (next.has(bill.bill_id)) next.delete(bill.bill_id); else next.add(bill.bill_id); return next; })}
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
                        >
                          <span>{isExpanded ? 'Hide details' : 'More details'}</span>
                          {optionalCount > 0 && !isExpanded && <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: 6, background: 'rgba(255,255,255,0.08)' }}>{optionalCount}</span>}
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        {bill.portal_url && (
                          <a href={bill.portal_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
                            <span>Pay Portal</span><ExternalLink size={12} />
                          </a>
                        )}
                      </div>

                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                          {hasPhone && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Phone size={12} color="var(--color-text-muted)" />
                                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>Registered Phone:</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', fontFamily: 'var(--font-mono)' }}>{bill.registered_phone}</span>
                              </div>
                              <button onClick={() => copyText(bill.registered_phone!, `phone-${bill.bill_id}`)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 2 }}>
                                {copiedKey === `phone-${bill.bill_id}` ? <Check size={12} color="var(--color-paid)" /> : <Copy size={12} />}
                              </button>
                            </div>
                          )}
                          {hasCare && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Headphones size={12} color="var(--color-text-muted)" />
                                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>Customer Care:</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', fontFamily: 'var(--font-mono)' }}>{bill.support_number}</span>
                              </div>
                              <button onClick={() => copyText(bill.support_number!, `care-${bill.bill_id}`)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 2 }}>
                                {copiedKey === `care-${bill.bill_id}` ? <Check size={12} color="var(--color-paid)" /> : <Copy size={12} />}
                              </button>
                            </div>
                          )}
                          {hasPortal && (
                            <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', gap: 6 }}>
                              <Link2 size={12} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>Portal:</span>
                              <a href={bill.portal_url!} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: 'var(--color-accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bill.portal_url}</a>
                            </div>
                          )}
                          {hasNote && (
                            <div style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <FileText size={12} color="var(--color-text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                              <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{bill.notes}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bento grid layout (same responsive grid as real dashboard) */}
      <style jsx>{`
        .bento-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--gap-bento, 16px);
        }
        .bento-cell-hero, .bento-cell-metrics-stack, .bento-cell-calendar, .bento-cell-spend { grid-column: span 1; height: 100%; }
        .bento-cell-metrics-stack { display: flex; flex-direction: column; gap: var(--gap-bento, 16px); height: 100%; }
        @media (min-width: 768px) and (max-width: 1023px) {
          .bento-grid { grid-template-columns: repeat(2, 1fr); }
          .bento-cell-hero { grid-column: span 2; }
          .bento-cell-metrics-stack { grid-column: span 2; flex-direction: row; }
          .bento-cell-calendar { grid-column: span 2; }
          .bento-cell-spend { grid-column: span 2; }
        }
        @media (min-width: 1024px) {
          .bento-grid { grid-template-columns: repeat(12, 1fr); }
          .bento-cell-hero { grid-column: span 7; }
          .bento-cell-metrics-stack { grid-column: span 5; }
          .bento-cell-calendar { grid-column: span 7; }
          .bento-cell-spend { grid-column: span 5; }
        }
      `}</style>

      {/* Modals */}
      {activePayBill && (
        <MarkPaidModal bill={activePayBill} isOpen={isPayModalOpen} onClose={() => { setIsPayModalOpen(false); setActivePayBill(null); }} />
      )}
      <AddBillModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      {activeEditBill && (
        <EditBillModal bill={activeEditBill} isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setActiveEditBill(null); }} />
      )}
    </div>
  );
}

