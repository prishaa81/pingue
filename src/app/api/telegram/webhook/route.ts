import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, answerTelegramCallback, formatBillAlert } from '@/lib/telegram';
import { parseBillWithGemini } from '@/lib/gemini';
import { getServiceRoleClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Telegram secret token header if configured (PRD Page 13)
    const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (expectedSecret && secretToken !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 });
    }

    const update = await req.json();
    const supabase = getServiceRoleClient();

    // 2. Handle Inline Button Callback Queries (Paid, Snooze, Ignore)
    if (update.callback_query) {
      const cq = update.callback_query;
      const callbackData = cq.data || '';
      const chatId = cq.message?.chat?.id;
      const [action, billId] = callbackData.split(':');

      if (!supabase) {
        await answerTelegramCallback(cq.id, 'Database not configured');
        return NextResponse.json({ ok: true });
      }

      if (action === 'paid' && billId) {
        // Look up profile by Telegram chat ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('telegram_chat_id', chatId)
          .single();

        if (!profile) {
          await answerTelegramCallback(cq.id, 'Chat not linked to an account');
          return NextResponse.json({ ok: true });
        }

        const { data: bill } = await supabase
          .from('bills')
          .select('*')
          .eq('bill_id', billId)
          .eq('user_id', profile.user_id)
          .single();

        if (bill) {
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];

          // Calculate next due date
          let nextDue: string | null = null;
          if (bill.cycle_type === 'days') {
            const d = new Date(bill.next_due_date || todayStr);
            d.setDate(d.getDate() + bill.cycle_value);
            nextDue = d.toISOString().split('T')[0];
          } else if (bill.cycle_type === 'months') {
            const d = new Date(bill.next_due_date || todayStr);
            d.setMonth(d.getMonth() + bill.cycle_value);
            nextDue = d.toISOString().split('T')[0];
          }

          // Advance bill
          await supabase
            .from('bills')
            .update({
              last_paid_date: todayStr,
              next_due_date: nextDue,
              snoozed_until: null,
            })
            .eq('bill_id', bill.bill_id);

          // Insert payment record
          await supabase.from('payments').insert({
            bill_id: bill.bill_id,
            user_id: profile.user_id,
            amount_paid: bill.amount,
            paid_date: todayStr,
            source: 'telegram',
            input_type: 'form',
            notes: 'Marked paid via Telegram inline button',
          });

          await answerTelegramCallback(cq.id, 'Payment logged! ✅');
          if (chatId) {
            await sendTelegramMessage(
              chatId,
              `✅ <b>${bill.name}</b> marked as paid for ₹${bill.amount.toLocaleString('en-IN')}!\n` +
                (nextDue
                  ? `📅 Next due date: <b>${nextDue}</b>`
                  : '🎉 Completed one-time renewal!')
            );
          }
        } else {
          await answerTelegramCallback(cq.id, 'Bill not found');
        }
      } else if (action === 'snooze' && billId) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        await supabase
          .from('bills')
          .update({ snoozed_until: tomorrowStr })
          .eq('bill_id', billId);

        await answerTelegramCallback(cq.id, 'Snoozed for 1 day 💤');
        if (chatId) {
          await sendTelegramMessage(chatId, `💤 <b>Snoozed!</b> We'll remind you again tomorrow.`);
        }
      } else if (action === 'ignore' && billId) {
        await supabase
          .from('bills')
          .update({ status: 'ignored' })
          .eq('bill_id', billId);

        await answerTelegramCallback(cq.id, 'Alert silenced for this cycle');
        if (chatId) {
          await sendTelegramMessage(chatId, `❌ <b>Ignored.</b> Alert silenced for this cycle.`);
        }
      }

      return NextResponse.json({ ok: true });
    }

    // 3. Handle Regular Message
    if (!update.message) {
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text: string = message.text || message.caption || '';

    // Handle /start command
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const code = parts[1]?.trim().toUpperCase();

      if (!code) {
        // Unlinked greeting / instructions (PRD Page 6)
        await sendTelegramMessage(
          chatId,
          `👋 <b>Welcome to Pingue!</b>\n\nTo link this Telegram chat to your account:\n1. Log into your dashboard on the web\n2. Go to <b>Settings</b> and click <b>"Generate Linking Code"</b>\n3. Send <code>/start &lt;CODE&gt;</code> here.\n\nOnce linked, you'll receive timely bill renewal alerts with one-tap [Paid] buttons, and you can forward receipts or SMS messages to log payments automatically!`
        );
        return NextResponse.json({ ok: true });
      }

      // Process one-time linking code
      if (supabase) {
        const { data: linkRecord, error: linkErr } = await supabase
          .from('link_codes')
          .select('*')
          .eq('code', code)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (linkErr || !linkRecord) {
          await sendTelegramMessage(
            chatId,
            `❌ <b>Invalid or expired linking code.</b>\nPlease generate a fresh 6-character code in your web dashboard Settings.`
          );
          return NextResponse.json({ ok: true });
        }

        // Link profile to chat ID
        await supabase
          .from('profiles')
          .update({ telegram_chat_id: chatId })
          .eq('user_id', linkRecord.user_id);

        // Mark link code as used
        await supabase
          .from('link_codes')
          .update({ used: true })
          .eq('code', code);

        await sendTelegramMessage(
          chatId,
          `🎉 <b>Account Linked Successfully!</b>\n\nYou're all set! From now on, alerts, one-tap Paid buttons, and payment receipts for your account will be delivered right here.`
        );
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    // Handle photo screenshot or invoice attachment
    let photoBase64: string | undefined = undefined;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (message.photo && message.photo.length > 0 && botToken) {
      try {
        const photo = message.photo[message.photo.length - 1]; // Highest resolution
        const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${photo.file_id}`);
        const fileData = await fileRes.json();
        if (fileData.ok && fileData.result?.file_path) {
          const imgRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`);
          const arrayBuffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          photoBase64 = `data:image/jpeg;base64,${base64}`;
        }
      } catch (imgErr) {
        console.error('Error fetching Telegram image attachment:', imgErr);
      }
    }

    // Parse natural language / SMS / receipt with Gemini
    if (text || photoBase64) {
      const parsed = await parseBillWithGemini(text || undefined, photoBase64);

      if (parsed.amount > 0) {
        let matchNote = '';

        if (supabase) {
          // Check if this chat belongs to a linked user
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('telegram_chat_id', chatId)
            .single();

          if (profile) {
            // Find active bill matching the biller name
            const { data: userBills } = await supabase
              .from('bills')
              .select('*')
              .eq('user_id', profile.user_id)
              .eq('status', 'active');

            const matchedBill = (userBills || []).find((b) =>
              b.name.toLowerCase().includes((parsed.biller || '').toLowerCase()) ||
              (parsed.biller && parsed.biller.toLowerCase().includes(b.name.toLowerCase()))
            );

            if (matchedBill) {
              const today = new Date();
              const todayStr = today.toISOString().split('T')[0];
              let nextDue: string | null = null;
              if (matchedBill.cycle_type === 'days') {
                const d = new Date(matchedBill.next_due_date || todayStr);
                d.setDate(d.getDate() + (parsed.validity_days || matchedBill.cycle_value));
                nextDue = d.toISOString().split('T')[0];
              } else if (matchedBill.cycle_type === 'months') {
                const d = new Date(matchedBill.next_due_date || todayStr);
                d.setMonth(d.getMonth() + matchedBill.cycle_value);
                nextDue = d.toISOString().split('T')[0];
              }

              // Advance bill
              await supabase
                .from('bills')
                .update({
                  last_paid_date: parsed.paid_date || todayStr,
                  next_due_date: nextDue,
                  snoozed_until: null,
                })
                .eq('bill_id', matchedBill.bill_id);

              // Log payment record
              await supabase.from('payments').insert({
                bill_id: matchedBill.bill_id,
                user_id: profile.user_id,
                amount_paid: parsed.amount,
                paid_date: parsed.paid_date || todayStr,
                txn_ref: parsed.reference || null,
                source: 'telegram',
                input_type: photoBase64 ? 'screenshot' : 'sms',
                notes: `Auto-parsed via Gemini (${parsed.biller})`,
              });

              matchNote = `\n\n🎯 <b>Matched &amp; Updated:</b> <b>${matchedBill.name}</b> next due date set to <b>${nextDue}</b>.`;
            }
          }
        }

        await sendTelegramMessage(
          chatId,
          `🤖 <b>Gemini Extracted Receipt:</b>\n` +
            `• <b>Biller:</b> ${parsed.biller}\n` +
            `• <b>Amount:</b> ₹${parsed.amount.toLocaleString('en-IN')}\n` +
            (parsed.paid_date ? `• <b>Date:</b> ${parsed.paid_date}\n` : '') +
            (parsed.reference ? `• <b>Ref/Txn:</b> <code>${parsed.reference}</code>\n` : '') +
            (parsed.consumer_id ? `• <b>Account/Consumer:</b> <code>${parsed.consumer_id}</code>\n` : '') +
            matchNote
        );
      } else {
        await sendTelegramMessage(
          chatId,
          `🤔 I couldn't spot a clear bill amount. You can send: <i>"Vi recharge 299 done for 28 days"</i> or forward your bank payment SMS.`
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook handler exception:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
