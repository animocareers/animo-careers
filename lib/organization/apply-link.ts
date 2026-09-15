/**
 * Derives the app's public origin from request headers. Reads `host` +
 * `x-forwarded-proto` rather than the `origin` header: `origin` is only sent
 * by browsers on POST/cross-origin requests, not on a plain GET page
 * navigation, so it's unreliable inside a Server Component render.
 */
export function resolveOrigin(headers: Pick<Headers, "get">): string {
  const host = headers.get("host");
  const protocol =
    headers.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
  return `${protocol}://${host}`;
}

/** Builds an organization's public application-form URL from its slug. */
export function buildApplyLink(origin: string, locale: string, slug: string): string {
  return `${origin}/${locale}/application/apply/${slug}`;
}
