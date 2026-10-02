import { useI18n } from '../../i18n/I18nContext'
import type { GenerationFailure } from '../../domain/questions'

/**
 * Shown when a game cannot be built — for example if the dataset shrinks below
 * the point where eight valid pairs exist. Better a clear dead end than an
 * invalid game or a generator that spins.
 */
export function ErrorScreen({
  error,
  onRetry,
  onHome,
}: {
  error: GenerationFailure | null
  onRetry: () => void
  onHome: () => void
}) {
  const { t } = useI18n()

  const message =
    error?.reason === 'no-valid-pairs'
      ? t('error.noPairs')
      : error?.reason === 'not-enough-pairs'
        ? t('error.notEnoughPairs')
        : t('error.noData')

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
