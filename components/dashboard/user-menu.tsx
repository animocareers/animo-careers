"use client";

import { useLocale, useTranslations } from "next-intl";
import { LogOut, Settings, UserRound } from "lucide-react";

import { signOut } from "@/app/[locale]/dashboard/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  email: string;
}

/** Avatar button in the navbar that opens the account menu (profile, settings, sign out). */
export function UserMenu({ email }: UserMenuProps) {
  const t = useTranslations("DashboardLayout");
  const locale = useLocale();
  const initial = (email || "?").charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={t("accountMenu")}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >
            {initial}
          </button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <UserRound />
          {t("profile")}
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Settings />
          {t("settings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void signOut(locale);
          }}
        >
          <LogOut />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
