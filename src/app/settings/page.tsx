'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import {
  Send,
  Bell,
  Check,
  Copy,
  ExternalLink,
  User,
  KeyRound,
  Trash2,
  AlertTriangle,
  Sparkles,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const {
    user,
    linkCode,
    generateTelegramLinkCode,
    updateUserSettings,
    unlinkTelegram,
    updatePassword,
    deleteAccount,
    showToast,
    isLoggedIn,
    isLoading,
  } = useAppStore();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/welcome');
    }
  }, [isLoading, isLoggedIn, router]);

  const [copied, setCopied] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // AI Diagnostic State
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<any | null>(null);

  // Default reminder days selection
  const userRemindDays = (user?.default_remind_days || '3,1,0')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));

  const [selectedDays, setSelectedDays] = useState<number[]>(userRemindDays);

  const handleGenerateCode = async () => {
    await generateTelegramLinkCode();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(`/start ${code}`);
    setCopied(true);
    showToast(`Copied "/start ${code}" to clipboard!`, 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleToggleDay = (day: number) => {
    let next: number[];
    if (selectedDays.includes(day)) {
      next = selectedDays.filter((d) => d !== day);
    } else {
      next = [...selectedDays, day].sort((a, b) => b - a);
    }
    setSelectedDays(next);
    updateUserSettings({ default_remind_days: next.join(',') });
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    await updateUserSettings({ display_name: displayName.trim() });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await updatePassword(newPassword);
      if (res.success) {
        setNewPassword('');
      } else {
        showToast(res.error || 'Failed to update password', 'error');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleTestAIParsing = async () => {
    setIsTestingAI(true);
    setAiTestResult(null);
    try {
      const res = await fetch('/api/test-ai-parsing');
      const data = await res.json();
      setAiTestResult(data);
      if (data.status === 'success') {
        showToast('AI parser test succeeded!', 'success');
      } else {
        showToast(`AI diagnostic returned ${data.status}`, 'warning');
      }
    } catch (err: any) {
      setAiTestResult({
        status: 'error',
        errorMessage: err?.message || 'Network request failed',
      });
      showToast('AI parse test failed', 'error');
    } finally {
      setIsTestingAI(false);
    }
  };

  if (isLoading) {
    return (
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Loading settings...
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 840, margin: '0 auto', padding: '24px 16px 100px 16px' }}>
      {/* Title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
          Settings &amp; Account
        </h1>
        <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
          Manage your profile, Telegram alerts, AI parsing diagnostics, reminder windows, and security
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Section 1: User Profile (Name, Email) */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div className="category-tile" style={{ width: 40, height: 40 }}>
              <User size={18} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                Profile Details
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                Your account identity across Pingue
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Display Name
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="glass-input"
                  style={{ maxWidth: 320 }}
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="btn btn-sm btn-primary"
                  style={{ padding: '6px 16px' }}
                >
                  Save
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                Email Address
              </label>
              <span style={{ fontSize: '0.92rem', color: 'var(--color-text-main)', fontFamily: 'var(--font-mono)' }}>
                {user?.email || 'Logged in user'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: AI Parsing Diagnostics (Part 1 Requirement 4) */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="category-tile" style={{ width: 40, height: 40 }}>
                <Cpu size={18} color="#FFFFFF" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                  Gemini AI Parser Diagnostics
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  Test model availability, structured JSON extraction, and offline fallback
                </p>
              </div>
            </div>

            <button
              onClick={handleTestAIParsing}
              disabled={isTestingAI}
              className="btn btn-sm btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}
              id="test-ai-parsing-btn"
            >
              {isTestingAI ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Testing Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Test AI parsing</span>
                </>
              )}
            </button>
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
            Sends a real sample SMS (<em>&quot;Paid Rs 1,499 to Tata Power on 28-10-2026 for CA 100234567. UTR: 628945612344.&quot;</em>) to Google&apos;s Gemini API and verifies structured field extraction.
          </div>

          {aiTestResult && (
            <div
              style={{
                marginTop: 14,
                padding: 18,
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {aiTestResult.status === 'success' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-paid)', fontWeight: 700, fontSize: '0.85rem' }}>
                      <CheckCircle2 size={16} /> Operational
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-overdue)', fontWeight: 700, fontSize: '0.85rem' }}>
                      <AlertCircle size={16} /> Status: {aiTestResult.status} ({aiTestResult.httpStatus || 'N/A'})
                    </span>
                  )}
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    • Model: <code style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>{aiTestResult.resolvedModel || 'auto-discovered'}</code>
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    • API Key: <code style={{ color: aiTestResult.apiKeyStatus === 'set' ? 'var(--color-paid)' : 'var(--color-overdue)' }}>{aiTestResult.apiKeyStatus}</code>
                  </span>
                </div>
              </div>

              {aiTestResult.parseResult && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginTop: 4 }}>
                  <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Biller</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{aiTestResult.parseResult.biller}</div>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Amount</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-main)' }}>₹{aiTestResult.parseResult.amount}</div>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Date</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{aiTestResult.parseResult.date}</div>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Txn / UTR</div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-text-main)', fontFamily: 'var(--font-mono)' }}>
                      {aiTestResult.parseResult.txn_ref || 'N/A'}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Consumer ID</div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-text-main)', fontFamily: 'var(--font-mono)' }}>
                      {aiTestResult.parseResult.consumer_id || 'N/A'}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Parser Used</div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                      {aiTestResult.parseResult.parserUsed || 'gemini'}
                    </div>
                  </div>
                </div>
              )}

              {aiTestResult.errorMessage && (
                <div style={{ padding: 12, borderRadius: 10, background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', fontSize: '0.82rem', color: 'var(--color-overdue)' }}>
                  <strong>Error details:</strong> {aiTestResult.errorMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 3: Telegram Bot Linking & Re-linking */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="category-tile" style={{ width: 40, height: 40 }}>
              <Send size={18} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                Telegram Bot Alerts &amp; Quick Logging
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                Receive daily reminder notifications with [Paid], [Snooze], and [Ignore] actions
              </p>
            </div>
          </div>

          {user?.telegram_chat_id ? (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 16,
                background: 'var(--color-paid-bg)',
                border: '1px solid var(--color-paid-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-paid)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={16} /> Telegram Connected
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 4, display: 'block' }}>
                  Linked Chat ID: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-main)' }}>{user.telegram_chat_id}</code>
                </span>
              </div>
              <button
                onClick={unlinkTelegram}
                className="btn btn-sm btn-glass"
                style={{ color: 'var(--color-overdue)', borderColor: 'var(--color-overdue-border)' }}
              >
                Disconnect Bot
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Link your Telegram account to receive real-time alerts before bills are due. Generate a one-time code and send it to our bot:
              </p>

              {linkCode ? (
                <div
                  style={{
                    padding: 18,
                    borderRadius: 16,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>Send this in Telegram:</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', margin: '4px 0' }}>
                      /start {linkCode}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
                      Expires in 15 minutes
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleCopyCode(linkCode)}
                      className="btn btn-sm btn-glass"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {copied ? <Check size={14} color="var(--color-paid)" /> : <Copy size={14} />}
                      <span>{copied ? 'Copied' : 'Copy Command'}</span>
                    </button>
                    <a
                      href={`https://t.me/Pingue1_bot?start=${linkCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                    >
                      <span>Open Bot</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateCode}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start' }}
                  id="generate-link-code-btn"
                >
                  Generate Linking Code
                </button>
              )}
            </div>
          )}
        </div>

        {/* Section 4: Default Reminder Lead Times */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div className="category-tile" style={{ width: 40, height: 40 }}>
              <Bell size={18} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                Default Reminder Lead Times
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                Applied automatically to new bills unless specifically overridden
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {[7, 5, 3, 2, 1, 0].map((d) => {
              const label = d === 0 ? 'On Due Day' : `${d} Days Before`;
              const isChecked = selectedDays.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => handleToggleDay(d)}
                  className="btn btn-sm"
                  style={{
                    background: isChecked ? 'var(--color-accent-bg)' : 'rgba(255, 255, 255, 0.05)',
                    border: isChecked ? '1px solid var(--color-accent-border)' : '1px solid var(--glass-border)',
                    color: isChecked ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    fontWeight: isChecked ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isChecked && <Check size={14} color="var(--color-accent)" strokeWidth={3} />}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 5: Security & Change Password */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="category-tile" style={{ width: 40, height: 40 }}>
              <KeyRound size={18} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                Change Password
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                Update your account password with Supabase Auth
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
            <input
              type="password"
              placeholder="Enter new password (min. 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="glass-input"
              minLength={6}
            />
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              style={{ alignSelf: 'flex-start' }}
              disabled={isUpdatingPassword || !newPassword}
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Section 6: Danger Zone (Delete Account) */}
        <div
          className="glass-card"
          style={{
            padding: 24,
            borderRadius: 22,
            border: '1px solid rgba(244, 63, 94, 0.25)',
            background: 'rgba(244, 63, 94, 0.03)',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-overdue)', marginBottom: 6 }}>
            Danger Zone
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            Permanently delete your account, bills, and payment records. This action cannot be reversed.
          </p>

          {showDeleteConfirm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={deleteAccount}
                className="btn btn-sm"
                style={{ background: 'var(--color-overdue)', color: '#FFFFFF', fontWeight: 700 }}
              >
                Confirm Account Deletion
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-sm btn-glass"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-sm btn-glass"
              style={{ color: 'var(--color-overdue)', borderColor: 'var(--color-overdue-border)', gap: 6 }}
            >
              <Trash2 size={14} />
              <span>Delete Account &amp; All Data</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
