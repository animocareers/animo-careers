import { sendEmail } from "@/lib/email/providers";

export interface SendAuthEmailInput {
  to: string;
  locale: string;
  firstName: string | null;
  confirmationUrl: string;
  emailActionType: string;
}

interface AuthEmailCopy {
  subject: string;
  greeting: (firstName: string | null) => string;
  body: string;
  ignore: string;
}

const SIGNUP_COPY: Record<"de" | "en", AuthEmailCopy> = {
  de: {
    subject: "Bestätige deine E-Mail-Adresse für animo",
    greeting: (firstName) => (firstName ? `Hallo ${firstName},` : "Hallo,"),
    body: "vielen Dank für deine Registrierung bei animo. Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren:",
    ignore: "Wenn du dich nicht bei animo registriert hast, kannst du diese E-Mail ignorieren.",
  },
  en: {
    subject: "Confirm your email address for animo",
    greeting: (firstName) => (firstName ? `Hi ${firstName},` : "Hi,"),
    body: "thanks for signing up for animo. Please confirm your email address to activate your account:",
    ignore: "If you didn't sign up for animo, you can safely ignore this email.",
  },
};

/**
 * Every Supabase email_action_type other than "signup" (recovery,
 * magiclink, email_change, ...) — none of these flows exist in the app yet,
 * but the "Send Email" hook is enabled project-wide, so an unhandled type
 * would otherwise silently break whichever flow triggers it.
 */
const GENERIC_COPY: Record<"de" | "en", AuthEmailCopy> = {
  de: {
    subject: "Bestätige deine Anfrage bei animo",
    greeting: (firstName) => (firstName ? `Hallo ${firstName},` : "Hallo,"),
    body: "bitte bestätige diese Anfrage über den folgenden Link:",
    ignore: "Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.",
  },
  en: {
    subject: "Confirm your request for animo",
    greeting: (firstName) => (firstName ? `Hi ${firstName},` : "Hi,"),
    body: "please confirm this request using the link below:",
    ignore: "If you didn't make this request, you can safely ignore this email.",
  },
};

/**
 * Sends Supabase Auth's outgoing emails via lib/email/providers (Resend)
 * instead of Supabase's built-in mailer. Called from
 * lib/auth/send-email-hook.ts, which is invoked by Supabase's "Send Email"
 * auth hook for every auth email the project sends.
 */
export async function sendAuthEmail(input: SendAuthEmailInput): Promise<void> {
  const locale = input.locale === "de" ? "de" : "en";
  const copy = (input.emailActionType === "signup" ? SIGNUP_COPY : GENERIC_COPY)[locale];

  const textBody = [
    copy.greeting(input.firstName),
    "",
    copy.body,
    "",
    input.confirmationUrl,
    "",
    copy.ignore,
  ].join("\n");

  await sendEmail({ to: input.to, subject: copy.subject, textBody });
}
