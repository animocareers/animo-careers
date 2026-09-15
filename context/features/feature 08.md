# Feature 08 — Public Application Form (Multi-Step, Mobile + Desktop)

## Summary

Build the public-facing application form that applicants reach via an organization's apply link. Mobile must match the provided design exactly; desktop is a standard, self-designed layout using a stepper. This feature covers **UI, validation, and step flow only** — no persistence/saving logic yet.

## Context

- Reference design: **`context/assets/application_page.png`** — a mobile-view screenshot of the target design. **View this file directly before starting**; this spec describes structure and behavior but cannot reproduce its exact visual details (spacing, colors, copy, icon choices, etc.). Match it exactly for mobile.
- No desktop mockup is provided — design the desktop layout yourself, using standard/conventional patterns consistent with the rest of the app's design system (shadcn/ui + Tailwind, per `architecture.md`).
- This form is reached via the apply link already specified in `architecture.md` / `product-requirements.md`: `/apply/{orgSlug}` or `/apply/{orgSlug}/{branchSlug}`.
- Field list, scope toggle, and mandatory-school toggle are as defined in `product-requirements.md` §5 and `database-design.md`'s `applications` table — this feature builds the UI for those fields, it doesn't change what they are.

## Requirements

### 1. Route & layout

- Pages live under `app/apply/[orgSlug]/[[...branchSlug]]/`, matching the existing apply-link structure.
- This route must have **its own layout, entirely separate from the authenticated dashboard layout** — no sidebar, no dashboard nav/header. Add a dedicated `layout.tsx` for this route (or its route group) with a minimal shell appropriate for a public-facing form (e.g. centered container, logo, nothing else).
- Resolve the organization (and branch, if present) from the URL slug(s) server-side before rendering the form.

### 2. Mobile flow — 3-step wizard (match the screenshot exactly)

- Three steps total. Step 1, per the description, is the "details" step — build the remaining steps' field grouping by inspecting the screenshot directly, don't guess the split.
- Each step shows only its own fields; a **Continue** button advances to the next step.
- Continue should be blocked until the current step's fields pass validation.
- Include a **Back** action to return to the previous step, and whatever progress indicator (dots/step count/etc.) the screenshot shows.
- Match the screenshot's spacing, field order, labels, and visual style for this breakpoint precisely.

### 3. Desktop flow — stepper

- Same 3 logical steps and same underlying form state/validation as mobile.
- Render a stepper (numbered/labeled steps across the top, current step highlighted, completed steps marked) instead of the mobile progress indicator.
- shadcn/ui doesn't ship a dedicated stepper primitive — compose one from existing primitives (e.g. `Separator`, `Badge`/`Progress`-style indicators) or a standard custom stepper component; keep it visually consistent with the rest of the shadcn/ui design system already used elsewhere in the app.
- Recommended approach: one shared form/step-state implementation, responsive via Tailwind breakpoints (mobile-first single-step view by default, stepper chrome added at `md:` and above) — rather than two separate form implementations. Flag if you take a different approach and why.

### 4. Fields

Per `product-requirements.md` / `database-design.md`'s `applications` table:
- First name, last name, email, phone, date of birth
- Profession (see §5 below)
- Scope: single profession vs. Orientierungspraktikum
- Mandatory-from-school (Pflichtpraktikum) toggle
- Requested start/end dates (optional)
- Branch selector — only if the organization has more than one branch

Use shadcn/ui form primitives throughout (`Input`, `Select`, `RadioGroup`/`ToggleGroup` or `Switch` for the boolean/scope fields, etc.) wired up with React Hook Form + Zod, per `architecture.md`'s established stack. Build the Zod validation schema under `lib/validation/` now — it'll be reused by the future save-logic feature, so get the shape right even though nothing persists yet.

### 5. Profession dropdown — organization-scoped

- The Job/Role field is a **Select** dropdown.
- Options must be the professions the *specific organization* (resolved from `orgSlug`) actually offers — i.e. `organization_professions` joined to `profession_catalog`, filtered by that organization's ID. Never show the full global catalog.
- This is public, unauthenticated data (not PII) — add a narrowly-scoped public **read** RLS policy on `organization_professions`/`profession_catalog` (and the minimal needed columns of `organizations`/`branches` for slug resolution) so this page can resolve everything with the regular (anon) client, without needing the service-role client. Keep the service-role client reserved for the actual submission write, as already established in `architecture.md`'s "Public form submission path."

### 6. Date fields

- Use shadcn's Calendar + Popover date-picker pattern for date of birth and the requested start/end dates — not a bare native `<input type="date">`.

### 7. Explicitly NOT in scope

- **Do not implement the save/submit logic.** The `applications` table needs schema changes first (tracked as a separate, later feature).
- On final submit, stub the handler (e.g. log the assembled payload, no-op) with a clear `// TODO: wire up once applications table schema is finalized` comment. Do **not** call `/api/public-apply` or write to the `applications` table from this feature.
- Do not modify the `applications` table or its RLS policies as part of this feature.

## Acceptance Criteria

- [ ] Mobile view matches `context/assets/application_page.png` exactly (layout, spacing, step behavior, copy).
- [ ] Desktop view uses a stepper reflecting the same 3 steps, styled consistently with the rest of the app.
- [ ] Step navigation (Continue/Back) works on both breakpoints, gated by per-step validation.
- [ ] Profession dropdown shows only the resolved organization's offered professions — verified against at least two different organizations with different profession sets.
- [ ] Branch selector appears only when the organization actually has more than one branch.
- [ ] Date of birth and requested date fields use the shadcn date-picker pattern.
- [ ] The route renders with its own standalone layout — no dashboard chrome present.
- [ ] Submitting the final step does **not** create any database row or call any save endpoint.
- [ ] Zod validation schema for the form fields exists under `lib/validation/` and is exercised by the form.

## Assumptions to Confirm Against the Screenshot

- Exact field grouping across steps 2 and 3 (only step 1 = "details" was specified in the request).
- Whether the branch selector (when applicable) belongs in step 1 or elsewhere.
- Exact labels/copy for the profession field ("Job," "Role," "Profession," etc.) and the scope/mandatory toggles.
- Whether "Continue" on the final step is literally labeled "Submit"/"Apply" or something else, given no save logic fires yet.

## Related docs

- `architecture.md` — routing structure, stack, public form submission pattern
- `database-design.md` — `applications`, `organization_professions`, `profession_catalog`, `branches` schemas
- `product-requirements.md` §5 — public application form field list
- `api-design.md` — the future `/api/public-apply` contract this form's data will eventually feed
