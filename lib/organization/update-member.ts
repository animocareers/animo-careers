import { z } from "zod";

import { canManageOrganization, getOrganizationMembership, type OrganizationMembership, type OrgRole } from "@/lib/organization/roles";
import { createClient } from "@/lib/supabase/server";
import { createUpdateMemberSchema } from "@/lib/validation/organization-member";

/** Returns translation keys unchanged — callers that need real messages map the result status themselves (see actions.ts). */
const t = (key: string) => key;

export interface TargetMember {
  id: string;
  organizationId: string;
  role: OrgRole;
}

export interface MemberPatch {
  role?: OrgRole;
  department: string | null;
}

export type UpdateOrganizationMemberResult =
  | { status: "success" }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "invalid"; fieldErrors: Record<string, string[] | undefined> }
  | { status: "server_error" };

/**
 * Every external effect this function needs, injectable for tests — same
 * shape as lib/application/submit-application.ts's SubmitPublicApplicationDeps.
 * Each is optional and defaults to the real Supabase-backed implementation
 * below, so the Server Action caller can call updateOrganizationMember(id,
 * values) with no extra wiring, the same way route.ts calls
 * submitPublicApplication(body).
 */
export interface UpdateMemberDeps {
  getViewerMembership?: () => Promise<OrganizationMembership | null>;
  getTargetMember?: (memberId: string) => Promise<TargetMember | null>;
  updateMember?: (memberId: string, patch: MemberPatch) => Promise<{ error: string | null }>;
}

/** A fresh client per call, never cached across calls — see lib/supabase/server.ts. */
async function defaultGetViewerMembership(): Promise<OrganizationMembership | null> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) return null;
  return getOrganizationMembership(supabase, claimsData.claims.sub);
}

async function defaultGetTargetMember(memberId: string): Promise<TargetMember | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("id, organization_id, role")
    .eq("id", memberId)
    .maybeSingle();

  if (error || !data) return null;
  return { id: data.id, organizationId: data.organization_id, role: data.role };
}

async function defaultUpdateMember(
  memberId: string,
  patch: MemberPatch,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("organization_members").update(patch).eq("id", memberId);
  return { error: error?.message ?? null };
}

/**
 * Validates and persists a role/department edit from the Team Members detail
 * panel. Enforces, independently of the UI (feature 10 §6):
 *  - only owner/admin viewers may save at all (matches the invite/remove-
 *    member permission tier in roles-and-permissions.md);
 *  - the target must belong to the viewer's own organization;
 *  - a member whose current role is `owner` never has their role changed
 *    here — ownership transfer is out of scope for this panel, so `role` is
 *    simply never forwarded to the update for that target, regardless of
 *    what was submitted.
 */
export async function updateOrganizationMember(
  memberId: string,
  rawValues: unknown,
  deps: UpdateMemberDeps = {},
): Promise<UpdateOrganizationMemberResult> {
  const getViewerMembership = deps.getViewerMembership ?? defaultGetViewerMembership;
  const getTargetMember = deps.getTargetMember ?? defaultGetTargetMember;
  const updateMember = deps.updateMember ?? defaultUpdateMember;

  const viewer = await getViewerMembership();
  if (!viewer || !canManageOrganization(viewer.role)) {
    return { status: "forbidden" };
  }

  const parsed = createUpdateMemberSchema(t).safeParse(rawValues);
  if (!parsed.success) {
    return { status: "invalid", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const target = await getTargetMember(memberId);
  if (!target || target.organizationId !== viewer.organizationId) {
    return { status: "not_found" };
  }

  const patch: MemberPatch = { department: parsed.data.department ?? null };
  if (target.role !== "owner" && parsed.data.role) {
    patch.role = parsed.data.role;
  }

  const { error } = await updateMember(memberId, patch);
  if (error) {
    return { status: "server_error" };
  }

  return { status: "success" };
}
