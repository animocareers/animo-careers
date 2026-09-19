import { describe, expect, it } from "vitest";

import { ASSIGNABLE_ORG_ROLES, canManageOrganization, ORG_ROLES } from "@/lib/organization/roles";

describe("ASSIGNABLE_ORG_ROLES", () => {
  it("excludes owner", () => {
    expect(ASSIGNABLE_ORG_ROLES).not.toContain("owner");
  });

  it("includes every other org role", () => {
    expect(ASSIGNABLE_ORG_ROLES).toEqual(ORG_ROLES.filter((role) => role !== "owner"));
  });
});

describe("canManageOrganization", () => {
  it.each(["owner", "admin"] as const)("allows %s", (role) => {
    expect(canManageOrganization(role)).toBe(true);
  });

  it.each(["head_of_apprenticeship", "team_member"] as const)("disallows %s", (role) => {
    expect(canManageOrganization(role)).toBe(false);
  });

  it("disallows null", () => {
    expect(canManageOrganization(null)).toBe(false);
  });

  it("disallows undefined", () => {
    expect(canManageOrganization(undefined)).toBe(false);
  });
});
