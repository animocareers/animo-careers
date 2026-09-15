import { describe, expect, it } from "vitest";

import { canManageOrganization } from "@/lib/organization/roles";

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
