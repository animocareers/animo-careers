# Animo — Technical Architecture

Current architecture decision: **Supabase (Postgres, Auth, Storage, Realtime) + Vercel (Next.js hosting)**, as a single full-stack Next.js application rather than a separate frontend/backend split.

## High-level architecture

```
                    ┌───────────────────────────┐
                    │   Company's own website    │
                    │  <a href="animo.app/..">   │──── click ───┐
                    └───────────────────────────┘              │
                                                                 ▼
┌──────────────────┐    ┌───────────────────────────┐   ┌───────────────────────┐
│  Company Dashboard │◄──►│   Next.js (Vercel, fra1)  │◄─►│  Public Apply Page     │
│  (authenticated)   │    │   Server Actions +        │   │  (unauthenticated)     │
│                     │    │   Route Handlers          │   └───────────────────────┘
└──────────────────┘    └─────────────┬─────────────┘
                                        │
                    ┌───────────────────┼───────────────────────┐
                    ▼                    ▼                        ▼
            ┌──────────────┐    ┌───────────────┐        ┌───────────────┐
            │  Supabase     │    │  Supabase      │        │  Supabase      │
            │  Postgres     │    │  Auth          │        │  Storage       │
            │  (RLS,        │    │  (JWT/session) │        │  (attachments) │
            │  Frankfurt)   │    └───────────────┘        └───────────────┘
            └──────────────┘
```

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Drag-and-drop board | dnd-kit |
| Calendar | FullCalendar (React) |
| Forms & validation | React Hook Form + Zod (schemas shared client/server) |
| Server state | TanStack Query |
| Database | Supabase Postgres (Frankfurt / `eu-central-1`) |
| Auth | Supabase Auth via `@supabase/ssr` |
| File storage | Supabase Storage |
| Realtime | Supabase Realtime (Postgres change streams) |
| Backend "API" | Next.js Server Actions + Route Handlers, deployed as Vercel Functions |
| Bot protection | Cloudflare Turnstile on the public apply form |
| Migrations | Supabase CLI (SQL migrations are the source of truth) |
| Hosting | Vercel, function region pinned to `fra1` (Frankfurt) |
| CI/CD | GitHub Actions |
| Error tracking | Sentry |
| E2E testing | Playwright |

## Project structure

```
animo/
├── app/
│   ├── (dashboard)/
│   │   ├── pipeline/
│   │   ├── calendar/
│   │   └── settings/
│   │       ├── professions/
│   │       ├── pipeline-stages/
│   │       ├── branches/
│   │       └── team/
│   ├── (public)/apply/[orgSlug]/[[...branchSlug]]/
│   ├── (auth)/login|signup/
│   └── api/
│       ├── public-apply/route.ts
│       └── invitations/accept/route.ts
├── lib/
│   ├── supabase/
│   │   ├── server.ts       # server client, reads user session from cookies
│   │   ├── admin.ts        # service-role client, server-only
│   │   └── client.ts       # browser client
│   └── validation/          # shared Zod schemas
├── supabase/
│   ├── migrations/
│   └── config.toml
├── components/
├── vercel.json               # { "regions": ["fra1"] }
└── package.json
```

## Multi-tenancy strategy

Shared database, shared schema, every tenant-scoped table carries `organization_id` (and, where relevant, `branch_id`). Enforced primarily through **Postgres Row-Level Security**, keyed off `auth.uid()` joined against `organization_members` (see `database-design.md` for the exact policies). Application code should never be the only thing standing between one org's data and another's.

Because each user belongs to exactly one organization (see `roles-and-permissions.md`), tenant-context resolution is a single-row lookup, not a "which org is this session acting as" problem.

## Embeddable apply link

A plain redirect link (`animo.app/apply/{orgSlug}` or `/apply/{orgSlug}/{branchSlug}`), not a cross-origin iframe — simpler, avoids CSP/cookie complications, and matches what was actually specified (a link the company embeds behind their own button).

## Public form submission path

The public form does **not** write directly to the database via an anon-role RLS policy. It posts to `app/api/public-apply/route.ts`, which verifies the Turnstile token, validates the payload, confirms the chosen profession/branch belong to the target org, and writes using the service-role client — keeping all untrusted-input handling in one reviewable place.

## Transactional email

Provider: **Resend**. `lib/email/providers/resend.ts` implements the send; `lib/email/providers/index.ts` picks it whenever `RESEND_API_KEY` is set (staging/production) and falls back to `lib/email/providers/console-log.ts` otherwise, so local dev needs no Resend account. Callers (e.g. `send-confirmation-email.ts`) only depend on the `SendEmailInput -> Promise<void>` shape in `lib/email/providers/types.ts`, never on Resend directly.

Requires a sending domain verified in the Resend dashboard (SPF/DKIM DNS records) and two env vars: `RESEND_API_KEY`, `EMAIL_FROM`. Per `feature 09.md`, a send failure must never fail the triggering request — callers log and continue rather than propagating.

## Auth email verification

Supabase Auth's built-in mailer is replaced with Resend via the **Send Email** auth hook, so signup confirmation (and any other auth email Supabase later sends — recovery, magic link, etc.) goes through the same provider as the rest of the app instead of Supabase's default sender:

- `app/api/auth/send-email/route.ts` — the hook's HTTP target. Verifies the Standard Webhooks signature and maps the result onto a response; delegates everything else.
- `lib/auth/send-email-hook.ts` — verifies the signature (`SEND_EMAIL_HOOK_SECRET`), validates the payload shape, builds the confirmation URL (Supabase gives us `token_hash`; the link must point at our own `app/[locale]/auth/confirm/route.ts`, not a Supabase-hosted verify endpoint), and derives the locale from that URL.
- `lib/email/send-auth-email.ts` — the email content (German/English), sent via `lib/email/providers` like every other transactional email. Unlike this endpoint, a send failure here **must** fail the hook (non-2xx), because Supabase surfaces that as a signup error to the user — they genuinely can't proceed without the email.

Registered in `supabase/config.toml`'s `[auth.hook.send_email]` for local dev (`host.docker.internal` so the Auth container can reach the Next.js dev server) and in the hosted project's **Authentication → Hooks** dashboard for staging/production, each with its own `SEND_EMAIL_HOOK_SECRET`. "Confirm email" must also be enabled on the Auth provider (`enable_confirmations` locally; the dashboard toggle in staging/production) or Supabase never calls the hook at all.

## Connection handling

Vercel Functions are short-lived; any direct Postgres client (if used alongside the Supabase client) must go through Supabase's pooled connection string (Supavisor, transaction mode), not a direct connection — otherwise connection exhaustion is the most common production failure mode for this exact stack combination.

## Data residency & compliance

- Supabase project region: Frankfurt (`eu-central-1`) — covers database and storage.
- Vercel function region pinned to `fra1` so compute also stays in the EU.
- See `product-requirements.md` for the GDPR/minors'-data non-functional requirements this is satisfying.

## What's deliberately deferred

- A separate background job queue (BullMQ/Redis) — not needed at MVP scale; Vercel Cron / Supabase Edge Functions cover scheduled jobs.
- Realtime board updates — cheap to add on this stack (Supabase Realtime), but not required for MVP; see `build-plan.md`.
