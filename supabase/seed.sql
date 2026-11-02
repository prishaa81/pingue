-- OPTIONAL MANUAL DEVELOPMENT SEED
-- Run this in the Supabase SQL Editor ONLY if you wish to seed test data for your authenticated user.
-- Replace 'YOUR_USER_UUID_HERE' with your actual Supabase auth.users id.

/*
DO $$
DECLARE
  v_user_id uuid := 'YOUR_USER_UUID_HERE'; -- Paste your Supabase user UUID here
BEGIN
  -- 1. Insert Profile
  INSERT INTO public.profiles (user_id, display_name, default_remind_days, monthly_budget)
  VALUES (v_user_id, 'Test User', '3,1,0', 12000)
  ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name;

  -- 2. Insert Test Bills
  INSERT INTO public.bills (user_id, name, category, icon, amount, cycle_type, cycle_value, next_due_date, remind_days, status, provider, consumer_id)
  VALUES
    (v_user_id, 'Electricity Bill', 'electricity', 'Zap', 2450.00, 'months', 1, CURRENT_DATE + interval '3 days', '3,1,0', 'active', 'Tata Power', 'CA-902831'),
    (v_user_id, 'Mobile Recharge', 'recharge', 'Smartphone', 299.00, 'days', 28, CURRENT_DATE + interval '5 days', '3,1,0', 'active', 'Vi Prepaid', '9820011223'),
    (v_user_id, 'Broadband Internet', 'internet', 'Wifi', 825.00, 'months', 1, CURRENT_DATE + interval '12 days', '3,1,0', 'active', 'ACT Fibernet', 'ACT-102938');

END $$;
*/
