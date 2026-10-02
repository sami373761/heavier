import { buildPairIndex, drawPair, pairKey, type PairIndex } from './pairing'
import type { GameObject, Question } from './types'

export const QUESTIONS_PER_GAME = 8

export type GenerationFailure =
  | { reason: 'no-valid-pairs' }
  | { reason: 'not-enough-pairs'; available: number; required: number }

export type GenerationResult =
  | { ok: true; questions: Question[] }
  | { ok: false; error: GenerationFailure }

/**
 * Attempts per question before the generator relaxes a preference or gives up.
 * Bounded on purpose: generation must never be able to spin forever, however
 * small or awkward the dataset is.
 */
const ATTEMPTS_PER_QUESTION = 24

/**
 * Builds a game's worth of questions.
 *
 * Pairs are drawn uniformly from the precomputed index rather than by guessing
 * object pairs and testing them afterwards, so every draw is valid by
 * construction and a sparse dataset cannot degrade into endless retries.
 *
 * Two soft preferences are applied in order, each with a bounded budget:
 * no repeated pair (hard — enforced for the whole run) and no object appearing
 * twice in one game (relaxed once the budget runs out).
 */
export function generateQuestions(
  objects: readonly GameObject[],
  count: number = QUESTIONS_PER_GAME,
  random: () => number = Math.random,
): GenerationResult {
  const index = buildPairIndex(objects)

  if (index.totalPairs === 0) return { ok: false, error: { reason: 'no-valid-pairs' } }
  if (index.totalPairs < count) {
    return {
      ok: false,
      error: { reason: 'not-enough-pairs', available: index.totalPairs, required: count },
    }
  }

  const questions: Question[] = []
  const usedPairs = new Set<string>()
  const usedObjects = new Set<string>()

  for (let position = 0; position < count; position += 1) {
    const picked = pickPair(index, random, usedPairs, usedObjects)
    if (!picked) {
      return {
        ok: false,
        error: { reason: 'not-enough-pairs', available: questions.length, required: count },
      }
    }

    const [lighter, heavier] = picked
    usedPairs.add(pairKey(lighter.id, heavier.id))
    usedObjects.add(lighter.id)
    usedObjects.add(heavier.id)

    // The heavier object must not always land on the same side.
    const heavierOnLeft = random() < 0.5
    questions.push({
      id: `${position}-${pairKey(lighter.id, heavier.id)}`,
      left: heavierOnLeft ? heavier : lighter,
      right: heavierOnLeft ? lighter : heavier,
    })
  }

  return { ok: true, questions }
}

function pickPair(
  index: PairIndex,
  random: () => number,
  usedPairs: Set<string>,
  usedObjects: Set<string>,
): [GameObject, GameObject] | null {
  let fallback: [GameObject, GameObject] | null = null

  for (let attempt = 0; attempt < ATTEMPTS_PER_QUESTION; attempt += 1) {
    const pair = drawPair(index, random)
    if (!pair) continue
    if (usedPairs.has(pairKey(pair[0].id, pair[1].id))) continue

    const reusesObject = usedObjects.has(pair[0].id) || usedObjects.has(pair[1].id)
    if (!reusesObject) return pair
    fallback ??= pair
  }

  // Random draws came up empty often enough that the remaining unused pairs are
  // likely scarce; fall back to a deterministic scan so a valid game is still
  // produced whenever one exists at all.
  return fallback ?? scanForUnusedPair(index, usedPairs)
}

function scanForUnusedPair(
  index: PairIndex,
  usedPairs: Set<string>,
): [GameObject, GameObject] | null {
  for (let i = 0; i < index.objects.length; i += 1) {
    for (let j = index.windowStart[i]; j <= index.windowEnd[i]; j += 1) {
      const lighter = index.objects[i]
      const heavier = index.objects[j]
      if (!usedPairs.has(pairKey(lighter.id, heavier.id))) return [lighter, heavier]
    }
  }
  return null
}

/** The side holding the heavier object. Always decided on canonical weights. */
export function heavierSide(question: Question): 'left' | 'right' {
  return question.left.weightGrams > question.right.weightGrams ? 'left' : 'right'
}
