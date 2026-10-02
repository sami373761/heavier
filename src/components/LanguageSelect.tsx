import { useI18n } from '../i18n/I18nContext'
import { usePreferences } from '../state/PreferencesContext'
import { isLanguageCode, LANGUAGE_CODES, LANGUAGE_LABELS } from '../i18n/languages'
import { ChevronDownIcon } from './icons'

export function LanguageSelect() {
  const { t } = useI18n()
  const { language, setLanguage } = usePreferences()

  return (
    <div className="select">
      <select
        className="select__input"
        value={language}
        aria-label={t('a11y.languageSelect')}
        onChange={(event) => {
          const next = event.target.value
          if (isLanguageCode(next)) setLanguage(next)
        }}
      >
        {LANGUAGE_CODES.map((code) => (
          <option key={code} value={code}>
            {LANGUAGE_LABELS[code]}
          </option>
        ))}
      </select>
      <span className="select__chevron">
        <ChevronDownIcon />
      </span>
    </div>
  )
}
