"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { MemberDetailForm } from "@/components/dashboard/team-members/member-detail-form";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { OrgRole } from "@/lib/organization/roles";
import { memberStatusLabel } from "@/lib/organization/members";

export interface TeamMemberDisplayRow {
  id: string;
  role: OrgRole;
  branchName: string | null;
  department: string | null;
  status: string | null;
  displayName: string;
  email: string;
  initial: string;
}

interface TeamMembersTableProps {
  locale: string;
  members: TeamMemberDisplayRow[];
}

/** Roster table for the Team Members tab. Clicking a row opens that member's details in a right-side panel (feature 10 §5). */
export function TeamMembersTable({ locale, members }: TeamMembersTableProps) {
  const t = useTranslations("OrganizationSettings.teamMembers");
  const tRoles = useTranslations("OrganizationSettings.teamMembers.roles");
  const [selected, setSelected] = useState<TeamMemberDisplayRow | null>(null);

  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <>
      <div className="overflow-hidden rounded-md ring-1 ring-foreground/5 dark:ring-foreground/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                {t("columns.member")}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t("columns.role")}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t("columns.branch")}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t("columns.status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.id}
                tabIndex={0}
                role="button"
                aria-label={member.displayName}
                onClick={() => setSelected(member)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(member);
                  }
                }}
                className="cursor-pointer border-b border-border outline-none last:border-b-0 hover:bg-muted/50 focus-visible:bg-muted/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {member.initial}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{member.displayName}</span>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{tRoles(member.role)}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {member.branchName ?? t("noBranch")}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={memberStatusLabel(member.status) === "active" ? "default" : "outline"}>
                    {t(`status.${memberStatusLabel(member.status)}`)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="flex flex-col p-0 data-[side=right]:sm:max-w-lg">
          <SheetHeader className="border-b border-border">
            <SheetTitle>{t("panel.title")}</SheetTitle>
          </SheetHeader>
          {selected && (
            <MemberDetailForm
              locale={locale}
              memberId={selected.id}
              displayName={selected.displayName}
              email={selected.email}
              role={selected.role}
              department={selected.department}
              onSaved={() => setSelected(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
