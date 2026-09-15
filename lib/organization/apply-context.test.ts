import { describe, expect, it } from "vitest";

import { hasMultipleBranches } from "@/lib/organization/apply-context";

describe("hasMultipleBranches", () => {
  it("is false for no branches", () => {
    expect(hasMultipleBranches([])).toBe(false);
  });

  it("is false for exactly one branch (the default 'Main' case)", () => {
    expect(hasMultipleBranches([{ id: "1" }])).toBe(false);
  });

  it("is true for two or more branches", () => {
    expect(hasMultipleBranches([{ id: "1" }, { id: "2" }])).toBe(true);
    expect(hasMultipleBranches([{ id: "1" }, { id: "2" }, { id: "3" }])).toBe(true);
  });
});
