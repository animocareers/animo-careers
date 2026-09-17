import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { handleSendEmailHook } from "@/lib/auth/send-email-hook";

/**
 * Target of Supabase Auth's "Send Email" hook: every outgoing auth email
 * (signup confirmation today) is routed here instead of Supabase's
 * built-in mailer, so delivery goes through Resend (lib/email/providers).
 * Registered via supabase/config.toml's [auth.hook.send_email] locally and
 * the hosted project's Auth Hooks dashboard in staging/production — see
 * context/architecture.md. Must read the raw body (not request.json())
 * since signature verification needs the exact bytes Supabase signed.
 */
export async function POST(request: NextRequest) {
  const payload = await request.text();
  const headers = Object.fromEntries(request.headers);

  const result = await handleSendEmailHook(payload, headers);

  switch (result.status) {
    case "success":
      return NextResponse.json({});
    case "invalid_signature":
      return hookError(401, "Invalid webhook signature");
    case "invalid_payload":
      return hookError(400, "Unexpected hook payload shape");
    case "send_failed":
      return hookError(500, "Failed to send email");
    default:
      result satisfies never;
      return hookError(500, "Unexpected error");
  }
}

/** Error shape GoTrue's HTTP hooks expect — see context/architecture.md. */
function hookError(httpCode: number, message: string) {
  return NextResponse.json({ error: { http_code: httpCode, message } }, { status: httpCode });
}
