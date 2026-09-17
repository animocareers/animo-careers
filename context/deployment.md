# Animo — Deployment

## Environments

| Environment | Supabase project | Vercel deployment |
|---|---|---|
| Local | `supabase start` (local Postgres) | `next dev` |
| Staging | Dedicated Supabase project, Frankfurt region | Vercel preview/staging deployment |
| Production | Dedicated Supabase project, Frankfurt region | Vercel production deployment |

Staging and production are **separate Supabase projects**, not separate schemas in one project — this is what actually prevents staging data or a staging RLS mistake from ever touching production.

## CI/CD pipeline (GitHub Actions)

1. **On every PR**: lint, typecheck, unit tests, RLS/integration tests against a local Supabase instance spun up in CI.
2. **On merge to `main`**: run the same checks, then deploy the Supabase migrations to staging (`supabase db push` against the staging project), then deploy the app to Vercel staging.
3. **Playwright** runs against the staging deployment before promotion.
4. **Promotion to production**: manual approval step, then apply migrations to the production Supabase project, then promote the Vercel deployment.

## Vercel configuration

- `vercel.json`: pin function region to Frankfurt —
  ```json
  { "regions": ["fra1"] }
  ```
- Environment variables set per-environment (staging vs. production) in the Vercel dashboard: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to the client bundle), `RESEND_API_KEY` and `EMAIL_FROM` (see `architecture.md`), `SEND_EMAIL_HOOK_SECRET` (see `architecture.md`, "Auth email verification" — a distinct value per environment, generated when creating that environment's Send Email hook in the Supabase dashboard), Turnstile secret.
- Preview deployments per PR are fine for UI review, but should point at the **staging** Supabase project (or an ephemeral branch database, if using Supabase's database branching), never production.
- Local dev additionally needs `SEND_EMAIL_HOOK_SECRET` set in the shell that runs `supabase start` (config.toml's `env(...)` substitution reads the process environment, not `.env.local`) — export it, or run `supabase start` through a tool that loads `.env.local` into the environment first.

## Database migrations in CI/CD

- Migrations live in `supabase/migrations/`, applied via the Supabase CLI as an explicit CI step — never applied by hand against production.
- Every migration that adds a table must add its RLS policy in the same migration (see `database-design.md`) — CI should fail a migration that enables a new tenant-scoped table without a corresponding policy.

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY` only ever runs server-side (Route Handlers, Server Actions) — treat a leak of this key as a full data breach, since it bypasses RLS entirely.
- Rotate keys on staff offboarding; store secrets in Vercel's environment variable manager and GitHub Actions secrets, never committed to the repo.

## Monitoring

- **Errors**: Sentry (frontend + server).
- **Uptime**: external monitor (e.g. Better Uptime) specifically on `/apply/*` and `/api/public-apply` — this is the one surface a customer's own site visitors interact with directly.
- **Database/Auth/Storage health**: Supabase's own dashboard and logs.
- **Function performance/region**: Vercel's built-in analytics; confirm functions are actually executing in `fra1`, not silently falling back to a default region.

## Backups & recovery

- Rely on Supabase's automated daily backups; confirm the plan tier includes point-in-time recovery before launch (needed given HR/PII data sensitivity).
- Periodically test an actual restore, not just confirm backups exist.

## Rollback

- **App rollback**: Vercel's instant rollback to a previous deployment.
- **Database rollback**: write migrations to be reversible where practical; for destructive schema changes, deploy in an expand → migrate data → contract sequence across releases rather than a single irreversible migration.
