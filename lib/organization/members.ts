import type { createClient } from "@/lib/supabase/server";
import type { OrgRole } from "@/lib/organization/roles";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface OrganizationMemberRow {
  id: string;
  userId: string;
  role: OrgRole;
  branchId: string | null;
  branchName: string | null;
  department: string | null;
  status: string | null;
  createdAt: string | null;
}

interface OrganizationMemberQueryRow {
  id: string;
  user_id: string;
  role: OrgRole;
  branch_id: string | null;
  department: string | null;
  status: string | null;
  created_at: string | null;
  branches: { name: string } | null;
}

/**
 * Lists an organization's roster, scoped the same way `applications` are
 * scoped (feature 09): always by organization, and additionally by branch
 * when the viewer themselves is branch-scoped (`branchId` set). An org-wide
 * viewer (`branchId` null — always true for owner/admin today) sees the
 * whole roster. Built generically now so this is ready for a future
 * branch-scoped viewer, even though only owner/admin reach this query today.
 */
export async function listOrganizationMembers(
  supabase: SupabaseClient,
  viewer: { organizationId: string; branchId: string | null },
): Promise<OrganizationMemberRow[]> {
  let query = supabase
    .from("organization_members")
    .select("id, user_id, role, branch_id, department, status, created_at, branches(name)")
    .eq("organization_id", viewer.organizationId)
    .order("created_at", { ascending: true });

  if (viewer.branchId) {
    query = query.eq("branch_id", viewer.branchId);
  }

  // Throws on failure rather than returning [] — an empty array must only
  // ever mean "the query succeeded and the roster is genuinely empty", never
  // "the query failed" (callers show a distinct load-error state instead).
  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as OrganizationMemberQueryRow[];
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    role: row.role,
    branchId: row.branch_id,
    branchName: row.branches?.name ?? null,
    department: row.department,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export interface MemberIdentity {
  firstName: string | null;
  lastName: string | null;
  email: string;
}

/** Combines a roster row's display name from whatever name parts are on file, falling back to email when neither is set. */
export function memberDisplayName(identity: MemberIdentity): string {
  const name = [identity.firstName, identity.lastName].filter(Boolean).join(" ").trim();
  return name || identity.email;
}

/** Single-letter avatar initial: first name if known, otherwise the email. */
export function memberInitial(identity: MemberIdentity): string {
  const source = identity.firstName?.trim() || identity.email;
  return (source.charAt(0) || "?").toUpperCase();
}

export type MemberStatusLabel = "active" | "pending";

/** Collapses the raw `status` column to the two states the UI shows — anything other than "active" (e.g. "invited") displays as Pending. */
export function memberStatusLabel(status: string | null): MemberStatusLabel {
  return status === "active" ? "active" : "pending";
}
