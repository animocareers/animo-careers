import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitPublicApplication } from "@/lib/application/submit-application";
import type { ApplyBranch, ApplyOrganization, ApplyProfession } from "@/lib/organization/apply-context";
import { buildApplyPayload, type ApplicationFormValues } from "@/lib/validation/application";

const ORG: ApplyOrganization = { id: "org-1", name: "Acme GmbH", slug: "acme-gmbh" };
const MAIN_BRANCH: ApplyBranch = { id: "branch-main", name: "Main", slug: null };
const BERLIN_BRANCH: ApplyBranch = { id: "branch-berlin", name: "Berlin", slug: "berlin" };
const HAMBURG_BRANCH: ApplyBranch = { id: "branch-hamburg", name: "Hamburg", slug: "hamburg" };
const PROFESSION: ApplyProfession = {
  organizationProfessionId: "11111111-1111-4111-8111-111111111111",
  nameDe: "Tischler",
};

/** The real wire-payload shape sent by the client, via the same helper it uses. */
function realPayload(overrides: Partial<Record<string, unknown>> = {}) {
  const values: ApplicationFormValues = {
    organizationProfessionId: PROFESSION.organizationProfessionId,
    internshipType: "obligatory",
    scope: "single_profession",
    branchId: undefined,
    exactDateUnknown: false,
    requestedStartDate: "2026-06-01",
    requestedEndDate: "2026-06-30",
    firstName: "Max",
    lastName: "Schlau",
    dateOfBirth: "2010-03-05",
    email: "max@example.com",
    phone: "0151 23456789",
  };
  return { ...buildApplyPayload(values, { orgSlug: "acme-gmbh", branchSlug: null }), ...overrides };
}

function makeDeps(overrides: Partial<Parameters<typeof submitPublicApplication>[1]> = {}) {
  return {
    resolveOrganization: vi.fn().mockResolvedValue(ORG),
    resolveBranch: vi.fn().mockResolvedValue(BERLIN_BRANCH),
    listOrgBranches: vi.fn().mockResolvedValue([MAIN_BRANCH]),
    listOrgProfessions: vi.fn().mockResolvedValue([PROFESSION]),
    submitApplicationRpc: vi.fn().mockResolvedValue({ data: "app-1", error: null }),
    sendConfirmationEmail: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("submitPublicApplication", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("succeeds for a single-branch org and sends the confirmation email", async () => {
    const deps = makeDeps({ listOrgBranches: vi.fn().mockResolvedValue([MAIN_BRANCH]) });
    const result = await submitPublicApplication(realPayload({ branchSlug: null }), deps);

    expect(result).toEqual({ status: "success", applicationId: "app-1", emailSent: true });
    expect(deps.submitApplicationRpc).toHaveBeenCalledWith(
      expect.objectContaining({
        p_organization_id: "org-1",
        p_branch_id: "branch-main",
        p_organization_profession_id: PROFESSION.organizationProfessionId,
        p_is_school_mandatory: true,
      }),
    );
    expect(deps.sendConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "max@example.com", professionName: "Tischler" }),
    );
  });

  it("succeeds for a multi-branch org with a valid branchSlug (regression: branchId is never in the wire payload)", async () => {
    const deps = makeDeps({
      listOrgBranches: vi.fn().mockResolvedValue([BERLIN_BRANCH, HAMBURG_BRANCH]),
      resolveBranch: vi.fn().mockResolvedValue(BERLIN_BRANCH),
    });
    const result = await submitPublicApplication(realPayload({ branchSlug: "berlin" }), deps);

    expect(result.status).toBe("success");
    expect(deps.resolveBranch).toHaveBeenCalledWith("org-1", "berlin");
    expect(deps.submitApplicationRpc).toHaveBeenCalledWith(
      expect.objectContaining({ p_branch_id: "branch-berlin" }),
    );
  });

  it("returns invalid when a multi-branch org has no resolvable branchSlug", async () => {
    const deps = makeDeps({
      listOrgBranches: vi.fn().mockResolvedValue([BERLIN_BRANCH, HAMBURG_BRANCH]),
    });
    const result = await submitPublicApplication(realPayload({ branchSlug: null }), deps);

    expect(result.status).toBe("invalid");
    expect(deps.submitApplicationRpc).not.toHaveBeenCalled();
  });

  it("returns not_found for an unresolvable orgSlug", async () => {
    const deps = makeDeps({ resolveOrganization: vi.fn().mockResolvedValue(null) });
    const result = await submitPublicApplication(realPayload(), deps);

    expect(result).toEqual({ status: "not_found" });
    expect(deps.submitApplicationRpc).not.toHaveBeenCalled();
  });

  it("returns not_found for an unresolvable branchSlug", async () => {
    const deps = makeDeps({ resolveBranch: vi.fn().mockResolvedValue(null) });
    const result = await submitPublicApplication(realPayload({ branchSlug: "nowhere" }), deps);

    expect(result).toEqual({ status: "not_found" });
  });

  it("returns invalid and never reaches the database for a malformed payload", async () => {
    const deps = makeDeps();
    const result = await submitPublicApplication(realPayload({ firstName: "" }), deps);

    expect(result.status).toBe("invalid");
    expect(deps.submitApplicationRpc).not.toHaveBeenCalled();
  });

  it("rejects an organizationProfessionId that doesn't belong to the resolved org", async () => {
    const deps = makeDeps({ listOrgProfessions: vi.fn().mockResolvedValue([]) });
    const result = await submitPublicApplication(realPayload(), deps);

    expect(result).toEqual({
      status: "invalid",
      fieldErrors: { organizationProfessionId: ["invalid_profession"] },
    });
    expect(deps.submitApplicationRpc).not.toHaveBeenCalled();
  });

  it("succeeds when the org has no pipeline stages (RPC itself owns the null-fallback)", async () => {
    const deps = makeDeps({
      listOrgBranches: vi.fn().mockResolvedValue([MAIN_BRANCH]),
      submitApplicationRpc: vi.fn().mockResolvedValue({ data: "app-2", error: null }),
    });
    const result = await submitPublicApplication(realPayload({ branchSlug: null }), deps);

    expect(result).toEqual({ status: "success", applicationId: "app-2", emailSent: true });
  });

  it("reports the same success shape as a genuine submission when the applicant already applied (anti-enumeration: a public caller must not be able to tell a duplicate from a new submission)", async () => {
    const deps = makeDeps({
      submitApplicationRpc: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "duplicate_application" } }),
    });
    const result = await submitPublicApplication(realPayload(), deps);

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.applicationId).toEqual(expect.any(String));
      expect(result.applicationId).not.toBe("");
      expect(result.emailSent).toBe(true);
    }
    // No duplicate confirmation email — the real applicant already received
    // one on their original, genuine submission.
    expect(deps.sendConfirmationEmail).not.toHaveBeenCalled();
  });

  it("returns server_error when the RPC fails", async () => {
    const deps = makeDeps({
      submitApplicationRpc: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }),
    });
    const result = await submitPublicApplication(realPayload(), deps);

    expect(result).toEqual({ status: "server_error" });
  });

  it("still reports success when the confirmation email fails to send, flagging emailSent: false", async () => {
    const deps = makeDeps({
      listOrgBranches: vi.fn().mockResolvedValue([MAIN_BRANCH]),
      sendConfirmationEmail: vi.fn().mockRejectedValue(new Error("email provider down")),
    });
    const result = await submitPublicApplication(realPayload({ branchSlug: null }), deps);

    expect(result).toEqual({ status: "success", applicationId: "app-1", emailSent: false });
  });
});
