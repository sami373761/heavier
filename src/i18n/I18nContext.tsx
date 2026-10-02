import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { getObjectName, translate, type TranslationKey, type TranslationValues } from '.'
import type { LanguageCode } from './languages'
import type { GameObject } from '../domain/types'

interface I18nValue {
  language: LanguageCode
  t: (key: TranslationKey, values?: TranslationValues) => string
  /** Localized object name, with graceful fallback. */
  objectName: (object: GameObject) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({
  language,
  children,
}: {
  language: LanguageCode
  children: ReactNode
}) {
  const value = useMemo<I18nValue>(
    () => ({
      language,
      t: (key, values) => translate(language, key, values),
      objectName: (object) => getObjectName(object, language),
    }),
    [language],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside an I18nProvider')
  return value
}
