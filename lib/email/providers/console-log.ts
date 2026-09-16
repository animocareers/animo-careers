export interface SendEmailInput {
  to: string;
  subject: string;
  textBody: string;
}

/**
 * Placeholder provider: logs the email instead of sending it.
 * architecture.md leaves the real provider (Postmark vs. Brevo) undecided,
 * and no provider SDK is installed yet. Swap this file's implementation
 * (keeping the same SendEmailInput -> Promise<void> signature) once a
 * provider is chosen and configured — no changes needed in
 * send-confirmation-email.ts, which only imports this function.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  console.log("[email:stub] would send email", {
    to: input.to,
    subject: input.subject,
  });
}
