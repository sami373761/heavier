import type { LanguageCode } from '../i18n/languages'

/**
 * The four categories the supplied dataset shipped with, keyed by their asset
 * folder. They are the ones the homepage has cards for and the ones with
 * translation keys.
 */
export const BUILT_IN_CATEGORY_IDS = ['animals', 'foods', 'stuff', 'vehicles'] as const
export type BuiltInCategoryId = (typeof BUILT_IN_CATEGORY_IDS)[number]

/**
 * A category id is a plain string rather than a union of the four above,
 * because categories can now be created at runtime through the admin panel: a
 * category invented after this file was compiled could not be a member of a
 * literal type. The registry in `src/data/categories.ts` is what decides which
 * ids actually exist.
 */
export type CategoryId = string

/**
 * A single playable object.
 *
 * `weightGrams` is the one canonical weight in the application: all gameplay
 * (pair validation, comparison, scoring) runs on it, and only the display layer
 * ever converts it to the unit the player picked.
 */
export interface GameObject {
  id: string
  weightGrams: number
  categoryId: CategoryId
  /** Asset path exactly as supplied by the dataset, e.g. `animals_svg/bear.svg`. */
  assetPath: string
  /**
   * Whether the object may be drawn by the two modes that pick from the whole
   * dataset — heavier/lighter and Guess the Weight. `false` keeps it to its own
   * category (its homepage card, and any future category game); it does not
   * hide the object or change its weight.
   *
   * `include_random` in items.json, and **true when the field is absent**: the
   * default has to be the inclusive one, or an entry written before the field
   * existed would silently vanish from both game modes.
   */
  includeRandom: boolean
  names: Partial<Record<LanguageCode, string>>
}

export interface Question {
  id: string
  left: GameObject
  right: GameObject
}

export type QuestionSide = 'left' | 'right'
