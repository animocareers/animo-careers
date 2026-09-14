import { describe, expect, it } from "vitest";

import { createOrganizationSchema } from "@/lib/validation/organization";

const t = (key: string) => key;

const PROFESSION_A = "11111111-1111-4111-8111-111111111111";
const PROFESSION_B = "22222222-2222-4222-8222-222222222222";

/** Builds `count` distinct, valid (version 4) UUIDs for boundary tests. */
function professionIds(count: number) {
  return Array.from(
    { length: count },
    (_, i) => `33333333-3333-4333-8333-${String(i).padStart(12, "0")}`,
  );
}

function validPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    name: "Acme GmbH",
    street: "Musterstraße 1",
    postalCode: "10115",
    city: "Berlin",
    country: "Germany",
    industryType: "it_software",
    professionIds: [PROFESSION_A, PROFESSION_B],
    ...overrides,
  };
}

describe("createOrganizationSchema", () => {
  it("accepts a fully valid payload", () => {
    const result = createOrganizationSchema(t).safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  it("rejects a single profession id (below the minimum of 2)", () => {
    const result = createOrganizationSchema(t).safeParse(
      validPayload({ professionIds: [PROFESSION_A] }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts exactly 2 profession ids (lower boundary)", () => {
    const result = createOrganizationSchema(t).safeParse(
      validPayload({ professionIds: [PROFESSION_A, PROFESSION_B] }),
    );
    expect(result.success).toBe(true);
  });

  it("accepts exactly 15 profession ids (upper boundary)", () => {
    const result = createOrganizationSchema(t).safeParse(
      validPayload({ professionIds: professionIds(15) }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects 16 profession ids (above the maximum of 15)", () => {
    const result = createOrganizationSchema(t).safeParse(
      validPayload({ professionIds: professionIds(16) }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a blank name", () => {
    const result = createOrganizationSchema(t).safeParse(validPayload({ name: "  " }));
    expect(result.success).toBe(false);
  });

  it.each(["street", "postalCode", "city", "country"])(
    "rejects a missing %s",
    (field) => {
      const result = createOrganizationSchema(t).safeParse(validPayload({ [field]: "" }));
      expect(result.success).toBe(false);
    },
  );

  it("rejects an industryType outside the fixed enum", () => {
    const result = createOrganizationSchema(t).safeParse(
      validPayload({ industryType: "not_a_real_industry" }),
    );
    expect(result.success).toBe(false);
  });
});
