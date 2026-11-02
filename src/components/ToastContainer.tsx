'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { CheckCircle2, AlertTriangle, Info, XCircle, RotateCcw, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, dismissToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let iconColor = 'var(--color-paid)';

        if (toast.type === 'error') {
          Icon = XCircle;
          iconColor = 'var(--color-overdue)';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'var(--color-due-soon)';
        } else if (toast.type === 'info') {
          Icon = Info;
          iconColor = 'var(--color-text-main)';
        }

        return (
          <div key={toast.id} className="toast-item" role="status">
            <Icon size={18} color={iconColor} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, lineHeight: 1.35, fontSize: '0.86rem', color: 'var(--color-text-main)' }}>
              {toast.message}
            </div>

            {toast.undoAction && (
              <button
                onClick={() => {
                  toast.undoAction?.();
                  dismissToast(toast.id);
                }}
                className="btn btn-sm btn-glass"
                style={{
                  padding: '3px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.76rem',
                }}
              >
                <RotateCcw size={12} />
                <span>Undo</span>
              </button>
            )}

            <button
              onClick={() => dismissToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                padding: 4,
              }}
              aria-label="Dismiss toast"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
