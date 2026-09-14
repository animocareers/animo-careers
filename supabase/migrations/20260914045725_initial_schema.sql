-- Animo initial schema
--
-- Source of truth: context/database-design.md. Tables are created in FK
-- dependency order first, then RLS is enabled and policies are added for
-- every tenant-scoped table (per database-design.md: "a table without its
-- RLS policy should never ship"), then supporting indexes.
--
-- auth.users is owned and managed by Supabase Auth and already exists in
-- every Supabase project — it is not created here, only referenced by FK.

-- =============================================================================
-- 1. Extension types
-- =============================================================================

create type org_role as enum ('owner', 'admin', 'head_of_apprenticeship', 'team_member');

-- =============================================================================
-- 2. Tables (FK dependency order)
-- =============================================================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,           -- used in animo.app/apply/{slug}
  address jsonb,
  industry_type text,
  created_at timestamptz default now()
);

-- Every organization gets one of these automatically at creation ("Main"),
-- so nothing downstream needs a special case for single-location companies.
create table branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text not null,
  address jsonb,
  slug text,                            -- optional: /apply/{orgSlug}/{branchSlug}
  created_at timestamptz default now(),
  unique (organization_id, slug)
);

-- One user -> exactly one organization. UNIQUE on user_id (not a composite key)
-- is what enforces that constraint.
create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  user_id uuid unique references auth.users(id),
  branch_id uuid references branches(id),   -- NULL = sees the whole org
  role org_role not null,
  status text default 'active',              -- invited | active | disabled
  created_at timestamptz default now()
);

-- Global, shared catalog seeded from the Bundesagentur fuer Arbeit "Berufe A-Z" list
create table profession_catalog (
  id uuid primary key default gen_random_uuid(),
  external_code text unique,
  name_de text not null,
  category text
);

-- The 2-15 professions each org actually offers
create table organization_professions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  profession_catalog_id uuid references profession_catalog(id),
  is_active boolean default true,
  unique (organization_id, profession_catalog_id)
);
-- enforce the 2-15 cap with a trigger or a check in the mutation path

create table pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text not null,
  position int not null,
  created_at timestamptz default now()
);

create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  pipeline_stage_id uuid references pipeline_stages(id),
  title text not null,
  position int not null
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  branch_id uuid references branches(id) not null,
  organization_profession_id uuid references organization_professions(id),
  first_name text, last_name text, email text, phone text, date_of_birth date,
  scope text check (scope in ('single_profession', 'orientierungspraktikum')),
  is_school_mandatory boolean,
  current_stage_id uuid references pipeline_stages(id),
  requested_start_date date, requested_end_date date,
  confirmed_start_date date, confirmed_end_date date,
  submitted_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- "no date given yet" and "missing information" are computed at query time
-- from nullable columns above — not stored as flags, to avoid drift.

-- Cloned from checklist_templates when an application enters a stage, so
-- later template edits don't retroactively change in-flight applications.
create table application_checklist_items (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id),
  title text not null,
  position int not null,
  is_done boolean default false,
  done_by uuid references auth.users(id),
  done_at timestamptz,
  assigned_to uuid references auth.users(id)
);

-- Modeled as a feed, not a single free-text field, to preserve who-said-what.
create table application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id),
  author_id uuid references auth.users(id),
  body text not null,
  created_at timestamptz default now()
);

create table application_attachments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id),
  storage_key text not null,             -- Supabase Storage object path
  file_name text, content_type text,
  uploaded_at timestamptz default now()
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  branch_id uuid references branches(id),   -- optional scope for the invitee
  email text not null,
  role org_role not null,
  token text unique not null,
  invited_by uuid references auth.users(id),
  expires_at timestamptz,
  accepted_at timestamptz
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  actor_id uuid references auth.users(id),
  action text not null,                    -- e.g. "application.stage_changed"
  entity_type text, entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- =============================================================================
-- 3. Helper functions for RLS
-- =============================================================================
--
-- Every tenant-scoped policy below needs "what org/branch/role does the
-- calling user have". Rather than repeat
-- `(select organization_id from organization_members where user_id = auth.uid())`
-- inline in every policy (and, for policies ON organization_members itself,
-- recurse into the table the policy is defined on), these are wrapped in
-- SECURITY DEFINER helper functions in a private, non-API-exposed schema.
-- SECURITY DEFINER makes the lookup bypass RLS internally (breaking the
-- self-reference on organization_members), and wrapping calls in `(select ...)`
-- at the call site lets Postgres cache the result per statement instead of
-- re-evaluating per row.

create schema if not exists private;

create or replace function private.current_org_id()
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select organization_id from public.organization_members where user_id = (select auth.uid())
$$;

