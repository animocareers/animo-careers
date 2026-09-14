-- Fixes a gap in the initial schema migration: every tenant-scoped table got
-- RLS policies `to authenticated`, but the base table-level GRANT to the
-- `authenticated` role was never issued. Postgres requires BOTH a table
-- privilege grant AND a passing RLS policy for a query to succeed — RLS
-- alone (without the grant) makes every query fail with "permission denied
-- for table ...", not an RLS-filtered empty result. This went unnoticed
-- because, before this feature, no dashboard code queried a table directly
-- as the authenticated user (only supabase.auth.getClaims() was called).
-- Verified live against the project's `authenticated` role via
-- information_schema.role_table_grants: every public table had only
-- REFERENCES/TRIGGER/TRUNCATE, never SELECT/INSERT/UPDATE/DELETE.
--
-- RLS policies remain the actual authorization boundary (per
-- architecture.md) — these grants are the Postgres-level prerequisite the
-- policies already assume, not a widening of access. `anon` intentionally
-- gets nothing here: no table in this schema has an anon-facing RLS policy
-- (public apply submissions go through the service-role-backed
-- /api/public-apply route, per api-design.md).

-- Supabase projects may already have platform default grants on public
-- tables. Clear those inherited privileges first so the explicit grants
-- below are the complete, auditable access surface for this schema.
revoke all privileges on table public.organizations from authenticated;
revoke all privileges on table public.branches from authenticated;
revoke all privileges on table public.organization_members from authenticated;
revoke all privileges on table public.profession_catalog from authenticated;
revoke all privileges on table public.organization_professions from authenticated;
revoke all privileges on table public.pipeline_stages from authenticated;
revoke all privileges on table public.checklist_templates from authenticated;
revoke all privileges on table public.applications from authenticated;
revoke all privileges on table public.application_checklist_items from authenticated;
revoke all privileges on table public.application_notes from authenticated;
revoke all privileges on table public.application_attachments from authenticated;
revoke all privileges on table public.invitations from authenticated;
revoke all privileges on table public.audit_logs from authenticated;

grant select, update on table public.organizations to authenticated;
grant select, insert, update, delete on table public.branches to authenticated;
grant select, insert, update, delete on table public.organization_members to authenticated;
grant select on table public.profession_catalog to authenticated;
grant select, insert, update, delete on table public.organization_professions to authenticated;
grant select, insert, update, delete on table public.pipeline_stages to authenticated;
grant select, insert, update, delete on table public.checklist_templates to authenticated;
grant select, update on table public.applications to authenticated;
grant select, insert, update, delete on table public.application_checklist_items to authenticated;
grant select, insert on table public.application_notes to authenticated;
grant select, insert, update, delete on table public.application_attachments to authenticated;
grant select, insert, update, delete on table public.invitations to authenticated;
grant select on table public.audit_logs to authenticated;
