import type { Answer } from '../state/useGame'

/**
 * One pip per round: filled green/red as answers come in, outlined for the
 * round in play, dim for rounds still ahead.
 */
export function ProgressPips({
  answers,
  total,
  currentIndex,
}: {
  answers: readonly Answer[]
  total: number
  currentIndex?: number
}) {
  return (
    <ol className="pips" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => {
        const answer = answers[index]
        const state = answer ? (answer.correct ? 'correct' : 'wrong') : index === currentIndex ? 'current' : 'upcoming'
        return <li key={index} className="pips__pip" data-state={state} />
      })}
    </ol>
  )
}
