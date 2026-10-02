import { ProgressPips } from '../ProgressPips'
import { ShareButton } from '../ShareButton'
import { useI18n } from '../../i18n/I18nContext'
import { LOCALE_TAGS } from '../../i18n/languages'
import { currentOrigin, urlForLanguage } from '../../i18n/languageRoute'
import { buildShareText, correctnessMarks } from '../../domain/shareResult'
import type { TranslationKey } from '../../i18n'
import type { GameController } from '../../state/useGame'

/** Headline bands. Flavour text only — the score itself is just correct/total. */
function headlineKey(percentage: number): TranslationKey {
  if (percentage === 100) return 'score.headline.perfect'
  if (percentage >= 75) return 'score.headline.great'
  if (percentage >= 50) return 'score.headline.good'
  return 'score.headline.low'
}

export function ScoreScreen({ game, onHome }: { game: GameController; onHome: () => void }) {
  const { t, language } = useI18n()
  const { correctCount, totalQuestions, percentage, state } = game
  const percentText = new Intl.NumberFormat(LOCALE_TAGS[language], { style: 'percent' }).format(
    percentage / 100,
  )

  // The link points at this player's own language, and at its root rather than
  // wherever they happen to be standing — whoever opens it should get the game,
  // in the language the result was played in.
  const shareText = buildShareText(
    `${t('app.name')} ${correctCount}/${totalQuestions}`,
    correctnessMarks(state.answers),
    urlForLanguage(language, currentOrigin()),
  )

  return (
    <section className="score">
      <p className="score__eyebrow">{t('score.eyebrow')}</p>
      <h1 className="score__headline">{t(headlineKey(percentage))}</h1>

      <p className="score__fraction">
        <span className="score__correct">{correctCount}</span>
        <span className="score__slash">/</span>
        <span className="score__total">{totalQuestions}</span>
      </p>

      <p className="score__detail">
        <span>{t('score.correctOf', { correct: correctCount, total: totalQuestions })}</span>
        <span className="score__percent">{percentText}</span>
      </p>

      <ProgressPips answers={state.answers} total={totalQuestions} />

      <div className="score__actions">
        <button type="button" className="button button--primary button--large" onClick={game.start}>
          {t('score.playAgain')}
        </button>
        <ShareButton text={shareText} />
        <button type="button" className="button button--ghost" onClick={onHome}>
          {t('score.home')}
        </button>
      </div>
    </section>
  )
}
