'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Bill, Payment, UserProfile, BillStatus, PaymentSource, PaymentInputType, CycleType } from './types';
import { supabase } from './supabase';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  undoAction?: () => void;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  requiresEmailConfirmation?: boolean;
}

interface AppContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  bills: Bill[];
  payments: Payment[];
  toasts: Toast[];
  isLoading: boolean;
  linkCode: string | null;
  linkCodeExpires: string | null;

  // Real Supabase Auth actions
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  deleteAccount: () => Promise<void>;

  // Real Database Bill actions
  addBill: (billData: Omit<Bill, 'bill_id' | 'user_id' | 'created_at'>) => Promise<Bill | null>;
  updateBill: (billId: string, updates: Partial<Bill>) => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;
  togglePauseBill: (billId: string) => Promise<void>;
  markBillAsPaid: (
    billId: string,
    amount: number,
    paidDate: string,
    txnRef?: string,
    source?: PaymentSource,
    inputType?: PaymentInputType,
    validityDays?: number
  ) => Promise<{ success: boolean; error?: string }>;

  // Payment actions
  addPayment: (paymentData: Omit<Payment, 'payment_id' | 'user_id' | 'created_at'>) => Promise<Payment | null>;
  deletePayment: (paymentId: string) => Promise<void>;

  // Telegram Linking & Settings
  generateTelegramLinkCode: () => Promise<string | null>;
  updateUserSettings: (updates: Partial<UserProfile>) => Promise<void>;
  unlinkTelegram: () => Promise<void>;

  // Refetch
  refreshData: () => Promise<void>;

  // Toasts
  showToast: (message: string, type?: Toast['type'], undoAction?: () => void) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

/**
 * Calculates the next due date based on cycle type, cycle value, or validity days
 */
