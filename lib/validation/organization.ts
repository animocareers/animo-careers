import { z } from "zod";

import { INDUSTRY_TYPES } from "@/lib/constants/industries";

export const MIN_PROFESSIONS = 2;
export const MAX_PROFESSIONS = 15;

/** Shared fields between organization creation and the settings-page edit form. */
function organizationDetailsSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().trim().min(1, { error: t("nameRequired") }).max(200),
    street: z.string().trim().min(1, { error: t("streetRequired") }),
    postalCode: z.string().trim().min(1, { error: t("postalCodeRequired") }),
    city: z.string().trim().min(1, { error: t("cityRequired") }),
    country: z.string().trim().min(1, { error: t("countryRequired") }),
    industryType: z.enum(INDUSTRY_TYPES, { error: t("industryTypeRequired") }),
  });
}

/** Creates the localized validation schema for organization onboarding. */
export function createOrganizationSchema(t: (key: string) => string) {
  return organizationDetailsSchema(t).extend({
    professionIds: z
      .array(z.uuid({ error: t("professionIdInvalid") }))
      .min(MIN_PROFESSIONS, { error: t("professionsMin") })
      .max(MAX_PROFESSIONS, { error: t("professionsMax") }),
  });
}

export type OrganizationFormValues = z.infer<ReturnType<typeof createOrganizationSchema>>;

/** Creates the localized validation schema for editing organization details on the settings page. */
export function updateOrganizationSchema(t: (key: string) => string) {
  return organizationDetailsSchema(t);
}

export type UpdateOrganizationFormValues = z.infer<ReturnType<typeof updateOrganizationSchema>>;
