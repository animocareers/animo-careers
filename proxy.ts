import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

<<<<<<< HEAD
const handleI18nRouting = createMiddleware(routing);

=======
/** Applies Supabase session handling to requests matched by the proxy config. */
>>>>>>> c56f5555925d55e6e6b2bc0f44b64e99657f8827
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
