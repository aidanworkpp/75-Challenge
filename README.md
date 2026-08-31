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

One **daily afternoon email reminder** fires from a Vercel Cron job (compatible with the
Vercel Hobby plan — daily cadence only). Each user can toggle their reminder on or off
in Settings.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase — Postgres + Auth (email magic link)
- OpenAI (gpt-4o-mini) — motivation endpoint
- Resend — daily reminder email
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
4. Grab the project URL, `anon` key, and **`service_role` key** from **Settings → API**. The service role key is server-only — it bypasses RLS and is used by the cron endpoint.

### 3. Resend

1. Sign up at [resend.com](https://resend.com).
2. Verify a domain (or sandbox `onboarding@resend.dev` for testing — but that only sends to your signup email, not the team).
3. Copy an API key (`re_...`).

### 4. OpenAI

Create an API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

### 5. Environment

```bash
cp .env.local.example .env.local
```

**Put real secrets in `.env.local` (which is gitignored) — never in `.env.local.example`.**

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`, `REMINDER_FROM_EMAIL`
- `CRON_SECRET` — long random string (e.g. `openssl rand -hex 32`)
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
2. In **Settings → Environment Variables**, add all the same variables from `.env.local`. Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL after the first deploy.

### 3. Update Supabase redirect URLs

In Supabase **Authentication → URL Configuration**, add your Vercel URL.

### 4. Cron

`vercel.json` declares one daily cron at `0 14 * * *` — that's **14:00 UTC**.

Adjust the UTC hour in [`vercel.json`](vercel.json) to match the local afternoon of your team:

| Team timezone       | UTC offset (standard) | UTC hour for ~15:00 local |
|---|---|---|
| UK (London)         | UTC+0 / +1 summer | `15` (winter) / `14` (summer) |
| Central Europe      | UTC+1 / +2 summer | `14` / `13` |
| South Africa        | UTC+2             | `13` |
| US Eastern          | UTC−5 / −4        | `20` / `19` |
| US Pacific          | UTC−8 / −7        | `23` / `22` |
| Australia Eastern   | UTC+10 / +11      | `05` / `04` (next-day-local) |

Vercel Hobby only allows daily crons, so you pick one time. If your team spans timezones, pick whatever works best for most of them.

### 5. Test cron manually

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/reminders
```

Returns JSON listing per-user status (`sent`, `already-sent`, `no-email`, or an error).

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
    settings/               — Name, reminders toggle, end challenge, sign out
    login/                  — Magic-link entry
    auth/callback/          — Supabase OAuth callback
    api/motivation/         — OpenAI-backed generator
    api/cron/reminders/     — Daily cron for the afternoon email
    actions.ts              — Server actions for tracking + prefs
  components/
    AppShell, BottomNav
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
    email.ts                — Resend client + email template
    rules-content.ts        — Static rules text
    types.ts, queries.ts
supabase/migrations/        — SQL schema + RLS
vercel.json                 — Cron schedule
```

## Data model

- `profiles` — 1:1 with `auth.users`; display_name, reminders_enabled
- `challenges` — one active per user
- `commitment_items` — the frozen rule list for a challenge
- `daily_logs` — one row per date, `complete` flag recomputed on writes
- `daily_log_entries` — per-item value (bool or numeric) for that day
- `email_reminders` — dedup log; one row per (user, log_date)

RLS: every user-facing table restricts reads/writes to the challenge owner. `email_reminders` is service-role only.
