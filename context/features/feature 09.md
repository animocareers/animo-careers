# Feature 09 — Application Submission Logic

## Summary

Implement the actual save path for the public application form built in `feature 08.md`: validate submissions server-side, persist them via Prisma into the `applications` table under the correct organization/branch, show a loading state during submission, and send the applicant a confirmation email.

## Preconditions

- Per `feature 08.md`, the `applications` table required schema modifications before this feature could be built. **Confirm the table's current, actual schema before implementing** — if it now differs from `database-design.md`, treat the live schema as the source of truth and update `database-design.md` afterward so the doc set doesn't go stale.
- The Zod validation schema built in `feature 08.md` (`lib/validation/`) already covers these fields client-side — reuse it here for server-side validation rather than duplicating field rules.
- This implements the `POST /api/public-apply` contract already specified in `api-design.md`; treat that as the base contract and layer this feature's additions on top rather than redesigning it.

## Requirements

### 1. Route Handler
- `app/api/public-apply/route.ts`, `POST`, unauthenticated.
- Wire the feature-08 form's submit handler to actually call this endpoint, replacing the stubbed/no-op handler left there.

### 2. Server-side validation
- Re-validate the full payload against the shared Zod schema — never trust client-side validation alone, since this is a public, unauthenticated endpoint.
- Return `400` with field-level errors on failure (matches `api-design.md`'s error convention).

### 3. Resolve organization/branch/profession from the link
- Resolve `orgSlug` (and `branchSlug`, if present) from the request to the actual `organization_id`/`branch_id` server-side — never trust an org/branch ID sent directly by the client.
- Confirm the submitted `organizationProfessionId` actually belongs to the resolved organization; reject (`404`/`400`) if not.
- The saved application's `organization_id` and `branch_id` must always be the ones resolved from the link the applicant actually used, not any client-supplied value.

### 4. Persist the application — Prisma
- Use the project's existing Prisma client (pointed at the Supabase pooled connection string, per established convention) for all reads and writes in this handler.
- In a single Prisma transaction:
  1. Create the `applications` row with the resolved org/branch, the submitted fields, and `current_stage_id` set to the organization's **first pipeline stage** (lowest `position`).
  2. Clone that stage's `checklist_templates` into `application_checklist_items` for the new application — the same cloning behavior already described in `database-design.md` / `api-design.md` for stage transitions, just applied at creation instead of a later move.
- Because a direct Prisma connection isn't subject to Supabase RLS, this handler is now the *only* thing standing between a malformed/malicious request and the database — validate thoroughly rather than relying on any database-level backstop here.
- Note: bot protection (Cloudflare Turnstile) and rate-limiting on this endpoint were part of the original architecture for this exact submission path (`architecture.md`, "Public form submission path") but weren't built in `feature 08.md`. Confirm whether to include them in this feature or track them as a fast-follow hardening pass — don't ship this publicly reachable write endpoint without one or the other.

### 5. Loading state during submission
- Disable the submit control and show a standard loading indicator (spinner/skeleton, consistent with the app's existing loading patterns) for the duration of the request.
- Guard against double-submission — a second click while a request is in flight must not create a duplicate application.

### 6. Confirmation email to the applicant
- On successful save, send a confirmation email to the applicant's submitted email address containing: their name, the organization (and branch, if applicable), the profession applied for, requested dates (if given), and a clear confirmation that the application was received.
- Use the email provider established in `architecture.md`: Resend.
- **Email sending must not be on the critical path for the save itself**: if the email fails to send, the application must still be considered successfully submitted — don't roll back the DB write, and don't fail the response to the client. Log the email failure (e.g. Sentry) for follow-up rather than surfacing it to the applicant.
- Sending an internal "new application received" notification to the organization's team is a separate, already-tracked Phase 2 item (`build-plan.md`) — out of scope here unless you want to fold it in now; call that out explicitly if so.

### 7. Success state on the form
- After a successful submission, replace the form with a clear confirmation state (e.g. "Application received — check your email") rather than leaving the applicant on a blank or ambiguous screen. This is the same failure mode fixed in `feature 07.md` for the org-creation flow — don't reintroduce it here.
- On failure, surface a clear, actionable error and let the applicant retry without losing their entered data.

## Explicitly out of scope

- Any dashboard-side changes — the board/calendar views already expect applications with a stage and checklist items; this feature should make new applications compatible with that, not modify those views.
- The internal team notification email (Phase 2, per `build-plan.md`).
- Any changes to the `applications` table schema itself — this feature assumes it's already in its final, correct shape per the precondition above.

## Acceptance Criteria

- [ ] Submitting a valid application creates a row in `applications` with the correct `organization_id`/`branch_id` resolved from the link, not from client input.
- [ ] The new application's `current_stage_id` is set to the org's first pipeline stage, with that stage's checklist cloned into `application_checklist_items`.
- [ ] Invalid submissions return field-level `400` errors and never reach the database.
- [ ] A submitted `organizationProfessionId` that doesn't belong to the resolved organization is rejected.
- [ ] The submit button shows a loading state during the request and cannot be double-clicked into creating duplicate applications.
- [ ] A confirmation email reaches the applicant's address after a successful save, containing their name, org/branch, profession, and requested dates if given.
- [ ] A simulated email-send failure still results in a successfully saved application and a success response to the client.
- [ ] The apply page shows a clear success state after submission and a clear, recoverable error state on failure.
- [ ] The new application is immediately visible and fully usable (correct stage, checklist) on the org's pipeline board.

## Assumptions to Confirm

- Exact final shape of the `applications` table (see Preconditions) — reconcile with `database-design.md` if it has changed.
- Whether Turnstile/rate-limiting ships in this feature or as a separate hardening pass.
- Whether the internal team notification email should be folded into this feature or stay a separate Phase 2 item.
- ~~Which email provider is actually configured in the project.~~ Resolved: Resend (see `architecture.md`).

## Related docs

- `feature 08.md` — the form this feature wires up
- `feature 07.md` — the earlier "blank screen after submit" bug this feature must not repeat
- `api-design.md` — base `POST /api/public-apply` contract
- `database-design.md` — `applications`, `application_checklist_items`, `pipeline_stages`, `checklist_templates`
- `architecture.md` — public submission security pattern, email provider choice
- `build-plan.md` — Phase 2 notification scope boundary
