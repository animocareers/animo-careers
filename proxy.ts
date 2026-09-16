import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const intlResponse = handleI18nRouting(request);

  // Unprefixed paths (e.g. "/" or a request missing its locale segment) get
  // redirected to their localized URL by next-intl. Let that redirect through
  // before Supabase's locale-prefixed route matching ever sees the request.
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  const sessionResponse = await updateSession(request);
  if (sessionResponse.status >= 300 && sessionResponse.status < 400) {
    return sessionResponse;
  }

  // Merge next-intl's locale cookie onto the Supabase response so neither
  // flow's cookies are dropped.
  intlResponse.cookies.getAll().forEach((cookie) => {
    sessionResponse.cookies.set(cookie);
  });

  return sessionResponse;
}

export const config = {
  // `api` is excluded here too: API routes (e.g. app/api/public-apply) have
  // no locale segment, so next-intl's middleware would otherwise 307-redirect
  // them to a locale-prefixed path that doesn't exist (e.g. /en/api/public-apply).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
