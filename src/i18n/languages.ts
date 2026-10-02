/**
 * Language codes are the ones the supplied dataset already uses in its `names`
 * structure, so object names and UI copy are keyed identically.
 */
export const LANGUAGE_CODES = ['eng', 'esp', 'tur', 'fra', 'deu'] as const
export type LanguageCode = (typeof LANGUAGE_CODES)[number]

export const DEFAULT_LANGUAGE: LanguageCode = 'eng'

/** Endonyms — a language picker should read in its own language. */
export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  eng: 'English',
  esp: 'Español',
  tur: 'Türkçe',
  fra: 'Français',
  deu: 'Deutsch',
}

/** Short badge shown in the compact picker. */
export const LANGUAGE_SHORT_LABELS: Record<LanguageCode, string> = {
  eng: 'EN',
  esp: 'ES',
  tur: 'TR',
  fra: 'FR',
  deu: 'DE',
}

/** BCP 47 tags, used for number formatting and the document language. */
export const LOCALE_TAGS: Record<LanguageCode, string> = {
  eng: 'en',
  esp: 'es',
  tur: 'tr',
  fra: 'fr',
  deu: 'de',
}

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && (LANGUAGE_CODES as readonly string[]).includes(value)
}
