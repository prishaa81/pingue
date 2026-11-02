'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Bill } from '@/lib/types';
import { CategoryIcon } from '@/components/CategoryIcon';
import {
  ShieldCheck,
  Search,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Plus,
  Phone,
  Headphones,
  Link2,
  FileText,
  X,
  Edit2,
  Trash2,
  Lock,
} from 'lucide-react';

// Helper to infer provider from bill name if not explicitly set
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
  if (lower.includes('insurance') || lower.includes('hdfc')) return 'HDFC ERGO';
  return bill.name;
}

export default function VaultPage() {
  const router = useRouter();
  const { bills, updateBill, showToast, isLoggedIn, isLoading } = useAppStore();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/welcome');
    }
  }, [isLoading, isLoggedIn, router]);

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Expanded cards set (tracking bill_id)
  const [expandedBills, setExpandedBills] = useState<Set<string>>(new Set());

  // Active inline detail adder: { billId, fieldType: 'id' | 'phone' | 'care' | 'portal' | 'note' }
  const [activeAdder, setActiveAdder] = useState<{
    billId: string;
    fieldType: 'id' | 'phone' | 'care' | 'portal' | 'note';
    currentValue?: string;
  } | null>(null);
  const [adderValue, setAdderValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleExpand = (billId: string) => {
    setExpandedBills((prev) => {
      const next = new Set(prev);
      if (next.has(billId)) next.delete(billId);
      else next.add(billId);
      return next;
    });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied "${text}"`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openAdder = (billId: string, fieldType: 'id' | 'phone' | 'care' | 'portal' | 'note', initialVal = '') => {
    setActiveAdder({ billId, fieldType, currentValue: initialVal });
    setAdderValue(initialVal);
  };

  const closeAdder = () => {
    setActiveAdder(null);
    setAdderValue('');
  };

  const handleSaveDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdder) return;

    setIsSaving(true);
    const { billId, fieldType } = activeAdder;
    const val = adderValue.trim() || null;

    const updates: Partial<Bill> = {};
    if (fieldType === 'id') updates.consumer_id = val;
    else if (fieldType === 'phone') updates.registered_phone = val;
    else if (fieldType === 'care') updates.support_number = val;
    else if (fieldType === 'portal') updates.portal_url = val;
    else if (fieldType === 'note') updates.notes = val;

    try {
      await updateBill(billId, updates);
      showToast('Vault updated', 'success');
      closeAdder();
    } catch {
      showToast('Failed to update vault', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDetail = async (billId: string, fieldType: 'id' | 'phone' | 'care' | 'portal' | 'note') => {
    const updates: Partial<Bill> = {};
    if (fieldType === 'id') updates.consumer_id = null;
    else if (fieldType === 'phone') updates.registered_phone = null;
    else if (fieldType === 'care') updates.support_number = null;
    else if (fieldType === 'portal') updates.portal_url = null;
    else if (fieldType === 'note') updates.notes = null;

    try {
      await updateBill(billId, updates);
      showToast('Detail removed', 'info');
    } catch {
      showToast('Failed to remove detail', 'error');
    }
  };

  // Filter bills
  const filteredBills = bills.filter((b) => {
    const q = searchQuery.toLowerCase();
    const providerName = inferProvider(b).toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      providerName.includes(q) ||
      (b.consumer_id && b.consumer_id.toLowerCase().includes(q))
    );
  });

  if (isLoading) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Loading vault...
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px 100px 16px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'var(--color-accent-bg)',
              border: '1px solid var(--color-accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={20} color="var(--color-accent)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
              Reference Vault
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Consumer IDs, account numbers, and quick access links for all your bills
            </p>
          </div>
        </div>
      </div>

      {/* Security Note Banner (Part 2: Keep the note: "Don't store passwords here.") */}
      <div
        className="glass-card"
        style={{
          padding: '12px 18px',
          borderRadius: 16,
          marginBottom: 20,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Lock size={16} color="var(--color-accent)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
          <strong style={{ color: 'var(--color-text-main)' }}>Don&apos;t store passwords here.</strong> Pingue only stores public IDs, account numbers, and renewal links.
        </span>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search
          size={16}
          color="var(--color-text-muted)"
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        />
        <input
          type="text"
          placeholder="Search by provider, bill name, or consumer ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input"
          style={{ paddingLeft: 42, height: 44, fontSize: '0.9rem' }}
        />
      </div>

      {/* Compact Cards Grid */}
      {filteredBills.length === 0 ? (
        <div
          className="glass-card"
          style={{
            padding: 48,
            borderRadius: 22,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <ShieldCheck size={36} color="var(--color-text-muted)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            No vault entries found
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: 360 }}>
            {searchQuery
              ? 'No bills match your search criteria.'
              : 'Add bills to see their provider IDs and quick copy shortcuts here.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 14,
          }}
        >
          {filteredBills.map((bill) => {
            const providerName = inferProvider(bill);
            const isRecharge = bill.category === 'recharge';
            const isExpanded = expandedBills.has(bill.bill_id);
            const mainIdLabel = isRecharge ? 'Mobile No' : 'Consumer ID';
            const mainIdValue = bill.consumer_id;

            // Optional fields presence
            const hasPhone = Boolean(bill.registered_phone);
            const hasCare = Boolean(bill.support_number);
            const hasPortal = Boolean(bill.portal_url);
            const hasNote = Boolean(bill.notes);
            const optionalCount = (hasPhone ? 1 : 0) + (hasCare ? 1 : 0) + (hasPortal ? 1 : 0) + (hasNote ? 1 : 0);

            return (
              <div
                key={bill.bill_id}
                className="glass-card"
                style={{
                  padding: '16px 18px',
                  borderRadius: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Compact Card Header: Provider Name + Main ID + Copy Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <CategoryIcon category={bill.category} showTile size={18} />
                    <div style={{ minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: '0.98rem',
                          fontWeight: 700,
                          color: 'var(--color-text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {providerName}
                      </h3>
                      {bill.name !== providerName && (
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {bill.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main ID pill with copy button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {mainIdValue ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--glass-border)',
                          padding: '5px 8px 5px 10px',
                          borderRadius: 10,
                        }}
                      >
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-text-main)', fontFamily: 'var(--font-mono)' }}>
                          {mainIdValue}
                        </span>
                        <button
                          onClick={() => copyToClipboard(mainIdValue, `main-${bill.bill_id}`)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: copiedKey === `main-${bill.bill_id}` ? 'var(--color-paid)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            padding: 2,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title={`Copy ${mainIdLabel}`}
                        >
                          {copiedKey === `main-${bill.bill_id}` ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAdder(bill.bill_id, 'id')}
                        className="btn btn-sm btn-glass"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', gap: 4 }}
                      >
                        <Plus size={12} />
                        <span>Add {mainIdLabel}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* More Details Expander Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 8 }}>
                  <button
                    onClick={() => toggleExpand(bill.bill_id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0,
                    }}
                  >
                    <span>{isExpanded ? 'Hide details' : 'More details'}</span>
                    {optionalCount > 0 && !isExpanded && (
                      <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: 6, background: 'rgba(255, 255, 255, 0.08)' }}>
                        {optionalCount}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {/* Quick portal shortcut if available */}
                  {bill.portal_url && (
                    <a
                      href={bill.portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.75rem',
                        color: 'var(--color-accent)',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      <span>Pay Portal</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {/* Expanded Section: Optional fields (registered phone, customer care, portal link, note) */}
                {isExpanded && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      paddingTop: 4,
                      animation: 'fadeIn 0.15s ease',
                    }}
                  >
                    {/* Registered Phone */}
                    {hasPhone && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 10,
                          background: 'rgba(255, 255, 255, 0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <Phone size={12} color="var(--color-text-muted)" />
                          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>Registered Phone:</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', fontFamily: 'var(--font-mono)' }}>
                            {bill.registered_phone}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button
                            onClick={() => copyToClipboard(bill.registered_phone!, `phone-${bill.bill_id}`)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 2 }}
                            title="Copy Phone"
                          >
                            {copiedKey === `phone-${bill.bill_id}` ? <Check size={12} color="var(--color-paid)" /> : <Copy size={12} />}
                          </button>
                          <button
                            onClick={() => handleDeleteDetail(bill.bill_id, 'phone')}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 2 }}
                            title="Remove Phone"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Customer Care */}
                    {hasCare && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 10,
                          background: 'rgba(255, 255, 255, 0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <Headphones size={12} color="var(--color-text-muted)" />
                          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>Customer Care:</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', fontFamily: 'var(--font-mono)' }}>
                            {bill.support_number}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button
                            onClick={() => copyToClipboard(bill.support_number!, `care-${bill.bill_id}`)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 2 }}
                            title="Copy Care Number"
                          >
                            {copiedKey === `care-${bill.bill_id}` ? <Check size={12} color="var(--color-paid)" /> : <Copy size={12} />}
                          </button>
                          <button
                            onClick={() => handleDeleteDetail(bill.bill_id, 'care')}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 2 }}
                            title="Remove"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Portal Link */}
                    {hasPortal && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 10,
                          background: 'rgba(255, 255, 255, 0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                          <Link2 size={12} color="var(--color-text-muted)" />
                          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>Portal:</span>
                          <a
                            href={bill.portal_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.78rem', color: 'var(--color-accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {bill.portal_url}
                          </a>
                        </div>
                        <button
                          onClick={() => handleDeleteDetail(bill.bill_id, 'portal')}
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 2 }}
                          title="Remove Portal"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}

                    {/* Note */}
                    {hasNote && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 10,
                          background: 'rgba(255, 255, 255, 0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, minWidth: 0 }}>
                          <FileText size={12} color="var(--color-text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                            {bill.notes}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteDetail(bill.bill_id, 'note')}
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 2 }}
                          title="Remove Note"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}

                    {/* Add Detail Action Chips (Empty fields hidden until user taps "Add detail") */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>+ Add detail:</span>
                      {!hasPhone && (
                        <button
                          onClick={() => openAdder(bill.bill_id, 'phone')}
                          className="btn btn-sm btn-glass"
                          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                        >
                          Phone
                        </button>
                      )}
                      {!hasCare && (
                        <button
                          onClick={() => openAdder(bill.bill_id, 'care')}
                          className="btn btn-sm btn-glass"
                          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                        >
                          Care No
                        </button>
                      )}
                      {!hasPortal && (
                        <button
                          onClick={() => openAdder(bill.bill_id, 'portal')}
                          className="btn btn-sm btn-glass"
                          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                        >
                          Portal Link
                        </button>
                      )}
                      {!hasNote && (
                        <button
                          onClick={() => openAdder(bill.bill_id, 'note')}
                          className="btn btn-sm btn-glass"
                          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                        >
                          Note
                        </button>
                      )}
                      {mainIdValue && (
                        <button
                          onClick={() => openAdder(bill.bill_id, 'id', mainIdValue)}
                          className="btn btn-sm btn-glass"
                          style={{ padding: '3px 8px', fontSize: '0.72rem', opacity: 0.7 }}
                        >
                          Edit ID
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Minimal Inline Detail Adder Modal (Single input, no long forms, no required fields) */}
      {activeAdder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) closeAdder();
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: 380,
              background: '#111113',
              border: '1px solid var(--glass-border)',
              padding: 20,
              borderRadius: 20,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {activeAdder.fieldType === 'id' && 'Set Consumer ID / Mobile'}
                {activeAdder.fieldType === 'phone' && 'Add Registered Phone'}
                {activeAdder.fieldType === 'care' && 'Add Customer Care Number'}
                {activeAdder.fieldType === 'portal' && 'Add Payment Portal URL'}
                {activeAdder.fieldType === 'note' && 'Add Note / Hint'}
              </h3>
              <button
                onClick={closeAdder}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDetail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeAdder.fieldType === 'note' ? (
                <textarea
                  placeholder="e.g. Due on 15th, pay via HDFC netbanking"
                  value={adderValue}
                  onChange={(e) => setAdderValue(e.target.value)}
                  className="glass-input"
                  rows={3}
                  autoFocus
                />
              ) : (
                <input
                  type={activeAdder.fieldType === 'portal' ? 'url' : 'text'}
                  placeholder={
                    activeAdder.fieldType === 'id'
                      ? 'e.g. CA-100234567 or 9820011223'
                      : activeAdder.fieldType === 'phone'
                      ? 'e.g. 9820011223'
                      : activeAdder.fieldType === 'care'
                      ? 'e.g. 1800-209-5161'
                      : 'https://...'
                  }
                  value={adderValue}
                  onChange={(e) => setAdderValue(e.target.value)}
                  className="glass-input"
                  autoFocus
                />
              )}

              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                Don&apos;t store passwords here.
              </span>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={closeAdder}
                  className="btn btn-sm btn-glass"
                  style={{ flex: 1 }}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                  style={{ flex: 1 }}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
