/**
 * Scoring rule for the Guess the Weight mode, independent of the
 * heavier/lighter game entirely: a single guess is graded against the actual
 * weight by absolute percentage difference, bucketed into five tiers.
 */
export const ACCURACY_TIERS = ['perfect', 'veryGood', 'good', 'close', 'far'] as const
export type AccuracyTier = (typeof ACCURACY_TIERS)[number]

export interface AccuracyResult {
  tier: AccuracyTier
  /** Absolute percentage difference between the guess and the actual weight. */
  percentDiff: number
}

/** Boundaries are upper-inclusive: exactly 5% is still Perfect, exactly 30% is still Close. */
function tierFor(percentDiff: number): AccuracyTier {
  if (percentDiff <= 5) return 'perfect'
  if (percentDiff <= 10) return 'veryGood'
  if (percentDiff <= 20) return 'good'
  if (percentDiff <= 30) return 'close'
  return 'far'
}

export function computeAccuracy(guessGrams: number, actualGrams: number): AccuracyResult {
  const percentDiff = actualGrams > 0 ? (Math.abs(guessGrams - actualGrams) / actualGrams) * 100 : 0
  return { tier: tierFor(percentDiff), percentDiff }
}
