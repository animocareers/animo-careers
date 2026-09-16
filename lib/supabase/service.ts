import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client authenticated as the service role — bypasses RLS
 * entirely (see architecture.md, "Public form submission path"). Server-only:
 * never import this outside the /api/public-apply write path, and never
 * expose the key it reads to client code.
 *
 * Built with @supabase/supabase-js's plain createClient rather than
 * @supabase/ssr — there's no user session or cookie exchange for a
 * service-role client, so the cookie-adapter machinery lib/supabase/server.ts
 * needs doesn't apply here.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service-role environment variables.");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
