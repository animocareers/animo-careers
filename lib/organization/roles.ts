import type { createClient } from "@/lib/supabase/server";

/** Mirrors the Postgres `org_role` enum (supabase/migrations/20260914045725_initial_schema.sql). */
export const ORG_ROLES = ["owner", "admin", "head_of_apprenticeship", "team_member"] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

/**
 * Roles assignable to an existing member from the Team Members edit panel.
 * Excludes `owner`: reassigning ownership is a distinct, higher-stakes
 * operation (transfer of org ownership) and isn't exposed as a dropdown
 * choice here — see feature 10.
 */
export const ASSIGNABLE_ORG_ROLES = ORG_ROLES.filter((role) => role !== "owner");

export type AssignableOrgRole = (typeof ASSIGNABLE_ORG_ROLES)[number];

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
  /** NULL = org-wide viewer (always true for owner/admin); set = scoped to that one branch. */
  branchId: string | null;
}

/** Looks up the caller's organization membership, role, and branch scope — shared by the settings page's access gate and its save actions. */
export async function getOrganizationMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<OrganizationMembership | null> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, branch_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return { organizationId: data.organization_id, role: data.role, branchId: data.branch_id };
}
