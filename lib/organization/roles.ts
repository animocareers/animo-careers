import type { createClient } from "@/lib/supabase/server";

/** Mirrors the Postgres `org_role` enum (supabase/migrations/20260914045725_initial_schema.sql). */
export const ORG_ROLES = ["owner", "admin", "head_of_apprenticeship", "team_member"] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

/**
 * Roles allowed to view and edit organization-level settings (name, address,
 * industry). Per context/roles-and-permissions.md, admin has every
 * organization-wide capability owner has except billing/deletion — editing
 * these fields isn't either, so admin is included alongside owner. Matches
 * the existing `organizations` RLS UPDATE policy.
 */
export function canManageOrganization(role: OrgRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export interface OrganizationMembership {
  organizationId: string;
  role: OrgRole;
}

/** Looks up the caller's organization membership and role — shared by the settings page's access gate and its save action. */
export async function getOrganizationMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<OrganizationMembership | null> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return { organizationId: data.organization_id, role: data.role };
}
