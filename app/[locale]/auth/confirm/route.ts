import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

function isSafeRedirectPath(value: string | null): value is string {
  if (!value) return false;
  // Must be a relative path starting with a single "/" — reject
  // protocol-relative ("//host"), backslash tricks ("/\host"), and
  // absolute URLs, which would otherwise enable an open redirect.
  return /^\/(?!\/|\\)/.test(value);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const requestedNext = searchParams.get("next");
  const next = isSafeRedirectPath(requestedNext)
    ? requestedNext
    : `/${locale}/auth/login`;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  redirect(`/${locale}/auth/login?error=confirmation_failed`);
}
