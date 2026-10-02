import type { GameObject } from './types'

export const GUESS_QUESTIONS_PER_GAME = 8

export interface GuessQuestion {
  id: string
  object: GameObject
}

export type GuessGenerationFailure = {
  reason: 'not-enough-objects'
  available: number
  required: number
}

export type GuessGenerationResult =
  | { ok: true; questions: GuessQuestion[] }
  | { ok: false; error: GuessGenerationFailure }

/**
 * Builds a game's worth of single-object questions.
 *
 * Unlike the heavier/lighter mode there is no pairing rule to satisfy — any
 * object can be guessed on its own — so this only needs `count` distinct
 * objects, drawn uniformly by shuffling the whole list.
 */
export function generateGuessQuestions(
  objects: readonly GameObject[],
  count: number = GUESS_QUESTIONS_PER_GAME,
  random: () => number = Math.random,
): GuessGenerationResult {
  if (objects.length < count) {
    return {
      ok: false,
      error: { reason: 'not-enough-objects', available: objects.length, required: count },
    }
  }

  const chosen = shuffle(objects, random).slice(0, count)
  return {
    ok: true,
    questions: chosen.map((object, index) => ({ id: `${index}-${object.id}`, object })),
  }
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
