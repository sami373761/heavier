import { LOCALE_TAGS, type LanguageCode } from './languages'
import { pathForLanguage, urlForLanguage } from './languageRoute'
import { translate } from '.'

/**
 * Keeps the parts of `<head>` that depend on the chosen language in step with
 * it: the document language, the description, and the canonical/OpenGraph URL.
 *
 * Everything that does not vary — the card type, the image, the hreflang map —
 * is static in `index.html`, because a social scraper does not run this code.
 * What it does do is make the five locales honest for browsers and for
 * crawlers that render JavaScript: each language declares its own URL as
 * canonical, so `/tr/` is indexed as the Turkish page rather than as a
 * duplicate of `/`.
 *
 * It also pins the origin to the one actually being served, which is what lets
 * the placeholder domain in `index.html` be wrong without the share button or
 * the canonical tag ever being wrong.
 */

/** Facebook wants `language_TERRITORY`, not the bare tag `<html lang>` takes. */
const OG_LOCALES: Record<LanguageCode, string> = {
  eng: 'en_US',
  esp: 'es_ES',
  tur: 'tr_TR',
  fra: 'fr_FR',
  deu: 'de_DE',
}

function setMeta(attribute: 'name' | 'property', key: string, value: string): void {
  const selector = `meta[${attribute}="${key}"]`
  let tag = document.head.querySelector<HTMLMetaElement>(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', value)
}

function setCanonical(url: string): void {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!tag) {
    tag = document.createElement('link')
    tag.rel = 'canonical'
    document.head.appendChild(tag)
  }
  tag.href = url
}

export function applyDocumentHead(language: LanguageCode): void {
  const url = urlForLanguage(language, window.location.origin, window.location.pathname)
  const description = translate(language, 'meta.description')

  document.documentElement.lang = LOCALE_TAGS[language]
  setMeta('name', 'description', description)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:locale', OG_LOCALES[language])
  setMeta('property', 'og:url', url)
  setMeta('name', 'twitter:description', description)
  setCanonical(url)
}

/**
 * Normalises `/en/` to `/`, the address hreflang and the canonical tag both
 * name for English. A history *replacement*, so the visitor's Back button is
 * not spent on a URL they never chose.
 */
export function normaliseLanguagePath(language: LanguageCode): void {
  const canonicalPath = pathForLanguage(language, window.location.pathname)
  if (canonicalPath === window.location.pathname) return
  window.history.replaceState(null, '', `${canonicalPath}${window.location.search}${window.location.hash}`)
}
