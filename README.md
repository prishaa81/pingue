# RemindLoop — Smart Bill & Recharge Reminder System (v2)

> Multi-user web app and Telegram bot where users manage recurring bills (28-day recharges, electricity, gas, maintenance, subscriptions), get timely reminders before each due date, and log payments in under 20 seconds using text, pasted SMS, or screenshot receipts.

Built based on the [PRD specifications](./Bill%20Reminder%20System%20%E2%80%94%20PRD.pdf).

---

## ✨ Features

- **Aurora Glass Bento UI**: Gen Z-friendly design with deep navy background (`#0B1026`), soft blurred gradient glows, frosted glass cards, and status colors (Mint for Paid, Amber for Due Soon, Coral for Overdue).
- **Fast 1-Tap Payment Logging**: Tap "Paid" on any bill card to confirm prefilled amounts, advance the next due date automatically, trigger checkmark celebrations, and offer an instant "Undo" toast.
- **AI Bill Parsing**: Powered by Google Gemini 2.0 with a fallback heuristic parser for Indian telecom/utility SMS & receipts.
- **Telegram Bot Webhook**: Connect your personal Telegram chat via single-use expiring codes (`/start CODE`). Get reminders with inline `[Paid]`, `[Snooze 1d]`, and `[Ignore]` buttons.
- **Daily Reminder Job**: Vercel Cron-compatible endpoint (`/api/cron/reminders`) checking lead times (e.g. 3 days, 1 day, due day).
- **Monthly Expense Tracker**: Category breakdown donut chart, 6-month spending trend bars, month-over-month % differences, and a dynamic Monthly Budget progress ring.
- **Payment History & Export**: Search, filter, and 1-click export to CSV / Excel for bills and payments.
- **Privacy & Security First**: Supabase Row-Level Security (RLS) guarantees users only view their own data. Screenshots are parsed in-memory and discarded without storing bank account or card numbers.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env.local
```

Configure your secrets:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for webhook & cron)
- `GEMINI_API_KEY`: Google Gemini API key
- `TELEGRAM_BOT_TOKEN`: Token from [@BotFather](https://t.me/BotFather)
- `TELEGRAM_WEBHOOK_SECRET`: Custom secret token for webhook verification
- `CRON_SECRET`: Random secret string for cron authentication

*(Note: The application includes a preloaded demo mode with offline local state for Prisha and Vritti, so it runs immediately out of the box even before plugging in API keys).*

### 3. Database Migration
In your Supabase project's SQL editor, execute [`supabase/schema.sql`](./supabase/schema.sql) to create the tables, indexes, automatic profile trigger, and Row-Level Security (RLS) policies.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm start
```
