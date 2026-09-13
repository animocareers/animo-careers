"use client";

import { useLocale, useTranslations } from "next-intl";
import { LogOut } from "lucide-react";

import { signOut } from "@/app/[locale]/dashboard/actions";
import { Button } from "@/components/ui/button";

/** Ends the current session and redirects to the login page. */
export function SignOutButton() {
  const t = useTranslations("DashboardLayout");
  const locale = useLocale();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={t("signOut")}
      onClick={() => {
        void signOut(locale);
      }}
    >
      <LogOut />
    </Button>
  );
}
