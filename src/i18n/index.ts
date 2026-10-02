import { deu } from './locales/deu'
import { eng, type Translation, type TranslationKey } from './locales/eng'
import { esp } from './locales/esp'
import { fra } from './locales/fra'
import { tur } from './locales/tur'
import { DEFAULT_LANGUAGE, type LanguageCode } from './languages'
import type { GameObject } from '../domain/types'

export type { Translation, TranslationKey }

export const TRANSLATIONS: Record<LanguageCode, Translation> = { eng, esp, tur, fra, deu }

export type TranslationValues = Record<string, string | number>

/**
 * Resolves a UI string, falling back to English and finally to the key itself
 * so a gap in a locale degrades to readable text rather than `undefined`.
 */
export function translate(
  language: LanguageCode,
  key: TranslationKey,
  values?: TranslationValues,
): string {
  const template =
    TRANSLATIONS[language]?.[key] ?? TRANSLATIONS[DEFAULT_LANGUAGE][key] ?? String(key)
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  )
}

/**
 * Object names live in the dataset rather than in the locale files. Missing or
 * blank translations fall back to English, then to any other language that has
 * a name, and only then to the raw id.
 */
export function getObjectName(object: GameObject, language: LanguageCode): string {
  const preferred = object.names[language]?.trim()
  if (preferred) return preferred

  const english = object.names[DEFAULT_LANGUAGE]?.trim()
  if (english) return english

  for (const value of Object.values(object.names)) {
    const candidate = value?.trim()
    if (candidate) return candidate
  }
  return object.id
}
