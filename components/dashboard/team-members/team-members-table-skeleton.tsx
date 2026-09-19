const SKELETON_ROW_COUNT = 5;

/** Shimmer rows matching TeamMembersTable's real column layout (avatar, name/email, role badge, branch, status badge) — shown while the roster is streaming in. */
export function TeamMembersTableSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading team members"
      className="overflow-hidden rounded-md ring-1 ring-foreground/5 dark:ring-foreground/10"
    >
      <table className="w-full text-left text-sm">
        <tbody>
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
            <tr key={i} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3.5 w-32 animate-pulse rounded-full bg-muted" />
                    <div className="h-3 w-40 animate-pulse rounded-full bg-muted" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="h-5 w-20 animate-pulse rounded-3xl bg-muted" />
              </td>
              <td className="px-4 py-3">
                <div className="h-3.5 w-24 animate-pulse rounded-full bg-muted" />
              </td>
              <td className="px-4 py-3">
                <div className="h-5 w-16 animate-pulse rounded-3xl bg-muted" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
