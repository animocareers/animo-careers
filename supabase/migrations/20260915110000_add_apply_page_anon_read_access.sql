-- Public apply-form pages (feature 08) resolve an organization's slug, its
-- branches, and its offered professions with the anon client — no session
-- exists on this unauthenticated route (context/features/feature 08.md §5).
--
-- Policies below are scoped `to anon` specifically, never `to public`.
-- Postgres ORs all permissive policies together per role for a given
-- operation: organizations/branches/organization_professions already carry
-- `to authenticated` policies scoped by private.current_org_id() (see
-- 20260914045725_initial_schema.sql). A `to public using (true)` policy here
-- would combine with those and silently grant every logged-in user
-- cross-tenant read access to every org's rows, not just anon's read of its
-- own apply-link target. `to anon` avoids that: a session running as
-- `authenticated` never evaluates `to anon` policies at all.
--
-- RLS is row-level, not column-level, so each policy is paired with an
-- explicit column-restricted `grant select (...) ... to anon` — the same
-- "RLS without the underlying grant fails closed" lesson
-- 20260914072245_grant_authenticated_table_privileges.sql already encodes,
-- applied here as defense-in-depth so `organizations.address`/`domain` and
-- `branches.address` (never needed to resolve an apply link) stay out of
-- anon's reach even though the row itself is readable.
--
-- Known, accepted tradeoff: `using (true)` lets anon enumerate every org's
-- id/name/slug (and every org's branches/professions) given no prior
-- context, not just the one org whose apply link they were handed. This
-- matches the spec's framing of this data as "public, unauthenticated data
-- (not PII)" and is no more exposed than the apply link itself already
-- publishing an org's name. `applications` and its RLS are untouched here —
-- out of scope for this feature (see feature 08.md §7); public submissions
-- still go through the future service-role-backed /api/public-apply route.

create policy "public can read organizations for apply-link resolution"
on organizations for select
to anon
using (true);

grant select (id, name, slug) on table public.organizations to anon;

create policy "public can read branches for apply-link resolution"
on branches for select
to anon
using (true);

grant select (id, organization_id, name, slug) on table public.branches to anon;

create policy "public can read organization professions for the apply form"
on organization_professions for select
to anon
using (true);

grant select (id, organization_id, profession_catalog_id, is_active)
  on table public.organization_professions to anon;

create policy "public can read the profession catalog for the apply form"
on profession_catalog for select
to anon
using (true);

grant select on table public.profession_catalog to anon;
