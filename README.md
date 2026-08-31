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

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase — Postgres + Auth (email magic link)
- OpenAI (gpt-4o-mini) — motivation endpoint
- Vercel (deployment)

> **Not included yet:** daily email reminders. The scaffolding for reminders was removed for v1 to keep setup simple. Can be added later via Resend or similar.

---

## Setup — local dev

### 1. Install

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, paste and run [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql).
3. In **Authentication → URL Configuration** add `http://localhost:3000` (and later your prod URL) as an allowed redirect.
4. Grab the project URL and `anon` key from **Settings → API**.

### 3. OpenAI

Create an API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

### 4. Environment

```bash
cp .env.local.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SITE_URL` (leave as `http://localhost:3000` for local dev)

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000 and sign in with your email.

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

That's it — the app is now always-on.

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
    settings/               — Name, end challenge, sign out
    login/                  — Magic-link entry
    auth/callback/          — Supabase OAuth callback
    api/motivation/         — OpenAI-backed generator
    actions.ts              — Server actions for tracking
  components/
    AppShell, BottomNav
    ChallengeSetupWizard, CommitmentRow, StreakBadge
    HistoryCalendar, InsightsCards
  lib/
    supabase/               — SSR + browser clients + middleware
    tiers.ts                — Hard/Medium/Soft templates
    completion.ts           — Day-complete rule
    streak.ts               — Streak calculation
    insights.ts             — Stats
    date.ts                 — Date helpers
    challenge-state.ts      — End-of-challenge reconciliation
    rules-content.ts        — Static rules text
    types.ts, queries.ts
supabase/migrations/        — SQL schema + RLS
```

## Data model

- `profiles` — 1:1 with `auth.users`; display_name
- `challenges` — one active per user
- `commitment_items` — the frozen rule list for a challenge
- `daily_logs` — one row per date, `complete` flag recomputed on writes
- `daily_log_entries` — per-item value (bool or numeric) for that day

RLS: every table restricts reads/writes to the challenge owner.
