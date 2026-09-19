import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { InviteMemberButton } from "@/components/dashboard/team-members/invite-member-button";
import { TeamMembersTableSection } from "@/components/dashboard/team-members/team-members-table-section";
import { TeamMembersTableSkeleton } from "@/components/dashboard/team-members/team-members-table-skeleton";

interface TeamMembersTabProps {
  locale: string;
  organizationId: string;
  viewerBranchId: string | null;
}

/**
 * "Team Members" tab content (feature 10). The heading and invite button
 * render immediately; only the roster table itself is wrapped in Suspense,
 * so the shimmer skeleton replaces just the table while the rest of the tab
 * stays put.
 */
export async function TeamMembersTab({ locale, organizationId, viewerBranchId }: TeamMembersTabProps) {
  const t = await getTranslations({ locale, namespace: "OrganizationSettings.teamMembers" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold">{t("heading")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <InviteMemberButton label={t("inviteButton")} />
      </div>
      <Suspense fallback={<TeamMembersTableSkeleton label={t("loading")} />}>
        <TeamMembersTableSection
          locale={locale}
          organizationId={organizationId}
          viewerBranchId={viewerBranchId}
        />
      </Suspense>
    </div>
  );
}
