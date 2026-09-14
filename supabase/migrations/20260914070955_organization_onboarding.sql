-- Organization onboarding
--
-- Adds what's needed for feature 06 ("Organization Onboarding"):
--   - organizations.domain, used to auto-join a new signup to an existing
--     org when their work-email domain matches one already on file.
--   - a blocklist of common free email providers, enforced both at the
--     point of writing `domain` (the RPC below) and as a table-level CHECK
--     (closing the gap where "owners and admins can update their own
--     organization" would otherwise allow setting `domain` to a free
--     provider via a direct UPDATE).
--   - slug generation (private.slugify), matching the auto-suffix behavior
--     described in user-flows.md's org-name-collision edge case.
--   - two SECURITY DEFINER RPCs that perform the actual onboarding writes.
--     organizations/organization_members have no self-service INSERT
--     policy (see database-design.md/api-design.md), so a bare
--     authenticated client can't create its own first membership row —
--     these functions do it atomically instead, the same way
--     private.current_org_id() etc. already bypass RLS for reads.

-- =============================================================================
-- 1. organizations.domain
-- =============================================================================

alter table organizations add column domain text;

create or replace function private.normalize_organization_domain()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.domain := nullif(lower(btrim(new.domain)), '');
  return new;
end;
$$;

revoke execute on function private.normalize_organization_domain() from public, anon, authenticated;

create trigger normalize_organization_domain_before_write
before insert or update of domain on public.organizations
for each row execute function private.normalize_organization_domain();

alter table organizations
  add constraint organizations_domain_key unique (domain),
  add constraint organizations_domain_lowercase
  check (domain is null or domain = lower(domain));

-- =============================================================================
-- 2. Free email provider blocklist
-- =============================================================================
-- "official/company email" is the intent (product-requirements.md); without
-- this, two unrelated signups on the same free provider (e.g. two different
-- people both using @gmail.com) would be silently merged into one
-- organization via domain auto-join — a real cross-tenant exposure.

