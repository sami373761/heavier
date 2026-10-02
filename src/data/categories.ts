import rawCategories from '../../data/categories.json'
import type { CategoryId } from '../domain/types'
import type { TranslationKey } from '../i18n'
import { DEFAULT_LANGUAGE, LANGUAGE_CODES, type LanguageCode } from '../i18n/languages'

/**
 * Each object's category comes from its `category` field in items.json. The
 * asset folder it lives in carries the same information and stays available as a
 * fallback, so an entry written before the field existed still loads.
 *
 * Keeping categories as real data (rather than inferring them ad hoc in
 * components) is what the homepage cards read, and what a future category quiz
 * mode would build on.
 *
 * Since the admin panel can create categories, this is a **registry** rather
 * than a constant: the four supplied categories are the seed, and
 * `data/categories.json` — the file the panel writes — is loaded over the top
 * of them. That load is a plain bundled import, resolved by Vite at build
 * time: there is no boot request and no server involved in reading it, so the
 * registry is complete before the first line of app code runs.
 */
export interface Category {
  id: CategoryId
  /** Value of the object's `category` field in items.json. */
  datasetKey: string
  /** Asset folder in `svg_files/`, as it appears in the dataset's `path`. */
  folder: string
  /**
   * Only the four supplied categories have one. A category created through the
   * admin panel carries `names` instead — a locale file cannot gain a key at
   * runtime.
   */
  labelKey?: TranslationKey
  /** Five-language names, entered in the admin panel. */
  names?: Partial<Record<LanguageCode, string>>
  /**
   * Whether this category gets a card on the homepage. Owned by the admin
   * panel and stored in `data/categories.json`; it has no effect on gameplay,
   * because question generation only compares weights and never looks at a
   * category at all.
   */
  showOnHome: boolean
}

/**
 * The supplied four, with the irregular folder names they actually use
 * (`animal` → `animals_svg` and `food` → `foods_svg` are pluralised, `vehicle`
 * → `vehicle_svg` is not), so no naming convention can stand in for this table.
 * Categories created later do follow `${key}_svg`.
 */
const BUILT_INS: readonly Category[] = [
  { id: 'animals', datasetKey: 'animal', folder: 'animals_svg', labelKey: 'category.animals', showOnHome: true },
  { id: 'foods', datasetKey: 'food', folder: 'foods_svg', labelKey: 'category.foods', showOnHome: true },
  { id: 'stuff', datasetKey: 'stuff', folder: 'stuff_svg', labelKey: 'category.stuff', showOnHome: true },
  { id: 'vehicles', datasetKey: 'vehicle', folder: 'vehicle_svg', labelKey: 'category.vehicles', showOnHome: true },
]

const registry: Category[] = BUILT_INS.map((category) => ({ ...category }))

/** Every category the dataset knows about. */
export const CATEGORIES: readonly Category[] = registry

/**
 * The categories the homepage has cards for, in registry order.
 *
 * A function rather than a constant, because the answer is not known until
 * `hydrateCategories` has run: the flag lives in `data/categories.json` and
 * arrives with the dataset at boot. Hiding a category only removes its card —
 * its objects stay in the question pool, since `generateQuestions` never looks
 * at a category.
 */
export function homepageCategories(): readonly Category[] {
  return registry.filter((category) => category.showOnHome)
}

const CATEGORY_BY_FOLDER = new Map<string, Category>()
const CATEGORY_BY_DATASET_KEY = new Map<string, Category>()

function reindex(): void {
  CATEGORY_BY_FOLDER.clear()
  CATEGORY_BY_DATASET_KEY.clear()
  for (const category of registry) {
    CATEGORY_BY_FOLDER.set(category.folder, category)
    CATEGORY_BY_DATASET_KEY.set(category.datasetKey, category)
  }
}

reindex()

/**
 * Lays `data/categories.json` over the seed.
 *
 * A supplied category keeps its existing id and translation key so nothing that
 * already references `animals` changes meaning; a category created in the admin
 * panel is identified by its own key. The four are re-added if the file somehow
 * omits them, because losing one would orphan every object in it.
 *
 * Internal and called once below, at module load. Nothing else may replace the
 * registry at runtime: `src/data/objects.ts` resolves each object's category
 * through the maps this builds, and it imports this module, so the registry is
 * guaranteed to be filled before a single object is parsed.
 */
function hydrateCategories(raw: unknown): void {
  if (!Array.isArray(raw)) return

  const next: Category[] = []
  const seen = new Set<string>()

  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue
    const record = entry as Record<string, unknown>
    const key = typeof record.key === 'string' ? record.key.trim() : ''
    if (!key || seen.has(key)) continue
    seen.add(key)

    const builtIn = BUILT_INS.find((category) => category.datasetKey === key)
    const folder =
      typeof record.folder === 'string' && record.folder.trim()
        ? record.folder.trim()
        : (builtIn?.folder ?? `${key}_svg`)

    const names: Partial<Record<LanguageCode, string>> = {}
    const rawNames = (
      typeof record.names === 'object' && record.names !== null ? record.names : {}
    ) as Record<string, unknown>
    for (const code of LANGUAGE_CODES) {
      const value = rawNames[code]
      if (typeof value === 'string' && value.trim()) names[code] = value.trim()
    }

    // A payload written before the flag existed defaults the supplied four to
    // true and everything else to false, matching what the server does — the
    // homepage must look the same before and after this field arrived.
    const showOnHome =
      typeof record.showOnHome === 'boolean' ? record.showOnHome : builtIn !== undefined

    next.push({
      id: builtIn?.id ?? key,
      datasetKey: key,
      folder,
      ...(builtIn?.labelKey ? { labelKey: builtIn.labelKey } : {}),
      names,
      showOnHome,
    })
  }

  for (const builtIn of BUILT_INS) {
    if (!seen.has(builtIn.datasetKey)) next.push({ ...builtIn })
  }

  registry.splice(0, registry.length, ...next)
  reindex()
}

hydrateCategories(rawCategories)

/** Resolves a dataset `category` value (`"animal"`, `"food"`, ...). */
export function categoryFromDatasetKey(value: string): CategoryId | null {
  return CATEGORY_BY_DATASET_KEY.get(value)?.id ?? null
}

export function categoryFromAssetPath(assetPath: string): CategoryId | null {
  const folder = assetPath.split('/')[0]
  return CATEGORY_BY_FOLDER.get(folder)?.id ?? null
}

export function getCategory(id: CategoryId): Category | undefined {
  return CATEGORIES.find((category) => category.id === id)
}

/**
 * The name to show for a category: its translation for the supplied four, its
 * own five-language names for one created in the panel, and its key as the last
 * resort so a label never renders as `undefined`.
 */
export function categoryLabel(
  category: Category,
  translate: (key: TranslationKey) => string,
  language: LanguageCode,
): string {
  if (category.labelKey) return translate(category.labelKey)
  return (
    category.names?.[language]?.trim() ||
    category.names?.[DEFAULT_LANGUAGE]?.trim() ||
    category.datasetKey
  )
}
