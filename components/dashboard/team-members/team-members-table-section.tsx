import { getTranslations } from "next-intl/server";

import { TeamMembersTable, type TeamMemberDisplayRow } from "@/components/dashboard/team-members/team-members-table";
import { getMemberIdentities } from "@/lib/organization/member-identities";
import {
  listOrganizationMembers,
  memberDisplayName,
  memberInitial,
  type OrganizationMemberRow,
} from "@/lib/organization/members";
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
 * caller so the shimmer skeleton shows while this streams in. A failed
 * roster query renders an inline error instead of throwing, so the other
 * tab on the page stays usable.
 */
export async function TeamMembersTableSection({
  locale,
  organizationId,
  viewerBranchId,
}: TeamMembersTableSectionProps) {
  const supabase = await createClient();

  let members: OrganizationMemberRow[];
  try {
    members = await listOrganizationMembers(supabase, { organizationId, branchId: viewerBranchId });
  } catch (error) {
    console.error("[TeamMembersTableSection] roster query failed", {
      organizationId,
      message: error instanceof Error ? error.message : String(error),
    });
    const t = await getTranslations({ locale, namespace: "OrganizationSettings.teamMembers" });
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("loadError")}
      </p>
    );
  }

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
