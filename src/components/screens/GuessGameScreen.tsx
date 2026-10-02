import { useState, type FormEvent } from 'react'
import { GuessFeedbackCard } from '../GuessFeedbackCard'
import { GuessProgressPips } from '../GuessProgressPips'
import { ObjectImage } from '../ObjectImage'
import { useI18n } from '../../i18n/I18nContext'
import { usePreferences } from '../../state/PreferencesContext'
import { useGameKeys } from '../../state/useGameKeys'
import { unitToGrams, type WeightUnit } from '../../domain/units'
import type { GuessGameController } from '../../state/useGuessGame'

/**
 * Mounted with `key={question.id}` by the parent so its input resets between
 * rounds instead of carrying the previous guess over.
 */
function GuessInputForm({
  unit,
  onSubmit,
}: {
  unit: WeightUnit
  onSubmit: (guessGrams: number) => void
}) {
  const { t } = useI18n()
  const [value, setValue] = useState('')
  const parsed = Number(value)
  const isValid = value.trim() !== '' && Number.isFinite(parsed) && parsed > 0

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isValid) return
    onSubmit(unitToGrams(parsed, unit))
  }

  return (
    <form className="guess__form" onSubmit={handleSubmit}>
      <label className="guess__input-group">
        <input
          className="guess__input"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t('guess.inputLabel')}
          aria-label={t('guess.a11yInput')}
        />
        <span className="guess__input-unit">{unit}</span>
      </label>
      <button type="submit" className="button button--primary button--large" disabled={!isValid}>
        {t('guess.submit')}
      </button>
    </form>
  )
}

export function GuessGameScreen({ game }: { game: GuessGameController }) {
  const { t, objectName } = useI18n()
  const { unit } = usePreferences()
  const { state, currentQuestion, currentAnswer, totalQuestions } = game
  const revealed = state.phase === 'revealed'

  // Only the advance key here: there are no sides to pick, and while the
  // question is open Enter belongs to the guess field, which the hook leaves
  // alone because its target is an input.
  useGameKeys({ onAdvance: revealed ? game.advance : undefined })

  if (!currentQuestion) return null

  const isLastRound = state.questionIndex === totalQuestions - 1

  return (
    <section className="guess">
      <div className="guess__bar">
        <p className="game__round">
          <span>{t('game.round')}</span>
          <span className="game__round-count">
            {state.questionIndex + 1}
            <span className="game__round-total">/{totalQuestions}</span>
          </span>
        </p>
        <GuessProgressPips
          answers={state.answers}
          total={totalQuestions}
          currentIndex={state.questionIndex}
        />
      </div>

      <h1 className="guess__prompt">{t('guess.prompt')}</h1>

      {/* The panel and the label it names travel together: on a wide screen they
          are the whole left column, beside the prompt and the guess. */}
      <div className="guess__object">
        <div className="guess__stage" data-revealed={revealed || undefined}>
          <ObjectImage object={currentQuestion.object} />
        </div>
        <p className="guess__name">{objectName(currentQuestion.object)}</p>
      </div>

      {!revealed && <GuessInputForm key={currentQuestion.id} unit={unit} onSubmit={game.answer} />}
      {revealed && currentAnswer && <GuessFeedbackCard answer={currentAnswer} unit={unit} />}

      <div className="guess__foot" data-revealed={revealed || undefined}>
        {revealed && (
          <button type="button" className="button button--primary" onClick={game.advance}>
            {isLastRound ? t('guess.finish') : t('guess.next')}
          </button>
        )}
      </div>
    </section>
  )
}
