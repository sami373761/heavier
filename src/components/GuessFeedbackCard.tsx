import { useMemo } from 'react'
import { ArrowDownIcon, ArrowUpIcon, SparkleIcon } from './icons'
import { useI18n } from '../i18n/I18nContext'
import { LOCALE_TAGS } from '../i18n/languages'
import { formatWeight, type WeightUnit } from '../domain/units'
import type { AccuracyTier } from '../domain/guessAccuracy'
import type { GuessAnswer } from '../state/useGuessGame'
import type { TranslationKey } from '../i18n'

/** Shared with the results list on the score screen, so a tier reads the same word everywhere. */
export const TIER_LABEL_KEYS: Record<AccuracyTier, TranslationKey> = {
  perfect: 'guess.tier.perfect',
  veryGood: 'guess.tier.veryGood',
  good: 'guess.tier.good',
  close: 'guess.tier.close',
  far: 'guess.tier.far',
}

/**
 * A guess that lands on the exact gram gets one of these instead of the usual
 * "Perfect" label — still the `perfect` tier everywhere else (pips, the score
 * list), so nothing about tiers, ranges or scoring changes; only this card's
 * own label and styling react to the exact match.
 */
const EXACT_LABEL_KEYS: readonly TranslationKey[] = ['guess.exact.bullseye', 'guess.exact.spotOn']

/**
 * The result of one round: tier, percentage difference, and the guess next to
 * the actual weight. `data-tier` drives every colour on the card — see the
 * `--tier-*` custom properties in global.css. An exact match additionally sets
 * `data-exact`, which swaps in the celebratory gradient and animation.
 */
export function GuessFeedbackCard({ answer, unit }: { answer: GuessAnswer; unit: WeightUnit }) {
  const { t, language } = useI18n()
  const guess = formatWeight(answer.guessGrams, unit, language)
  const actual = formatWeight(answer.actualGrams, unit, language)
  const percentText = new Intl.NumberFormat(LOCALE_TAGS[language], {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(answer.percentDiff / 100)

  const isExact = answer.percentDiff === 0
  // Picked once per round, not on every re-render.
  const exactLabelKey = useMemo(
    () => EXACT_LABEL_KEYS[Math.floor(Math.random() * EXACT_LABEL_KEYS.length)]!,
    [answer.questionId],
  )

  const guessedHigh = answer.guessGrams > answer.actualGrams
  const guessedLow = answer.guessGrams < answer.actualGrams

  return (
    <div className="guess-feedback" data-tier={answer.tier} data-exact={isExact || undefined} role="status">
      <p className="guess-feedback__label">
        {isExact && <SparkleIcon />}
        <span>{isExact ? t(exactLabelKey) : t(TIER_LABEL_KEYS[answer.tier])}</span>
        {isExact && <SparkleIcon />}
      </p>
      <p className="guess-feedback__percent">{t('guess.percentOff', { percent: percentText })}</p>

      <dl className="guess-feedback__rows">
        <div className="guess-feedback__row">
          <dt>{t('guess.yourGuess')}</dt>
          <dd>
            {guessedHigh && <ArrowDownIcon />}
            {guessedLow && <ArrowUpIcon />}
            <span>{guess.text}</span>
          </dd>
        </div>
        <div className="guess-feedback__row">
          <dt>{t('guess.actualWeight')}</dt>
          <dd>{actual.text}</dd>
        </div>
      </dl>
    </div>
  )
}
