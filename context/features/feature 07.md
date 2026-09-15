# Feature 07 — Organization Setup: Post-Creation Redirect & Org Settings Page

## Summary

Fix the broken post-submit state after a new organization is created, and introduce a dedicated **Organization Settings** page that shows/edits the organization's details and surfaces the public application (apply) link with a copy-to-clipboard action. Add an entry point to this page from the profile avatar menu, visible only to the `owner` role.

## Current Behavior (context — not changing)

- On signup, if the new user's email domain matches an existing organization's domain, they are auto-registered as `team_member` in `organization_members` for that organization.
- If the domain does **not** match an existing organization, the dashboard shows a "Setup Organization" button.
- Clicking it opens a right-side slide-over/drawer with a form to enter organization details (name, address, industry type, etc.).

## Problem (what's actually broken/missing)

1. **Bug**: after submitting the organization-creation form, the drawer closes but the user is left on the dashboard with a **blank screen** — there's no follow-up navigation.
2. There is currently no page where an organization's details can be viewed or edited after creation.
3. There is no way for an owner to retrieve/copy the public application (apply) link once the organization exists.
4. There is no navigation entry point to reach organization details from anywhere other than the initial setup flow.

## Desired Behavior

### 1. Redirect after organization creation

- On successful submission of the "Setup Organization" form, close the drawer and **redirect the user to the Organization Settings page** (see below) instead of leaving them on a blank dashboard.
- Suggested route: `/settings/organization` (consistent with the existing `settings/professions`, `settings/branches`, `settings/team` pattern, if those already exist in the codebase).

### 2. Organization Settings page

- Displays all organization fields: name, address, industry type (and any other fields already captured on the setup form).
- Fields are editable, with a save action that persists changes back to the `organizations` table.
- This is the same page reached both right after org creation and via the new navigation entry (#4) — no separate "view" vs. "just created" variant.

### 3. Apply-link field with copy button

- On the same page, show the public application form link in a **disabled/read-only text input**, with a **"Copy" button** beside it.
- Clicking Copy writes the link to the clipboard and gives the user visible confirmation (e.g. button label briefly changes to "Copied", or a toast).
- The link value is the organization's existing public apply URL (built from the org's slug, e.g. `https://<domain>/apply/{orgSlug}` — reuse whatever slug/link logic already exists in the codebase rather than re-deriving it here).

### 4. "Organization" item in the profile avatar menu

- Add a new item labeled **"Organization"** to the dropdown menu opened from the profile avatar.
- Clicking it navigates to the same Organization Settings page from #2.
- **Visibility**: this menu item should only render for users whose role is `owner`. Other roles (`admin`, `head_of_apprenticeship`, `team_member`) should not see it in this menu.

## Technical Notes

- **Field source**: pull organization data from the `organizations` table (`name`, `address`, `industry_type`, `slug`, etc.) — match whatever fields the "Setup Organization" form already collects, so the settings page is a strict superset (view + edit) of the creation form, not a new/different field set.
- **Read-only input accessibility**: implement the apply-link field with the `readOnly` attribute rather than `disabled`. A `disabled` input is excluded from tab order and some browsers won't allow text selection from it, which fights the whole point of a copyable field. `readOnly` keeps it focusable/selectable while still preventing edits — style it visually as "disabled" (muted background, etc.) if that's the intended look.
- **Clipboard action**: use the Clipboard API (`navigator.clipboard.writeText`) with a try/catch fallback, and reset any "Copied" confirmation state after a couple of seconds.
- **Role gating**: the `owner`-only visibility for the "Organization" menu item is a UI convenience. **Also confirm/enforce access at the page and data level** (e.g., via RLS on `organizations`/route-level role check), not just by hiding the menu item — a non-owner should not be able to reach or edit this page by navigating to the URL directly. Decide and document here if `admin` should also have edit access, since elsewhere in the app `admin` generally has the same permissions as `owner` except billing/deletion — this feature request specifies owner-only for the menu entry point, so confirm whether that's intentionally narrower before enforcing it identically at the data layer.
- **Scope of "organization details"**: this page covers the core organization record only (name/address/industry/apply link). Branches, professions, pipeline stages, and team management remain on their own existing/planned settings pages — don't fold them into this one unless explicitly asked.

## Acceptance Criteria

- [ ] Submitting the "Setup Organization" form redirects to the Organization Settings page — no more blank screen.
- [ ] The Organization Settings page loads and displays the current organization's actual data (not stale/empty state).
- [ ] All displayed organization fields are editable and persist correctly on save.
- [ ] The apply-link field is present, read-only in appearance, and its value matches the organization's real public apply URL.
- [ ] Clicking Copy places the correct link on the clipboard and gives the user clear confirmation that it copied.
- [ ] The profile avatar dropdown shows an "Organization" item only when the current user's role is `owner`.
- [ ] Clicking "Organization" in the avatar menu navigates to the same settings page described above.
- [ ] A non-owner cannot reach a working, editable version of this page by URL alone (confirm current enforcement approach and note any gap).

## Edge Cases / Open Questions

- If the organization has multiple branches with their own apply-link variants, should this page show only the org-level link, or a link per branch? (Default assumption: org-level link only, matching what the original "Setup Organization" flow produces today.)
- Should there be a loading/empty state if organization data hasn't finished loading yet, vs. redirecting before data is ready?
- Confirm whether `admin` should ever see the "Organization" menu item — as specified, it's owner-only; flag if that's a deliberate product decision or just what was described.
