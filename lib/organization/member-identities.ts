import { createClient as createServiceClient } from "@/lib/supabase/service";
import type { MemberIdentity } from "@/lib/organization/members";

/** Max Admin API lookups in flight at once — keeps a large roster from firing an unbounded request burst. */
const LOOKUP_CONCURRENCY = 10;

/**
 * Resolves name/email for a set of member user IDs via the Supabase Admin
 * API. There's no `profiles` table mirroring `auth.users` in this schema, and
 * `auth.users` itself isn't exposed to the authenticated/anon PostgREST
 * client — the service-role Admin API is the only way to read another
 * member's email/name. This is read-only enrichment of rows already scoped
 * to the caller's own organization (and branch) by listOrganizationMembers,
 * not an independent authorization boundary. The Admin API has no bulk
 * lookup by ID, so requests run in bounded chunks rather than all at once.
 */
export async function getMemberIdentities(userIds: string[]): Promise<Map<string, MemberIdentity>> {
  const supabase = createServiceClient();
  const identities = new Map<string, MemberIdentity>();

  for (let start = 0; start < userIds.length; start += LOOKUP_CONCURRENCY) {
    const chunk = userIds.slice(start, start + LOOKUP_CONCURRENCY);
    await Promise.all(
      chunk.map(async (userId) => {
        const { data, error } = await supabase.auth.admin.getUserById(userId);
        if (error || !data.user) return;
        const metadata = data.user.user_metadata as { first_name?: string; last_name?: string };
        identities.set(userId, {
          email: data.user.email ?? "",
          firstName: metadata.first_name ?? null,
          lastName: metadata.last_name ?? null,
        });
      }),
    );
  }

  return identities;
}
