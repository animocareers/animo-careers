-- Transactional update for the Organization Settings page
--
-- The settings-page save action previously ran the organizations update and
-- the organization_professions delete/insert as three separate PostgREST
-- calls, each committed independently — a failure partway through (e.g. the
-- insert failing after the delete succeeded) could leave the org's professions
-- inconsistent even though "something went wrong" was reported. Wrapping all
-- of it in one plpgsql function body gives it the same all-or-nothing
-- semantics as create_organization_with_owner (20260914070955_organization_onboarding.sql).

-- =============================================================================
-- update_organization_details(...)
-- =============================================================================
-- Atomically updates the organization's core details and its offered
-- professions (2-15). SECURITY DEFINER so it can look up the caller's role
-- without depending on organization_members' own RLS (same reasoning as
-- create_organization_with_owner); owner/admin is checked explicitly here
-- rather than relying on the organizations/organization_professions RLS
-- policies alone, since a Server Action can call this directly.

create or replace function public.update_organization_details(
  p_organization_id uuid,
  p_name text,
  p_address jsonb,
  p_industry_type text,
  p_profession_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_role public.org_role;
  v_profession_count int;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select role into v_role
  from public.organization_members
  where user_id = v_user_id and organization_id = p_organization_id;

  if v_role is null or v_role not in ('owner', 'admin') then
    raise exception 'not_authorized';
  end if;

  if p_name is null or trim(p_name) = '' then
    raise exception 'invalid_name';
  end if;

  if p_industry_type is null or p_industry_type not in (
    'manufacturing',
    'retail',
    'healthcare',
    'construction',
    'it_software',
    'hospitality',
    'logistics_transport',
    'finance_insurance',
    'education',
    'automotive',
    'skilled_trades',
    'public_sector',
    'food_beverage',
    'energy',
    'other'
  ) then
    raise exception 'invalid_industry_type';
  end if;

  select count(distinct pid) into v_profession_count from unnest(p_profession_ids) as pid;
  if v_profession_count is null or v_profession_count < 2 or v_profession_count > 15 then
    raise exception 'invalid_profession_count';
  end if;

  if exists (
    select 1 from unnest(p_profession_ids) as pid
    where not exists (select 1 from public.profession_catalog where id = pid)
  ) then
    raise exception 'invalid_profession_id';
  end if;

  update public.organizations
  set name = trim(p_name), address = p_address, industry_type = p_industry_type
  where id = p_organization_id;

  delete from public.organization_professions
  where organization_id = p_organization_id
    and profession_catalog_id != all(p_profession_ids);

  insert into public.organization_professions (organization_id, profession_catalog_id)
  select distinct p_organization_id, pid
  from unnest(p_profession_ids) as pid
  where not exists (
    select 1 from public.organization_professions op
    where op.organization_id = p_organization_id and op.profession_catalog_id = pid
  );
end;
$$;

revoke execute on function public.update_organization_details(uuid, text, jsonb, text, uuid[]) from public, anon;
grant execute on function public.update_organization_details(uuid, text, jsonb, text, uuid[]) to authenticated;
