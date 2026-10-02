import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_LANGUAGE,
  isLanguageCode,
  LOCALE_TAGS,
  type LanguageCode,
} from '../i18n/languages'
import { applyDocumentHead, normaliseLanguagePath } from '../i18n/documentHead'
import { currentPathname, languageFromPath, pathForLanguage } from '../i18n/languageRoute'
import { DEFAULT_WEIGHT_UNIT, WEIGHT_UNITS, type WeightUnit } from '../domain/units'
import { readStoredPreference, writeStoredPreference } from '../services/preferencesStorage'

const LANGUAGE_KEY = 'weight-game:language'
const UNIT_KEY = 'weight-game:unit'

function isWeightUnit(value: unknown): value is WeightUnit {
  return typeof value === 'string' && (WEIGHT_UNITS as readonly string[]).includes(value)
}

interface PreferencesValue {
  language: LanguageCode
  unit: WeightUnit
  setLanguage: (language: LanguageCode) => void
  setUnit: (unit: WeightUnit) => void
}

const PreferencesContext = createContext<PreferencesValue | null>(null)

/** Picks the closest supported language from the browser, e.g. `de-AT` -> `deu`. */
function detectLanguage(): LanguageCode {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE
  for (const tag of navigator.languages ?? []) {
    const base = tag.toLowerCase().split('-')[0]
    const match = (Object.keys(LOCALE_TAGS) as LanguageCode[]).find(
      (code) => LOCALE_TAGS[code] === base,
    )
    if (match) return match
  }
  return DEFAULT_LANGUAGE
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(
    () =>
      // The URL wins: a link to `/tr/` must open in Turkish for everyone,
      // including a visitor whose last visit was in German. Only when the
      // address declares no language do the old rules apply.
      languageFromPath(currentPathname()) ??
      readStoredPreference(LANGUAGE_KEY, isLanguageCode) ??
      detectLanguage(),
  )
  const [unit, setUnitState] = useState<WeightUnit>(
    () => readStoredPreference(UNIT_KEY, isWeightUnit) ?? DEFAULT_WEIGHT_UNIT,
  )

  useEffect(() => {
    // Normalise first, so the canonical tag describes the address the visitor
    // is left on rather than the one they arrived at.
    normaliseLanguagePath(language)
    applyDocumentHead(language)
  }, [language])

  // The Back button after a language change: the address is authoritative once
  // the visitor has navigated, so a bare path means the default language
  // rather than whatever is in storage.
  useEffect(() => {
    const onPopState = () =>
      setLanguageState(languageFromPath(window.location.pathname) ?? DEFAULT_LANGUAGE)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const setLanguage = useCallback((next: LanguageCode) => {
    setLanguageState(next)
    writeStoredPreference(LANGUAGE_KEY, next)
    // A real history entry, so switching language is undoable and the address
    // bar always shows a link worth copying.
    const path = pathForLanguage(next, window.location.pathname)
    window.history.pushState(null, '', `${path}${window.location.search}${window.location.hash}`)
  }, [])

  const setUnit = useCallback((next: WeightUnit) => {
    setUnitState(next)
    writeStoredPreference(UNIT_KEY, next)
  }, [])

  const value = useMemo(
    () => ({ language, unit, setLanguage, setUnit }),
    [language, unit, setLanguage, setUnit],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences(): PreferencesValue {
  const value = useContext(PreferencesContext)
  if (!value) throw new Error('usePreferences must be used inside a PreferencesProvider')
  return value
}
