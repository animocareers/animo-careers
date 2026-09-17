import type { SendEmailInput } from "@/lib/email/providers/types";

/**
 * Dev-only fallback: logs the email instead of sending it. Selected by
 * lib/email/providers/index.ts whenever RESEND_API_KEY isn't set, so a
 * fresh checkout works without a Resend account. Real sends go through
 * lib/email/providers/resend.ts.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  console.log("[email:stub] would send email", {
    to: input.to,
    subject: input.subject,
  });
}
