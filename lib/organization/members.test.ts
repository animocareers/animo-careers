import { describe, expect, it } from "vitest";

import { memberDisplayName, memberInitial, memberStatusLabel } from "@/lib/organization/members";

describe("memberDisplayName", () => {
  it("joins first and last name when both are present", () => {
    expect(memberDisplayName({ firstName: "Max", lastName: "Schlau", email: "max@acme.de" })).toBe(
      "Max Schlau",
    );
  });

  it("falls back to email when no name is on file", () => {
    expect(memberDisplayName({ firstName: null, lastName: null, email: "max@acme.de" })).toBe(
      "max@acme.de",
    );
  });

  it("uses whichever name part is present", () => {
    expect(memberDisplayName({ firstName: "Max", lastName: null, email: "max@acme.de" })).toBe("Max");
    expect(memberDisplayName({ firstName: null, lastName: "Schlau", email: "max@acme.de" })).toBe(
      "Schlau",
    );
  });
});

describe("memberInitial", () => {
  it("uses the first letter of the first name when present", () => {
    expect(memberInitial({ firstName: "max", lastName: null, email: "z@acme.de" })).toBe("M");
  });

  it("falls back to the first letter of the email", () => {
    expect(memberInitial({ firstName: null, lastName: null, email: "zoe@acme.de" })).toBe("Z");
  });
});

describe("memberStatusLabel", () => {
  it("maps 'active' to active", () => {
    expect(memberStatusLabel("active")).toBe("active");
  });

  it.each(["invited", "disabled", null])("maps %s to pending", (status) => {
    expect(memberStatusLabel(status)).toBe("pending");
  });
});
