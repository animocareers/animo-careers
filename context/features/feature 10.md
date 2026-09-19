# Feature 10 — Organization Page Tabs: Team Members List & Member Detail Editing

## Summary

Turn the Organization Settings page built in `feature 07.md` into a tabbed page: the existing org-details content becomes one tab, and a new "Team Members" tab lists the organization's members with a shimmer loading state, an (as-yet non-functional) invite button, and a right-side panel to view/edit an individual member's role and department.

## Preconditions / Builds On

- `feature 07.md` — the Organization Settings page this feature adds tabs to, reached via the profile avatar's "Organization" item (owner-only).
- `feature 09.md` — established that Prisma bypasses Supabase RLS, so authorization/scoping for this feature's queries must be enforced explicitly in application code, the same way `applications` queries are scoped. Reuse that pattern here rather than inventing a new one.
- The invite team member UI (drawer with email/role/branch fields) was already designed as a visual reference in a prior discussion — this feature intentionally does **not** wire that drawer up. Treat "Invite team member" as a button that exists visually and nothing more, for now.

## Requirements

### 1. Tabbed layout on the Organization page

- Add two tabs to the existing Organization Settings page: **"Organization details"** and **"Team Members."**
- "Organization details" is the existing `feature 07.md` content (editable org fields + apply-link copy field) — move it into this tab unchanged, don't redesign it.
- "Team Members" is new, described below.

### 2. Team Members tab — data & scoping

- Fetch and display all members of the current organization.
- Scoping rule: same organization, **and** same branch when the viewing member is branch-scoped (`organization_members.branch_id` is set); an org-wide viewer (`branch_id is null` — always true for `owner`/`admin`) sees the whole organization. This mirrors the `applications` scoping pattern from `feature 09.md` — reuse (or closely model after) that same shared-helper approach rather than writing a one-off filter.
- Since only `owner` can currently reach this page (per `feature 07.md`), this will in practice show the entire org roster today. Build the scoping generically anyway, since this component/query may be reused later for a branch-scoped viewer.
- Table columns: member (avatar + name + email), role, branch, status (Active/Pending — most members will show Active today, since invite creation isn't implemented yet; domain-based auto-join already produces active members).

### 3. Loading state — shimmer

- While the member list is being fetched, render skeleton/shimmer rows matching the table's real column layout (avatar circle, name/email lines, role badge, branch text, status) rather than a blank area or a generic spinner.

### 4. Invite button — visual only, not wired up

- Render an "Invite team member" button with an icon, right-aligned above the table.
- **Do not implement any invite logic behind it in this feature** — no drawer wiring, no email sending, no `invitations` row creation. A click handler can be absent or a no-op. This is deliberately split into a separate, later feature.

### 5. Member row click → right-side detail/edit panel

- Clicking a row opens a panel on the **right side** of the screen (slide-over/drawer pattern — same UI pattern already used for the org-creation flow in `feature 07.md`'s context and the invite drawer reference), not a centered dialog.
- Shows the selected member's details and lets you edit **role** and **department** (see the resolved design decision below), then save.
- Identity fields — name, email — are **read-only** here; those belong to the member's own account, not something an org owner edits on their behalf.
- The `owner` role must not appear as a selectable option in the role dropdown when editing another member — reassigning ownership is a distinct, higher-stakes operation and shouldn't be exposed as a casual dropdown choice here.

### 6. Save behavior

- Saving role/department changes should actually persist (via Prisma, per the project's established convention) — unlike the invite button, editing an existing member is in scope and should be fully functional.
- Enforce that only `owner`/`admin` can save changes from this panel (matches the existing invite/remove-member permission tier in `roles-and-permissions.md`); irrelevant today since only `owner` reaches this page, but build the check in now rather than retrofitting it later.

## Resolved Design Decision: What "Department" Means

**"Department" is a separate concept from "branch"** — a functional grouping (e.g. "HR" or "Operations") independent of which physical branch someone works out of. It did not previously exist in the schema, so this feature adds a nullable free-text `department` column to `organization_members` (new migration), edited via a plain text field in the member panel. `branch_id` is unaffected.

## Explicitly Out of Scope

- Sending invitations, generating invite tokens, or any part of the invite acceptance flow — tracked as a separate future feature.
- Editing a member's name or email.
- Removing/deactivating a member, or transferring ownership — neither was asked for here; flag if you want either folded in.
- Any change to who can _reach_ this page (still owner-only per `feature 07.md`) — this feature only adds what's inside it.

## Acceptance Criteria

- [ ] The Organization page shows two tabs: "Organization details" (unchanged `feature 07.md` content) and "Team Members."
- [ ] The Team Members tab fetches members scoped to the current organization, and to the viewer's branch if they're branch-scoped.
- [ ] A shimmer/skeleton loading state matches the table's real layout while data loads.
- [ ] "Invite team member" renders with an icon, top-right above the table, with no invite logic wired to it.
- [ ] Clicking a row opens a right-side panel with that member's details.
- [ ] Role and department are editable and persist correctly on save; name and email are read-only.
- [ ] `owner` never appears as a selectable role option when editing someone else.
- [ ] Only `owner`/`admin` can actually save changes from this panel.
- [x] The "department" question is resolved (separate nullable text column on `organization_members`) and the schema change is reflected in `database-design.md`.

## Related Docs

- `feature 07.md` — the Organization Settings page this feature extends
- `feature 09.md` — the Prisma/RLS scoping pattern this feature reuses
- `database-design.md` — `organization_members` schema (update if the department question adds a column)
- `roles-and-permissions.md` — role definitions and branch-scoping rules this feature must respect
