import type { LanguageCode } from '../i18n/languages'
import { LOCALE_TAGS } from '../i18n/languages'

/**
 * Single source of truth for turning a canonical weight (grams) into something
 * a player can read. Nothing else in the app is allowed to convert weights.
 */
export const WEIGHT_UNITS = ['kg', 'lbs'] as const
export type WeightUnit = (typeof WEIGHT_UNITS)[number]

export const DEFAULT_WEIGHT_UNIT: WeightUnit = 'kg'

/** Deliberately the game's clean conversion, not the scientific 2.20462. */
export const KG_TO_LBS = 2.2

const GRAMS_PER_KG = 1000

/**
 * Canonical weights are whole grams, so a kilogram value has at most 3 decimals
 * and a pound value at most 4. Rounding at 6 decimals therefore only removes
 * binary floating point noise (506.00000000000006 -> 506); it never rounds away
 * a digit the conversion actually produced.
 */
const FLOAT_NOISE_DECIMALS = 6
const MAX_DISPLAY_DECIMALS = 6

function stripFloatNoise(value: number): number {
  return Number(value.toFixed(FLOAT_NOISE_DECIMALS))
}

export function gramsToKg(grams: number): number {
  return stripFloatNoise(grams / GRAMS_PER_KG)
}

export function gramsToLbs(grams: number): number {
  return stripFloatNoise((grams / GRAMS_PER_KG) * KG_TO_LBS)
}

function kgToGrams(kg: number): number {
  return stripFloatNoise(kg * GRAMS_PER_KG)
}

function lbsToGrams(lbs: number): number {
  return stripFloatNoise((lbs / KG_TO_LBS) * GRAMS_PER_KG)
}

/** The reverse of the display conversion — turns a player-entered value back into canonical grams. */
export function unitToGrams(value: number, unit: WeightUnit): number {
  return unit === 'lbs' ? lbsToGrams(value) : kgToGrams(value)
}

/** The suffix a formatted value carries, so the UI can style it separately. */
export type WeightSuffix = 'g' | 'kg' | 'lbs'

export interface FormattedWeight {
  /** Locale-formatted number, e.g. `4.500` in German or `4,500` in English. */
  value: string
  suffix: WeightSuffix
  /** Ready-to-render string, e.g. `230 kg`. */
  text: string
}

function formatNumber(value: number, language: LanguageCode): string {
  return new Intl.NumberFormat(LOCALE_TAGS[language], {
    maximumFractionDigits: MAX_DISPLAY_DECIMALS,
  }).format(value)
}

/**
 * Formats a canonical weight in the player's selected unit.
 *
 * In kilogram mode anything under 1 kg is shown in grams, which keeps a cherry
 * readable as `10 g` instead of `0.01 kg`. Pound mode has no such sub-unit, so
 * it always shows pounds with whatever decimals the 2.2 factor produces.
 */
export function formatWeight(
  grams: number,
  unit: WeightUnit,
  language: LanguageCode,
): FormattedWeight {
  const build = (value: number, suffix: WeightSuffix): FormattedWeight => {
    const formatted = formatNumber(value, language)
    return { value: formatted, suffix, text: `${formatted} ${suffix}` }
  }

  if (unit === 'lbs') return build(gramsToLbs(grams), 'lbs')
  if (grams < GRAMS_PER_KG) return build(stripFloatNoise(grams), 'g')
  return build(gramsToKg(grams), 'kg')
}
