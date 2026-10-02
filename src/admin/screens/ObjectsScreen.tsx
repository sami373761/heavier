import { useMemo, useState, type FormEvent } from 'react'
import { ApiError, updateObject, type AdminCategory, type AdminItem } from '../api'
import { NameFields, namesFrom, type Names } from '../NameFields'
import { objectAssetUrl } from '../../data/assets'
import { formatWeight } from '../../domain/units'

/**
 * The object list, with one row expanding into an edit form.
 *
 * Weight, category, the random-modes flag and all five names are editable.
 * **The asset path is not**: it is shown, never sent, and the server carries it
 * over untouched. Moving an object between categories therefore leaves its SVG
 * where it was — which is fine, because `src/data/objects.ts` resolves an
 * object's category from the `category` field and only falls back to the folder
 * when that field is missing.
 */
export function ObjectsScreen({
  items,
  categories,
  onSaved,
  focusId,
}: {
  items: AdminItem[]
  categories: AdminCategory[]
  onSaved: () => void
  focusId?: string | undefined
}) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<string | null>(focusId ?? null)

  const categoryName = useMemo(
    () => new Map(categories.map((entry) => [entry.key, entry.names.eng ?? entry.key])),
    [categories],
  )

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matches = needle
      ? items.filter(
          (item) =>
            item.id.includes(needle) ||
            Object.values(item.names).some((name) => name?.toLowerCase().includes(needle)),
        )
      : items
    return [...matches].sort((a, b) => a.id.localeCompare(b.id))
  }, [items, query])

  return (
    <section className="admin-section">
      <h2 className="admin-section__title">Objects</h2>

      <label className="admin-field admin-field--inline" htmlFor="object-search">
        <span className="admin-field__label">Search</span>
        <input
          id="object-search"
          className="admin-field__input"
          type="search"
          placeholder="id or name in any language"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <p className="admin-note">
        {visible.length} of {items.length} objects
      </p>

      <ul className="admin-list">
        {visible.map((item) => (
          <li className="admin-list__item" key={item.id}>
            <div className="admin-row">
              {/* Artwork is bundled, so an SVG uploaded since the last build has
                  no URL yet and the thumbnail is simply left out rather than
                  rendered as a broken image. */}
              {objectAssetUrl(item.path) && (
                <img className="admin-row__art" src={objectAssetUrl(item.path)} alt="" />
              )}
              <div className="admin-row__main">
                <strong className="admin-row__name">{item.names.eng ?? item.id}</strong>
                <span className="admin-row__meta">
                  {item.id} · {categoryName.get(item.category) ?? item.category} ·{' '}
                  {formatWeight(item.weight, 'kg', 'eng').text}
                  {item.include_random === false ? ' · category only' : ''}
                </span>
              </div>
              <button
                className="admin-button"
                type="button"
                onClick={() => setEditing(editing === item.id ? null : item.id)}
                aria-expanded={editing === item.id}
              >
                {editing === item.id ? 'Close' : 'Edit'}
              </button>
            </div>

            {editing === item.id && (
              <EditForm
                key={item.id}
                item={item}
                categories={categories}
                onSaved={onSaved}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Mounted with `key={item.id}` so switching rows starts from that row's data. */
function EditForm({
  item,
  categories,
  onSaved,
}: {
  item: AdminItem
  categories: AdminCategory[]
  onSaved: () => void
}) {
  const [weight, setWeight] = useState(String(item.weight))
  const [category, setCategory] = useState(item.category)
  // Absent means true: an entry written before the field existed is in the
  // random modes, and the box has to show that rather than an unchecked lie.
  const [includeRandom, setIncludeRandom] = useState(item.include_random !== false)
  const [names, setNames] = useState<Names>(() => namesFrom(item.names))
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    setDone(false)
    try {
      await updateObject(item.id, {
        weight: Number(weight),
        category,
        include_random: includeRandom,
        names,
      })
      setDone(true)
      onSaved()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not save the changes.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="admin-form admin-form--nested" onSubmit={(event) => void submit(event)}>
      <div className="admin-grid">
        <label className="admin-field" htmlFor={`edit-weight-${item.id}`}>
          <span className="admin-field__label">Weight (grams)</span>
          <input
            id={`edit-weight-${item.id}`}
            className="admin-field__input"
            type="number"
            min="1"
            step="1"
            required
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </label>

        <label className="admin-field" htmlFor={`edit-category-${item.id}`}>
          <span className="admin-field__label">Category</span>
          <select
            id={`edit-category-${item.id}`}
            className="admin-field__input"
            required
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((entry) => (
              <option key={entry.key} value={entry.key}>
                {entry.names.eng ?? entry.key}
              </option>
            ))}
          </select>
        </label>

        <div className="admin-field">
          <span className="admin-field__label">Artwork</span>
          <output className="admin-field__static">{item.path}</output>
          <span className="admin-field__hint">
            Stays where it is, even if the category changes.
          </span>
        </div>
      </div>

      <NameFields names={names} onChange={setNames} disabled={busy} idPrefix={`edit-${item.id}`} />

      <label className="admin-check">
        <input
          type="checkbox"
          checked={includeRandom}
          disabled={busy}
          onChange={(event) => setIncludeRandom(event.target.checked)}
        />
        <span>
          Include in the random modes
          <span className="admin-field__hint">
            Off keeps {item.names.eng ?? item.id} out of Heavier/Lighter and Guess the Weight; it
            stays in its own category.
          </span>
        </span>
      </label>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {done && !error && (
        <p className="admin-ok" role="status">
          Saved.
        </p>
      )}

      <button className="admin-button admin-button--primary" type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
