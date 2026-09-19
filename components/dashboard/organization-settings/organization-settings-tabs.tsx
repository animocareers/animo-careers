"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";

interface OrganizationSettingsTabsProps {
  detailsContent: ReactNode;
  teamMembersContent: ReactNode;
}

/** Tabbed shell for the Organization Settings page (feature 10): the existing org-details form as one tab, the new Team Members roster as the other. */
export function OrganizationSettingsTabs({
  detailsContent,
  teamMembersContent,
}: OrganizationSettingsTabsProps) {
  const t = useTranslations("OrganizationSettings.tabs");

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTab value="details">{t("details")}</TabsTab>
        <TabsTab value="teamMembers">{t("teamMembers")}</TabsTab>
      </TabsList>
      <TabsPanel value="details">{detailsContent}</TabsPanel>
      <TabsPanel value="teamMembers">{teamMembersContent}</TabsPanel>
    </Tabs>
  );
}
