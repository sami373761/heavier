import rawItems from '../../items.json'
import type { CategoryId, GameObject } from '../domain/types'
import { LANGUAGE_CODES, type LanguageCode } from '../i18n/languages'
import { categoryFromAssetPath, categoryFromDatasetKey } from './categories'

/**
 * Loads the dataset into the shape the game uses.
 *
 * items.json is the source of truth and is never rewritten *here* — this module
 * only renames `weight` to `weightGrams` (to keep the canonical unit explicit
 * at every call site) and `include_random` to `includeRandom`, and attaches the
 * category implied by the asset folder.
 * The admin panel writes the file through `server/store.mjs`; the game only
 * ever reads it.
 *
 * The file is a **bundled import**, which is the whole of how the game gets its
 * data: Vite reads items.json at build time and the dataset is in the bundle
 * before any code runs. There is no boot request, so every reader of
 * `GAME_OBJECTS` stays synchronous and the game has nothing to wait for. An
 * edit made in the admin panel is published by the next `npm run build`.
 *
 * Validation is per-object: one malformed entry is dropped with a warning
 * rather than taking down the whole game.
 */
function parseObject(raw: unknown, index: number): GameObject | null {
  const reject = (problem: string) => {
    console.warn(`[weight-game] items.json entry ${index} skipped: ${problem}`)
    return null
  }

  if (typeof raw !== 'object' || raw === null) return reject('not an object')
  const item = raw as Record<string, unknown>

  const id = typeof item.id === 'string' ? item.id.trim() : ''
  if (!id) return reject('missing id')

  const weightGrams = item.weight
  if (typeof weightGrams !== 'number' || !Number.isFinite(weightGrams) || weightGrams <= 0) {
    return reject(`"${id}" has an invalid weight (${String(item.weight)})`)
  }

  const assetPath = typeof item.path === 'string' ? item.path.trim() : ''
  if (!assetPath) return reject(`"${id}" has no asset path`)

  // The dataset's `category` field is the source of truth; the asset folder is
  // only consulted when that field is missing or unrecognised. This is also
  // what lets the admin panel move an object between categories without moving
  // its SVG: the two disagree, and the field wins.
  const declaredCategory = typeof item.category === 'string' ? item.category.trim() : ''
  const categoryId =
    (declaredCategory ? categoryFromDatasetKey(declaredCategory) : null) ??
    categoryFromAssetPath(assetPath)
  if (!categoryId) {
    return reject(
      declaredCategory
        ? `"${id}" has an unknown category ("${declaredCategory}")`
        : `"${id}" has no category and an unknown asset folder (${assetPath})`,
    )
  }

  const rawNames = (typeof item.names === 'object' && item.names !== null ? item.names : {}) as
    Record<string, unknown>
  const names: Partial<Record<LanguageCode, string>> = {}
  for (const code of LANGUAGE_CODES) {
    const value = rawNames[code]
    if (typeof value === 'string' && value.trim()) names[code] = value.trim()
  }
  if (Object.keys(names).length === 0) return reject(`"${id}" has no usable name`)

  // Absent means true, and so does anything that is not literally `false`: the
  // flag only ever removes an object from the two whole-dataset modes, so the
  // safe reading of a missing or malformed value is the one that keeps playing.
  const includeRandom = item.include_random !== false

  return { id, weightGrams, categoryId, assetPath, includeRandom, names }
}

function loadObjects(rawList: unknown): GameObject[] {
  if (!Array.isArray(rawList)) {
    console.warn('[weight-game] items.json is not an array; no objects loaded')
    return []
  }

  const seen = new Set<string>()
  const objects: GameObject[] = []

  rawList.forEach((raw, index) => {
    const object = parseObject(raw, index)
    if (!object) return
    if (seen.has(object.id)) {
      console.warn(`[weight-game] duplicate id "${object.id}" skipped`)
      return
    }
    seen.add(object.id)
    objects.push(object)
  })

  return objects
}

/** Every valid object in the dataset. */
const objects: GameObject[] = loadObjects(rawItems)
export const GAME_OBJECTS: readonly GameObject[] = objects

/**
 * Every object belonging to one category, grouped so callers filter by lookup
 * rather than re-scanning the dataset on each render.
 */
const OBJECTS_BY_CATEGORY = new Map<CategoryId, GameObject[]>()

/**
 * The objects the two whole-dataset modes may draw from, i.e. those with
 * `include_random` true.
 */
const randomPool: GameObject[] = []

function regroup(): void {
  OBJECTS_BY_CATEGORY.clear()
  randomPool.length = 0
  for (const object of objects) {
    const bucket = OBJECTS_BY_CATEGORY.get(object.categoryId)
    if (bucket) bucket.push(object)
    else OBJECTS_BY_CATEGORY.set(object.categoryId, [object])
    if (object.includeRandom) randomPool.push(object)
  }
}

regroup()

export function getObjectById(id: string): GameObject | undefined {
  return GAME_OBJECTS.find((object) => object.id === id)
}

export function objectsInCategory(categoryId: CategoryId): readonly GameObject[] {
  return OBJECTS_BY_CATEGORY.get(categoryId) ?? []
}

/**
 * The pool both whole-dataset modes draw from: heavier/lighter question
 * generation and Guess the Weight. An object with `include_random: false` is
 * absent here but still present in `GAME_OBJECTS` and in `objectsInCategory`,
 * which is what keeps it on its own category's card.
 */
export function randomPoolObjects(): readonly GameObject[] {
  return randomPool
}
