import type { AccuracyTier } from './guessAccuracy'

/**
 * Turns a finished game into something worth pasting somewhere.
 *
 * The rule the whole shape follows is **spoiler-free**: a result names no
 * object and no weight, so posting it cannot ruin the game for whoever reads
 * it. All it carries is the shape of the run — one mark per round — plus the
 * score and a link, which is also why there is nothing here to store or send
 * anywhere. The text is built, handed to the clipboard, and forgotten.
 *
 * Pure string building on purpose: the score screens own the wording and the
 * localised number formatting, this owns the marks and the layout.
 */

/** The heavier/lighter mode: right or wrong, nothing in between. */
const CORRECT_MARK = '🟢'
const WRONG_MARK = '🔴'

/**
 * Guess the Weight grades in five bands, so it gets five marks rather than
 * two. Squares, where the other mode uses circles, which keeps the two modes
 * apart at a glance in a feed. The ramp runs green → black as the guess gets
 * worse, matching the order of `ACCURACY_TIERS` itself.
 */
const TIER_MARKS: Record<AccuracyTier, string> = {
  perfect: '🟩',
  veryGood: '🟨',
  good: '🟧',
  close: '🟥',
  far: '⬛',
}

export function correctnessMarks(answers: readonly { correct: boolean }[]): string {
  return answers.map((answer) => (answer.correct ? CORRECT_MARK : WRONG_MARK)).join('')
}

export function tierMarks(answers: readonly { tier: AccuracyTier }[]): string {
  return answers.map((answer) => TIER_MARKS[answer.tier]).join('')
}

/**
 * Three lines: what was played and how it went, the run itself, and where to
 * play it. Blank-safe — a run with no rounds simply has no middle line.
 */
export function buildShareText(headline: string, marks: string, url: string): string {
  return [headline, marks, url].filter(Boolean).join('\n')
}
