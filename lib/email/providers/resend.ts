import { Resend } from "resend";

import type { SendEmailInput } from "@/lib/email/providers/types";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    client = new Resend(apiKey);
  }
  return client;
}

/** Real provider: sends via Resend. Requires RESEND_API_KEY and EMAIL_FROM (a sender on a domain verified in the Resend dashboard) — see .env.local. */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }

  const { error } = await getClient().emails.send({
    from,
    to: input.to,
    subject: input.subject,
    text: input.textBody,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}