create or replace function private.current_branch_id()
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select branch_id from public.organization_members where user_id = (select auth.uid())
$$;

create or replace function private.current_role()
returns org_role
language sql
security definer
stable
set search_path = ''
as $$
  select role from public.organization_members where user_id = (select auth.uid())
$$;

revoke execute on function private.current_org_id() from public, anon;
revoke execute on function private.current_branch_id() from public, anon;
revoke execute on function private.current_role() from public, anon;
grant execute on function private.current_org_id() to authenticated;
grant execute on function private.current_branch_id() to authenticated;
grant execute on function private.current_role() to authenticated;

-- =============================================================================
-- 4. Row-Level Security
-- =============================================================================
-- Core pattern (per database-design.md), rewritten with the helper functions:
--   select: organization_id (and, where relevant, branch_id) matches the
--     caller's own membership.
--   mutate (insert/update/delete): same scoping, gated to
--     owner/admin/head_of_apprenticeship — the role list database-design.md's
--     applications example uses. Note this is a direct, mechanical
--     application of that example; roles-and-permissions.md's matrix grants
--     team_member narrower, branch-scoped write access on applications and
--     their checklist items/notes/attachments that these policies don't yet
--     carve out — flagged here rather than silently resolved either way, see
--     the summary for this migration.

-- ---- organizations ---------------------------------------------------------

alter table organizations enable row level security;

create policy "members can read their own organization"
on organizations for select
to authenticated
using (id = (select private.current_org_id()));

create policy "owners and admins can update their own organization"
on organizations for update
to authenticated
using (
  id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
)
with check (
  id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
);

-- ---- branches ---------------------------------------------------------------

alter table branches enable row level security;

create policy "members can read their org/branch branches"
on branches for select
to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    (select private.current_branch_id()) is null
    or id = (select private.current_branch_id())
  )
);

create policy "owners and admins can manage branches"
on branches for all
to authenticated
using (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
)
with check (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
);

-- ---- organization_members ----------------------------------------------------

alter table organization_members enable row level security;

create policy "members can read their org's membership roster"
on organization_members for select
to authenticated
using (organization_id = (select private.current_org_id()));

create policy "owners and admins can manage org membership"
on organization_members for all
to authenticated
using (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
)
with check (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
);

-- ---- profession_catalog ------------------------------------------------------
-- Global/read-only to all authenticated users — no org scoping needed.

alter table profession_catalog enable row level security;

create policy "authenticated users can read the profession catalog"
on profession_catalog for select
to authenticated
using (true);

-- ---- organization_professions -------------------------------------------------

alter table organization_professions enable row level security;

create policy "members can read their org's professions"
on organization_professions for select
to authenticated
using (organization_id = (select private.current_org_id()));

create policy "owners, admins and heads can manage org professions"
on organization_professions for all
to authenticated
using (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin', 'head_of_apprenticeship')
)
with check (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin', 'head_of_apprenticeship')
);

-- ---- pipeline_stages -----------------------------------------------------------

alter table pipeline_stages enable row level security;

create policy "members can read their org's pipeline stages"
on pipeline_stages for select
to authenticated
using (organization_id = (select private.current_org_id()));

create policy "owners, admins and heads can manage pipeline stages"
on pipeline_stages for all
to authenticated
using (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin', 'head_of_apprenticeship')
)
with check (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin', 'head_of_apprenticeship')
);

-- ---- checklist_templates --------------------------------------------------------

alter table checklist_templates enable row level security;

create policy "members can read their org's checklist templates"
on checklist_templates for select
to authenticated
using (
  pipeline_stage_id in (
    select id from pipeline_stages where organization_id = (select private.current_org_id())
  )
);

create policy "owners, admins and heads can manage checklist templates"
on checklist_templates for all
to authenticated
using (
  pipeline_stage_id in (
    select id from pipeline_stages where organization_id = (select private.current_org_id())
  )
  and (select private.current_role()) in ('owner', 'admin', 'head_of_apprenticeship')
)
with check (
  pipeline_stage_id in (
    select id from pipeline_stages where organization_id = (select private.current_org_id())
  )
  and (select private.current_role()) in ('owner', 'admin', 'head_of_apprenticeship')
);

-- ---- applications -----------------------------------------------------------------
-- Deliberately no policy allowing public/anon inserts — public submissions go
-- through the /api/public-apply Route Handler using the service-role client
-- (see api-design.md), not direct table access.

alter table applications enable row level security;

create policy "members can read their org/branch applications"
on applications for select
to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    (select private.current_branch_id()) is null
    or branch_id = (select private.current_branch_id())
  )
);

create policy "owners, admins and heads can update applications"
on applications for update
to authenticated
using (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin', 'head_of_apprenticeship')
)
with check (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin', 'head_of_apprenticeship')
);

