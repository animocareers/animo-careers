-- Feature 09: atomic write path for the public apply form.
--
-- Called exclusively by app/api/public-apply/route.ts via the service-role
-- client (lib/supabase/service.ts) — never by an authenticated or anon
-- Supabase client directly (see the revoke/grant at the bottom). The route
-- handler already resolves organization_id/branch_id/organization_profession_id
-- server-side via the anon client + apply-context.ts and re-validates the
-- payload with the shared Zod schema before calling this function, but every
-- check below is repeated here too: this function is SECURITY DEFINER and
-- bypasses RLS, so it — not the route handler — is the last line of defense
-- against a malformed or malicious call, the same posture
-- create_organization_with_owner takes for its own inputs.
--
-- Graceful fallback (feature 09 decision): no organization currently has any
-- pipeline_stages rows (org creation doesn't seed them yet). If none exist,
-- v_stage_id stays NULL, the application is saved with current_stage_id NULL,
-- and the checklist-clone insert is skipped entirely — this is a supported,
-- non-error outcome, not a failure.

create or replace function public.submit_public_application(
  p_organization_id uuid,
  p_branch_id uuid,
  p_organization_profession_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_date_of_birth date,
  p_scope text,
  p_is_school_mandatory boolean,
  p_requested_start_date date,
  p_requested_end_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_branch_org_id uuid;
  v_profession_org_id uuid;
  v_stage_id uuid;
  v_application_id uuid;
begin
  if p_organization_id is null or not exists (
    select 1 from public.organizations where id = p_organization_id
  ) then
    raise exception 'invalid_organization';
  end if;

  select organization_id into v_branch_org_id
  from public.branches
  where id = p_branch_id;

  if v_branch_org_id is null or v_branch_org_id <> p_organization_id then
    raise exception 'invalid_branch';
  end if;

  select organization_id into v_profession_org_id
  from public.organization_professions
  where id = p_organization_profession_id
    and is_active = true;

  if v_profession_org_id is null or v_profession_org_id <> p_organization_id then
    raise exception 'invalid_profession';
  end if;

  if p_scope not in ('single_profession', 'orientierungspraktikum') then
    raise exception 'invalid_scope';
  end if;

  if p_first_name is null or btrim(p_first_name) = ''
     or p_last_name is null or btrim(p_last_name) = ''
     or p_email is null or btrim(p_email) = '' then
    raise exception 'invalid_applicant';
  end if;

  -- Org's first pipeline stage by position. NULL (no rows) is a valid,
  -- expected outcome per the graceful-fallback decision above.
  select id into v_stage_id
  from public.pipeline_stages
  where organization_id = p_organization_id
  order by position asc
  limit 1;

  insert into public.applications (
    organization_id, branch_id, organization_profession_id,
    first_name, last_name, email, phone, date_of_birth,
    scope, is_school_mandatory, current_stage_id,
    requested_start_date, requested_end_date
  ) values (
    p_organization_id, p_branch_id, p_organization_profession_id,
    btrim(p_first_name), btrim(p_last_name), btrim(p_email), nullif(p_phone, ''), p_date_of_birth,
    p_scope, p_is_school_mandatory, v_stage_id,
    p_requested_start_date, p_requested_end_date
  )
  returning id into v_application_id;

  if v_stage_id is not null then
    insert into public.application_checklist_items (application_id, title, position)
    select v_application_id, title, position
    from public.checklist_templates
    where pipeline_stage_id = v_stage_id
    order by position;
  end if;

  return v_application_id;
end;
$$;

-- No `authenticated` grant here (unlike create_organization_with_owner) —
-- this write path is deliberately reachable only via the service-role
-- client, matching architecture.md's "Public form submission path" and the
-- comment in 20260914045725_initial_schema.sql that applications has "no
-- policy allowing public/anon inserts" by design.
revoke execute on function public.submit_public_application(
  uuid, uuid, uuid, text, text, text, text, date, text, boolean, date, date
) from public, anon, authenticated;

grant execute on function public.submit_public_application(
  uuid, uuid, uuid, text, text, text, text, date, text, boolean, date, date
) to service_role;
