// Design tokens, Monochrome Glass color palette, and category mappings
// PRD & Requirement: Monochrome Glass (Black, white, and grey with status-only accents)
import { BillCategory } from './types';

export const COLORS = {
  background: '#0A0A0B', // Near-black
  glassSurface: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassSurfaceHover: 'rgba(255, 255, 255, 0.09)',

  // Text Contrast Tokens (Strictly >= 4.5:1 against dark glass)
  textPrimary: '#F5F5F6', // Crisp near-white
  textSecondary: '#9A9AA3', // Readable mid-grey
  textMuted: '#6B6B74', // Dim label grey

  // Status colors (THE ONLY COLORS IN THE ENTIRE APP)
  paid: '#34D399', // Green
  paidBg: 'rgba(52, 211, 153, 0.15)',
  paidBorder: 'rgba(52, 211, 153, 0.3)',

  dueSoon: '#FBBF24', // Amber
  dueSoonBg: 'rgba(251, 191, 36, 0.15)',
  dueSoonBorder: 'rgba(251, 191, 36, 0.3)',

  overdue: '#F43F5E', // Red
  overdueBg: 'rgba(244, 63, 94, 0.15)',
  overdueBorder: 'rgba(244, 63, 94, 0.3)',
  overdueCardBorder: 'rgba(244, 63, 94, 0.4)',
  overdueCardGlow: '0 0 20px rgba(244, 63, 94, 0.15)',

  // Monochrome Chart Shades
  chartWhite: '#FFFFFF',
  chartGrey1: '#D4D4D8',
  chartGrey2: '#A1A1AA',
  chartGrey3: '#71717A',
  chartGrey4: '#52525B',
  chartGrey5: '#3F3F46',
};

export interface CategoryMeta {
  label: string;
  icon: string;
  emoji: string;
}

// Icon tiles: each bill type keeps distinct line icon in a rounded grey glass tile with a white icon.
// Differentiate types by icon shape, not by colour.
export const CATEGORY_META: Record<BillCategory, CategoryMeta> = {
  electricity: {
    label: 'Electricity',
    icon: 'Zap',
    emoji: '⚡',
  },
  gas: {
    label: 'Gas',
    icon: 'Flame',
    emoji: '🔥',
  },
  water: {
    label: 'Water',
    icon: 'Droplets',
    emoji: '💧',
  },
  maintenance: {
    label: 'Maintenance',
    icon: 'Building2',
    emoji: '🏢',
  },
  recharge: {
    label: 'Mobile Recharge',
    icon: 'Smartphone',
    emoji: '📱',
  },
  internet: {
    label: 'Internet / Wi-Fi',
    icon: 'Wifi',
    emoji: '🌐',
  },
  subscription: {
    label: 'Subscription',
    icon: 'PlayCircle',
    emoji: '🍿',
  },
  other: {
    label: 'Other Bill',
    icon: 'Receipt',
    emoji: '🧾',
  },
};
