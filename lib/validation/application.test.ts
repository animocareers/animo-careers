import { describe, expect, it } from "vitest";

import {
  APPLICATION_STEP_FIELDS,
  type ApplicationFormValues,
  applyRequestSchema,
  buildApplyPayload,
  createApplicationSchema,
} from "@/lib/validation/application";

/** Returns translation keys unchanged for deterministic validation messages. */
const t = (key: string) => key;

const PROFESSION_ID = "11111111-1111-4111-8111-111111111111";
const BRANCH_ID = "22222222-2222-4222-8222-222222222222";

/** Builds a valid application payload with optional field overrides. */
function validPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    organizationProfessionId: PROFESSION_ID,
    internshipType: "obligatory",
    scope: "single_profession",
    branchId: BRANCH_ID,
    exactDateUnknown: false,
    requestedStartDate: "2026-06-01",
    requestedEndDate: "2026-06-30",
    firstName: "Max",
    lastName: "Schlau",
    dateOfBirth: "2010-03-05",
    email: "max@example.com",
    phone: "0151 23456789",
    ...overrides,
  };
}

describe("createApplicationSchema", () => {
  it("accepts a fully valid payload", () => {
    const result = createApplicationSchema(t, { branchRequired: true }).safeParse(
      validPayload(),
    );
    expect(result.success).toBe(true);
  });

  it("accepts a payload with dates left null when exactDateUnknown is true", () => {
    const result = createApplicationSchema(t, { branchRequired: false }).safeParse(
      validPayload({
        branchId: undefined,
        exactDateUnknown: true,
        requestedStartDate: null,
        requestedEndDate: null,
      }),
    );
    expect(result.success).toBe(true);
  });

  it("accepts a missing phone (optional)", () => {
    const result = createApplicationSchema(t, { branchRequired: true }).safeParse(
      validPayload({ phone: undefined }),
    );
    expect(result.success).toBe(true);
  });

  it.each(["organizationProfessionId", "internshipType", "scope", "firstName", "lastName", "dateOfBirth"])(
    "rejects a missing %s",
    (field) => {
      const result = createApplicationSchema(t, { branchRequired: true }).safeParse(
        validPayload({ [field]: "" }),
      );
      expect(result.success).toBe(false);
    },
  );

  it("rejects a malformed email", () => {
    const result = createApplicationSchema(t, { branchRequired: true }).safeParse(
      validPayload({ email: "not-an-email" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an internshipType outside the fixed enum", () => {
    const result = createApplicationSchema(t, { branchRequired: true }).safeParse(
      validPayload({ internshipType: "sometimes" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a scope outside the fixed enum", () => {
    const result = createApplicationSchema(t, { branchRequired: true }).safeParse(
      validPayload({ scope: "every_profession" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects requestedEndDate before requestedStartDate", () => {
    const result = createApplicationSchema(t, { branchRequired: true }).safeParse(
      validPayload({ requestedStartDate: "2026-06-30", requestedEndDate: "2026-06-01" }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts requestedEndDate equal to requestedStartDate", () => {
    const result = createApplicationSchema(t, { branchRequired: true }).safeParse(
      validPayload({ requestedStartDate: "2026-06-01", requestedEndDate: "2026-06-01" }),
    );
    expect(result.success).toBe(true);
  });

  it("requires branchId when branchRequired is true", () => {
    const result = createApplicationSchema(t, { branchRequired: true }).safeParse(
      validPayload({ branchId: undefined }),
    );
    expect(result.success).toBe(false);
  });

  it("allows a missing branchId when branchRequired is false", () => {
    const result = createApplicationSchema(t, { branchRequired: false }).safeParse(
      validPayload({ branchId: undefined }),
    );
    expect(result.success).toBe(true);
  });
});

describe("APPLICATION_STEP_FIELDS", () => {
  it("covers every schema field exactly once across steps 1 and 2", () => {
    const allFields = [...APPLICATION_STEP_FIELDS[1], ...APPLICATION_STEP_FIELDS[2]];
    const schemaKeys = Object.keys(validPayload()) as (keyof ApplicationFormValues)[];

    expect(new Set(allFields)).toEqual(new Set(schemaKeys));
    expect(allFields).toHaveLength(new Set(allFields).size);
  });
});

describe("buildApplyPayload", () => {
  const context = { orgSlug: "acme-gmbh", branchSlug: "berlin" };

  it("maps internshipType 'obligatory' to isSchoolMandatory: true", () => {
    const payload = buildApplyPayload(
      validPayload({ internshipType: "obligatory" }) as ApplicationFormValues,
      context,
    );
    expect(payload.isSchoolMandatory).toBe(true);
  });

  it("maps internshipType 'voluntary' to isSchoolMandatory: false", () => {
    const payload = buildApplyPayload(
      validPayload({ internshipType: "voluntary" }) as ApplicationFormValues,
      context,
    );
    expect(payload.isSchoolMandatory).toBe(false);
  });

  it("zeroes out both dates when exactDateUnknown is true, even if stale values remain in form state", () => {
    const payload = buildApplyPayload(
      validPayload({
        exactDateUnknown: true,
        requestedStartDate: "2026-06-01",
        requestedEndDate: "2026-06-30",
      }) as ApplicationFormValues,
      context,
    );
    expect(payload.requestedStartDate).toBeNull();
    expect(payload.requestedEndDate).toBeNull();
  });

  it("keeps the dates when exactDateUnknown is false", () => {
    const payload = buildApplyPayload(validPayload() as ApplicationFormValues, context);
    expect(payload.requestedStartDate).toBe("2026-06-01");
    expect(payload.requestedEndDate).toBe("2026-06-30");
  });

  it("carries orgSlug/branchSlug from context, not the form", () => {
    const payload = buildApplyPayload(validPayload() as ApplicationFormValues, context);
    expect(payload.orgSlug).toBe("acme-gmbh");
    expect(payload.branchSlug).toBe("berlin");
  });
});

describe("applyRequestSchema", () => {
  function validRequest(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      orgSlug: "acme-gmbh",
      branchSlug: "berlin",
      isSchoolMandatory: true,
      ...overrides,
    };
  }

  it("accepts a valid request with a branchSlug", () => {
    expect(applyRequestSchema.safeParse(validRequest()).success).toBe(true);
  });

  it("accepts a null branchSlug (single-branch org)", () => {
    expect(applyRequestSchema.safeParse(validRequest({ branchSlug: null })).success).toBe(true);
  });

  it("rejects an empty orgSlug", () => {
    expect(applyRequestSchema.safeParse(validRequest({ orgSlug: "" })).success).toBe(false);
  });

  it("rejects an empty-string branchSlug (null is the only valid absence)", () => {
    expect(applyRequestSchema.safeParse(validRequest({ branchSlug: "" })).success).toBe(false);
  });

  it("rejects a non-boolean isSchoolMandatory", () => {
    expect(applyRequestSchema.safeParse(validRequest({ isSchoolMandatory: "yes" })).success).toBe(
      false,
    );
  });

  it("rejects a missing isSchoolMandatory", () => {
    expect(
      applyRequestSchema.safeParse(validRequest({ isSchoolMandatory: undefined })).success,
    ).toBe(false);
  });
});
