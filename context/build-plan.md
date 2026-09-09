# Animo — Build Plan

Implementation phases in priority order. Assumes the Supabase + Vercel architecture in `architecture.md`. Each phase should ship as a working increment, not a big-bang release.

## Phase 0 — Foundations

- [ ] Repo scaffold: Next.js (App Router, TypeScript), Tailwind + shadcn/ui, Supabase CLI local dev
- [ ] Supabase project created (Frankfurt region) for dev/staging/production, each isolated
- [ ] Core schema migrated: `organizations`, `branches`, `organization_members` (see `database-design.md`)
- [ ] RLS enabled and tested on every tenant-scoped table from the start — not bolted on later
- [ ] Auth wired up (`@supabase/ssr`): signup, login, session handling
- [ ] CI pipeline: lint, typecheck, unit tests on every PR
- [ ] **Cross-tenant isolation test harness stood up before any feature work** — this is the highest-leverage safety net in the whole project

## Phase 1 — MVP

- [ ] Organization creation flow (name, address, industry, default branch auto-created)
- [ ] Profession catalog seeded from the Bundesagentur für Arbeit list; org profession selection (2–15, enforced)
- [ ] Pipeline stage + checklist template CRUD, seeded with the default 6-stage suggestion on org creation
- [ ] Team invitations (email, role, optional branch scope) and accept flow
- [ ] Public apply page + form, with Turnstile and server-side validation
- [ ] Public application submission Route Handler (service-role insert, see `api-design.md`)
- [ ] Embed link generation (org-level, optionally per-branch)
- [ ] Pipeline board view: list applications by stage, card detail panel (checklist, info with missing-field flags, notes)
- [ ] Stage transitions clone the stage's checklist template onto the application
- [ ] Playwright coverage of the full happy path: signup → org setup → apply link → submission → card appears → stage move

## Phase 2

- [ ] Calendar view (requested vs. confirmed vs. no-date), including the "no date" → filtered board handoff
- [ ] Checklist item assignment to specific teammates
- [ ] CV/document attachment upload (Supabase Storage) — confirm scope per `product-requirements.md`
- [ ] Audit log for stage changes, checklist edits, note additions
- [ ] Transactional email notifications (new application received, task assigned)
- [ ] Data retention/erasure tooling (GDPR — see `product-requirements.md` non-functional section)

## Phase 3

- [ ] Realtime board updates via Supabase Realtime (cheap to add on this stack — consider pulling forward if multi-user concurrent editing is a pain point sooner)
- [ ] SSO for enterprise customers
- [ ] Branch-specific pipeline/checklist customization, if requested by real customers
- [ ] Reporting/analytics dashboard
- [ ] Applicant self-service "check my status" portal (magic link, no password)
- [ ] Animo's own billing/subscription management

## Sequencing notes for an AI coding agent

- Build and test RLS policies **before** building the UI that depends on them — a feature that "works" against a service-role client but hasn't been checked against RLS as a real authenticated user is not done.
- The public apply form and its Route Handler are the one surface handling untrusted input; treat its validation and rate-limiting as part of the feature, not a follow-up hardening task.
- Don't build the calendar view before the board view — the calendar view reuses the board view's detail panel and filtering logic.
- Don't implement branch scoping as an afterthought on top of a single-org-wide-view assumption — bake `branch_id` and the "org-wide vs. branch-scoped member" distinction into the very first queries you write against `applications`.
