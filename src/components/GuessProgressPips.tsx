import type { GuessAnswer } from '../state/useGuessGame'

/**
 * The heavier/lighter mode's pips are binary (correct/wrong); a guess has five
 * possible tiers, so each answered pip is coloured by `data-tier` instead of
 * `data-state`, on the same `.pips`/`.pips__pip` classes.
 */
export function GuessProgressPips({
  answers,
  total,
  currentIndex,
}: {
  answers: readonly GuessAnswer[]
  total: number
  currentIndex?: number
}) {
  return (
    <ol className="pips" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => {
        const answer = answers[index]
        if (answer) return <li key={index} className="pips__pip" data-tier={answer.tier} />
        const state = index === currentIndex ? 'current' : 'upcoming'
        return <li key={index} className="pips__pip" data-state={state} />
      })}
    </ol>
  )
}
