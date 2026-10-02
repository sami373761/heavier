import type { GameObject } from './types'

/**
 * Picks the two objects a category card shows on its mini scale.
 *
 * These cards are visual discovery, not gameplay: the pair is drawn from the
 * category alone and deliberately ignores the question generator's weight-ratio
 * rule, which would leave three of the four categories with a single possible
 * pairing and therefore a card that never varies. The scale still reads honestly
 * because `BalanceScale` tips toward whichever object is actually heavier.
 *
 * Returns null for a category too small to fill both pans.
 */
export function pickPreviewPair(
  objects: readonly GameObject[],
  random: () => number = Math.random,
): [GameObject, GameObject] | null {
  if (objects.length < 2) return null

  // Clamped so a `random` that can return exactly 1 cannot index past the end.
  const index = (size: number) => Math.min(size - 1, Math.max(0, Math.floor(random() * size)))

  const first = index(objects.length)
  // Draw the partner from the remaining objects, then shift past `first` so the
  // two are always distinct without retrying.
  let second = index(objects.length - 1)
  if (second >= first) second += 1

  return [objects[first], objects[second]]
}
