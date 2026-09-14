"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { OrganizationOnboardingForm } from "@/components/dashboard/organization-onboarding/organization-onboarding-form";
import type { ProfessionOption } from "@/components/dashboard/organization-onboarding/profession-multi-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface OrganizationSetupPromptProps {
  locale: string;
  professions: ProfessionOption[];
}

/** Shown in place of dashboard content until the user has an organization: a prompt card that opens the onboarding form in a right-side sheet. */
export function OrganizationSetupPrompt({ locale, professions }: OrganizationSetupPromptProps) {
  const tPage = useTranslations("OrganizationOnboarding");
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-md text-center">
        <CardHeader>
          <CardTitle>{tPage("promptTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button>{tPage("promptButton")}</Button>} />
            <SheetContent side="right" className="flex flex-col p-0 data-[side=right]:sm:max-w-lg">
              <SheetHeader className="border-b border-border">
                <SheetTitle>{tPage("heading")}</SheetTitle>
                <SheetDescription>{tPage("description")}</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-6">
                <OrganizationOnboardingForm locale={locale} professions={professions} />
              </div>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>
    </div>
  );
}
