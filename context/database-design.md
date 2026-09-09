# Animo — Database Design

Postgres schema (Supabase), with Row-Level Security as the primary tenant-isolation mechanism. Migrations are managed via the Supabase CLI (`supabase/migrations/*.sql`) — this is the single source of truth for schema, not an ORM's migration engine.

## Entity relationship overview

```
organizations 1───* branches
organizations 1───* organization_members 1───1 auth.users   (one user → exactly one org, optionally one branch)
organizations 1───* organization_professions *───1 profession_catalog (global catalog, seeded from the BA list)
organizations 1───* pipeline_stages 1───* checklist_templates
organizations 1───* applications *───1 organization_professions
                        │              *───1 branches
                        ├──1───* application_checklist_items ──* assigned_to → auth.users
                        ├──1───* application_notes ── author → auth.users
                        └──1───* application_attachments (Supabase Storage keys)
organizations 1───* invitations
organizations 1───* audit_logs
```

## Tables

```sql
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

create type org_role as enum ('owner', 'admin', 'head_of_apprenticeship', 'team_member');

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

-- Global, shared catalog seeded from the Bundesagentur für Arbeit "Berufe A-Z" list
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
-- Cloned from checklist_templates when an application enters a stage, so
-- later template edits don't retroactively change in-flight applications.

create table application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id),
  author_id uuid references auth.users(id),
  body text not null,
  created_at timestamptz default now()
);
-- Modeled as a feed, not a single free-text field, to preserve who-said-what.

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
```

## Row-Level Security

Enable RLS on every tenant-scoped table. Core pattern, shown on `applications`:

```sql
alter table applications enable row level security;

create policy "members can read their org/branch applications"
on applications for select using (
  organization_id = (select organization_id from organization_members where user_id = auth.uid())
  and (
    (select branch_id from organization_members where user_id = auth.uid()) is null
    or branch_id = (select branch_id from organization_members where user_id = auth.uid())
  )
);

create policy "admins and heads can update applications"
on applications for update using (
  organization_id = (select organization_id from organization_members where user_id = auth.uid())
  and (select role from organization_members where user_id = auth.uid())
      in ('owner', 'admin', 'head_of_apprenticeship')
);
```

Apply the equivalent `organization_id` (and, where relevant, `branch_id`) pattern to `branches`, `organization_professions`, `pipeline_stages`, `checklist_templates`, `application_checklist_items`, `application_notes`, `application_attachments`, `invitations`, and `audit_logs`. `profession_catalog` is global/read-only to all authenticated users — no org scoping needed.

There is deliberately **no RLS policy allowing public/anon inserts into `applications`** — public submissions go through the `/api/public-apply` Route Handler using the service-role client (see `api-design.md`), not direct table access.

## Seeding

- `profession_catalog` — seeded once from the Bundesagentur für Arbeit "Berufe A-Z" list.
- On organization creation: one `branches` row ("Main"), a default 6-row `pipeline_stages` set, and a starter `checklist_templates` set per stage.

## Migration workflow

1. `supabase migration new <name>` to scaffold a SQL file under `supabase/migrations/`.
2. Write schema + RLS policy changes together in the same migration — a table without its RLS policy should never ship.
3. `supabase db push` (or the CI equivalent) applies migrations to staging, then production, after review.
4. Local development uses `supabase start` against a local Postgres instance seeded from the same migrations.
