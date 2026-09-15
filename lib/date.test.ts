import { afterEach, describe, expect, it, vi } from "vitest";

import { formatGermanDate, fromIsoDate, toIsoDate } from "@/lib/date";

describe("fromIsoDate / toIsoDate round-trip", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(["UTC", "Europe/Berlin", "Pacific/Kiritimati", "Etc/GMT+12"])(
    "round-trips a date unchanged in the %s timezone",
    (tz) => {
      vi.stubEnv("TZ", tz);
      const iso = "2026-06-15";
      expect(toIsoDate(fromIsoDate(iso))).toBe(iso);
    },
  );

  it("round-trips dates at both ends of a month/year boundary", () => {
    vi.stubEnv("TZ", "Europe/Berlin");
    expect(toIsoDate(fromIsoDate("2026-01-01"))).toBe("2026-01-01");
    expect(toIsoDate(fromIsoDate("2025-12-31"))).toBe("2025-12-31");
  });
});

describe("formatGermanDate", () => {
  it("formats as DD.MM.YYYY", () => {
    expect(formatGermanDate(fromIsoDate("2026-03-05"))).toBe("05.03.2026");
  });

  it("pads single-digit day and month", () => {
    expect(formatGermanDate(fromIsoDate("2026-01-09"))).toBe("09.01.2026");
  });
});

describe("toIsoDate", () => {
  it("formats a locally-constructed Date (as a Calendar picker would hand back) using its local calendar day", () => {
    const localMidnight = new Date(2026, 5, 15); // June is month index 5
    expect(toIsoDate(localMidnight)).toBe("2026-06-15");
  });
});