export function calculateNextDueDate(
  fromDate: string,
  cycleType: CycleType,
  cycleValue: number,
  validityDays?: number
): string | null {
  if (cycleType === 'one-time') return null;

  const base = new Date(fromDate || new Date().toISOString().split('T')[0]);
  if (isNaN(base.getTime())) return null;

  if (validityDays && validityDays > 0) {
    base.setDate(base.getDate() + validityDays);
  } else if (cycleType === 'days') {
    base.setDate(base.getDate() + (cycleValue || 28));
  } else if (cycleType === 'months') {
    base.setMonth(base.getMonth() + (cycleValue || 1));
  }

  return base.toISOString().split('T')[0];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkCodeExpires, setLinkCodeExpires] = useState<string | null>(null);

  // Show Toast
  const showToast = useCallback(
    (message: string, type: Toast['type'] = 'success', undoAction?: () => void) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type, undoAction }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, undoAction ? 7000 : 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all user data from Supabase
  const fetchUserData = useCallback(async (userId: string, email?: string) => {
    if (!supabase) return;

    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileErr) {
        console.error('Error fetching profile:', profileErr);
      }

      const activeProfile: UserProfile = {
        user_id: userId,
        email: email || '',
        display_name: profileData?.display_name || email?.split('@')[0] || 'User',
        telegram_chat_id: profileData?.telegram_chat_id || null,
        default_remind_days: profileData?.default_remind_days || '3,1,0',
        monthly_budget: profileData?.monthly_budget ? Number(profileData.monthly_budget) : null,
        created_at: profileData?.created_at,
      };

      setUser(activeProfile);
      setIsLoggedIn(true);

      // 2. Fetch Bills (Scoped to logged-in user via RLS)
      const { data: billsData, error: billsErr } = await supabase
        .from('bills')
        .select('*')
        .order('next_due_date', { ascending: true, nullsFirst: false });

      if (billsErr) {
        console.error('Error fetching bills:', billsErr);
      } else {
        setBills(
          (billsData || []).map((b) => ({
            ...b,
            amount: Number(b.amount),
          }))
        );
      }

      // 3. Fetch Payments (Scoped to logged-in user via RLS)
      const { data: paymentsData, error: paymentsErr } = await supabase
        .from('payments')
        .select('*')
        .order('paid_date', { ascending: false });

      if (paymentsErr) {
        console.error('Error fetching payments:', paymentsErr);
      } else {
        setPayments(
          (paymentsData || []).map((p) => ({
            ...p,
            amount_paid: Number(p.amount_paid),
          }))
        );
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, []);

  // Initial Auth check on mount
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          await fetchUserData(session.user.id, session.user.email);
        } else if (mounted) {
          setUser(null);
          setIsLoggedIn(false);
          setBills([]);
          setPayments([]);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase Auth state changes
    const { data: { subscription } } = supabase
      ? supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user && mounted) {
            await fetchUserData(session.user.id, session.user.email);
          } else if (mounted) {
            setUser(null);
            setIsLoggedIn(false);
            setBills([]);
            setPayments([]);
          }
        })
      : { data: { subscription: null } };

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserData]);

  const refreshData = async () => {
    if (user?.user_id) {
      await fetchUserData(user.user_id, user.email);
    }
  };

  // Real Supabase Login
  const login = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Database service not configured' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await fetchUserData(data.user.id, data.user.email);
        showToast('Welcome back!', 'success');
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
    }
  };

  // Real Supabase Signup
  const signup = async (name: string, email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Database service not configured' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: name.trim(),
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        if (!data.session) {
          // Email confirmation is required by Supabase
          return {
            success: true,
            requiresEmailConfirmation: true,
          };
        }

        // Active session exists immediately
        await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            display_name: name.trim(),
            default_remind_days: '3,1,0',
          });

        await fetchUserData(data.user.id, data.user.email);
        showToast('Account created successfully!', 'success');
        return { success: true, requiresEmailConfirmation: false };
      }

      return { success: false, error: 'Signup failed' };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Signup failed' };
    }
  };

  // Logout
  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsLoggedIn(false);
    setBills([]);
    setPayments([]);
    if (typeof window !== 'undefined') {
      window.location.href = '/welcome';
    }
  };

  // Reset Password
  const resetPasswordForEmail = async (email: string): Promise<AuthResult> => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/settings`,
    });
    if (error) return { success: false, error: error.message };
    showToast('Password reset link sent to your email', 'info');
    return { success: true };
  };

  // Update Password
  const updatePassword = async (password: string): Promise<AuthResult> => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { success: false, error: error.message };
    showToast('Password updated successfully', 'success');
    return { success: true };
  };

  // Delete Account
  const deleteAccount = async () => {
    if (!supabase || !user) return;
    try {
      await supabase.from('profiles').delete().eq('user_id', user.user_id);
      await logout();
      showToast('Account deleted', 'info');
    } catch (err) {
      console.error('Delete account error:', err);
    }
  };

  // Add Bill
  const addBill = async (billData: Omit<Bill, 'bill_id' | 'user_id' | 'created_at'>): Promise<Bill | null> => {
    if (!supabase || !user) {
      showToast('You must be logged in to add a bill', 'error');
      return null;
    }

    try {
      const payload = {
        ...billData,
        user_id: user.user_id,
        amount: Number(billData.amount),
      };

      const { data, error } = await supabase
        .from('bills')
        .insert(payload)
        .select()
        .single();

      if (error) {
        showToast(`Failed to add bill: ${error.message}`, 'error');
        return null;
      }

      const formatted: Bill = {
        ...data,
        amount: Number(data.amount),
      };

      setBills((prev) => [...prev, formatted]);
      showToast(`Added ${formatted.name}`, 'success');
      return formatted;
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error adding bill', 'error');
      return null;
    }
  };

  // Update Bill
  const updateBill = async (billId: string, updates: Partial<Bill>) => {
    if (!supabase || !user) return;

    try {
      const { error } = await supabase
        .from('bills')
        .update(updates)
        .eq('bill_id', billId)
        .eq('user_id', user.user_id);

      if (error) {
        showToast(`Error updating bill: ${error.message}`, 'error');
        return;
      }

      setBills((prev) =>
        prev.map((b) => (b.bill_id === billId ? { ...b, ...updates } : b))
      );
      showToast('Bill updated', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error updating bill', 'error');
    }
  };

  // Delete Bill
  const deleteBill = async (billId: string) => {
    if (!supabase || !user) return;

    const previousBills = [...bills];
    setBills((prev) => prev.filter((b) => b.bill_id !== billId));

    try {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('bill_id', billId)
        .eq('user_id', user.user_id);

      if (error) {
        setBills(previousBills);
        showToast(`Failed to delete bill: ${error.message}`, 'error');
        return;
      }

      showToast('Bill deleted', 'info');
    } catch {
      setBills(previousBills);
    }
  };

  // Toggle Pause/Resume Bill
  const togglePauseBill = async (billId: string) => {
    const target = bills.find((b) => b.bill_id === billId);
    if (!target) return;

    const newStatus: BillStatus = target.status === 'paused' ? 'active' : 'paused';
    await updateBill(billId, { status: newStatus });
    showToast(newStatus === 'paused' ? 'Bill paused' : 'Bill resumed', 'info');
  };

  // Mark Bill as Paid (Parts 6 & 7: move next_due_date forward, prevent duplicates)
  const markBillAsPaid = async (
    billId: string,
    amount: number,
    paidDate: string,
    txnRef?: string,
    source: PaymentSource = 'web',
    inputType: PaymentInputType = 'form',
    validityDays?: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    const bill = bills.find((b) => b.bill_id === billId);
    if (!bill) {
      return { success: false, error: 'Bill not found' };
    }

    // Check for duplicate payment transaction reference if reference provided
    if (txnRef && txnRef.trim()) {
      const trimmedRef = txnRef.trim();
      const existingTxn = payments.find((p) => p.txn_ref === trimmedRef);
      if (existingTxn) {
        showToast(`Payment with ref "${trimmedRef}" already recorded!`, 'warning');
        return { success: false, error: 'Duplicate transaction reference' };
      }
    }

    try {
      // 1. Insert payment into public.payments
      const paymentPayload = {
        user_id: user.user_id,
        bill_id: bill.bill_id,
        amount_paid: Number(amount),
        paid_date: paidDate,
        txn_ref: txnRef?.trim() || null,
        source,
        input_type: inputType,
      };

      const { data: newPaymentData, error: payErr } = await supabase
        .from('payments')
        .insert(paymentPayload)
        .select()
        .single();

      if (payErr) {
        if (payErr.code === '23505') {
          showToast('Duplicate payment reference rejected', 'error');
          return { success: false, error: 'Duplicate transaction reference' };
        }
        showToast(`Failed to record payment: ${payErr.message}`, 'error');
        return { success: false, error: payErr.message };
      }

      // 2. Advance bill next_due_date forward and set last_paid_date (Part 6)
      const nextDue = calculateNextDueDate(
        paidDate,
        bill.cycle_type,
        bill.cycle_value,
        validityDays
      );

      const billUpdates: Partial<Bill> = {
        last_paid_date: paidDate,
        next_due_date: nextDue,
        status: bill.cycle_type === 'one-time' ? 'paused' : 'active',
        snoozed_until: null,
      };

      const { error: billUpdateErr } = await supabase
        .from('bills')
        .update(billUpdates)
        .eq('bill_id', bill.bill_id)
        .eq('user_id', user.user_id);

      if (billUpdateErr) {
        console.error('Error updating bill after payment:', billUpdateErr);
      }

      // Update local state
      const createdPayment: Payment = {
        ...newPaymentData,
        amount_paid: Number(newPaymentData.amount_paid),
        bill_name: bill.name,
        bill_category: bill.category,
      };

      setPayments((prev) => [createdPayment, ...prev]);
      setBills((prev) =>
        prev.map((b) => (b.bill_id === billId ? { ...b, ...billUpdates } : b))
      );

      showToast(`Paid ₹${amount.toLocaleString('en-IN')} for ${bill.name}!`, 'success');
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  // Add Independent Payment (e.g. from receipt scanning without prior bill)
  const addPayment = async (
    paymentData: Omit<Payment, 'payment_id' | 'user_id' | 'created_at'>
  ): Promise<Payment | null> => {
    if (!supabase || !user) return null;

    try {
      const payload = {
        ...paymentData,
        user_id: user.user_id,
        amount_paid: Number(paymentData.amount_paid),
      };

      const { data, error } = await supabase
        .from('payments')
        .insert(payload)
        .select()
        .single();

      if (error) {
        showToast(`Payment record error: ${error.message}`, 'error');
        return null;
      }

      const formatted: Payment = {
        ...data,
        amount_paid: Number(data.amount_paid),
      };

      setPayments((prev) => [formatted, ...prev]);
      showToast(`Payment of ₹${formatted.amount_paid} recorded!`, 'success');
      return formatted;
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error recording payment', 'error');
      return null;
    }
  };

  // Delete Payment
  const deletePayment = async (paymentId: string) => {
    if (!supabase || !user) return;

    const previous = [...payments];
    setPayments((prev) => prev.filter((p) => p.payment_id !== paymentId));

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('payment_id', paymentId)
        .eq('user_id', user.user_id);

      if (error) {
        setPayments(previous);
        showToast(`Failed to delete payment: ${error.message}`, 'error');
        return;
      }

      showToast('Payment record removed', 'info');
    } catch {
      setPayments(previous);
    }
  };

  // Generate Telegram Link Code in Supabase
  const generateTelegramLinkCode = async (): Promise<string | null> => {
    if (!supabase || !user) return null;

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    try {
      const { error } = await supabase.from('link_codes').insert({
        code,
        user_id: user.user_id,
        expires_at: expires,
        used: false,
      });

      if (error) {
        showToast(`Could not generate code: ${error.message}`, 'error');
        return null;
      }

      setLinkCode(code);
      setLinkCodeExpires(expires);
      return code;
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error generating code', 'error');
      return null;
    }
  };

  // Update Settings
  const updateUserSettings = async (updates: Partial<UserProfile>) => {
    if (!supabase || !user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.user_id);

      if (error) {
        showToast(`Failed to save settings: ${error.message}`, 'error');
        return;
      }

      setUser((prev) => (prev ? { ...prev, ...updates } : null));
      showToast('Settings saved', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error saving settings', 'error');
    }
  };

  // Unlink Telegram
  const unlinkTelegram = async () => {
    if (!supabase || !user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ telegram_chat_id: null })
        .eq('user_id', user.user_id);

      if (error) {
        showToast(`Failed to unlink bot: ${error.message}`, 'error');
        return;
      }

      setUser((prev) => (prev ? { ...prev, telegram_chat_id: null } : null));
      showToast('Telegram disconnected', 'info');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error disconnecting bot', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isLoggedIn,
        bills,
        payments,
        toasts,
        isLoading,
        linkCode,
        linkCodeExpires,
        login,
        signup,
        logout,
        resetPasswordForEmail,
        updatePassword,
        deleteAccount,
        addBill,
        updateBill,
        deleteBill,
        togglePauseBill,
        markBillAsPaid,
        addPayment,
        deletePayment,
        generateTelegramLinkCode,
        updateUserSettings,
        unlinkTelegram,
        refreshData,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return ctx;
}
