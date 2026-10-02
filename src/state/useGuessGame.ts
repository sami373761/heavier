import { useCallback, useMemo, useReducer } from 'react'
import { randomPoolObjects } from '../data/objects'
import { computeAccuracy, type AccuracyTier } from '../domain/guessAccuracy'
import {
  generateGuessQuestions,
  GUESS_QUESTIONS_PER_GAME,
  type GuessGenerationFailure,
  type GuessQuestion,
} from '../domain/guessQuestions'

export type GuessGamePhase = 'idle' | 'question' | 'revealed' | 'score' | 'error'

export interface GuessAnswer {
  questionId: string
  guessGrams: number
  actualGrams: number
  percentDiff: number
  tier: AccuracyTier
}

export interface GuessGameState {
  phase: GuessGamePhase
  questions: GuessQuestion[]
  questionIndex: number
  answers: GuessAnswer[]
  error: GuessGenerationFailure | null
}

type GuessGameAction =
  | { type: 'start' }
  | { type: 'answer'; guessGrams: number }
  | { type: 'advance' }
  | { type: 'goHome' }

const initialState: GuessGameState = {
  phase: 'idle',
  questions: [],
  questionIndex: 0,
  answers: [],
  error: null,
}

function startGame(): GuessGameState {
  // Same pool the heavier/lighter mode draws from — see `randomPoolObjects`.
  const result = generateGuessQuestions(randomPoolObjects(), GUESS_QUESTIONS_PER_GAME)
  if (!result.ok) return { ...initialState, phase: 'error', error: result.error }
  return {
    phase: 'question',
    questions: result.questions,
    questionIndex: 0,
    answers: [],
    error: null,
  }
}

function reducer(state: GuessGameState, action: GuessGameAction): GuessGameState {
  switch (action.type) {
    case 'start':
      return startGame()

    case 'answer': {
      if (state.phase !== 'question') return state
      const question = state.questions[state.questionIndex]
      if (!question) return state
      const actualGrams = question.object.weightGrams
      const { tier, percentDiff } = computeAccuracy(action.guessGrams, actualGrams)
      const answer: GuessAnswer = {
        questionId: question.id,
        guessGrams: action.guessGrams,
        actualGrams,
        percentDiff,
        tier,
      }
      return { ...state, phase: 'revealed', answers: [...state.answers, answer] }
    }

    case 'advance': {
      if (state.phase !== 'revealed') return state
      const next = state.questionIndex + 1
      if (next >= state.questions.length) return { ...state, phase: 'score' }
      return { ...state, phase: 'question', questionIndex: next }
    }

    case 'goHome':
      return initialState

    default:
      return state
  }
}

export interface GuessGameController {
  state: GuessGameState
  currentQuestion: GuessQuestion | null
  currentAnswer: GuessAnswer | null
  totalQuestions: number
  /**
   * Average of each answer's closeness (100 - percentDiff, floored at 0),
   * rounded to a whole percentage. Distinct from any one round's percentage
   * difference, which is what the per-round feedback card shows.
   */
  overallAccuracy: number
  start: () => void
  answer: (guessGrams: number) => void
  advance: () => void
  goHome: () => void
}

export function useGuessGame(): GuessGameController {
  const [state, dispatch] = useReducer(reducer, initialState)

  const currentQuestion = state.questions[state.questionIndex] ?? null
  const currentAnswer =
    state.phase === 'revealed' ? (state.answers[state.answers.length - 1] ?? null) : null
  const totalQuestions = state.questions.length || GUESS_QUESTIONS_PER_GAME

  const overallAccuracy = useMemo(() => {
    if (state.answers.length === 0) return 0
    const total = state.answers.reduce((sum, entry) => sum + Math.max(0, 100 - entry.percentDiff), 0)
    return Math.round(total / state.answers.length)
  }, [state.answers])

  return {
    state,
    currentQuestion,
    currentAnswer,
    totalQuestions,
    overallAccuracy,
    start: useCallback(() => dispatch({ type: 'start' }), []),
    answer: useCallback((guessGrams: number) => dispatch({ type: 'answer', guessGrams }), []),
    advance: useCallback(() => dispatch({ type: 'advance' }), []),
    goHome: useCallback(() => dispatch({ type: 'goHome' }), []),
  }
}
