import type { createClient } from "@/lib/supabase/server";

export interface ApplyOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface ApplyBranch {
  id: string;
  name: string;
  slug: string | null;
}

export interface ApplyProfession {
  organizationProfessionId: string;
  nameDe: string;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/** Resolves an organization by its apply-link slug. Returns null if not found or on error, so the caller can 404 either way without leaking which. */
export async function resolveOrganizationBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<ApplyOrganization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/** Resolves a branch by slug, scoped to the given organization — a branch slug from a different org must not resolve. */
export async function resolveBranchBySlug(
  supabase: SupabaseClient,
  organizationId: string,
  slug: string,
): Promise<ApplyBranch | null> {
  const { data, error } = await supabase
    .from("branches")
    .select("id, name, slug")
    .eq("organization_id", organizationId)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/** Lists every branch for an organization, used both to populate the branch selector and to decide whether it should render at all. */
export async function listBranches(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<ApplyBranch[]> {
  const { data, error } = await supabase
    .from("branches")
    .select("id, name, slug")
    .eq("organization_id", organizationId)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

interface OrganizationProfessionRow {
  id: string;
  profession_catalog: { name_de: string } | null;
}

/** Lists the professions this organization actually offers — never the global catalog. */
export async function listOrganizationProfessions(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<ApplyProfession[]> {
  // Plain `profession_catalog(name_de)`, not `alias:profession_catalog_id(...)`
  // — PostgREST embeds by the FOREIGN TABLE name (or an explicit `!fk_hint`
  // when a pair of tables has more than one FK between them), never by the
  // local FK column name. There's exactly one FK from organization_professions
  // to profession_catalog, so no disambiguation hint is needed.
  const { data, error } = await supabase
    .from("organization_professions")
    .select("id, profession_catalog(name_de)")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (error || !data) return [];

  const rows = data as unknown as OrganizationProfessionRow[];
  return rows
    .filter((row) => row.profession_catalog !== null)
    .map((row) => ({
      organizationProfessionId: row.id,
      nameDe: (row.profession_catalog as { name_de: string }).name_de,
    }));
}

/** Pure — the branch selector only renders when this is true. */
export function hasMultipleBranches(
  branches: Pick<ApplyBranch, "id">[],
): boolean {
  return branches.length > 1;
}
