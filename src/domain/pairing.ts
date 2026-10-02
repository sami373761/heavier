import type { GameObject } from './types'

/**
 * Core gameplay rule: the two objects in a question must be close in weight, so
 * the player has to actually estimate rather than spot an obvious mismatch. The
 * heavier object may be at most 54% heavier than the lighter one; an exact 1.54x
 * difference is valid.
 *
 * Only one bound is needed: the ratio below is always computed heavier/lighter,
 * so `<= 1.54` is the same constraint as the mirrored lower bound of ~0.65x.
 */
export const MAX_WEIGHT_RATIO = 1.54

/**
 * Objects of exactly equal weight are excluded: "which is heavier" has no
 * correct answer for them. The dataset currently contains four such pairs
 * (bandicoot/turtle, squid-animal/cooking-pot, gazelle/lamb, sea-lion/tapir).
 */
export function isValidPair(a: GameObject, b: GameObject): boolean {
  if (a.id === b.id) return false
  if (a.weightGrams <= 0 || b.weightGrams <= 0) return false
  if (a.weightGrams === b.weightGrams) return false
  const ratio = Math.max(a.weightGrams, b.weightGrams) / Math.min(a.weightGrams, b.weightGrams)
  return ratio <= MAX_WEIGHT_RATIO
}

/**
 * Precomputed view of every valid pair in the dataset.
 *
 * Objects are sorted by weight, which turns "all valid partners of object i"
 * into a contiguous window `[windowStart[i], windowEnd[i]]` of strictly heavier
 * objects. Each unordered pair is therefore owned by exactly one index — its
 * lighter member — and `cumulativePairs` lets us draw a uniformly random pair
 * without ever materialising the full pair list. Building is O(n log n) and the
 * index stays O(n) in memory no matter how large the dataset grows.
 */
export interface PairIndex {
  objects: GameObject[]
  windowStart: Int32Array
  windowEnd: Int32Array
  /** cumulativePairs[i] = number of valid pairs owned by objects 0..i-1. */
  cumulativePairs: Float64Array
  totalPairs: number
}

export function buildPairIndex(objects: readonly GameObject[]): PairIndex {
  const sorted = [...objects]
    .filter((object) => object.weightGrams > 0)
    .sort((a, b) => a.weightGrams - b.weightGrams || a.id.localeCompare(b.id))

  const size = sorted.length
  const windowStart = new Int32Array(size)
  const windowEnd = new Int32Array(size)
  const cumulativePairs = new Float64Array(size + 1)

  // Both window edges only ever move forward, so a single pass covers every
  // object: two pointers rather than a binary search per element.
  let start = 0
  let end = -1
  let total = 0

  for (let i = 0; i < size; i += 1) {
    const weight = sorted[i].weightGrams
    const ceiling = weight * MAX_WEIGHT_RATIO

    if (start < i + 1) start = i + 1
    while (start < size && sorted[start].weightGrams === weight) start += 1
    if (end < start - 1) end = start - 1
    while (end + 1 < size && sorted[end + 1].weightGrams <= ceiling) end += 1

    windowStart[i] = start
    windowEnd[i] = end
    const count = Math.max(0, end - start + 1)
    cumulativePairs[i] = total
    total += count
  }

  cumulativePairs[size] = total
  return { objects: sorted, windowStart, windowEnd, cumulativePairs, totalPairs: total }
}

/** Stable key for a pair, independent of which object is shown on which side. */
export function pairKey(aId: string, bId: string): string {
  return aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`
}

/**
 * Draws one valid pair uniformly at random from every pair in the index.
 * Returns the lighter object first.
 */
export function drawPair(
  index: PairIndex,
  random: () => number,
): [GameObject, GameObject] | null {
  if (index.totalPairs === 0) return null

  const target = Math.floor(random() * index.totalPairs)

  // Binary search for the object that owns the target pair.
  let low = 0
  let high = index.objects.length - 1
  while (low < high) {
    const middle = (low + high + 1) >> 1
    if (index.cumulativePairs[middle] <= target) low = middle
    else high = middle - 1
  }

  const partner = index.windowStart[low] + (target - index.cumulativePairs[low])
  if (partner > index.windowEnd[low]) return null
  return [index.objects[low], index.objects[partner]]
}
