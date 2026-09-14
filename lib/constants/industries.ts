/**
 * Fixed set of industry types offered in the organization onboarding form.
 * Single source of truth for both the Zod enum (lib/validation/organization.ts)
 * and the industry <Select> options — labels are resolved via
 * OrganizationOnboarding.industryTypes.<value> in messages/*.json.
 */
export const INDUSTRY_TYPES = [
  "manufacturing",
  "retail",
  "healthcare",
  "construction",
  "it_software",
  "hospitality",
  "logistics_transport",
  "finance_insurance",
  "education",
  "automotive",
  "skilled_trades",
  "public_sector",
  "food_beverage",
  "energy",
  "other",
] as const;

export type IndustryType = (typeof INDUSTRY_TYPES)[number];
