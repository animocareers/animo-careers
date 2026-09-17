import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { z } from "zod";

import { routing } from "@/i18n/routing";
import { sendAuthEmail } from "@/lib/email/send-auth-email";

const hookPayloadSchema = z.object({
  user: z.object({
    email: z.string(),
    user_metadata: z.object({ first_name: z.string() }).partial().optional(),
  }),
  email_data: z.object({
    token_hash: z.string(),
    email_action_type: z.string(),
    redirect_to: z.string(),
    site_url: z.string(),
  }),
});

export type SendEmailHookResult =
  | { status: "success" }
  | { status: "invalid_signature" }
  | { status: "invalid_payload" }
  | { status: "send_failed" };

export interface SendEmailHookDeps {
  sendAuthEmail?: typeof sendAuthEmail;
}

/**
 * Verifies and handles Supabase Auth's "Send Email" webhook: checks the
 * Standard Webhooks signature against SEND_EMAIL_HOOK_SECRET, then sends
 * the email via Resend (lib/email/send-auth-email.ts) instead of
 * Supabase's built-in mailer. See app/api/auth/send-email/route.ts for the
 * HTTP mapping, and supabase/config.toml's [auth.hook.send_email] (local)
 * or the hosted project's Auth Hooks dashboard (staging/production) for
 * where this endpoint is registered.
 */
export async function handleSendEmailHook(
  payload: string,
  headers: Record<string, string>,
  deps: SendEmailHookDeps = {},
): Promise<SendEmailHookResult> {
  const hookSecret = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!hookSecret) {
    throw new Error("SEND_EMAIL_HOOK_SECRET is not set");
  }

  let verified: unknown;
  try {
    const wh = new Webhook(hookSecret.replace("v1,whsec_", ""));
    verified = wh.verify(payload, headers);
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return { status: "invalid_signature" };
    }
    throw error;
  }

  const parsed = hookPayloadSchema.safeParse(verified);
  if (!parsed.success) {
    return { status: "invalid_payload" };
  }

  const { user, email_data } = parsed.data;
  const send = deps.sendAuthEmail ?? sendAuthEmail;

  try {
    await send({
      to: user.email,
      locale: extractLocale(email_data.redirect_to),
      firstName: user.user_metadata?.first_name ?? null,
      confirmationUrl: buildConfirmationUrl(email_data),
      emailActionType: email_data.email_action_type,
    });
  } catch {
    return { status: "send_failed" };
  }

  return { status: "success" };
}

/**
 * Supabase doesn't verify the OTP for us here — it hands us token_hash and
 * expects the email to link to our own verification route (matches
 * app/[locale]/auth/confirm/route.ts, which reads token_hash/type/next).
 * redirect_to is whatever emailRedirectTo the caller passed to
 * supabase.auth.signUp() — already the full, locale-prefixed confirm-route
 * URL for this app (see app/[locale]/auth/register/actions.ts) — so we
 * only need to append the two params it verifies against.
 */
function buildConfirmationUrl(emailData: {
  token_hash: string;
  email_action_type: string;
  redirect_to: string;
  site_url: string;
}): string {
  const url = new URL(emailData.redirect_to || emailData.site_url);
  url.searchParams.set("token_hash", emailData.token_hash);
  url.searchParams.set("type", emailData.email_action_type);
  return url.toString();
}

function extractLocale(redirectTo: string): string {
  try {
    const segment = new URL(redirectTo).pathname.split("/")[1];
    return (routing.locales as readonly string[]).includes(segment)
      ? segment
      : routing.defaultLocale;
  } catch {
    return routing.defaultLocale;
  }
}
