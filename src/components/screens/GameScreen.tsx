import { DisputeFlow } from '../DisputeFlow'
import { ObjectCard } from '../ObjectCard'
import { ProgressPips } from '../ProgressPips'
import { ArrowRightIcon } from '../icons'
import { useI18n } from '../../i18n/I18nContext'
import { heavierSide } from '../../domain/questions'
import { useGameKeys } from '../../state/useGameKeys'
import type { GameController } from '../../state/useGame'

export function GameScreen({ game }: { game: GameController }) {
  const { t } = useI18n()
  const { state, currentQuestion, currentAnswer, totalQuestions } = game
  const revealed = state.phase === 'revealed'

  // Keyboard play: a side while the question is open, "next" once it is not.
  // Hooks run before the early return below, so they cannot be made
  // conditional on there being a question — the handlers are instead.
  useGameKeys({
    onLeft: revealed || !currentQuestion ? undefined : () => game.answer('left'),
    onRight: revealed || !currentQuestion ? undefined : () => game.answer('right'),
    onAdvance: revealed ? game.advance : undefined,
  })

  if (!currentQuestion) return null

  const winner = heavierSide(currentQuestion)
  const isLastRound = state.questionIndex === totalQuestions - 1

  return (
    <section className="game">
      <div className="game__bar">
        <p className="game__round">
          <span className="game__round-label">{t('game.round')}</span>
          <span className="game__round-count">
            {state.questionIndex + 1}
            <span className="game__round-total">/{totalQuestions}</span>
          </span>
        </p>
        <ProgressPips
          answers={state.answers}
          total={totalQuestions}
          currentIndex={state.questionIndex}
        />
      </div>

      <h1
        className="game__prompt"
        data-result={revealed && currentAnswer ? (currentAnswer.correct ? 'correct' : 'wrong') : undefined}
        aria-live="polite"
      >
        {revealed && currentAnswer
          ? currentAnswer.correct
            ? t('game.correct')
            : t('game.wrong')
          : t('game.prompt')}
      </h1>

      <div className="arena" data-revealed={revealed || undefined}>
        <ObjectCard
          object={currentQuestion.left}
          revealed={revealed}
          chosen={currentAnswer?.chosen === 'left'}
          isHeavier={winner === 'left'}
          onChoose={() => game.answer('left')}
        />

        <div className="arena__divider" data-point={revealed ? winner : undefined}>
          <span className="arena__badge">
            {revealed ? <ArrowRightIcon /> : <span className="arena__vs">vs</span>}
          </span>
        </div>

        <ObjectCard
          object={currentQuestion.right}
          revealed={revealed}
          chosen={currentAnswer?.chosen === 'right'}
          isHeavier={winner === 'right'}
          onChoose={() => game.answer('right')}
        />
      </div>

      <div className="game__foot" data-revealed={revealed || undefined}>
        {revealed && (
          <>
            <button type="button" className="button button--primary" onClick={game.advance}>
              {isLastRound ? t('game.finish') : t('game.next')}
            </button>
            <DisputeFlow key={currentQuestion.id} question={currentQuestion} gameId={state.gameId} />
          </>
        )}
      </div>
    </section>
  )
}
