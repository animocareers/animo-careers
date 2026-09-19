import { z } from "zod";

import { ASSIGNABLE_ORG_ROLES } from "@/lib/organization/roles";

export const MAX_DEPARTMENT_LENGTH = 120;

/**
 * Validates edits from the Team Members detail panel. `role` is optional —
 * the panel omits it entirely when editing a member whose current role is
 * `owner`, since ownership transfer isn't done from here (see
 * ASSIGNABLE_ORG_ROLES). `department` is free text (feature 10: a genuinely
 * separate concept from `branch`), optional/nullable since not every member
 * has one set.
 */
export function createUpdateMemberSchema(t: (key: string) => string) {
  return z.object({
    role: z.enum(ASSIGNABLE_ORG_ROLES, { error: t("roleInvalid") }).optional(),
    department: z
      .string()
      .trim()
      .max(MAX_DEPARTMENT_LENGTH, { error: t("departmentTooLong") })
      .nullable()
      .optional(),
  });
}

export type UpdateMemberFormValues = z.infer<ReturnType<typeof createUpdateMemberSchema>>;
