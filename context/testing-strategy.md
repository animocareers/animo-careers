# Animo — Testing Strategy

## Priorities, in order

1. **Cross-tenant / cross-branch isolation** — the single highest-value test category in this codebase, because RLS is the actual security boundary (see `architecture.md`). A bug here means one company sees another's applicant data.
2. Core user flows end-to-end (see `user-flows.md`).
3. Everything else.

## Test types

| Type | Tooling | What it covers |
|---|---|---|
| Unit | Vitest | Business logic in Server Actions: checklist cloning, profession-count cap, date validation |
| RLS / policy tests | Supabase local (`supabase start`) + Vitest or pgTAP | Every RLS policy, tested as an actual authenticated Postgres role — not mocked. Includes explicit "org A cannot see org B" and "branch-scoped member cannot see another branch" cases |
| Integration | Vitest + Supabase local instance | Route Handlers (`/api/public-apply`) against a real (local) database |
| End-to-end | Playwright | Full flows from `user-flows.md`: signup → org setup → apply link → public submission → board → calendar |
| Accessibility | axe-core, run in CI against the public apply page | Keyboard navigation and screen-reader labels — the one surface used by people outside Animo's customer base |
| Load | k6 or Artillery | Spikes on `/api/public-apply` (a customer's careers page can drive bursts) |
| Security | OWASP ZAP scan in CI, `npm audit` / Dependabot | Baseline scanning; a manual review/pen test before public launch given the minors'-data exposure |

## RLS testing pattern

Test each policy from the perspective of an actual authenticated user, not the service-role client:

```ts
// pseudo-code
const orgAUser = await signInAs(orgAMemberEmail);
const { data, error } = await orgAUser.from('applications').select('*').eq('id', orgBApplicationId);
expect(data).toHaveLength(0); // RLS filters it out silently, not a 403
```

Write this pattern once per table that has RLS, and once per role/branch-scoping combination that matters (org-wide member vs. branch-scoped member, `team_member` vs. `head_of_apprenticeship`).

## Critical end-to-end scenarios (minimum bar before any release)

- [ ] Company signup → org creation → default branch + pipeline seeded correctly
- [ ] Profession selection enforces the 2–15 bound
- [ ] Team invite → accept → new member has correct role/branch scope
- [ ] An invited email already active in another org is rejected
- [ ] Public apply form submission (with and without dates) creates a correctly-scoped `applications` row
- [ ] Application appears on the board in the first stage; moving it clones the next stage's checklist
- [ ] Calendar view's "no date" control lands on the board pre-filtered correctly
- [ ] A branch-scoped `team_member` never sees another branch's applications, in the UI and via direct API/table access

## What NOT to mock

Don't mock Supabase's RLS behavior in tests that are supposed to verify tenant isolation — run them against a real local Postgres instance via `supabase start`. Mocking the database for these specific tests defeats their entire purpose.
