import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { sendTelegramMessage, formatBillAlert } from '@/lib/telegram';
import { Bill } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify cron secret (PRD Page 13: "The cron endpoint requires a secret")
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const urlKey = req.nextUrl.searchParams.get('key');

    if (cronSecret) {
      const isAuthorized =
        authHeader === `Bearer ${cronSecret}` ||
        urlKey === cronSecret;

      if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase service role client is not configured' },
        { status: 500 }
      );
    }

    const billsToAlert: Array<{ bill: Bill; chatId: number; daysRemaining: number }> = [];

    // Query active bills joined with user profiles
    const { data: bills, error } = await supabase
      .from('bills')
      .select('*, profiles!inner(telegram_chat_id, default_remind_days)')
      .eq('status', 'active');

    if (error) {
      console.error('Database query error in cron:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const item of bills || []) {
      const chatId = item.profiles?.telegram_chat_id;
      if (!chatId) continue;

      // Check if snoozed
      if (item.snoozed_until && item.snoozed_until > todayStr) {
        continue;
      }

      const dueDate = item.next_due_date ? new Date(item.next_due_date) : null;
      if (!dueDate) continue;
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Parse user lead days
      const leadDays = (item.remind_days || item.profiles?.default_remind_days || '3,1,0')
        .split(',')
        .map((d: string) => parseInt(d.trim(), 10));

      // Alert if today matches lead days, or overdue, or un-snoozed today
      if (leadDays.includes(daysRemaining) || daysRemaining < 0 || item.snoozed_until === todayStr) {
        billsToAlert.push({
          bill: item as Bill,
          chatId,
          daysRemaining,
        });
      }
    }

    // 2. Dispatch alerts to Telegram
    let sentCount = 0;
    for (const item of billsToAlert) {
      const { message, keyboard } = formatBillAlert(item.bill, item.daysRemaining);
      const ok = await sendTelegramMessage(item.chatId, message, keyboard);
      if (ok) sentCount++;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      checkedCount: billsToAlert.length,
      alertsDispatched: sentCount,
      billsAlerted: billsToAlert.map((b) => ({
        bill_id: b.bill.bill_id,
        name: b.bill.name,
        daysRemaining: b.daysRemaining,
      })),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown cron error';
    console.error('Cron job exception:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
