/** Thin top progress bar shown while this route's server data (org, professions, apply link) loads. */
export default function Loading() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-transparent" role="status" aria-label="Loading">
      <div className="h-full w-2/5 animate-[top-loading-bar_1s_ease-in-out_infinite] bg-primary" />
    </div>
  );
}
