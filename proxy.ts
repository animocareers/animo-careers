import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/** Applies Supabase session handling to requests matched by the proxy config. */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
