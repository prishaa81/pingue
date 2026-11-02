# Pingue — Smart Bill & Recharge Reminder System

> Multi-user web app and Telegram bot where users manage recurring bills (28-day recharges, electricity, gas, maintenance, subscriptions), get timely reminders before each due date, and log payments in under 20 seconds using text, pasted SMS, or screenshot receipts.

---

## ✨ Features

- **Monochrome Glass Bento UI**: Ultra-clean minimalist dark design with frosted glass cards, subtle borders, and clear status chips (Green for Paid, Amber for Due Soon & Today, Red for Overdue).
- **Fast 1-Tap Payment Logging**: Tap "Paid" on any bill card to confirm prefilled amounts, advance the next due date automatically, trigger checkmark celebrations, and offer an instant "Undo" toast.
- **AI Bill Parsing**: Powered by Google Gemini 2.0 with a fallback heuristic parser for Indian telecom/utility SMS & receipts.
- **Telegram Bot Webhook**: Connect your personal Telegram chat via single-use expiring codes (`/start CODE`). Get reminders with inline `[Paid]`, `[Snooze 1d]`, and `[Ignore]` buttons.
- **Daily Reminder Job**: Vercel Cron-compatible endpoint (`/api/cron/reminders`) checking lead times (e.g. 3 days, 1 day, due day).
- **Monthly Expense Tracker**: Category breakdown donut chart, 6-month spending trend bars, month-over-month % differences, and a dynamic Monthly Budget progress ring.
- **Payment History & Export**: Search, filter, and 1-click export to CSV / Excel for bills and payments.
- **Privacy & Security First**: Supabase Row-Level Security (RLS) guarantees users only view their own data. Screenshots are parsed in-memory and discarded without storing bank account or card numbers.


