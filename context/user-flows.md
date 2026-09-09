# Animo — User Flows

Concrete step-by-step workflows, derived from the original product description. Each flow lists the actor, steps, and notable edge cases. Terminology matches `project-overview.md`.

## 1. Company signup & organization creation

**Actor**: prospective company admin

1. Visits Animo, signs up with company email + password.
2. Confirms email (if email verification is enabled).
3. Prompted to create an organization: name, address, industry type.
4. A default branch ("Main") is created automatically.
5. Selects 2–15 professions from the Bundesagentur für Arbeit catalog dropdown.
6. Reviews the suggested default 6-stage pipeline with default checklists; edits stage names/order and checklist items as desired.
7. Organization setup is marked complete → apply link is generated.

**Edge cases**: fewer than 2 or more than 15 professions selected → blocked with inline validation. Organization name collision on the slug → auto-suffix or prompt for a different slug.

## 2. Inviting a team member

**Actor**: org admin

1. Opens Team settings, enters a teammate's email and picks a role.
2. Optionally scopes the invite to a specific branch (for `head_of_apprenticeship` / `team_member`).
3. Animo sends an invite email with a signup link.
4. Invitee clicks the link, sets a password, lands directly in the org (no separate org-creation step for invitees).

**Edge cases**: invite expired → resend flow. Invitee email already tied to a *different* organization → rejected, since one user belongs to exactly one organization (see `roles-and-permissions.md`).

## 3. Generating and embedding the apply link

**Actor**: org admin

1. After org setup, Animo shows the apply link for the organization (and, if multiple branches exist, one per branch).
2. Admin copies the link and pastes it behind an "Apply" button/anchor on the company's own website.
3. A visitor on the company's site clicks Apply → full-page redirect to Animo's public apply page.

## 4. Applicant submits an application

**Actor**: student/applicant (unauthenticated)

1. Lands on `animo.app/apply/{orgSlug}` (or a branch-specific variant) via the redirect above.
2. Fills in: name, email, phone, date of birth.
3. Selects a profession from the org's configured list.
4. Chooses scope: single profession vs. Orientierungspraktikum (broader, related professions).
5. Indicates whether the internship is mandatory from school (Pflichtpraktikum).
6. Optionally enters requested start/end dates (may be left blank).
7. Submits. Bot-check and validation run before the record is created.
8. Confirmation message shown; the company now sees the application in their pipeline.

**Edge cases**: required fields missing → inline validation before submit (client-side), re-validated server-side regardless. Spam/bot traffic → Turnstile challenge.

## 5. Processing an application — pipeline board

**Actor**: team member / head of apprenticeship

1. Opens the Pipeline view; sees all applications as cards grouped by stage, new ones in the first stage.
2. Clicks a card → detail panel expands showing: current stage's checklist (open/done), full application data with missing fields visually flagged, and the notes thread.
3. Checks off to-do items as they're completed; can assign a to-do to a specific teammate.
4. Adds a note.
5. Drags/moves the card to the next stage — checklist items for the new stage are cloned onto the application.

**Edge cases**: a required piece of applicant data is missing (e.g. no phone) → flagged visually in the detail panel rather than blocking stage progression.

## 6. Processing an application — calendar view

**Actor**: team member / head of apprenticeship

1. Opens the Calendar view; applications are organized by requested internship dates and, separately, by confirmed dates.
2. Clicks an application on the calendar → the same detail panel opens as in the board view.
3. Sets/edits confirmed start and end dates directly from this panel.

## 7. Finding applications without a date

**Actor**: team member / head of apprenticeship

1. From the Calendar view, clicks "Applications without specified date."
2. View switches to the pipeline board, pre-filtered to only applications with no requested or confirmed dates.
3. User processes/updates these as in flow 5, then can clear the filter to return to the full board.
