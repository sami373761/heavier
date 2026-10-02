import { useI18n } from '../i18n/I18nContext'
import { usePreferences } from '../state/PreferencesContext'
import { WEIGHT_UNITS } from '../domain/units'

/**
 * Switches the display unit only. Game logic never reads this — comparisons
 * always run on the canonical gram value.
 */
export function UnitToggle() {
  const { t } = useI18n()
  const { unit, setUnit } = usePreferences()

  return (
    <div className="segmented" role="group" aria-label={t('a11y.unitSelect')}>
      {WEIGHT_UNITS.map((option) => (
        <button
          key={option}
          type="button"
          className="segmented__option"
          data-active={option === unit || undefined}
          aria-pressed={option === unit}
          onClick={() => setUnit(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
