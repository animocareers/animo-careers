-- Feature 10: "department" is a genuinely separate concept from `branch`
-- (a functional grouping like "HR"/"Operations", independent of which
-- physical branch/location a member works out of) — confirmed with the
-- product owner rather than silently treating it as a `branch` alias. Simple
-- free-text column for this first pass; no enum/catalog requested.
--
-- No RLS changes needed: the existing "members can read their org's
-- membership roster" (select) and "owners and admins can manage org
-- membership" (all) policies on organization_members already cover reading
-- and writing this new column.

alter table organization_members add column department text;
