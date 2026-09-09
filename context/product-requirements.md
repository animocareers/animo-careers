# Animo — Product Requirements (MVP)

Scope of the first shippable version. See `user-flows.md` for the step-by-step workflows and `roles-and-permissions.md` for who can do what.

## In scope for MVP

### 1. Organization & branch setup
- Company employee signs up with email + password (official/company email).
- Post-signup: create an organization (name, address, industry type).
- A default branch ("Main") is created automatically.
- Admin can add additional branches (name, address) later.
- Admin selects 2–15 professions the org offers, from the Bundesagentur für Arbeit "Berufe A–Z" catalog.

### 2. Pipeline & checklist configuration
- On org creation, a default 6-stage pipeline is suggested with a starter checklist per stage.
- Admin/Head of Apprenticeship can rename, reorder, add, or remove stages.
- Admin/Head of Apprenticeship can edit the checklist items attached to each stage.
- Pipeline and checklist templates are **org-wide** (shared across branches) in v1.

### 3. Team management
- Admin can invite team members by email, assigning a role (`admin`, `head_of_apprenticeship`, `team_member`).
- Admin can optionally scope a `head_of_apprenticeship` or `team_member` to a single branch.
- Invited members accept via an emailed link and set their own password.
- One user belongs to exactly one organization — an invite to an email already active in another org is rejected.

### 4. Embeddable apply link
- Once org setup is complete, Animo generates a shareable apply link (`animo.app/apply/{orgSlug}`), and optionally a branch-specific variant (`/apply/{orgSlug}/{branchSlug}`).
- Company pastes this link behind an "Apply" button on their own website (a redirect, not an iframe — see `architecture.md`).

### 5. Public application form
- Unauthenticated form collecting: name, email, phone, date of birth, chosen profession (from the org's configured 2–15), scope toggle (single profession vs. Orientierungspraktikum), mandatory-from-school toggle (Pflichtpraktikum), requested start/end dates (optional at submission).
- Branch selection if the org has more than one branch.
- Basic bot protection (Cloudflare Turnstile) and field validation.

### 6. Application processing — pipeline board view
- Kanban-style board; new applications land in the first stage / inbox.
- Cards show applicant name + profession at a glance.
- Clicking a card expands: checklist for the current stage (open/done to-dos), full application data with missing/incomplete fields visually flagged, and a notes thread.
- Team members can move cards between stages, check off to-dos, assign to-dos to teammates, and add notes.

### 7. Application processing — calendar view
- Same applications, organized by requested vs. confirmed internship dates.
- A distinct affordance for "applications without a specified date," which switches to the board view pre-filtered to just those.
- Clicking an application in calendar view opens the same detail panel as the board view (stage, checklist, info, notes).

## Out of scope for MVP (candidates for Phase 2+)

- Applicant accounts / "check my status" portal
- SSO / enterprise identity providers
- Realtime multi-user board updates (start with refetch-on-change; cheap to add early on this stack if it becomes a real pain point — see `build-plan.md`)
- Branch-specific pipeline/checklist customization
- Billing/subscription management for Animo itself
- Automated reminder emails / notifications
- Reporting/analytics dashboards
- CV/document upload — **flagged as likely needed in practice; confirm before Phase 0 whether it's MVP or Phase 2** (schema supports it either way, see `database-design.md`)

## Non-functional requirements

- **Multi-tenancy**: one organization must never be able to see another's data, enforced at the database level (Postgres RLS), not just in application code.
- **Data residency**: all personal data (database, file storage, and — as much as the hosting platform allows — compute) stays in the EU (Frankfurt).
- **Minors' data**: a meaningful share of applicants will be under 18 (school-mandatory internships). Consent capture, data minimization, and a clear retention/erasure path are required, not optional polish.
- **Accessibility**: the public application form must be usable via keyboard and screen reader — it's the one surface used by people outside Animo's own customer base.
- **Performance target**: comfortably handle traffic bursts on the public apply endpoint (a customer's careers page can drive a spike), without needing the dashboard itself to be highly concurrent at MVP scale.

## Acceptance bar for MVP

A release is ready when:
- A brand-new company can go from signup to a working, embeddable apply link with no manual/support intervention.
- A submitted application reliably appears on the correct org and branch's board, and nowhere else.
- Moving an application through every stage correctly clones each stage's checklist and preserves notes/history.
- The calendar view and its "no date" filter behave exactly as described in `user-flows.md`.
- Cross-tenant and cross-branch isolation tests (see `testing-strategy.md`) pass — this is a release blocker, not a nice-to-have.
