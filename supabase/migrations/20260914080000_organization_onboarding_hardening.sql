-- Hardening for the organization onboarding feature (see
-- 20260914070955_organization_onboarding.sql), fixed as a follow-up
-- migration rather than editing the original in place since it may already
-- be applied to a shared database.
--
--   1. organizations.domain is now lowercase-normalized on every write (not
--      just writes going through the RPCs below), so the plain `unique`
--      constraint actually enforces case-insensitive uniqueness and stays
--      aligned with the lowercase lookup in join_organization_by_domain.
--      Without this, "owners and admins can update their own organization"
--      (a direct, non-RPC UPDATE path) could set a mixed-case domain that
--      both evades the unique constraint and never matches future signups.
--   2. organizations.industry_type is now constrained to the same fixed set
--      as lib/constants/industries.ts. create_organization_with_owner is
--      granted directly to `authenticated`, so a caller going around the
--      Next.js server action's Zod validation (e.g. a raw RPC call) could
--      otherwise persist an arbitrary string.
--   3. join_organization_by_domain / create_organization_with_owner now
--      require a *confirmed* email before deriving or trusting a domain.
--      auth.jwt() ->> 'email' reflects the address the user typed at
--      signup, confirmed or not (this project runs email/password only,
--      no OAuth providers - see supabase/config.toml). Trusting it
--      unconfirmed would let anyone claim a domain they don't own, either
--      auto-joining an existing org on it or squatting it on a new org to
--      intercept later legitimate signups from that domain.
--   4. create_organization_with_owner's slug-retry loop now inspects which
--      constraint actually fired. Previously *any* unique_violation on the
--      insert (slug or domain) was treated as a slug collision and retried
--      with a new suffix - if the real conflict was on domain, the suffix
--      never fixes it and the loop retries forever.

-- =============================================================================
-- 1. Canonicalize organizations.domain
-- =============================================================================

create or replace function private.normalize_organization_domain()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.domain is not null then
    new.domain := lower(new.domain);
  end if;
  return new;
end;
$$;

drop trigger if exists organizations_normalize_domain on organizations;
create trigger organizations_normalize_domain
  before insert or update on organizations
  for each row
  execute function private.normalize_organization_domain();

-- Backfill any existing rows so the (unchanged) unique constraint reflects
-- the canonical form immediately, not just for future writes.
update organizations set domain = lower(domain) where domain is not null and domain <> lower(domain);

-- =============================================================================
-- 2. Constrain organizations.industry_type to the fixed set
-- =============================================================================
-- Keep in sync with lib/constants/industries.ts (INDUSTRY_TYPES).

alter table organizations
  add constraint organizations_industry_type_valid
  check (industry_type is null or industry_type in (
    'manufacturing', 'retail', 'healthcare', 'construction', 'it_software',
    'hospitality', 'logistics_transport', 'finance_insurance', 'education',
    'automotive', 'skilled_trades', 'public_sector', 'food_beverage',
    'energy', 'other'
  ));

-- =============================================================================
-- 3. Require a confirmed email before trusting it for domain matching
-- =============================================================================

create or replace function public.join_organization_by_domain()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text := (select auth.jwt() ->> 'email');
  v_email_confirmed boolean;
  v_domain text;
  v_org_id uuid;
begin
  if v_user_id is null then
    return null;
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

  select (email_confirmed_at is not null) into v_email_confirmed
  from auth.users
  where id = v_user_id;

  if not coalesce(v_email_confirmed, false) then
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
  v_email text := (select auth.jwt() ->> 'email');
  v_email_confirmed boolean;
  v_domain text;
  v_base_slug text;
  v_slug text;
  v_suffix int := 1;
  v_org_id uuid;
  v_profession_count int;
  v_constraint text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if exists (select 1 from public.organization_members where user_id = v_user_id) then
    raise exception 'already_member';
  end if;

  if p_name is null or trim(p_name) = '' then
    raise exception 'invalid_name';
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

  select (email_confirmed_at is not null) into v_email_confirmed
  from auth.users
  where id = v_user_id;

  if coalesce(v_email_confirmed, false) and v_email is not null and position('@' in v_email) > 0 then
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
        get stacked diagnostics v_constraint = constraint_name;
        if v_constraint = 'organizations_slug_key' then
          v_suffix := v_suffix + 1;
          v_slug := v_base_slug || '-' || v_suffix;
        else
          -- Most likely organizations_domain_key: someone else already
          -- claimed this domain (e.g. a concurrent signup) between the
          -- caller's failed auto-join attempt and this insert. Retrying
          -- with a new slug would never fix a domain collision and would
          -- loop forever, so surface it distinctly instead.
          raise exception 'organization_domain_taken';
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
