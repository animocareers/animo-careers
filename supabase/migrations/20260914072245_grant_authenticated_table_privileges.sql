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

grant select, insert, update, delete on all tables in schema public to authenticated;

-- So future migrations don't need to remember this step for new tables.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
