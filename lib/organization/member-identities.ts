import { createClient as createServiceClient } from "@/lib/supabase/service";
import type { MemberIdentity } from "@/lib/organization/members";

/**
 * Resolves name/email for a set of member user IDs via the Supabase Admin
 * API. There's no `profiles` table mirroring `auth.users` in this schema, and
 * `auth.users` itself isn't exposed to the authenticated/anon PostgREST
 * client — the service-role Admin API is the only way to read another
 * member's email/name. This is read-only enrichment of rows already scoped
 * to the caller's own organization (and branch) by listOrganizationMembers,
 * not an independent authorization boundary.
 */
export async function getMemberIdentities(userIds: string[]): Promise<Map<string, MemberIdentity>> {
  const supabase = createServiceClient();
  const identities = new Map<string, MemberIdentity>();

  await Promise.all(
    userIds.map(async (userId) => {
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

  return identities;
}
