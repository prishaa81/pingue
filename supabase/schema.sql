-- Bill Reminder System (Pingue) - Production Supabase Postgres Schema & RLS
-- Multi-user with Telegram bot integration & Gemini AI parsing quotas

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Linked 1-to-1 with auth.users)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  telegram_chat_id bigint unique,
  default_remind_days text default '3,1,0',
  monthly_budget numeric(12, 2) default null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. LINK CODES (Single-use, expiring code to link Telegram bot to user)
create table if not exists public.link_codes (
  code text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamp with time zone not null,
  used boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. BILLS TABLE (Subscriptions, utility renewals, and recurring payments)
create table if not exists public.bills (
  bill_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null, -- 'electricity', 'gas', 'water', 'maintenance', 'recharge', 'internet', 'subscription', 'other'
  icon text not null default 'Receipt',
  amount numeric(12, 2) not null check (amount >= 0),
  cycle_type text not null check (cycle_type in ('days', 'months', 'one-time')),
  cycle_value integer not null default 1, -- e.g. 28 for recharge days, 1 for monthly
  last_paid_date date,
  next_due_date date,
  remind_days text not null default '3,1,0',
  snoozed_until date default null,
  status text not null default 'active' check (status in ('active', 'paused', 'ignored')),
  
  -- Vault & Provider Reference Details (Part 8)
  provider text,
  consumer_id text,
  registered_phone text,
  registered_email text,
  support_number text,
  portal_url text,
  login_hint text, -- e.g. "MPIN is in notebook" (Never passwords)
  notes text,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for fast queries
create index if not exists idx_bills_user on public.bills (user_id);
create index if not exists idx_bills_reminder on public.bills (status, next_due_date, snoozed_until);

-- 4. PAYMENTS TABLE (History log of completed transactions)
create table if not exists public.payments (
  payment_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bill_id uuid references public.bills(bill_id) on delete set null,
  paid_date date not null default current_date,
  amount_paid numeric(12, 2) not null check (amount_paid >= 0),
  txn_ref text,
  source text not null default 'web' check (source in ('web', 'telegram')),
  input_type text not null default 'form' check (input_type in ('form', 'text', 'sms', 'screenshot')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_payments_user_date on public.payments (user_id, paid_date desc);
-- Enforce unique transaction reference per user to reject duplicates
create unique index if not exists idx_payments_user_txn on public.payments (user_id, txn_ref) 
  where txn_ref is not null and txn_ref <> '';

-- 5. BOT STATE (For multi-step Telegram bot dialogues)
create table if not exists public.bot_state (
  chat_id bigint primary key,
  user_id uuid references auth.users(id) on delete cascade,
  waiting_for text not null, -- 'paid_details', 'confirm_bill', etc.
  bill_id uuid references public.bills(bill_id) on delete set null,
  context_data jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. AI USAGE (Per-user daily quota tracking for Gemini API)
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  count integer not null default 1,
  primary key (user_id, day)
);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.bills enable row level security;
alter table public.payments enable row level security;
alter table public.ai_usage enable row level security;
alter table public.link_codes enable row level security;
alter table public.bot_state enable row level security;

-- Profiles Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- Bills Policies
create policy "Users can view own bills"
  on public.bills for select
  using (auth.uid() = user_id);

create policy "Users can insert own bills"
  on public.bills for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bills"
  on public.bills for update
  using (auth.uid() = user_id);

create policy "Users can delete own bills"
  on public.bills for delete
  using (auth.uid() = user_id);

-- Payments Policies
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Users can insert own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own payments"
  on public.payments for delete
  using (auth.uid() = user_id);

-- Link Codes Policies
create policy "Users can view own link codes"
  on public.link_codes for select
  using (auth.uid() = user_id);

create policy "Users can insert own link codes"
  on public.link_codes for insert
  with check (auth.uid() = user_id);

-- Auto-create profile trigger on auth.users sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
