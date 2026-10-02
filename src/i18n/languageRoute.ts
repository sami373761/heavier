import { DEFAULT_LANGUAGE, LANGUAGE_CODES, LOCALE_TAGS, type LanguageCode } from './languages'

/**
 * Where each language lives in the URL.
 *
 * The language used to exist only in localStorage, which meant all five
 * locales shared one address: a crawler could only ever see English, and a
 * Turkish player had no link to send anyone. Each language now has a path of
 * its own, built from the same BCP 47 tag `LOCALE_TAGS` already uses for
 * `<html lang>` and number formatting, so there is no second table to keep in
 * step — `/tr/`, `/es/`, `/fr/`, `/de/`.
 *
 * English is the bare root rather than `/en/`: it is the default locale, so it
 * gets the canonical address and `/en/` is accepted as a synonym that
 * normalises back to `/`.
 *
 * This is a *language* prefix, not a router. Everything after the prefix is
 * carried through untouched, which is what will let real page paths be added
 * later without revisiting any of this.
 */

/** The path segment for a language, or `''` for the default one. */
export function languageSegment(language: LanguageCode): string {
  return language === DEFAULT_LANGUAGE ? '' : LOCALE_TAGS[language]
}

/**
 * The language a path declares, or null when it declares none.
 *
 * `/en/...` resolves to English even though English is served at `/`, so an
 * explicitly built link never 404s into the wrong locale.
 */
export function languageFromPath(pathname: string): LanguageCode | null {
  const segment = pathname.replace(/^\/+/, '').split('/')[0].toLowerCase()
  if (!segment) return null
  return LANGUAGE_CODES.find((code) => LOCALE_TAGS[code] === segment) ?? null
}

/** Whatever follows the language prefix, with no leading slash. */
function pathWithoutLanguage(pathname: string): string {
  const parts = pathname.replace(/^\/+/, '').split('/')
  if (parts.length > 0 && languageFromPath(parts[0]) !== null) parts.shift()
  return parts.filter(Boolean).join('/')
}

/**
 * The address a language lives at, keeping whatever page the current path
 * points to. Always ends in a slash, so `/tr/` and `/tr` are not two URLs.
 */
export function pathForLanguage(language: LanguageCode, pathname = '/'): string {
  const segment = languageSegment(language)
  const rest = pathWithoutLanguage(pathname)
  const parts = [segment, rest].filter(Boolean)
  if (parts.length === 0) return '/'
  return `/${parts.join('/')}${rest ? '' : '/'}`
}

/** The absolute, canonical URL of a language, for `<link rel="canonical">`, hreflang and sharing. */
export function urlForLanguage(language: LanguageCode, origin: string, pathname = '/'): string {
  return `${origin.replace(/\/+$/, '')}${pathForLanguage(language, pathname)}`
}

/**
 * The origin to build links against, or `''` where there is no browser.
 *
 * The guard is not defensive programming — the game only ever runs in one —
 * it is what keeps the score screens renderable by `renderToStaticMarkup`,
 * which is how this project checks its UI without a browser.
 */
export function currentOrigin(): string {
  return typeof window === 'undefined' ? '' : window.location.origin
}

/** The path being viewed, or `/` where there is no browser. Same reason as above. */
export function currentPathname(): string {
  return typeof window === 'undefined' ? '/' : window.location.pathname
}
