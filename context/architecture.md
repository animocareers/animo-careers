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

## Connection handling

Vercel Functions are short-lived; any direct Postgres client (if used alongside the Supabase client) must go through Supabase's pooled connection string (Supavisor, transaction mode), not a direct connection — otherwise connection exhaustion is the most common production failure mode for this exact stack combination.

## Data residency & compliance

- Supabase project region: Frankfurt (`eu-central-1`) — covers database and storage.
- Vercel function region pinned to `fra1` so compute also stays in the EU.
- See `product-requirements.md` for the GDPR/minors'-data non-functional requirements this is satisfying.

## What's deliberately deferred

- A separate background job queue (BullMQ/Redis) — not needed at MVP scale; Vercel Cron / Supabase Edge Functions cover scheduled jobs.
- Realtime board updates — cheap to add on this stack (Supabase Realtime), but not required for MVP; see `build-plan.md`.
