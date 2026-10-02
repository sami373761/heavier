import { ObjectImage } from './ObjectImage'
import { useI18n } from '../i18n/I18nContext'
import { usePreferences } from '../state/PreferencesContext'
import { formatWeight } from '../domain/units'
import type { GameObject } from '../domain/types'

type CardStatus = 'idle' | 'correct' | 'wrong' | 'muted'

interface ObjectCardProps {
  object: GameObject
  revealed: boolean
  /** True when this is the object the player picked. */
  chosen: boolean
  /** True when this object is the heavier one — only meaningful once revealed. */
  isHeavier: boolean
  onChoose: () => void
}

export function ObjectCard({ object, revealed, chosen, isHeavier, onChoose }: ObjectCardProps) {
  const { t, objectName, language } = useI18n()
  const { unit } = usePreferences()
  const name = objectName(object)

  const status: CardStatus = !revealed
    ? 'idle'
    : isHeavier
      ? 'correct'
      : chosen
        ? 'wrong'
        : 'muted'

  const weight = revealed ? formatWeight(object.weightGrams, unit, language) : null

  return (
    <button
      type="button"
      className="card"
      data-status={status}
      data-chosen={chosen || undefined}
      onClick={onChoose}
      disabled={revealed}
      aria-label={t('game.choose', { name })}
    >
      <span className="card__stage">
        <ObjectImage object={object} />
      </span>

      <span className="card__label">
        <span className="card__name">{name}</span>

        {/* Always rendered: its reserved height stops the card resizing on reveal. */}
        <span className="card__weight">
          {weight && (
            <>
              <span className="card__weight-value">{weight.value}</span>
              <span className="card__weight-unit">{weight.suffix}</span>
            </>
          )}
        </span>
      </span>

      {revealed && (isHeavier || chosen) && (
        <span className="card__tag" data-variant={isHeavier ? 'heavier' : 'pick'}>
          {isHeavier ? t('game.heavier') : t('game.yourPick')}
        </span>
      )}
    </button>
  )
}
