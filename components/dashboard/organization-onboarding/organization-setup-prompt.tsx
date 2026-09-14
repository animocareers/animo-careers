"use client";

import { ArrowRightIcon, Building2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { OrganizationOnboardingForm } from "@/components/dashboard/organization-onboarding/organization-onboarding-form";
import type { ProfessionOption } from "@/components/dashboard/organization-onboarding/profession-multi-select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
export function OrganizationSetupPrompt({
  locale,
  professions,
}: OrganizationSetupPromptProps) {
  const tPage = useTranslations("OrganizationOnboarding");
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 flex items-center justify-center">
      <Card className="w-full max-w-md rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2Icon className="size-5 text-primary" />
            {tPage("promptTitle")}
          </CardTitle>
          <CardDescription>{tPage("promptDescription")}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button>
                  {tPage("promptButton")}
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              }
            />
            <SheetContent
              side="right"
              className="flex flex-col p-0 data-[side=right]:sm:max-w-lg"
            >
              <SheetHeader className="border-b border-border">
                <SheetTitle>{tPage("heading")}</SheetTitle>
                <SheetDescription>{tPage("description")}</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-6">
                <OrganizationOnboardingForm
                  locale={locale}
                  professions={professions}
                />
              </div>
            </SheetContent>
          </Sheet>
        </CardFooter>
      </Card>
    </div>
  );
}
