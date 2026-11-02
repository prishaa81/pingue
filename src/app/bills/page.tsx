'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { BillCard } from '@/components/BillCard';
import { MarkPaidModal } from '@/components/MarkPaidModal';
import { AddBillModal } from '@/components/AddBillModal';
import { EditBillModal } from '@/components/EditBillModal';
import { Bill } from '@/lib/types';
import { Plus, Search, CalendarDays } from 'lucide-react';

export default function BillsPage() {
  const router = useRouter();
  const { bills, isLoggedIn, isLoading } = useAppStore();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/welcome');
    }
  }, [isLoading, isLoggedIn, router]);

  // Requirement 3: "The Bills page must have exactly two tabs: 'Active' and 'Paused'. Nothing else."
  const [activeTab, setActiveTab] = useState<'active' | 'paused'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activePayBill, setActivePayBill] = useState<Bill | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [activeEditBill, setActiveEditBill] = useState<Bill | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Requirement 3: "Bills with ignored alerts stay under Active with an Overdue chip."
  const activeBillsList = bills.filter((b) => b.status === 'active' || b.status === 'ignored');
  const pausedBillsList = bills.filter((b) => b.status === 'paused');

  const currentList = activeTab === 'active' ? activeBillsList : pausedBillsList;

  // Requirement 3: "Sort each tab by next due date, soonest first."
  const sortedBills = [...currentList].sort((a, b) => {
    if (!a.next_due_date) return 1;
    if (!b.next_due_date) return -1;
    return new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime();
  });

  // Simple live search filter
  const displayedBills = searchQuery.trim()
    ? sortedBills.filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : sortedBills;

  const handlePayClick = (bill: Bill) => {
    setActivePayBill(bill);
    setIsPayModalOpen(true);
  };

  const handleEditClick = (bill: Bill) => {
    setActiveEditBill(bill);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Loading bills...
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 100px 16px' }}>
      {/* Page Title & Add Button (Requirement 3: Clearly readable title & summary) */}
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
            Recurring Bills
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Manage renewal cycles, due dates, and automated reminders
          </p>
        </div>

        {/* Primary button: solid white with black text */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          id="bills-add-btn"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add Bill</span>
        </button>
      </div>

      {/* Glass Segmented Control & Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Requirement 3: "Exactly two tabs: 'Active' and 'Paused', with counts... Style as glass segmented control with a sliding indicator" */}
        <div className="segmented-control" role="tablist">
          {/* Sliding indicator using only transform and opacity */}
          <div
            className="segmented-indicator"
            style={{
              width: 'calc(50% - 4px)',
              left: 4,
              transform: activeTab === 'active' ? 'translateX(0%)' : 'translateX(100%)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />

          <button
            role="tab"
            aria-selected={activeTab === 'active'}
            onClick={() => setActiveTab('active')}
            className={`segmented-button ${activeTab === 'active' ? 'active' : ''}`}
            style={{ width: 140 }}
          >
            <span>Active</span>
            <span style={{ fontSize: '0.78rem', opacity: 0.85 }}>{activeBillsList.length}</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'paused'}
            onClick={() => setActiveTab('paused')}
            className={`segmented-button ${activeTab === 'paused' ? 'active' : ''}`}
            style={{ width: 140 }}
          >
            <span>Paused</span>
            <span style={{ fontSize: '0.78rem', opacity: 0.85 }}>{pausedBillsList.length}</span>
          </button>
        </div>

        {/* Search Input (Requirement 3: Keep the search box) */}
        <div style={{ position: 'relative', minWidth: 240 }}>
          <Search
            size={16}
            color="var(--color-text-secondary)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search bills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input"
            style={{ paddingLeft: 36, paddingRight: 12, height: 40, fontSize: '0.86rem' }}
          />
        </div>
      </div>

      {/* Bills Grid */}
      {displayedBills.length === 0 ? (
        <div
          className="glass-card"
          style={{
            padding: 48,
            borderRadius: 22,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarDays size={24} color="#FFFFFF" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            No {activeTab} bills found
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: 360 }}>
            {activeTab === 'active'
              ? 'You have no active bills scheduled. Add your first recurring reminder!'
              : 'You have no paused bills right now.'}
          </p>
          {activeTab === 'active' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ marginTop: 8 }}
            >
              Add Bill
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--gap-bento, 16px)',
          }}
        >
          {displayedBills.map((bill) => (
            <BillCard
              key={bill.bill_id}
              bill={bill}
              onPayClick={handlePayClick}
              onEditClick={handleEditClick}
            />
          ))}
        </div>
      )}

      {/* Interactive Modals */}
      <MarkPaidModal
        bill={activePayBill}
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setActivePayBill(null);
        }}
      />

      <EditBillModal
        bill={activeEditBill}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setActiveEditBill(null);
        }}
      />

      <AddBillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </main>
  );
}