-- ---- application_checklist_items -----------------------------------------------------

alter table application_checklist_items enable row level security;

create policy "members can read their org/branch checklist items"
on application_checklist_items for select
to authenticated
using (
  application_id in (
    select id from applications
    where organization_id = (select private.current_org_id())
    and (
      (select private.current_branch_id()) is null
      or branch_id = (select private.current_branch_id())
    )
  )
);

create policy "owners, admins and heads can manage checklist items"
on application_checklist_items for all
to authenticated
using (
  application_id in (
    select id from applications where organization_id = (select private.current_org_id())
  )
  and (select private.current_role()) in ('owner', 'admin', 'head_of_apprenticeship')
)
with check (
  application_id in (
    select id from applications where organization_id = (select private.current_org_id())
  )
  and (select private.current_role()) in ('owner', 'admin', 'head_of_apprenticeship')
);

-- ---- application_notes -----------------------------------------------------------------

alter table application_notes enable row level security;

create policy "members can read their org/branch application notes"
on application_notes for select
to authenticated
using (
  application_id in (
    select id from applications
    where organization_id = (select private.current_org_id())
    and (
      (select private.current_branch_id()) is null
      or branch_id = (select private.current_branch_id())
    )
  )
);

create policy "owners, admins and heads can add application notes"
on application_notes for insert
to authenticated
with check (
  application_id in (
    select id from applications where organization_id = (select private.current_org_id())
  )
  and (select private.current_role()) in ('owner', 'admin', 'head_of_apprenticeship')
  and author_id = (select auth.uid())
);

-- ---- application_attachments -----------------------------------------------------------------

alter table application_attachments enable row level security;

create policy "members can read their org/branch attachments"
on application_attachments for select
to authenticated
using (
  application_id in (
    select id from applications
    where organization_id = (select private.current_org_id())
    and (
      (select private.current_branch_id()) is null
      or branch_id = (select private.current_branch_id())
    )
  )
);

create policy "owners, admins and heads can manage attachments"
on application_attachments for all
to authenticated
using (
  application_id in (
    select id from applications where organization_id = (select private.current_org_id())
  )
  and (select private.current_role()) in ('owner', 'admin', 'head_of_apprenticeship')
)
with check (
  application_id in (
    select id from applications where organization_id = (select private.current_org_id())
  )
  and (select private.current_role()) in ('owner', 'admin', 'head_of_apprenticeship')
);

-- ---- invitations -----------------------------------------------------------------

alter table invitations enable row level security;

create policy "owners and admins can manage invitations"
on invitations for all
to authenticated
using (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
)
with check (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
);

-- ---- audit_logs -----------------------------------------------------------------
-- Written by application code (server actions/route handlers), not directly
-- inserted into by authenticated users — no insert policy here.

alter table audit_logs enable row level security;

create policy "owners and admins can read their org's audit log"
on audit_logs for select
to authenticated
using (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
);

-- =============================================================================
-- 5. Indexes
-- =============================================================================
-- Postgres does not automatically index foreign key columns. These back both
-- the RLS policies above (joins/filters through organization_id, branch_id,
-- application_id) and the FK relationships themselves.

create index branches_organization_id_idx on branches (organization_id);

create index organization_members_organization_id_idx on organization_members (organization_id);
create index organization_members_branch_id_idx on organization_members (branch_id);

create index organization_professions_organization_id_idx on organization_professions (organization_id);
create index organization_professions_profession_catalog_id_idx on organization_professions (profession_catalog_id);

create index pipeline_stages_organization_id_idx on pipeline_stages (organization_id);

create index checklist_templates_pipeline_stage_id_idx on checklist_templates (pipeline_stage_id);

create index applications_organization_id_idx on applications (organization_id);
create index applications_branch_id_idx on applications (branch_id);
create index applications_organization_profession_id_idx on applications (organization_profession_id);
create index applications_current_stage_id_idx on applications (current_stage_id);

create index application_checklist_items_application_id_idx on application_checklist_items (application_id);
create index application_checklist_items_done_by_idx on application_checklist_items (done_by);
create index application_checklist_items_assigned_to_idx on application_checklist_items (assigned_to);

create index application_notes_application_id_idx on application_notes (application_id);
create index application_notes_author_id_idx on application_notes (author_id);

create index application_attachments_application_id_idx on application_attachments (application_id);

create index invitations_organization_id_idx on invitations (organization_id);
create index invitations_branch_id_idx on invitations (branch_id);
create index invitations_invited_by_idx on invitations (invited_by);

create index audit_logs_organization_id_idx on audit_logs (organization_id);
create index audit_logs_actor_id_idx on audit_logs (actor_id);
