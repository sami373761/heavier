import { LANGUAGE_CODES, LANGUAGE_LABELS, type LanguageCode } from '../i18n/languages'

export type Names = Record<LanguageCode, string>

/** A blank set of names, one field per language the game speaks. */
export function emptyNames(): Names {
  return Object.fromEntries(LANGUAGE_CODES.map((code) => [code, ''])) as Names
}

/**
 * Fills in whatever names an existing entry has, leaving the rest blank so a
 * gap shows up as an empty required field rather than staying invisible.
 */
export function namesFrom(existing: Partial<Record<LanguageCode, string>>): Names {
  return Object.fromEntries(
    LANGUAGE_CODES.map((code) => [code, existing[code] ?? '']),
  ) as Names
}

/**
 * The five name inputs, shared by the object and category forms.
 *
 * All five are required. Translations are typed in by hand — there is no
 * translation service in the loop, by design — and a language left blank would
 * silently fall back to English for those players, which is exactly the kind of
 * gap nobody notices later.
 */
export function NameFields({
  names,
  onChange,
  disabled,
  idPrefix,
}: {
  names: Names
  onChange: (names: Names) => void
  disabled?: boolean
  idPrefix: string
}) {
  return (
    <fieldset className="admin-fieldset" disabled={disabled}>
      <legend className="admin-fieldset__legend">Names</legend>
      <div className="admin-grid">
        {LANGUAGE_CODES.map((code) => (
          <label className="admin-field" key={code} htmlFor={`${idPrefix}-${code}`}>
            <span className="admin-field__label">{LANGUAGE_LABELS[code]}</span>
            <input
              id={`${idPrefix}-${code}`}
              className="admin-field__input"
              type="text"
              required
              value={names[code]}
              onChange={(event) => onChange({ ...names, [code]: event.target.value })}
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
