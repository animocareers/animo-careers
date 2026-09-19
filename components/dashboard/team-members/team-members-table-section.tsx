import { TeamMembersTable, type TeamMemberDisplayRow } from "@/components/dashboard/team-members/team-members-table";
import { getMemberIdentities } from "@/lib/organization/member-identities";
import { listOrganizationMembers, memberDisplayName, memberInitial } from "@/lib/organization/members";
import { createClient } from "@/lib/supabase/server";

interface TeamMembersTableSectionProps {
  locale: string;
  organizationId: string;
  /** NULL = org-wide viewer, sees the whole roster; set = scoped to that one branch (feature 10 §2). */
  viewerBranchId: string | null;
}

/**
 * Async Server Component fetching the org's roster, scoped to organization
 * (+ branch when the viewer is branch-scoped) via listOrganizationMembers,
 * then enriched with name/email from the Admin API since there's no
 * `profiles` table. Meant to be wrapped in a `<Suspense>` boundary by its
 * caller so the shimmer skeleton shows while this streams in.
 */
export async function TeamMembersTableSection({
  locale,
  organizationId,
  viewerBranchId,
}: TeamMembersTableSectionProps) {
  const supabase = await createClient();
  const members = await listOrganizationMembers(supabase, { organizationId, branchId: viewerBranchId });
  const identities = await getMemberIdentities(members.map((member) => member.userId));

  const rows: TeamMemberDisplayRow[] = members.map((member) => {
    const identity = identities.get(member.userId) ?? { firstName: null, lastName: null, email: "" };
    return {
      id: member.id,
      role: member.role,
      branchName: member.branchName,
      department: member.department,
      status: member.status,
      displayName: memberDisplayName(identity),
      email: identity.email,
      initial: memberInitial(identity),
    };
  });

  return <TeamMembersTable locale={locale} members={rows} />;
}