create or replace function private.is_free_email_domain(p_domain text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_domain = any(array[
    'gmail.com', 'googlemail.com',
    'outlook.com', 'outlook.de', 'hotmail.com', 'hotmail.de', 'live.com', 'msn.com',
    'yahoo.com', 'yahoo.de',
    'icloud.com', 'me.com',
    'web.de', 'gmx.de', 'gmx.net', 'gmx.at', 'gmx.ch',
    't-online.de', 'freenet.de', 'online.de', 'arcor.de', 'posteo.de',
    'aol.com', 'protonmail.com', 'mail.com', 'zoho.com'
  ])
$$;

revoke execute on function private.is_free_email_domain(text) from public, anon;
grant execute on function private.is_free_email_domain(text) to authenticated;

alter table organizations
  add constraint organizations_domain_not_free_email
  check (domain is null or not private.is_free_email_domain(domain));

-- Keep the database boundary aligned with lib/constants/industries.ts. The
-- column remains nullable for existing/non-onboarding data, while every
-- non-null value must come from the shared fixed catalog.
alter table organizations
  add constraint organizations_industry_type_valid
  check (industry_type is null or industry_type in (
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
  ));

-- =============================================================================
-- 3. Slug generation
-- =============================================================================

create or replace function private.slugify(p_input text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    lower(
      replace(replace(replace(replace(replace(replace(replace(
        trim(p_input),
      'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'),
      'Ä', 'Ae'), 'Ö', 'Oe'), 'Ü', 'Ue'),
      'ß', 'ss')
    ),
    '[^a-z0-9]+', '-', 'g'
  ))
$$;

-- =============================================================================
-- 4. join_organization_by_domain()
-- =============================================================================
-- Called from the dashboard layout for a signed-in user with no membership
-- yet. Idempotent: if the caller already has a membership, just returns its
-- organization_id without writing anything.

create or replace function public.join_organization_by_domain()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_domain text;
  v_org_id uuid;
begin
  if v_user_id is null then
    return null;
  end if;

  select email into v_email
  from auth.users
  where id = v_user_id
    and email_confirmed_at is not null;

  if v_email is null then
    raise exception 'email_not_verified';
  end if;

  select organization_id into v_org_id
  from public.organization_members
  where user_id = v_user_id;

  if v_org_id is not null then
    return v_org_id;
  end if;

  if v_email is null or position('@' in v_email) = 0 then
    return null;
  end if;

  v_domain := lower(split_part(v_email, '@', 2));

  if private.is_free_email_domain(v_domain) then
    return null;
  end if;

  select id into v_org_id
  from public.organizations
  where domain = v_domain;

  if v_org_id is null then
    return null;
  end if;

  insert into public.organization_members (organization_id, user_id, branch_id, role, status)
  values (v_org_id, v_user_id, null, 'team_member', 'active')
  on conflict (user_id) do nothing;

  return v_org_id;
end;
$$;

revoke execute on function public.join_organization_by_domain() from public, anon;
grant execute on function public.join_organization_by_domain() to authenticated;

-- =============================================================================
-- 5. create_organization_with_owner(...)
-- =============================================================================
-- Atomically creates the organization, its default "Main" branch, the
-- caller's own membership as owner, and the org's selected professions
-- (2-15, validated here rather than only in the client/Zod layer).

create or replace function public.create_organization_with_owner(
  p_name text,
  p_address jsonb,
  p_industry_type text,
  p_profession_ids uuid[]
)
returns table(organization_id uuid, slug text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_domain text;
  v_base_slug text;
  v_slug text;
  v_suffix int := 1;
  v_org_id uuid;
  v_profession_count int;
  v_constraint_name text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select email into v_email
  from auth.users
  where id = v_user_id
    and email_confirmed_at is not null;

  if v_email is null then
    raise exception 'email_not_verified';
  end if;

  if exists (select 1 from public.organization_members where user_id = v_user_id) then
    raise exception 'already_member';
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

  if v_email is not null and position('@' in v_email) > 0 then
    v_domain := lower(split_part(v_email, '@', 2));
    if private.is_free_email_domain(v_domain) then
      v_domain := null;
    end if;
  end if;

  v_base_slug := private.slugify(p_name);
  if v_base_slug is null or v_base_slug = '' then
    v_base_slug := 'organization';
  end if;
  v_slug := v_base_slug;

  loop
    begin
      insert into public.organizations (name, slug, address, industry_type, domain)
      values (trim(p_name), v_slug, p_address, p_industry_type, v_domain)
      returning id into v_org_id;
      exit;
    exception
      when unique_violation then
        get stacked diagnostics v_constraint_name = constraint_name;

        if v_constraint_name = 'organizations_slug_key' then
          v_suffix := v_suffix + 1;
          v_slug := v_base_slug || '-' || v_suffix;
        elsif v_constraint_name = 'organizations_domain_key' then
          -- Another verified user may have created this domain's organization
          -- concurrently. Join that tenant instead of endlessly changing the
          -- slug while the conflicting domain remains unchanged.
          select organization.id, organization.slug into v_org_id, v_slug
          from public.organizations as organization
          where organization.domain = v_domain;

          if v_org_id is null then
            raise exception 'organization_domain_conflict';
          end if;

          insert into public.organization_members (organization_id, user_id, branch_id, role, status)
          values (v_org_id, v_user_id, null, 'team_member', 'active')
          on conflict (user_id) do nothing;

          return query select v_org_id, v_slug;
          return;
        else
          raise;
        end if;
    end;
  end loop;

  insert into public.branches (organization_id, name)
  values (v_org_id, 'Main');

  -- A concurrent duplicate call (e.g. a double form submit) could race past
  -- the already_member check above; organization_members.user_id's unique
  -- constraint is the real backstop, so translate that into the same
  -- already_member outcome instead of leaking a raw unique_violation. This
  -- also aborts the whole statement, so the organization/branch just
  -- inserted above roll back with it rather than being left orphaned.
  begin
    insert into public.organization_members (organization_id, user_id, branch_id, role, status)
    values (v_org_id, v_user_id, null, 'owner', 'active');
  exception
    when unique_violation then
      raise exception 'already_member';
  end;

  insert into public.organization_professions (organization_id, profession_catalog_id)
  select distinct v_org_id, pid from unnest(p_profession_ids) as pid;

  return query select v_org_id, v_slug;
end;
$$;

revoke execute on function public.create_organization_with_owner(text, jsonb, text, uuid[]) from public, anon;
grant execute on function public.create_organization_with_owner(text, jsonb, text, uuid[]) to authenticated;
