import { describe, expect, it, vi } from "vitest";

import { updateOrganizationMember, type UpdateMemberDeps } from "@/lib/organization/update-member";
import type { OrganizationMembership } from "@/lib/organization/roles";

const OWNER_VIEWER: OrganizationMembership = { organizationId: "org-1", role: "owner", branchId: null };
const ADMIN_VIEWER: OrganizationMembership = { organizationId: "org-1", role: "admin", branchId: null };
const TEAM_MEMBER_VIEWER: OrganizationMembership = {
  organizationId: "org-1",
  role: "team_member",
  branchId: null,
};

function makeDeps(overrides: Partial<UpdateMemberDeps> = {}): UpdateMemberDeps {
  return {
    getViewerMembership: vi.fn().mockResolvedValue(OWNER_VIEWER),
    getTargetMember: vi.fn().mockResolvedValue({ id: "member-1", organizationId: "org-1", role: "team_member" }),
    updateMember: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
}

describe("updateOrganizationMember", () => {
  it("updates role and department for a non-owner target", async () => {
    const deps = makeDeps();
    const result = await updateOrganizationMember(
      "member-1",
      { role: "admin", department: "HR" },
      deps,
    );

    expect(result).toEqual({ status: "success" });
    expect(deps.updateMember).toHaveBeenCalledWith("member-1", { role: "admin", department: "HR" });
  });

  it("allows admin viewers to save, matching the invite/remove-member permission tier", async () => {
    const deps = makeDeps({ getViewerMembership: vi.fn().mockResolvedValue(ADMIN_VIEWER) });
    const result = await updateOrganizationMember("member-1", { role: "admin", department: null }, deps);

    expect(result).toEqual({ status: "success" });
  });

  it("rejects a team_member viewer (only owner/admin may save)", async () => {
    const deps = makeDeps({ getViewerMembership: vi.fn().mockResolvedValue(TEAM_MEMBER_VIEWER) });
    const result = await updateOrganizationMember("member-1", { role: "admin", department: null }, deps);

    expect(result).toEqual({ status: "forbidden" });
    expect(deps.updateMember).not.toHaveBeenCalled();
  });

  it("rejects when there is no viewer membership at all", async () => {
    const deps = makeDeps({ getViewerMembership: vi.fn().mockResolvedValue(null) });
    const result = await updateOrganizationMember("member-1", { role: "admin", department: null }, deps);

    expect(result).toEqual({ status: "forbidden" });
    expect(deps.updateMember).not.toHaveBeenCalled();
  });

  it("never changes role when the target member is currently the owner, even department-only edits go through", async () => {
    const deps = makeDeps({
      getTargetMember: vi.fn().mockResolvedValue({ id: "member-owner", organizationId: "org-1", role: "owner" }),
    });
    const result = await updateOrganizationMember(
      "member-owner",
      { department: "Executive" },
      deps,
    );

    expect(result).toEqual({ status: "success" });
    expect(deps.updateMember).toHaveBeenCalledWith("member-owner", { department: "Executive" });
  });

  it("ignores a role value submitted for an owner target, updating department only", async () => {
    const deps = makeDeps({
      getTargetMember: vi.fn().mockResolvedValue({ id: "member-owner", organizationId: "org-1", role: "owner" }),
    });
    // Defensive: even if a client somehow sent a role for an owner row, the
    // schema itself would reject "owner" as a value — this proves the server
    // doesn't rely on that alone and also never forwards role for this target.
    const result = await updateOrganizationMember(
      "member-owner",
      { role: "admin", department: "Executive" },
      deps,
    );

    expect(result).toEqual({ status: "success" });
    expect(deps.updateMember).toHaveBeenCalledWith("member-owner", { department: "Executive" });
  });

  it("rejects role 'owner' as invalid input", async () => {
    const deps = makeDeps();
    const result = await updateOrganizationMember(
      "member-1",
      { role: "owner", department: null },
      deps,
    );

    expect(result.status).toBe("invalid");
    expect(deps.updateMember).not.toHaveBeenCalled();
  });

  it("returns not_found when the target member belongs to a different organization", async () => {
    const deps = makeDeps({
      getTargetMember: vi.fn().mockResolvedValue({ id: "member-1", organizationId: "org-2", role: "team_member" }),
    });
    const result = await updateOrganizationMember("member-1", { role: "admin", department: null }, deps);

    expect(result).toEqual({ status: "not_found" });
    expect(deps.updateMember).not.toHaveBeenCalled();
  });

  it("returns not_found when the target member doesn't exist", async () => {
    const deps = makeDeps({ getTargetMember: vi.fn().mockResolvedValue(null) });
    const result = await updateOrganizationMember("missing", { role: "admin", department: null }, deps);

    expect(result).toEqual({ status: "not_found" });
  });

  it("returns invalid for a malformed payload", async () => {
    const deps = makeDeps();
    const result = await updateOrganizationMember("member-1", { role: "not_a_role" }, deps);

    expect(result.status).toBe("invalid");
    expect(deps.updateMember).not.toHaveBeenCalled();
  });

  it("returns server_error when the update itself fails", async () => {
    const deps = makeDeps({ updateMember: vi.fn().mockResolvedValue({ error: "boom" }) });
    const result = await updateOrganizationMember("member-1", { role: "admin", department: null }, deps);

    expect(result).toEqual({ status: "server_error" });
  });

  it("treats a null department as clearing the field", async () => {
    const deps = makeDeps();
    const result = await updateOrganizationMember("member-1", { role: "team_member", department: null }, deps);

    expect(result).toEqual({ status: "success" });
    expect(deps.updateMember).toHaveBeenCalledWith("member-1", { role: "team_member", department: null });
  });
});
