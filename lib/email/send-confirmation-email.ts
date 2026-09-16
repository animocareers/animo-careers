import { sendEmail } from "@/lib/email/providers/console-log";

export interface ApplicationConfirmationEmailInput {
  to: string;
  applicantFirstName: string;
  organizationName: string;
  branchName: string | null;
  professionName: string;
  requestedStartDate: string | null;
  requestedEndDate: string | null;
}

/**
 * Sends the applicant-facing "application received" email. Content is
 * German-only for now: profession_catalog/organization_professions only
 * ever store a German name (no name_en anywhere in the schema), so a fully
 * bilingual email isn't achievable from current data regardless of the
 * applicant's chosen UI language.
 *
 * The actual send is isolated to lib/email/providers/*.ts — this function's
 * signature never mentions a specific provider, so switching providers later
 * only touches that one file.
 */
export async function sendApplicationConfirmationEmail(
  input: ApplicationConfirmationEmailInput,
): Promise<void> {
  const subject = `Deine Bewerbung bei ${input.organizationName}`;

  const locationSuffix = input.branchName ? ` (${input.branchName})` : "";
  const datesLine =
    input.requestedStartDate && input.requestedEndDate
      ? `Gewünschter Zeitraum: ${input.requestedStartDate} – ${input.requestedEndDate}`
      : "Du hast noch keinen genauen Zeitraum angegeben — das ist kein Problem, wir melden uns bei dir.";

  const textBody = [
    `Hallo ${input.applicantFirstName},`,
    "",
    `wir haben deine Bewerbung bei ${input.organizationName}${locationSuffix} für "${input.professionName}" erhalten.`,
    datesLine,
    "",
    "Wir melden uns in Kürze bei dir.",
  ].join("\n");

  await sendEmail({ to: input.to, subject, textBody });
}
