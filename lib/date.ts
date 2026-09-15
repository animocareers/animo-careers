/**
 * Formats a Date as "YYYY-MM-DD" using its LOCAL calendar date — deliberately
 * not UTC. A date the Calendar picker hands back represents the day the user
 * clicked, constructed in local time; reading it back with UTC getters would
 * roll it back (or forward) a day depending on the runtime's offset. Pairs
 * with `fromIsoDate`, which also builds its Date entirely in local time.
 */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a "YYYY-MM-DD" string into a Date representing local noon on that
 * calendar day — never mixes in a UTC conversion. Deliberately not
 * `new Date(iso)` (parsed as UTC midnight, which `toIsoDate`'s local getters
 * would then roll back a day in any timezone ahead of UTC) and deliberately
 * not UTC noon either (still rolls forward a day in UTC+13/+14 timezones,
 * e.g. Pacific/Kiritimati). Building the Date purely in local time — no UTC
 * arithmetic at any point in the round-trip — round-trips exactly regardless
 * of the runtime's offset.
 */
export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/** Formats a Date as "DD.MM.YYYY" (the German date format used in the apply form's DOB field), using local calendar getters — see `toIsoDate`. */
export function formatGermanDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
