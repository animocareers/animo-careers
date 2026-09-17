import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { z } from "zod";

import { routing } from "@/i18n/routing";
import { sendAuthEmail } from "@/lib/email/send-auth-email";

const hookPayloadSchema = z.object({
  user: z.object({
    email: z.string(),
    new_email: z.string().optional(),
    user_metadata: z.object({ first_name: z.string() }).partial().optional(),
  }),
  email_data: z.object({
    token_hash: z.string(),
    token_hash_new: z.string().optional(),
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
    console.error("send-email-hook: unexpected payload shape", parsed.error.issues);
    return { status: "invalid_payload" };
  }

  const { user, email_data } = parsed.data;
  const send = deps.sendAuthEmail ?? sendAuthEmail;
  const locale = extractLocale(email_data.redirect_to);
  const firstName = user.user_metadata?.first_name ?? null;

  try {
    if (email_data.email_action_type === "email_change" && user.new_email && email_data.token_hash_new) {
      // Secure email change (double_confirm_changes in config.toml) requires
      // confirmation from both addresses. Supabase reverses the token
      // fields for this case: token_hash_new belongs to the *current*
      // address, token_hash to the *new* one.
      await send({
        to: user.email,
        locale,
        firstName,
        confirmationUrl: buildConfirmationUrl(email_data, email_data.token_hash_new),
        emailActionType: email_data.email_action_type,
      });
      await send({
        to: user.new_email,
        locale,
        firstName,
        confirmationUrl: buildConfirmationUrl(email_data, email_data.token_hash),
        emailActionType: email_data.email_action_type,
      });
    } else {
      await send({
        to: user.email,
        locale,
        firstName,
        confirmationUrl: buildConfirmationUrl(email_data, email_data.token_hash),
        emailActionType: email_data.email_action_type,
      });
    }
  } catch (error) {
    console.error("send-email-hook: sendAuthEmail failed", error);
    return { status: "send_failed" };
  }

  return { status: "success" };
}

/**
 * Supabase doesn't verify the OTP for us here — it hands us a token_hash
 * and expects the email to link to our own verification route (matches
 * app/[locale]/auth/confirm/route.ts, which reads token_hash/type/next).
 * redirect_to is whatever emailRedirectTo the caller passed at request time
 * — already the full, locale-prefixed confirm-route URL for this app (see
 * app/[locale]/auth/register/actions.ts) — so we only need to append the
 * two params it verifies against. tokenHash is passed in explicitly rather
 * than always read off emailData.token_hash, since email_change sends two
 * emails with two different tokens (see caller).
 *
 * redirect_to is empty whenever the caller didn't pass emailRedirectTo (no
 * flow in this app does that today, but nothing stops one being added, or a
 * hook call originating outside this app's own actions). site_url alone is
 * just the bare origin, with no /auth/confirm route beneath it — appending
 * params directly to it produces a link to a page that doesn't exist, so we
 * build the default-locale confirm route under it instead.
 */
function buildConfirmationUrl(
  emailData: { email_action_type: string; redirect_to: string; site_url: string },
  tokenHash: string,
): string {
  const url = emailData.redirect_to
    ? new URL(emailData.redirect_to)
    : new URL(`/${routing.defaultLocale}/auth/confirm`, emailData.site_url);
  url.searchParams.set("token_hash", tokenHash);
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
