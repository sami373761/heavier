import { useI18n } from '../../i18n/I18nContext'
import type { GuessGenerationFailure } from '../../domain/guessQuestions'

/** Practically unreachable at 63+ objects, but handled the same way the heavier/lighter mode handles its own generation failure: a clear dead end, not a broken game. */
export function GuessErrorScreen({
  error,
  onRetry,
  onHome,
}: {
  error: GuessGenerationFailure | null
  onRetry: () => void
  onHome: () => void
}) {
  const { t } = useI18n()
  const message = error?.reason === 'not-enough-objects' ? t('guessError.notEnoughObjects') : t('error.noData')

  return (
    <section className="notice">
      <h1 className="notice__title">{t('error.title')}</h1>
      <p className="notice__message">{message}</p>
      <div className="notice__actions">
        <button type="button" className="button button--primary" onClick={onRetry}>
          {t('error.retry')}
        </button>
        <button type="button" className="button button--ghost" onClick={onHome}>
          {t('score.home')}
        </button>
      </div>
    </section>
  )
}
