# 75-something

A mobile-first personal-discipline tracker modelled on the 75 Hard programme,
with adjustable difficulty. Each user picks a tier (Hard / Medium / Soft),
customises it into their own commitment list, and tracks day-by-day.

Private by design — no leaderboard, no cross-user comparison.

## Runs 24/7, from any device

The app is deployed to **Vercel** (serverless) with data in **Supabase** (managed Postgres).
Once deployed, it's live regardless of whether your laptop is on. Your team accesses it
from any phone or browser at `https://your-app.vercel.app`. Every user has their own
account (email + magic link) and their own private data.

Email reminders (morning + evening) fire from a **Vercel Cron** job every hour and
respect each user's local timezone.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase — Postgres + Auth (email magic link)
- Resend — reminder emails
- OpenAI (gpt-4o-mini) — motivation endpoint
- Vercel + Vercel Cron

---

## Setup — local dev

### 1. Install

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, paste and run both migrations in order:
   - [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
   - [`supabase/migrations/002_reminders.sql`](supabase/migrations/002_reminders.sql)
3. In **Authentication → URL Configuration** add `http://localhost:3000` (and later your prod URL) as an allowed redirect.
4. Grab the project URL, `anon` key, and `service_role` key from **Settings → API**. The service role key is server-only — it bypasses RLS and is used by the cron endpoint.

### 3. Resend

1. Create a Resend account at [resend.com](https://resend.com).
2. Verify a domain (or use their sandbox `onboarding@resend.dev` for testing to your own inbox only).
3. Grab an API key.

### 4. OpenAI

Create an API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

### 5. Environment

```bash
cp .env.local.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`, `REMINDER_FROM_EMAIL`
- `CRON_SECRET` — a long random string (e.g. `openssl rand -hex 32`)
- `NEXT_PUBLIC_SITE_URL`

### 6. Run

```bash
npm run dev
```

Open http://localhost:3000 and sign in.

---

## Deploy to Vercel

### 1. Push to GitHub

Create a repo, commit, push.

### 2. Import to Vercel

1. New Project → import the repo → deploy.
2. In **Settings → Environment Variables**, add all the same variables from `.env.local`, but set `NEXT_PUBLIC_SITE_URL` to your production URL (e.g. `https://75-something.vercel.app`).
3. Redeploy.

### 3. Update Supabase redirect URLs

In Supabase **Authentication → URL Configuration**, add your Vercel URL to the allowed redirect list.

### 4. Cron

`vercel.json` already declares an hourly cron on `/api/cron/reminders`. Vercel picks it up automatically on deploy. The endpoint requires `Authorization: Bearer $CRON_SECRET` — Vercel Cron sends this header when `CRON_SECRET` is set as an env var.

That's it — the app is now always-on.

### 5. Test reminders manually

You can hit the cron endpoint yourself once things are live:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/reminders
```

It returns JSON listing who got emailed (or why they didn't).

---

## How reminders work

- Two per user per day: **morning nudge** (default 07:00 local) + **evening check-in** (default 20:00 local).
- Each user's timezone is auto-detected from their browser on first sign-in (they can override it in Settings).
- The cron runs at minute 0 of every hour (UTC). For each active challenge, it computes the user's local hour: if it matches their morning or evening slot, and today's email of that kind hasn't been sent, it sends.
- Users can turn reminders off entirely in Settings.

---

## Project map

```
src/
  app/
    page.tsx                — Today (checklist)
    setup/                  — Challenge setup wizard
    history/                — Month calendar of past days
    insights/               — Completion %, streaks, per-item consistency
    rules/                  — Classic 75 Hard + per-commitment "why"
    motivation/             — Tone-picker + LLM-generated message
    settings/               — Name, reminders, end challenge, sign out
    login/                  — Magic-link entry
    auth/callback/          — Supabase OAuth callback
    api/motivation/         — Anthropic-backed generator
    api/cron/reminders/     — Hourly cron for email reminders
    actions.ts              — Server actions for tracking + prefs
  components/
    AppShell, BottomNav, TimezoneSync
    ChallengeSetupWizard, CommitmentRow, StreakBadge
    HistoryCalendar, InsightsCards
  lib/
    supabase/               — SSR + browser + service-role clients + middleware
    tiers.ts                — Hard/Medium/Soft templates
    completion.ts           — Day-complete rule
    streak.ts               — Streak calculation
    insights.ts             — Stats
    date.ts                 — Date helpers
    challenge-state.ts      — End-of-challenge reconciliation
    email.ts                — Resend client + email templates
    rules-content.ts        — Static rules text
    types.ts, queries.ts
supabase/migrations/        — SQL schema + RLS
vercel.json                 — Cron schedule
```

## Data model

- `profiles` — 1:1 with `auth.users`; display_name, timezone, reminder prefs
- `challenges` — one active per user
- `commitment_items` — the frozen rule list for a challenge
- `daily_logs` — one row per date, `complete` flag recomputed on writes
- `daily_log_entries` — per-item value (bool or numeric) for that day
- `email_reminders` — dedup log; one row per (user, local_date, kind)

RLS: every user-facing table restricts reads/writes to the challenge owner. `email_reminders` is service-role only.
