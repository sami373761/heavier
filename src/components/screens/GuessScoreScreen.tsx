import { GuessProgressPips } from '../GuessProgressPips'
import { ShareButton } from '../ShareButton'
import { TIER_LABEL_KEYS } from '../GuessFeedbackCard'
import { useI18n } from '../../i18n/I18nContext'
import { LOCALE_TAGS } from '../../i18n/languages'
import { currentOrigin, urlForLanguage } from '../../i18n/languageRoute'
import { buildShareText, tierMarks } from '../../domain/shareResult'
import { formatWeight } from '../../domain/units'
import { usePreferences } from '../../state/PreferencesContext'
import type { TranslationKey } from '../../i18n'
import type { GuessGameController } from '../../state/useGuessGame'

/** Same bands as the heavier/lighter score screen, applied to overall accuracy instead of a fraction. */
function headlineKey(accuracy: number): TranslationKey {
  if (accuracy >= 100) return 'score.headline.perfect'
  if (accuracy >= 75) return 'score.headline.great'
  if (accuracy >= 50) return 'score.headline.good'
  return 'score.headline.low'
}

export function GuessScoreScreen({
  game,
  onHome,
}: {
  game: GuessGameController
  onHome: () => void
}) {
  const { t, objectName, language } = useI18n()
  const { unit } = usePreferences()
  const { state, totalQuestions, overallAccuracy } = game
  const percentText = new Intl.NumberFormat(LOCALE_TAGS[language], { style: 'percent' }).format(
    overallAccuracy / 100,
  )

  // Named after the mode, so a shared guess result is not mistaken for a
  // heavier/lighter one — the marks differ too, but the line says it outright.
  const shareText = buildShareText(
    `${t('app.name')} · ${t('home.guessStart')} ${percentText}`,
    tierMarks(state.answers),
    urlForLanguage(language, currentOrigin()),
  )

  return (
    <section className="score">
      <p className="score__eyebrow">{t('guessScore.eyebrow')}</p>
      <h1 className="score__headline">{t(headlineKey(overallAccuracy))}</h1>

      <p className="score__fraction">
        <span className="score__correct">{percentText}</span>
      </p>
      <p className="score__detail">
        <span>{t('guessScore.accuracyLabel')}</span>
      </p>

      <GuessProgressPips answers={state.answers} total={totalQuestions} />

      <ol className="guess-results">
        {state.answers.map((answer, index) => {
          const question = state.questions[index]
          if (!question) return null
          const guess = formatWeight(answer.guessGrams, unit, language)
          const actual = formatWeight(answer.actualGrams, unit, language)

          return (
            <li key={answer.questionId} className="guess-results__row" data-tier={answer.tier}>
              <span className="guess-results__index">{index + 1}</span>
              <span className="guess-results__name">{objectName(question.object)}</span>
              <span className="guess-results__tag">{t(TIER_LABEL_KEYS[answer.tier])}</span>
              <span className="guess-results__values">
                <span>
                  {t('guess.yourGuess')}: {guess.text}
                </span>
                <span>
                  {t('guess.actualWeight')}: {actual.text}
                </span>
              </span>
            </li>
          )
        })}
      </ol>

      <div className="score__actions">
        <button type="button" className="button button--primary button--large" onClick={game.start}>
          {t('guessScore.playAgain')}
        </button>
        <ShareButton text={shareText} />
        <button type="button" className="button button--ghost" onClick={onHome}>
          {t('guessScore.home')}
        </button>
      </div>
    </section>
  )
}
