import { describe, expect, it } from "vitest";

import { createUpdateMemberSchema } from "@/lib/validation/organization-member";

const t = (key: string) => key;

describe("createUpdateMemberSchema", () => {
  it("accepts a role + department payload", () => {
    const result = createUpdateMemberSchema(t).safeParse({ role: "admin", department: "HR" });
    expect(result.success).toBe(true);
  });

  it("accepts department-only (role omitted, e.g. editing the owner's own row)", () => {
    const result = createUpdateMemberSchema(t).safeParse({ department: "Operations" });
    expect(result.success).toBe(true);
  });

  it("accepts a null department", () => {
    const result = createUpdateMemberSchema(t).safeParse({ role: "team_member", department: null });
    expect(result.success).toBe(true);
  });

  it("trims department whitespace", () => {
    const result = createUpdateMemberSchema(t).safeParse({ role: "team_member", department: "  HR  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.department).toBe("HR");
  });

  it.each(["admin", "head_of_apprenticeship", "team_member"])("accepts role %s", (role) => {
    const result = createUpdateMemberSchema(t).safeParse({ role, department: null });
    expect(result.success).toBe(true);
  });

  it("rejects role 'owner' — ownership transfer isn't done from this panel", () => {
    const result = createUpdateMemberSchema(t).safeParse({ role: "owner", department: null });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown role", () => {
    const result = createUpdateMemberSchema(t).safeParse({ role: "not_a_role", department: null });
    expect(result.success).toBe(false);
  });

  it("rejects a department longer than 120 characters", () => {
    const result = createUpdateMemberSchema(t).safeParse({ role: "admin", department: "a".repeat(121) });
    expect(result.success).toBe(false);
  });

  it("accepts a department at exactly 120 characters", () => {
    const result = createUpdateMemberSchema(t).safeParse({ role: "admin", department: "a".repeat(120) });
    expect(result.success).toBe(true);
  });
});
