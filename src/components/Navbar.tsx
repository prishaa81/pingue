'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { PingueLogo } from './PingueLogo';
import {
  LayoutGrid,
  CalendarDays,
  History,
  ShieldCheck,
  Settings,
  Send,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoggedIn, logout } = useAppStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Part 3: Exactly four items: Dashboard, Bills, History, Vault
  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutGrid },
    { href: '/bills', label: 'Bills', icon: CalendarDays },
    { href: '/history', label: 'History', icon: History },
    { href: '/vault', label: 'Vault', icon: ShieldCheck },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [profileOpen]);

  if (!isLoggedIn) {
    return (
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          padding: '14px 24px',
          borderBottom: '1px solid var(--glass-border)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'rgba(10, 10, 11, 0.85)',
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Link href="/welcome" style={{ textDecoration: 'none' }}>
            <PingueLogo size="sm" />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              href="/login"
              className="btn btn-sm btn-glass"
              style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '0.84rem' }}
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="btn btn-sm btn-primary"
              style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '0.84rem' }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const initialLetter = (user?.display_name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: '12px 24px',
        borderBottom: '1px solid var(--glass-border)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        background: 'rgba(10, 10, 11, 0.88)',
      }}
    >
      {/* 3-Column Mathematically Symmetrical Layout (Left: Logo, Center: 4 Nav Tabs, Right: User Actions) */}
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        {/* Left Column: Brand Logo */}
        <div style={{ flex: '1 1 0%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <PingueLogo size="sm" />
          </Link>
        </div>

        {/* Center Column: Exactly 4 Navigation Tabs */}
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <nav
            style={{
              display: 'none',
              gap: 4,
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '4px 6px',
              borderRadius: 9999,
              border: '1px solid var(--glass-border)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            }}
            className="desktop-nav"
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
                    alignItems: 'center',
                    gap: 7,
                    padding: '7px 16px',
                    borderRadius: 9999,
                    fontSize: '0.86rem',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#0A0A0B' : 'var(--color-text-secondary)',
                    background: isActive ? '#FFFFFF' : 'transparent',
                    boxShadow: isActive ? '0 2px 10px rgba(255, 255, 255, 0.2)' : 'none',
                    textDecoration: 'none',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className={`desktop-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} color={isActive ? '#0A0A0B' : 'currentColor'} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Column: Telegram indicator & User Profile Menu */}
        <div style={{ flex: '1 1 0%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          {/* Telegram status indicator chip */}
          <Link
            href="/settings"
            title={user?.telegram_chat_id ? 'Telegram Bot Connected' : 'Telegram Bot Unlinked'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 9999,
              background: user?.telegram_chat_id ? 'var(--color-paid-bg)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${user?.telegram_chat_id ? 'var(--color-paid-border)' : 'var(--glass-border)'}`,
              fontSize: '0.78rem',
              color: user?.telegram_chat_id ? 'var(--color-paid)' : 'var(--color-text-secondary)',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            className="navbar-telegram-chip"
          >
            <Send size={13} color={user?.telegram_chat_id ? 'var(--color-paid)' : 'currentColor'} />
            <span>{user?.telegram_chat_id ? 'Bot Linked' : 'Link Bot'}</span>
          </Link>

          {/* Profile Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px 4px 5px',
                borderRadius: 9999,
                background: profileOpen ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.06)',
                border: profileOpen ? '1px solid var(--color-accent-border)' : '1px solid var(--glass-border)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              id="profile-menu-btn"
              aria-haspopup="true"
              aria-expanded={profileOpen}
            >
              {/* Avatar circle */}
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                {initialLetter}
              </div>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                {user?.display_name || user?.email?.split('@')[0] || 'User'}
              </span>
              <ChevronDown
                size={14}
                color="var(--color-text-secondary)"
                style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
              />
            </button>

            {/* Dropdown Panel (Settings and Log out) */}
            {profileOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  minWidth: 230,
                  background: 'rgba(18, 18, 20, 0.98)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 16,
                  padding: '8px',
                  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
                  zIndex: 100,
                  animation: 'pageEnter 0.15s cubic-bezier(0.16, 1, 0.3, 1) both',
                }}
              >
                {/* User info header: real name & email */}
                <div
                  style={{
                    padding: '10px 12px 12px',
                    borderBottom: '1px solid var(--glass-border)',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {user?.display_name || 'User'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {user?.email || (user?.telegram_chat_id ? '✓ Telegram linked' : 'Telegram unlinked')}
                  </div>
                </div>

                {/* Settings option */}
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 10,
                    fontSize: '0.86rem',
                    fontWeight: 500,
                    color: 'var(--color-text-main)',
                    textDecoration: 'none',
                    transition: 'background 0.12s ease',
                  }}
                  className="profile-menu-item"
                  id="profile-dropdown-settings"
                >
                  <Settings size={15} color="var(--color-accent)" />
                  <span>Settings &amp; Account</span>
                </Link>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--glass-border)', margin: '6px 0' }} />

                {/* Logout: clears session and returns to Welcome page */}
                <button
                  onClick={async () => {
                    setProfileOpen(false);
                    await logout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 10,
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#F43F5E',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.12s ease',
                  }}
                  className="profile-menu-item profile-menu-logout"
                  id="navbar-logout-btn"
                >
                  <LogOut size={15} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 820px) {
          .desktop-nav {
            display: flex !important;
          }
        }
        .desktop-nav-link:not(.active):hover {
          color: #FFFFFF !important;
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .navbar-telegram-chip:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
        }
        .profile-menu-item:hover {
          background: rgba(255, 255, 255, 0.06) !important;
        }
        .profile-menu-logout:hover {
          background: rgba(244, 63, 94, 0.1) !important;
        }
      `}</style>
    </header>
  );
}
