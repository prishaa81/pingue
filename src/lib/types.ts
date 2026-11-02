// Type definitions for Bill Reminder System (PRD Version 2)

export type BillCategory =
  | 'electricity'
  | 'gas'
  | 'water'
  | 'maintenance'
  | 'recharge'
  | 'internet'
  | 'subscription'
  | 'other';

export type CycleType = 'days' | 'months' | 'one-time';

export type BillStatus = 'active' | 'ignored' | 'paused';

export type PaymentSource = 'web' | 'telegram';

export type PaymentInputType = 'form' | 'text' | 'sms' | 'screenshot';

export interface UserProfile {
  user_id: string;
  email?: string;
  display_name: string;
  telegram_chat_id: number | null;
  default_remind_days: string; // e.g. "3,1,0"
  monthly_budget: number | null;
  created_at?: string;
}

export interface LinkCode {
  code: string;
  user_id: string;
  expires_at: string;
  used: boolean;
  created_at?: string;
}

export interface Bill {
  bill_id: string;
  user_id: string;
  name: string;
  category: BillCategory;
  icon: string;
  amount: number;
  cycle_type: CycleType;
  cycle_value: number; // e.g., 28 for 28-day recharge, 1 for monthly
  last_paid_date: string | null; // YYYY-MM-DD
  next_due_date: string | null; // YYYY-MM-DD
  remind_days: string; // comma-separated e.g. "3,1,0"
  snoozed_until: string | null; // YYYY-MM-DD
  status: BillStatus;

  // Vault & Provider Reference Details (Part 8)
  provider?: string | null;
  consumer_id?: string | null;
  registered_phone?: string | null;
  registered_email?: string | null;
  support_number?: string | null;
  portal_url?: string | null;
  login_hint?: string | null;
  notes?: string | null;

  created_at?: string;
}

export interface Payment {
  payment_id: string;
  user_id: string;
  bill_id: string | null;
  bill_name?: string;
  bill_category?: BillCategory;
  paid_date: string; // YYYY-MM-DD
  amount_paid: number;
  txn_ref: string | null;
  source: PaymentSource;
  input_type: PaymentInputType;
  created_at?: string;
}

export interface ParsedBillData {
  biller: string;
  amount: number;
  date: string; // YYYY-MM-DD
  cycle_type: CycleType;
  cycle_value: number;
  reference?: string;
  consumer_id?: string | null;
  validity_days?: number | null;
  paid_date?: string | null;
  confidence: number;
  raw_detected?: string;
}

export interface DailySpend {
  month: string;
  amount: number;
}

export interface CategorySpend {
  category: BillCategory;
  amount: number;
  percentage: number;
  count: number;
}
