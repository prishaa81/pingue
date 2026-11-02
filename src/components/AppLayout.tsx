'use client';

import React, { useState } from 'react';
import { AppProvider } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { ToastContainer } from '@/components/ToastContainer';
import { AddBillModal } from '@/components/AddBillModal';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <AppProvider>
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1 }}>{children}</div>

        {/* Professional Website Footer */}
        <footer
          style={{
            borderTop: '1px solid var(--glass-border)',
            padding: '28px 20px',
            textAlign: 'center',
            background: 'rgba(10, 10, 11, 0.6)',
          }}
          className="app-footer"
        >
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              <a href="/privacy" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Privacy Policy</a>
              <span>·</span>
              <a href="/terms" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Terms &amp; Conditions</a>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: 500, margin: 0 }}>
              © {new Date().getFullYear()} Pingue. All rights reserved.
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Designed &amp; Developed by <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>Pshetty</span>
            </p>
          </div>
        </footer>

        <BottomNav />
        <ToastContainer />

        <AddBillModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .app-footer {
            padding-bottom: 80px !important;
          }
        }
      `}</style>
    </AppProvider>
  );
}
