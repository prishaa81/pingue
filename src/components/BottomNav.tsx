'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { LayoutGrid, CalendarDays, History, ShieldCheck } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAppStore();

  if (!isLoggedIn) return null;

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutGrid },
    { href: '/bills', label: 'Bills', icon: CalendarDays },
    { href: '/history', label: 'History', icon: History },
    { href: '/vault', label: 'Vault', icon: ShieldCheck },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 68,
        background: 'rgba(10, 10, 11, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 8px',
        zIndex: 50,
      }}
      className="mobile-bottom-nav"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
              fontSize: '0.68rem',
              fontWeight: isActive ? 700 : 500,
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 12,
              background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              transition: 'all 0.15s ease',
              minWidth: 54,
              justifyContent: 'center',
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} color={isActive ? '#FFFFFF' : 'currentColor'} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <style jsx>{`
        @media (min-width: 820px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
