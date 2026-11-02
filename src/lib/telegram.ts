// Telegram Bot API helpers for sending messages, inline buttons, and alerts
import { Bill } from './types';
import { CATEGORY_META } from './constants';

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  inlineKeyboard?: InlineKeyboardButton[][]
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('Telegram bot token not configured. Simulating message dispatch to chat:', chatId);
    return false;
  }

  try {
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };

    if (inlineKeyboard && inlineKeyboard.length > 0) {
      payload.reply_markup = {
        inline_keyboard: inlineKeyboard,
      };
    }

    const res = await fetch(`${TELEGRAM_API_URL}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

export async function answerTelegramCallback(callbackQueryId: string, text?: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  try {
    const res = await fetch(`${TELEGRAM_API_URL}${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text || 'Action received!',
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('Error answering telegram callback:', err);
    return false;
  }
}

/**
 * Formats a Telegram reminder alert matching PRD specification
 */
export function formatBillAlert(bill: Bill, daysRemaining: number): {
  message: string;
  keyboard: InlineKeyboardButton[][];
} {
  const meta = CATEGORY_META[bill.category] || CATEGORY_META.other;
  const emoji = meta.emoji;

  let timingText = '';
  if (daysRemaining < 0) {
    timingText = `🚨 <b>OVERDUE by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) > 1 ? 's' : ''}!</b>`;
  } else if (daysRemaining === 0) {
    timingText = '⚠️ <b>Due TODAY!</b>';
  } else if (daysRemaining === 1) {
    timingText = '⏰ <b>Due TOMORROW</b>';
  } else {
    timingText = `📅 <b>Due in ${daysRemaining} days</b>`;
  }

  const cycleLabel =
    bill.cycle_type === 'days'
      ? `every ${bill.cycle_value} days`
      : bill.cycle_type === 'months'
      ? bill.cycle_value === 1
        ? 'monthly'
        : `every ${bill.cycle_value} months`
      : 'one-time';

  const message = [
    `${emoji} <b>Bill Reminder: ${bill.name}</b>`,
    timingText,
    `💵 <b>Amount:</b> ₹${bill.amount.toLocaleString('en-IN')}`,
    `🔄 <b>Cycle:</b> ${cycleLabel}`,
    `🗓 <b>Due Date:</b> ${bill.next_due_date}`,
    '',
    'Reply with your payment SMS, screenshot, or tap an action below:',
  ].join('\n');

  const keyboard: InlineKeyboardButton[][] = [
    [
      { text: '✅ Paid', callback_data: `paid:${bill.bill_id}` },
      { text: '💤 Snooze (1d)', callback_data: `snooze:${bill.bill_id}` },
      { text: '❌ Ignore', callback_data: `ignore:${bill.bill_id}` },
    ],
  ];

  return { message, keyboard };
}
