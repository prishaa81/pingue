'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bill, PaymentInputType } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { CategoryIcon } from './CategoryIcon';
import { parseBillFallback } from '@/lib/fallbackParser';
import {
  Calendar,
  Check,
  X,
  FileText,
  ImageIcon,
  Sparkles,
  Camera,
  Trash2,
  AlertCircle,
  Hash,
} from 'lucide-react';

interface MarkPaidModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MarkPaidModal({ bill, isOpen, onClose }: MarkPaidModalProps) {
  const { markBillAsPaid, updateBill, user, showToast } = useAppStore();

  const [amount, setAmount] = useState<number>(0);
  const [paidDate, setPaidDate] = useState<string>('');
  const [txnRef, setTxnRef] = useState<string>('');
  const [consumerId, setConsumerId] = useState<string>('');
  const [validityDays, setValidityDays] = useState<number | undefined>(undefined);

  // Input Type: 'form' | 'sms' | 'screenshot'
  const [activeTab, setActiveTab] = useState<'details' | 'sms' | 'screenshot'>('details');

  // SMS attachment state
  const [smsText, setSmsText] = useState<string>('');

  // Screenshot attachment state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI parsing status
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseConfidence, setParseConfidence] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);

  // Initialize fields when bill opens
  useEffect(() => {
    if (bill) {
      setAmount(bill.amount);
      setPaidDate(new Date().toISOString().split('T')[0]);
      setTxnRef('');
      setConsumerId(bill.consumer_id || '');
      setValidityDays(bill.cycle_type === 'days' ? bill.cycle_value : undefined);
      setSmsText('');
      setImagePreview(null);
      setParseError(null);
      setParseConfidence(null);
      setActiveTab('details');
      setIsSubmitting(false);
      setShowCheckmark(false);
    }
  }, [bill, isOpen]);

  // Handle Ctrl+V paste of screenshot anywhere in modal
  useEffect(() => {
    if (!isOpen) return;

    function handlePaste(e: ClipboardEvent) {
      if (e.clipboardData && e.clipboardData.items) {
        for (const item of Array.from(e.clipboardData.items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (uploadEvent) => {
                const base64 = uploadEvent.target?.result as string;
                setImagePreview(base64);
                setActiveTab('screenshot');
                handleRunGeminiParse(undefined, base64);
              };
              reader.readAsDataURL(file);
            }
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen || !bill) return null;

  const isRecharge = bill.category === 'recharge';

  const handleApplyParsedResult = (data: any, parserLabel = 'Gemini AI') => {
    if (data.amount && Number(data.amount) > 0) {
      setAmount(Number(data.amount));
    }
    if (data.paid_date || data.date) {
      setPaidDate(data.paid_date || data.date);
    }
    if (data.txn_ref) {
      setTxnRef(data.txn_ref);
    }
    if (data.consumer_id) {
      setConsumerId(data.consumer_id);
    }
    if (data.validity_days) {
      setValidityDays(Number(data.validity_days));
    }

    setParseConfidence(data.confidence || 0.85);
    showToast(`Receipt parsed with ${parserLabel}. Verify details below.`, 'success');
    setActiveTab('details');
  };

  // Real Gemini parsing handler with offline fallback
  const handleRunGeminiParse = async (textToParse?: string, imageToParse?: string) => {
    setIsParsing(true);
    setParseError(null);
    const targetText = textToParse || (activeTab === 'sms' ? smsText : undefined);

    try {
      const res = await fetch('/api/parse-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: targetText,
          imageBase64: imageToParse || imagePreview || undefined,
          userId: user?.user_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (targetText) {
          const fallback = parseBillFallback(targetText);
          handleApplyParsedResult(fallback, 'Offline Parser');
          return;
        }
        throw new Error(data.error || 'Parsing failed');
      }

      handleApplyParsedResult(data, data.parserUsed === 'builtin_fallback' ? 'Offline Parser' : 'Gemini AI');
    } catch (err: unknown) {
      if (targetText) {
        const fallback = parseBillFallback(targetText);
        handleApplyParsedResult(fallback, 'Offline Parser');
      } else {
        const msg = err instanceof Error ? err.message : 'Could not parse with AI';
        setParseError(`${msg}. Please enter payment details manually.`);
        setActiveTab('details');
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleTrySampleSMS = () => {
    const today = new Date().toISOString().split('T')[0];
    const sample = `Paid Rs ${bill.amount} to ${bill.name} on ${today} via UPI. UTR: 882910394812. CA: ${bill.consumer_id || '90283182'}.`;
    setSmsText(sample);
    const fallback = parseBillFallback(sample);
    handleApplyParsedResult(fallback, 'Demo Parser');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64 = loadEvent.target?.result as string;
        setImagePreview(base64);
        handleRunGeminiParse(undefined, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Please enter a valid amount paid', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      let inputType: PaymentInputType = 'form';
      if (imagePreview) inputType = 'screenshot';
      else if (smsText.trim()) inputType = 'sms';

      const res = await markBillAsPaid(
        bill.bill_id,
        amount,
        paidDate,
        txnRef.trim() || undefined,
        'web',
        inputType,
        validityDays
      );

      if (!res.success) {
        setIsSubmitting(false);
        return;
      }

      // If user confirmed/edited a consumer ID or mobile number, save to bill's vault details
      if (consumerId && consumerId.trim() !== (bill.consumer_id || '')) {
        await updateBill(bill.bill_id, {
          consumer_id: consumerId.trim(),
          registered_phone: isRecharge ? consumerId.trim() : bill.registered_phone,
        });
      }

      setShowCheckmark(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setShowCheckmark(false);
        onClose();
      }, 700);
    } catch {
      setIsSubmitting(false);
    }
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
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#111113',
          border: '1px solid var(--glass-border)',
          padding: 24,
          borderRadius: 24,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CategoryIcon category={bill.category} showTile size={22} />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
                Mark as Paid
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                {bill.name}
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
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {showCheckmark ? (
          <div
            style={{
              padding: '40px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--color-paid-bg)',
                border: '2px solid var(--color-paid)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <Check size={36} color="var(--color-paid)" strokeWidth={3} />
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-paid)' }}>
              Payment Recorded!
            </div>
          </div>
        ) : (
          <div>
            {/* Input Mode Selector: Details vs Attach SMS vs Screenshot */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: 4,
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 12,
                border: '1px solid var(--glass-border)',
                marginBottom: 16,
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: activeTab === 'details' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'details' ? '#0A0A0B' : 'var(--color-text-secondary)',
                  fontWeight: activeTab === 'details' ? 700 : 500,
                  padding: '6px 10px',
                  borderRadius: 8,
                }}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sms')}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: activeTab === 'sms' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'sms' ? '#0A0A0B' : 'var(--color-text-secondary)',
                  fontWeight: activeTab === 'sms' ? 700 : 500,
                  padding: '6px 10px',
                  borderRadius: 8,
                  gap: 4,
                }}
              >
                <FileText size={13} />
                <span>Attach SMS</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('screenshot')}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: activeTab === 'screenshot' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'screenshot' ? '#0A0A0B' : 'var(--color-text-secondary)',
                  fontWeight: activeTab === 'screenshot' ? 700 : 500,
                  padding: '6px 10px',
                  borderRadius: 8,
                  gap: 4,
                }}
              >
                <ImageIcon size={13} />
                <span>Screenshot</span>
              </button>
            </div>

            {/* Error Message if parsing failed */}
            {parseError && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'var(--color-due-soon-bg)',
                  border: '1px solid var(--color-due-soon-border)',
                  color: 'var(--color-due-soon)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{parseError}</span>
              </div>
            )}

            {/* Parsing Confidence Indicator */}
            {parseConfidence !== null && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: 'var(--color-paid-bg)',
                  border: '1px solid var(--color-paid-border)',
                  color: 'var(--color-paid)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 14,
                }}
              >
                <Sparkles size={14} />
                <span>Gemini AI Auto-Extracted ({Math.round(parseConfidence * 100)}% confidence). Review fields:</span>
              </div>
            )}

            {/* Attach SMS View */}
            {activeTab === 'sms' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Paste payment SMS or email notification:
                </label>
                <textarea
                  placeholder="e.g. Paid Rs 2,450 to Tata Power via UPI on 28 Oct. Ref: UPI90123849"
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="glass-input"
                  rows={4}
                  style={{ fontSize: '0.88rem', resize: 'vertical', marginBottom: 10 }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleRunGeminiParse(smsText)}
                    disabled={!smsText.trim() || isParsing}
                    className="btn btn-sm btn-primary"
                    style={{ flex: 2, gap: 6 }}
                  >
                    <Sparkles size={14} />
                    <span>{isParsing ? 'Parsing with Gemini AI...' : 'Scan SMS with Gemini'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTrySampleSMS}
                    className="btn btn-sm btn-glass"
                    style={{ flex: 1, fontSize: '0.76rem', gap: 4, whiteSpace: 'nowrap' }}
                    title="Fills a canned payment SMS for demonstration"
                  >
                    <span>Try sample SMS</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.7, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.1)' }}>Demo</span>
                  </button>
                </div>
              </div>
            )}

            {/* Screenshot View (Real file picker, camera capture, and paste) */}
            {activeTab === 'screenshot' && (
              <div style={{ marginBottom: 16 }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageFileChange}
                  style={{ display: 'none' }}
                />

                {imagePreview ? (
                  <div style={{ position: 'relative', marginBottom: 10 }}>
                    {/* Image Preview Thumbnail */}
                    <div
                      style={{
                        height: 160,
                        borderRadius: 14,
                        border: '1px solid var(--glass-border)',
                        overflow: 'hidden',
                        position: 'relative',
                        background: '#0A0A0B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Screenshot receipt preview"
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(0, 0, 0, 0.7)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--color-overdue)',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Remove image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '28px 16px',
                      borderRadius: 14,
                      border: '1px dashed var(--glass-border)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={20} color="#FFFFFF" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                        Take photo or upload screenshot
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        Or press Ctrl+V to paste anywhere
                      </div>
                    </div>
                  </div>
                )}

                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => handleRunGeminiParse()}
                    disabled={isParsing}
                    className="btn btn-sm btn-primary"
                    style={{ width: '100%', gap: 6 }}
                  >
                    <Sparkles size={14} />
                    <span>{isParsing ? 'Analyzing screenshot with Gemini...' : 'Re-parse with Gemini'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Editable Form Details */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Amount Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Amount Paid (₹)
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontWeight: 700,
                      color: 'var(--color-text-secondary)',
                      fontSize: '1.2rem',
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="glass-input"
                    style={{ paddingLeft: 34, fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)' }}
                    required
                    id="paid-modal-amount"
                  />
                </div>
              </div>

              {/* Paid Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Date of Payment
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="glass-input"
                    style={{ paddingRight: 36 }}
                    required
                    id="paid-modal-date"
                  />
                  <Calendar
                    size={18}
                    color="var(--color-text-secondary)"
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                </div>
              </div>

              {/* Optional Txn Ref / UPI ID */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  <span>Transaction Ref / UPI UTR</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Optional</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="e.g. UPI48921820"
                    value={txnRef}
                    onChange={(e) => setTxnRef(e.target.value)}
                    className="glass-input"
                    style={{ paddingLeft: 34, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}
                    id="paid-modal-ref"
                  />
                  <Hash
                    size={16}
                    color="var(--color-text-secondary)"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              {/* Consumer ID / Mobile Number (Part 7: For mobile recharges, ask for mobile number only) */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  <span>{isRecharge ? 'Registered Mobile Number' : 'Consumer ID / Account No'}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Saved to Vault</span>
                </label>
                <input
                  type={isRecharge ? 'tel' : 'text'}
                  placeholder={isRecharge ? '10-digit mobile number' : 'e.g. CA-892109'}
                  value={consumerId}
                  onChange={(e) => setConsumerId(e.target.value)}
                  className="glass-input"
                  style={{ fontSize: '0.9rem' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-glass"
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8 }}
                  disabled={isSubmitting}
                  id="confirm-paid-btn"
                >
                  <Check size={18} strokeWidth={2.5} />
                  <span>Confirm Payment</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scaleUp {
          from {
            transform: scale(0.6);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
