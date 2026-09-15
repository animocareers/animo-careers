import { afterEach, describe, expect, it, vi } from "vitest";

import { buildApplyLink, resolveOrigin } from "@/lib/organization/apply-link";

/** Minimal stand-in for the Next.js `headers()` result — only `.get` is used. */
function headersFrom(values: Record<string, string>): Pick<Headers, "get"> {
  return { get: (name: string) => values[name.toLowerCase()] ?? null };
}

describe("resolveOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers x-forwarded-proto when present (e.g. behind a reverse proxy)", () => {
    const origin = resolveOrigin(headersFrom({ host: "animo.app", "x-forwarded-proto": "https" }));
    expect(origin).toBe("https://animo.app");
  });

  it("falls back to http in development when x-forwarded-proto is absent", () => {
    vi.stubEnv("NODE_ENV", "development");
    const origin = resolveOrigin(headersFrom({ host: "localhost:3000" }));
    expect(origin).toBe("http://localhost:3000");
  });

  it("falls back to https outside development when x-forwarded-proto is absent", () => {
    vi.stubEnv("NODE_ENV", "production");
    const origin = resolveOrigin(headersFrom({ host: "animo.app" }));
    expect(origin).toBe("https://animo.app");
  });
});

describe("buildApplyLink", () => {
  it("joins the origin, locale, and slug under /application/apply", () => {
    expect(buildApplyLink("https://animo.app", "en", "acme-gmbh")).toBe(
      "https://animo.app/en/application/apply/acme-gmbh",
    );
  });

  it("uses whichever locale is passed", () => {
    expect(buildApplyLink("https://animo.app", "de", "acme-gmbh")).toBe(
      "https://animo.app/de/application/apply/acme-gmbh",
    );
  });
});
