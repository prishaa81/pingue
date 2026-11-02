'use client';

import React, { useState, useEffect } from 'react';
import { Bill } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { CategoryIcon } from './CategoryIcon';
import { X } from 'lucide-react';

interface EditBillModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditBillModal({ bill, isOpen, onClose }: EditBillModalProps) {
  const { updateBill, showToast } = useAppStore();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [cycleValue, setCycleValue] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (bill) {
      setName(bill.name);
      setAmount(bill.amount.toString());
      setNextDueDate(bill.next_due_date || '');
      setCycleValue(bill.cycle_value);
      setNotes(bill.notes || '');
    }
  }, [bill]);

  if (!isOpen || !bill) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!name.trim() || isNaN(num) || num < 0) {
      showToast('Please provide a valid bill name and amount', 'warning');
      return;
    }

    await updateBill(bill.bill_id, {
      name: name.trim(),
      amount: num,
      next_due_date: nextDueDate || null,
      cycle_value: cycleValue,
      notes: notes.trim() || null,
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#111113',
          border: '1px solid var(--glass-border)',
          padding: 24,
          borderRadius: 24,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
        }}
        role="dialog"
        aria-modal="true"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CategoryIcon category={bill.category} showTile size={22} />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
                Edit Bill
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Update reminder parameters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Bill Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Amount (₹)
            </label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Next Due Date
            </label>
            <input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Notes & Instructions
              <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 6 }}>(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pay via HDFC NetBanking, check meter reading first..."
              className="glass-input"
              rows={3}
              style={{ resize: 'vertical', lineHeight: 1.55 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-glass" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
