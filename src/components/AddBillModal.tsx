'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BillCategory, CycleType, ParsedBillData } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { CATEGORY_META } from '@/lib/constants';
import { CategoryIcon } from './CategoryIcon';
import { parseBillFallback } from '@/lib/fallbackParser';
import {
  Sparkles,
  Edit3,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';

interface AddBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddBillModal({ isOpen, onClose }: AddBillModalProps) {
  const { addBill, showToast } = useAppStore();

  // Tab: 'ai' | 'form'
  const [activeTab, setActiveTab] = useState<'ai' | 'form'>('ai');

  // AI Tab State
  const [rawText, setRawText] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedPreview, setParsedPreview] = useState<ParsedBillData | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<BillCategory>('recharge');
  const [amount, setAmount] = useState<string>('');
  const [cycleType, setCycleType] = useState<CycleType>('months');
  const [cycleValue, setCycleValue] = useState<number>(1);
  const [nextDueDate, setNextDueDate] = useState<string>('');
  const [selectedRemindDays, setSelectedRemindDays] = useState<number[]>([3, 1, 0]);
  const [notes, setNotes] = useState<string>('');

  // Vault Reference Fields (Part 8)
  const [showVaultSection, setShowVaultSection] = useState<boolean>(false);
  const [provider, setProvider] = useState<string>('');
  const [consumerId, setConsumerId] = useState<string>('');
  const [registeredPhone, setRegisteredPhone] = useState<string>('');
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [supportNumber, setSupportNumber] = useState<string>('');
  const [portalUrl, setPortalUrl] = useState<string>('');
  const [loginHint, setLoginHint] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset ALL form state every time the modal opens (prevents previous bill data leaking in)
  useEffect(() => {
    if (isOpen) {
      setActiveTab('ai');
      setRawText('');
      setImageFile(null);
      setImagePreview(null);
      setIsParsing(false);
      setParsedPreview(null);
      setName('');
      setCategory('recharge');
      setAmount('');
      setCycleType('months');
      setCycleValue(1);
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setNextDueDate(d.toISOString().split('T')[0]);
      setSelectedRemindDays([3, 1, 0]);
      setNotes('');
      setShowVaultSection(false);
      setProvider('');
      setConsumerId('');
      setRegisteredPhone('');
      setRegisteredEmail('');
      setSupportNumber('');
      setPortalUrl('');
      setLoginHint('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen]);

  // Support clipboard paste of images (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageSelected(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageSelected = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Toggle Reminder Days
  const toggleReminderDay = (day: number) => {
    if (selectedRemindDays.includes(day)) {
      setSelectedRemindDays(selectedRemindDays.filter((d) => d !== day));
    } else {
      setSelectedRemindDays([...selectedRemindDays, day].sort((a, b) => b - a));
    }
  };

  // Auto-fill form fields from parsed result
  const applyParsedBillData = (data: ParsedBillData, sourceLabel = 'AI') => {
    setParsedPreview(data);

    if (data.biller) {
      setName(data.biller);
      setProvider(data.biller);
    }
    if (data.amount > 0) {
      setAmount(data.amount.toString());
    }
    if (data.cycle_type) {
      setCycleType(data.cycle_type);
      setCycleValue(data.cycle_value || 1);
    }
    if (data.date) {
      setNextDueDate(data.date);
    }
    if (data.consumer_id) {
      setConsumerId(data.consumer_id);
      setShowVaultSection(true);
    }

    // Infer category
    const lower = (data.biller || '').toLowerCase();
    if (lower.includes('vi') || lower.includes('airtel') || lower.includes('jio') || lower.includes('vodafone')) {
      setCategory('recharge');
    } else if (lower.includes('power') || lower.includes('bescom') || lower.includes('electric') || lower.includes('torrent')) {
      setCategory('electricity');
    } else if (lower.includes('gas') || lower.includes('mgl') || lower.includes('igl') || lower.includes('adani')) {
      setCategory('gas');
    } else if (lower.includes('wifi') || lower.includes('broadband') || lower.includes('act') || lower.includes('fiber')) {
      setCategory('internet');
    } else if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('prime') || lower.includes('hotstar')) {
      setCategory('subscription');
    } else if (lower.includes('water')) {
      setCategory('water');
    } else if (lower.includes('maintenance') || lower.includes('society')) {
      setCategory('maintenance');
    }

    showToast(`Bill analyzed with ${sourceLabel}! Verify details below.`, 'success');
  };

  const handleTrySampleSMS = (textToUse?: string) => {
    const sample = textToUse || 'Paid Rs 1,499 to Tata Power on 28-10-2026 for CA 100234567. UTR: 628945612344.';
    setRawText(sample);
    const parsed = parseBillFallback(sample);
    applyParsedBillData(parsed, 'Demo Parser');
  };

  // Run AI / Gemini Parse with fallback
  const handleParse = async () => {
    if (!rawText.trim() && !imagePreview) {
      showToast('Please paste bill text/SMS or attach a receipt screenshot', 'warning');
      return;
    }

    setIsParsing(true);

    try {
      const res = await fetch('/api/parse-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText.trim() || undefined,
          imageBase64: imagePreview || undefined,
        }),
      });

      const data: ParsedBillData = await res.json();

      if (!res.ok) {
        if (rawText.trim()) {
          const fallback = parseBillFallback(rawText.trim());
          applyParsedBillData(fallback, 'Offline Parser');
          return;
        }
        throw new Error((data as any).error || 'Parsing service error');
      }

      applyParsedBillData(data, (data as any).parserUsed === 'builtin_fallback' ? 'Offline Parser' : 'Gemini AI');
    } catch (err: unknown) {
      if (rawText.trim()) {
        const fallback = parseBillFallback(rawText.trim());
        applyParsedBillData(fallback, 'Offline Parser');
      } else {
        const msg = err instanceof Error ? err.message : 'Could not parse with AI';
        showToast(`${msg}. Please enter details manually`, 'info');
        setActiveTab('form');
      }
    } finally {
      setIsParsing(false);
    }
  };

  // Submit Bill
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!name.trim() || isNaN(numAmount) || numAmount < 0) {
      showToast('Please provide a valid bill name and amount', 'warning');
      return;
    }

    await addBill({
      name: name.trim(),
      category,
      icon: CATEGORY_META[category].icon,
      amount: numAmount,
      cycle_type: cycleType,
      cycle_value: cycleValue,
      last_paid_date: null,
      next_due_date: nextDueDate || null,
      remind_days: selectedRemindDays.join(','),
      snoozed_until: null,
      status: 'active',
      notes: notes.trim() || null,
      // Vault Reference Details (Part 8)
      provider: provider.trim() || null,
      consumer_id: consumerId.trim() || null,
      registered_phone: registeredPhone.trim() || null,
      registered_email: registeredEmail.trim() || null,
      support_number: supportNumber.trim() || null,
      portal_url: portalUrl.trim() || null,
      login_hint: loginHint.trim() || null,
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
          maxWidth: 540,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#111113',
          border: '1px solid var(--glass-border)',
          padding: 24,
          borderRadius: 24,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
              Add Recurring Bill
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Never miss a renewal date or incur a late fee
            </p>
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

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--glass-border)',
            padding: 4,
            borderRadius: 14,
            marginBottom: 20,
            gap: 4,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === 'ai' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'ai' ? '#0A0A0B' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'ai' ? 700 : 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={16} color={activeTab === 'ai' ? '#0A0A0B' : 'currentColor'} />
            <span>AI Smart Paste &amp; Scan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === 'form' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'form' ? '#0A0A0B' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'form' ? 700 : 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Edit3 size={16} color={activeTab === 'form' ? '#0A0A0B' : 'currentColor'} />
            <span>Manual Form</span>
          </button>
        </div>

        {/* AI Tab */}
        {activeTab === 'ai' && !parsedPreview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Paste SMS, email, or natural language:
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder='e.g. "Vodafone recharge done, 28 days validity, Rs 299" or "Tata Power electricity bill of Rs 2,450 due on 12-Nov"'
                className="glass-input"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Receipt Image / Screenshot Upload & Paste */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Or attach receipt screenshot (optional):
              </label>

              {imagePreview ? (
                <div
                  style={{
                    position: 'relative',
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '1px solid var(--glass-border)',
                    maxHeight: 180,
                    background: '#050505',
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Receipt preview"
                    style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 180, objectFit: 'contain' }}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(0, 0, 0, 0.75)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--glass-border)',
                    borderRadius: 14,
                    padding: '20px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.02)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageSelected(e.target.files[0]);
                      }
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Upload size={22} color="var(--color-text-secondary)" />
                    <span style={{ fontSize: '0.84rem', color: 'var(--color-text-main)', fontWeight: 600 }}>
                      Click to upload screenshot or press Ctrl+V to paste
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                      In-memory processing only · discarded immediately after extraction
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Try sample SMS button & quick chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleTrySampleSMS('Paid Rs 1,499 to Tata Power on 28-10-2026 for CA 100234567. UTR: 628945612344.')}
                className="btn btn-sm btn-glass"
                style={{ padding: '4px 10px', fontSize: '0.76rem', gap: 5, borderColor: 'var(--color-accent-border)' }}
                title="Fills a canned parse result for demonstration"
              >
                <Sparkles size={12} color="var(--color-accent)" />
                <span>Try a sample SMS</span>
                <span style={{ fontSize: '0.66rem', opacity: 0.8, padding: '1px 5px', borderRadius: 4, background: 'var(--color-accent-bg)', color: 'var(--color-accent)', fontWeight: 700 }}>Demo</span>
              </button>
              <button
                type="button"
                onClick={() => handleTrySampleSMS('Your Vi mobile recharge of Rs 299 for 9820011223 is successful. 28 days validity.')}
                className="btn btn-sm btn-glass"
                style={{ padding: '3px 8px', fontSize: '0.74rem' }}
              >
                Vi ₹299
              </button>
              <button
                type="button"
                onClick={() => handleTrySampleSMS('ACT Fibernet: INR 825 bill generated for Account 9948271 due on 15 Nov.')}
                className="btn btn-sm btn-glass"
                style={{ padding: '3px 8px', fontSize: '0.74rem' }}
              >
                ACT ₹825
              </button>
            </div>

            <button
              type="button"
              onClick={handleParse}
              disabled={isParsing || (!rawText.trim() && !imagePreview)}
              className="btn btn-primary"
              style={{ marginTop: 6, width: '100%' }}
            >
              {isParsing ? (
                <>
                  <Sparkles size={18} className="spin" />
                  <span>Gemini AI is analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Analyze with Gemini AI</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Parsed Preview card when AI has processed */}
        {activeTab === 'ai' && parsedPreview && (
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: 'var(--color-paid-bg)',
              border: '1px solid var(--color-paid-border)',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-paid)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Check size={14} /> Gemini Extracted Details
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                Confidence: {Math.round(parsedPreview.confidence * 100)}%
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
              Detected <b>{parsedPreview.biller}</b> for <b>₹{parsedPreview.amount}</b> ({parsedPreview.cycle_value} {parsedPreview.cycle_type}).
              {parsedPreview.consumer_id && (
                <span> Reference/Consumer ID: <b>{parsedPreview.consumer_id}</b>.</span>
              )}
            </div>
          </div>
        )}

        {/* Form fields (shown in form tab or after AI parse) */}
        {(activeTab === 'form' || parsedPreview) && (() => {
          const isMissingName = !name.trim();
          const isMissingAmount = !amount || parseFloat(amount) <= 0;
          const isMissingDueDate = !nextDueDate;
          const missingCount = (isMissingName ? 1 : 0) + (isMissingAmount ? 1 : 0) + (isMissingDueDate ? 1 : 0);

          return (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {parsedPreview && (
              missingCount > 0 ? (
                <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#F59E0B', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} />
                  <span>Please fill in the {missingCount} missing field{missingCount > 1 ? 's' : ''} highlighted below: {[isMissingName && 'Name', isMissingAmount && 'Amount', isMissingDueDate && 'Due Date'].filter(Boolean).join(', ')}</span>
                </div>
              ) : (
                <div style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--color-paid-bg)', border: '1px solid var(--color-paid-border)', color: 'var(--color-paid)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={14} />
                  <span>All key fields extracted! Review below and tap Save Bill.</span>
                </div>
              )
            )}

            {/* Bill Name */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                <span>Bill / Service Name</span>
                {parsedPreview && (
                  isMissingName ? (
                    <span style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 600 }}>• Missing (Required)</span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-paid)', fontWeight: 600 }}>✓ Extracted</span>
                  )
                )}
              </label>
              <input
                type="text"
                placeholder="e.g. Vi Unlimited, ACT Broadband, Adani Gas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input"
                style={{ borderColor: parsedPreview && isMissingName ? '#F59E0B' : undefined }}
                required
              />
            </div>

            {/* Category Picker */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Category
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {(Object.keys(CATEGORY_META) as BillCategory[]).map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const isSelected = category === cat;
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        padding: 10,
                        borderRadius: 12,
                        background: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '1px solid #FFFFFF' : '1px solid var(--glass-border)',
                        color: isSelected ? '#0A0A0B' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <CategoryIcon category={cat} size={18} />
                      <span style={{ fontSize: '0.72rem', fontWeight: isSelected ? 700 : 500 }}>
                        {meta.label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Amount (₹)
              </label>
              <input
                type="number"
                step="any"
                placeholder="299"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="glass-input"
                required
              />
            </div>

            {/* Recurrence Cycle */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                How often does it repeat?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setCycleType('days');
                    setCycleValue(28);
                  }}
                  className="btn btn-sm"
                  style={{
                    background: cycleType === 'days' && cycleValue === 28 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
                    border: cycleType === 'days' && cycleValue === 28 ? '1px solid #FFFFFF' : '1px solid var(--glass-border)',
                    color: cycleType === 'days' && cycleValue === 28 ? '#0A0A0B' : 'var(--color-text-secondary)',
                    fontWeight: cycleType === 'days' && cycleValue === 28 ? 700 : 500,
                  }}
                >
                  Every 28 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCycleType('months');
                    setCycleValue(1);
                  }}
                  className="btn btn-sm"
                  style={{
                    background: cycleType === 'months' && cycleValue === 1 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
                    border: cycleType === 'months' && cycleValue === 1 ? '1px solid #FFFFFF' : '1px solid var(--glass-border)',
                    color: cycleType === 'months' && cycleValue === 1 ? '#0A0A0B' : 'var(--color-text-secondary)',
                    fontWeight: cycleType === 'months' && cycleValue === 1 ? 700 : 500,
                  }}
                >
                  Every Month
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCycleType('one-time');
                    setCycleValue(1);
                  }}
                  className="btn btn-sm"
                  style={{
                    background: cycleType === 'one-time' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
                    border: cycleType === 'one-time' ? '1px solid #FFFFFF' : '1px solid var(--glass-border)',
                    color: cycleType === 'one-time' ? '#0A0A0B' : 'var(--color-text-secondary)',
                    fontWeight: cycleType === 'one-time' ? 700 : 500,
                  }}
                >
                  One-time
                </button>
              </div>

              {cycleType === 'days' && cycleValue !== 28 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Days per cycle:</span>
                  <input
                    type="number"
                    value={cycleValue}
                    onChange={(e) => setCycleValue(parseInt(e.target.value) || 28)}
                    className="glass-input"
                    style={{ width: 100, padding: '6px 10px' }}
                  />
                </div>
              )}
            </div>

            {/* Next Due Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                First / Next Due Date
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="glass-input"
                required
              />
            </div>

            {/* Reminder Lead Times */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                When should Pingue ping you?
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[3, 2, 1, 0].map((d) => {
                  const label = d === 0 ? 'Due day' : `${d}d before`;
                  const isChecked = selectedRemindDays.includes(d);
                  return (
                    <button
                      type="button"
                      key={d}
                      onClick={() => toggleReminderDay(d)}
                      className="btn btn-sm"
                      style={{
                        background: isChecked ? 'var(--color-accent-bg)' : 'rgba(255, 255, 255, 0.05)',
                        border: isChecked ? '1px solid var(--color-accent-border)' : '1px solid var(--glass-border)',
                        color: isChecked ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        fontWeight: isChecked ? 700 : 500,
                      }}
                    >
                      {isChecked && <Check size={12} color="var(--color-accent)" strokeWidth={3} />}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expandable Vault Credentials Section (Part 8) */}
            <div
              style={{
                borderRadius: 16,
                border: '1px solid var(--glass-border)',
                background: 'rgba(255, 255, 255, 0.02)',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setShowVaultSection(!showVaultSection)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-main)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} color="var(--color-accent)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Vault &amp; Account Details
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>(optional)</span>
                </div>
                {showVaultSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showVaultSection && (
                <div style={{ padding: '0 14px 16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                    }}
                  >
                    <AlertTriangle size={14} color="var(--color-overdue)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      <b>Security Warning:</b> Never enter passwords, ATM PINs, UPI PINs, or CVVs. Only enter public reference numbers.
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                        Provider / Service
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BESCOM, Vi"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="glass-input"
                        style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                        Consumer ID / Account No
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 102938475"
                        value={consumerId}
                        onChange={(e) => setConsumerId(e.target.value)}
                        className="glass-input"
                        style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                        Registered Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 98765 43210"
                        value={registeredPhone}
                        onChange={(e) => setRegisteredPhone(e.target.value)}
                        className="glass-input"
                        style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                        Registered Email
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. billing@domain.com"
                        value={registeredEmail}
                        onChange={(e) => setRegisteredEmail(e.target.value)}
                        className="glass-input"
                        style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                        Support / Helpline No
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1912"
                        value={supportNumber}
                        onChange={(e) => setSupportNumber(e.target.value)}
                        className="glass-input"
                        style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                        Renewal Portal URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={portalUrl}
                        onChange={(e) => setPortalUrl(e.target.value)}
                        className="glass-input"
                        style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                      Login Hint / Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 'Use Google Sign-in with personal email' or user handle"
                      value={loginHint}
                      onChange={(e) => setLoginHint(e.target.value)}
                      className="glass-input"
                      style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes / Instructions */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Notes &amp; Instructions
                <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 6 }}>(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Pay via HDFC NetBanking, use account ending 4521. Check meter reading before paying."
                className="glass-input"
                rows={2}
                style={{ resize: 'vertical', lineHeight: 1.55 }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-glass"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                id="save-bill-btn"
              >
                Save Reminder
              </button>
            </div>
          </form>
          );
        })()}
      </div>
    </div>
  );
}
