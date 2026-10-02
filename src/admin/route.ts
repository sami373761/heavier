/**
 * Where the admin panel lives.
 *
 * It is a page of this app, not a second app: one build, one bundle entry, one
 * server. `src/main.tsx` compares the browser's pathname with the constant
 * below and renders the panel instead of the game when they match.
 *
 * Two consequences of that, both deliberate:
 *
 *  - The path is in the client bundle, because the client is what matches it.
 *    It is **not** a secret any more, and nothing here pretends otherwise: the
 *    login is the only thing protecting the panel.
 *  - The match is exact. A language prefix does not apply — the panel is
 *    English-only and lives at this one address, so `/tr/<path>` is the game,
 *    like any other unknown URL.
 */
export const ADMIN_ROUTE =
  '/4095824095823fs9a04fd823hb9d05s7d340g5b8f23s9df4s845g9h2sd8d37sdf484h039h8sd52e0sd8ff3g94h5823'

/** True for the admin route, with or without a trailing slash. */
export function isAdminRoute(pathname: string): boolean {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return trimmed === ADMIN_ROUTE
}
