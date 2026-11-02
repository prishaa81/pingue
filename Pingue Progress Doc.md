# Pingue Progress Doc — Project Audit Log

**Project Name:** Pingue (formerly RemindLoop)  
**Tagline:** *Bills that ping before they're due.*  
**Repository:** [github.com/prishaa81/pingue](https://github.com/prishaa81/pingue)  
**Audit Date:** November 3, 2026  
**Auditor:** Antigravity AI Engineering Assistant  
**Working Environment:** Windows 11, Node.js 20+, Next.js 16.4.3 (Turbopack), Supabase, Google Gemini 2.0  

---

## 1. Executive Summary & Working Status

Pingue is a modern, high-aesthetic bill and subscription reminder web application designed to help users track recurring bills (such as 28-day telecom recharges, electricity, broadband, LPG gas, rent, society maintenance, and OTT subscriptions). It features instant payment logging, Telegram bot integration with interactive actions, automated daily reminder cron jobs, and Gemini AI-powered bill and SMS receipt extraction.

- **Current Status:** **Operational & Stable**
- **Localhost Preview:** `http://localhost:3000` (Dev server active with Turbopack)
- **Production Readiness:** Ready for Vercel deployment with pre-configured `vercel.json` (daily cron job at 09:00 UTC) and Supabase database migrations.
- **Zero-Secret Public Git State:** All 87 application files safely pushed to GitHub on branch `main` with `.env*` and internal PDF documents strictly git-ignored.

---

## 2. Tools, Technologies, Libraries & Frameworks

| Layer | Technology | Details / Version |
|---|---|---|
| **Frontend Framework** | **Next.js 16.4.3** | App Router, React 19.3.0, Turbopack dev runtime |
| **Styling & Design System** | **Vanilla CSS + Glassmorphism** | Custom dark mode palette (`#0A0A0B`), frosted glass cards (`backdrop-filter: blur(16px)`), CSS variables, custom animations (e.g. `chip-pulse`) |
| **Backend / Database** | **Supabase** | PostgreSQL database, Row-Level Security (RLS) policies, `@supabase/supabase-js` v2.118.0 |
| **AI Bill Parsing** | **Google Gemini API** | `@google/genai` v2.32.0, dynamic model discovery, structured JSON output extraction |
| **Notification Engine** | **Telegram Bot API** | Webhook listener (`/api/telegram/webhook`), inline keyboard buttons (`[Paid]`, `[Snooze 1d]`, `[Ignore]`), deep linking (`/start <code>`) |
| **Automation** | **Vercel Cron** | Scheduled daily endpoint (`/api/cron/reminders`) triggered via `CRON_SECRET` authorization |
| **Icons & Micro-Interactions**| **Lucide React & Canvas Confetti** | `lucide-react` v1.65.0 (50+ category and utility icons), `canvas-confetti` v1.9.4 |
| **Data Export** | **Native CSV / Blob Engine** | Pure client-side CSV generator with UTF-8 encoding |

---

## 3. Architecture & Functional Components Built

### 3.1 Core User Flows & Routes

1. **Dashboard (`/` & `src/app/page.tsx`):**
   - **Bento Grid Layout:** Responsive CSS Grid spanning hero card, metrics stack, calendar card, and spend chart.
   - **Hero Due Card (`HeroDueCard.tsx`):** Highlights the single most urgent upcoming or overdue bill with large typography, contextual due countdown chip, provider identity, and direct `Pay Now` trigger.
   - **Metrics Stack:** Live metrics showing total overdue count/amount and monthly paid aggregate with dynamic status badges (`Action Needed` vs `All Clear`).
   - **Interactive Calendar Card (`CalendarCard.tsx`):** Month view showing date-specific indicator dots for due dates, cycle navigation, and a quick-action drawer for bills due on selected days.
   - **Compact Spend Breakdown (`CompactSpendCard.tsx`):** Rolling 6-month comparative bar chart and category share visualization.

2. **Recurring Bills Directory (`/bills` & `src/app/bills/page.tsx`):**
   - Segmented filter controls (`All`, `Due Soon`, `Recharges`, `Subscriptions`, `Utilities`).
   - Real-time search across bill names, provider names, and consumer IDs.
   - Interactive Bill Cards (`BillCard.tsx`) with 1-tap `Paid` button, cycle tags (`28 days`, `Monthly`), auto-computed next due dates, and modal editing controls.

3. **Transaction History & Analytics (`/history` & `src/app/history/page.tsx`):**
   - 6-month historical spending chart with maximum value scaling.
   - Category distribution progress bars with percentage share calculations.
   - Detailed payment timeline with filters for search query and month selector.
   - One-click CSV export utility (`src/lib/export.ts`).

4. **Credential Vault (`/vault` & `src/app/vault/page.tsx`):**
   - Single-card minimalist glass view per provider.
   - Primary consumer ID / mobile number display with instant clipboard copy.
   - Progressive disclosure ("More details" expander) for registered phone number, customer care helpline, official payment portal deep link, and personal reminders.
   - Explicit security notice: *"Don't store passwords here"*.

5. **Standalone Interactive Demo Mode (`/demo` & `src/app/demo/page.tsx`):**
   - Completely unauthenticated guest sandbox with zero database writes.
   - Preloaded with 8 realistic mock bills (Tata Power, Vi Recharge, ACT Broadband, Society Maintenance, IGL Gas, Netflix 4K, Water, LIC Insurance) and 12 historical payments spanning 6 months.
   - Full simulated state: marking a bill as paid advances the due date by its real cycle in memory, spawns celebratory confetti, logs a transaction to the demo history, and dynamically updates all spend charts.
   - Reuses identical UI card and bento grid components from the real authenticated pages for 1:1 visual parity.

6. **Settings & Diagnostics (`/settings` & `src/app/settings/page.tsx`):**
   - User profile settings, monthly budget management, and default notification lead times (e.g., 3, 1, 0 days before due date).
   - Telegram link generator creating secure, expiring 6-digit one-time link codes.
   - **AI Diagnostics Tool:** Dedicated "Test AI parsing" action running real-time Gemini tests against mock SMS texts, showing raw status codes, model IDs, and parsed field payloads directly on screen.

### 3.2 Modals & User Input Forms

- **Add Bill Modal (`AddBillModal.tsx`):**
  - Three-tier parsing workflow: **Gemini AI Parsing** -> **Regex Heuristic Fallback Parser** -> **Pre-filled Missing Fields Form**.
  - Dual input ingestion: supports both raw pasted SMS text and screenshot image uploads via HTML Canvas Base64 encoding.
  - Multi-cycle configuration: `days` (e.g. 28-day telecom packs), `months`, or `years`.
  - In-form demo assistant button ("Try a sample SMS") allowing instant verification without typing.
- **Mark as Paid Modal (`MarkPaidModal.tsx`):**
  - Pre-fills with the bill's known payment amount and default date.
  - Supports receipt scanning to update the actual amount paid and capture transaction / UPI reference numbers.
  - Auto-calculates the new next due date upon submission.
- **Edit Bill Modal (`EditBillModal.tsx`):**
  - Allows editing cycle frequencies, reminder lead times, custom notes, portal links, and consumer identifiers.

### 3.3 Server Routes & APIs

- `POST /api/parse-bill`: Unified multimodal endpoint accepting `{ text, image }`.
- `POST /api/test-ai-parsing`: Diagnostics endpoint verifying Gemini connectivity and returning timing and token metadata.
- `POST /api/telegram/webhook`: Webhook handler parsing Telegram messages, supporting callback buttons for one-tap payments, snoozing, and account linking.
- `GET /api/cron/reminders`: Cron-driven reminder evaluator that scans upcoming bills across all linked users and dispatches formatted Telegram alerts.

---

## 4. Key Improvements & Refinements Made

1. **Status Chip Hierarchy & Palette Refinement:**
   - Standardized status chips across the entire application:
     - **Paid (this cycle):** Mint Green (`#10B981`) with `<Check />` icon.
     - **Due Later (4+ days):** Calm Neutral Grey with `<Clock />` icon, keeping the interface uncluttered.
     - **Due in 1–3 days:** Amber warning (`#F59E0B`).
     - **Due Today:** High-visibility bold Amber with custom CSS glow animation (`chip-pulse` 2s infinite cycle).
     - **Overdue:** Vivid Red/Coral (`#EF4444`) with `<AlertTriangle />` icon.

2. **Form State Reset & Isolation:**
   - Eliminated cross-session form state pollution where data from previously parsed bills persisted into subsequent modal opens.
   - Implemented reactive reset hooks in `AddBillModal` and `MarkPaidModal` clearing form fields, pasted SMS strings, uploaded files, AI previews, and error flags whenever the modal opens or closes.

3. **Demo Page Architecture Overhaul:**
   - Completely refactored `/demo` from a simplified prototype into an exact reflection of the real application.
   - Embedded real UI components (`HeroDueCard`, `CalendarCard`, `CompactSpendCard`, `BillCard`) fed by an isolated React in-memory state engine.

4. **Monochrome Rebranding:**
   - Replaced all legacy references to "RemindLoop" and "temp_app" with the official brand name **Pingue** across `README.md`, `package.json`, layout metadata, and UI headers.

---

## 5. Testing & Verification Performed

All verification steps were performed directly against the local runtime and project codebase:

1. **Automated Server Probe (HTTP Status Verification):**
   - Probed all primary routes against `http://localhost:3000`:
     - `GET /` -> `200 OK`
     - `GET /demo` -> `200 OK`
     - `GET /bills` -> `200 OK`
     - `GET /history` -> `200 OK`
     - `GET /vault` -> `200 OK`
     - `GET /welcome` -> `200 OK`
     - `GET /settings` -> `200 OK`
2. **AI Bill Parsing & Fallback Test:**
   - Dispatched diagnostic parse requests to `/api/parse-bill` with mock Indian telecom and utility SMS strings.
   - Verified that when upstream Gemini servers experience temporary spikes (HTTP 503) or rate limits (HTTP 429), the retry handler fires and the system automatically falls back to `src/lib/fallbackParser.ts` without dropping the user to an empty form.
3. **Repository Security & Credential Isolation Audit:**
   - Audited all 87 tracked git files using regex pattern matchers for API keys, bearer tokens, service role keys, and passwords.
   - Verified that `.env.local` is omitted from git tracking.
   - Removed all binary PDF requirements documents from git history to ensure clean public repository visibility.
4. **Interactive Component Verification:**
   - Verified calendar date dot mapping logic (`CalendarCard.tsx`) against overdue, due-soon, and upcoming bill dates.
   - Verified that `canvas-confetti` executes smoothly on bill payment actions in both demo and live modes.

---

## 6. Detailed Incident / Resolved Error Case Study

### **Incident: Gemini Model Discontinuation & 404/503 Parsing Failures**

- **Symptoms Encountered:**
  Users pasting SMS bill messages or uploading screenshots were experiencing parsing failures, causing the application to fail silently or immediately fall back to a blank manual form.
- **Root Cause Analysis:**
  1. The original implementation called an older Gemini endpoint model identifier (`gemini-2.0-flash`), which was either deprecated or unavailable in specific regions under standard developer API keys, returning `404 Model Not Found`.
  2. Temporary demand spikes on free/tier keys returned `503 Service Unavailable` or `429 Too Many Requests`, causing the API route to fail without structured error output.
  3. Errors were caught generically, returning an empty JSON object to the client.
- **Resolution Strategy Implemented:**
  1. **Dynamic Model Discovery:** Updated `src/lib/gemini.ts` to query Google's `ai.models.list()` endpoint on startup with the configured `GEMINI_API_KEY`. The routine automatically discovers and selects the newest available flash model supporting both text and inline image input (e.g. `gemini-2.5-flash` or `gemini-flash-latest`).
  2. **Transient Error Retry Mechanism:** Added automated exponential backoff retry for HTTP 429 and 503 errors before aborting.
  3. **High-Fidelity Heuristic Fallback Parser:** Engineered `src/lib/fallbackParser.ts`, a deterministic regex engine capable of extracting Indian Rupees (`₹`, `Rs.`, `INR`), cycle validity (`28 days`), due dates (`DD/MM/YYYY`, `DD Mon`), and consumer reference IDs without requiring any AI calls.
  4. **Strict Fallback Pre-fill Flow:** Configured `AddBillModal` so that if the AI call fails or is rate-limited, the heuristic parser extracts as many fields as possible and opens the manual form pre-filled with the remaining missing items highlighted.

---

## 7. Work Breakdown: Completed vs. Pending

### ✅ Completed Work
- [x] Full UI design system with monochrome frosted glass styling and responsive CSS bento grid.
- [x] Multi-user authentication & profile management via Supabase Auth & PostgreSQL RLS.
- [x] Core bill management CRUD (Add, Edit, Mark Paid, Delete, Filter, Search).
- [x] Dual-input AI bill parser (SMS text + screenshot receipts) with dynamic model discovery.
- [x] Three-tier parsing resilience (Gemini -> Regex Fallback -> Pre-filled Form).
- [x] Form state lifecycle isolation and clean reset hooks.
- [x] Dedicated unauthenticated Demo Mode (`/demo`) with realistic in-memory state and charts.
- [x] Settings page with live AI parsing diagnostics and Telegram linking code generator.
- [x] Telegram bot webhook endpoint with interactive callback buttons.
- [x] Automated daily reminder cron endpoint (`/api/cron/reminders`).
- [x] Client-side CSV data export for transaction history.
- [x] Public GitHub repository sanitized and synchronized (`prishaa81/pingue`).

### ⏳ Pending Work / Recommended Next Steps
- [ ] **Vercel Production Deployment:** Complete the 1-click import on Vercel and paste the live URL into `NEXT_PUBLIC_APP_URL`.
- [ ] **Production Telegram Webhook Registration:** Call `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<VERCEL_URL>/api/telegram/webhook` once the production URL is provisioned.
- [ ] **Push Notification Enhancements:** Optional Web Push / PWA notification support for browsers without Telegram.
