import { useCallback, useMemo, useReducer } from 'react'
import { randomPoolObjects } from '../data/objects'
import {
  generateQuestions,
  heavierSide,
  QUESTIONS_PER_GAME,
  type GenerationFailure,
} from '../domain/questions'
import type { Question, QuestionSide } from '../domain/types'

export type GamePhase = 'home' | 'question' | 'revealed' | 'score' | 'error'

export interface Answer {
  questionId: string
  chosen: QuestionSide
  correct: boolean
}

export interface GameState {
  phase: GamePhase
  /** Identifies one play-through; attached to disputes as session context. */
  gameId: string
  questions: Question[]
  questionIndex: number
  answers: Answer[]
  error: GenerationFailure | null
}

type GameAction =
  | { type: 'start' }
  | { type: 'answer'; side: QuestionSide }
  | { type: 'advance' }
  | { type: 'goHome' }

const initialState: GameState = {
  phase: 'home',
  gameId: '',
  questions: [],
  questionIndex: 0,
  answers: [],
  error: null,
}

function createGameId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function startGame(): GameState {
  // The random pool, not the whole dataset: an object with `include_random`
  // false belongs to its category only.
  const result = generateQuestions(randomPoolObjects(), QUESTIONS_PER_GAME)
  if (!result.ok) return { ...initialState, phase: 'error', error: result.error }
  return {
    phase: 'question',
    gameId: createGameId(),
    questions: result.questions,
    questionIndex: 0,
    answers: [],
    error: null,
  }
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start':
      return startGame()

    case 'answer': {
      if (state.phase !== 'question') return state
      const question = state.questions[state.questionIndex]
      if (!question) return state
      const answer: Answer = {
        questionId: question.id,
        chosen: action.side,
        correct: action.side === heavierSide(question),
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

export interface GameController {
  state: GameState
  currentQuestion: Question | null
  currentAnswer: Answer | null
  correctCount: number
  totalQuestions: number
  /** Whole-number percentage of correct answers. */
  percentage: number
  start: () => void
  answer: (side: QuestionSide) => void
  advance: () => void
  goHome: () => void
}

export function useGame(): GameController {
  const [state, dispatch] = useReducer(reducer, initialState)

  const currentQuestion = state.questions[state.questionIndex] ?? null
  const currentAnswer =
    state.phase === 'revealed' ? (state.answers[state.answers.length - 1] ?? null) : null
  const correctCount = useMemo(
    () => state.answers.filter((entry) => entry.correct).length,
    [state.answers],
  )
  const totalQuestions = state.questions.length || QUESTIONS_PER_GAME
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  return {
    state,
    currentQuestion,
    currentAnswer,
    correctCount,
    totalQuestions,
    percentage,
    start: useCallback(() => dispatch({ type: 'start' }), []),
    answer: useCallback((side: QuestionSide) => dispatch({ type: 'answer', side }), []),
    advance: useCallback(() => dispatch({ type: 'advance' }), []),
    goHome: useCallback(() => dispatch({ type: 'goHome' }), []),
  }
}
