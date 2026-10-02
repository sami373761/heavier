import { useState, type FormEvent } from 'react'
import {
  ApiError,
  createCategory,
  setCategoryVisibility,
  type AdminCategory,
  type AdminItem,
} from '../api'
import { NameFields, emptyNames, type Names } from '../NameFields'

/**
 * Categories: which ones the homepage shows, and the form that creates one.
 *
 * Creating `guns` writes the category to `data/categories.json` and creates
 * `svg_files/guns_svg/` in the same step, so the folder exists before the first
 * object needs it. The `${key}_svg` convention applies to new categories only:
 * the four supplied ones have irregular folder names (`animal` → `animals_svg`,
 * but `vehicle` → `vehicle_svg`) and keep them.
 *
 * A category cannot be renamed or removed here. Both would have to rewrite
 * every object that points at it, and there is no undo in this project.
 */
export function CategoriesScreen({
  categories,
  items,
  onCreated,
  onChanged,
}: {
  categories: AdminCategory[]
  items: AdminItem[]
  onCreated: () => void
  onChanged: () => void
}) {
  const [key, setKey] = useState('')
  const [names, setNames] = useState<Names>(emptyNames)
  const [showOnHome, setShowOnHome] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const normalizedKey = key.trim().toLowerCase()
  const featured = categories.filter((category) => category.showOnHome).length

  function countIn(categoryKey: string): number {
    return items.filter((item) => item.category === categoryKey).length
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      const { category } = await createCategory(normalizedKey, names, showOnHome)
      setDone(
        `Created "${category.key}" and the folder ${category.folder}.` +
          (category.showOnHome ? '' : ' It is hidden from the homepage until you switch it on.'),
      )
      setKey('')
      setNames(emptyNames())
      setShowOnHome(false)
      onCreated()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not create the category.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-section">
      <h2 className="admin-section__title">Categories</h2>

      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Key</th>
            <th scope="col">English</th>
            <th scope="col">Folder</th>
            <th scope="col" className="admin-table__number">
              Objects
            </th>
            <th scope="col">Show on homepage</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.key}>
              <td>
                <code>{category.key}</code>
              </td>
              <td>{category.names.eng ?? '—'}</td>
              <td>
                <code>{category.folder}</code>
              </td>
              <td className="admin-table__number">{countIn(category.key)}</td>
              <td>
                <VisibilityToggle
                  category={category}
                  objectCount={countIn(category.key)}
                  onChanged={onChanged}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="admin-note">
        {featured === 0
          ? 'No categories are shown on the homepage, so the whole section is hidden there.'
          : `${featured} of ${categories.length} categories have a homepage card.`}{' '}
        Hiding a category only removes its card — its objects stay in the question pool, because
        question generation compares weights and never looks at a category.
      </p>

      <h3 className="admin-section__subtitle">Add a category</h3>

      <form className="admin-form" onSubmit={(event) => void submit(event)}>
        <label className="admin-field" htmlFor="category-key">
          <span className="admin-field__label">Key</span>
          <input
            id="category-key"
            className="admin-field__input"
            type="text"
            required
            pattern="[a-zA-Z0-9][a-zA-Z0-9-]*"
            placeholder="guns"
            value={key}
            onChange={(event) => setKey(event.target.value)}
          />
          <span className="admin-field__hint">
            Artwork will be stored in {normalizedKey ? `${normalizedKey}_svg` : '<key>_svg'}.
          </span>
        </label>

        <NameFields names={names} onChange={setNames} disabled={busy} idPrefix="category-name" />

        <label className="admin-check">
          <input
            type="checkbox"
            checked={showOnHome}
            disabled={busy}
            onChange={(event) => setShowOnHome(event.target.checked)}
          />
          <span>
            Show on homepage straight away
            <span className="admin-field__hint">
              A card needs two objects to draw its balance, so this usually waits until you have
              added some.
            </span>
          </span>
        </label>

        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        {done && (
          <p className="admin-ok" role="status">
            {done}
          </p>
        )}

        <button className="admin-button admin-button--primary" type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create category'}
        </button>
      </form>
    </section>
  )
}

/**
 * One row's homepage switch. It saves on change rather than behind a button,
 * so the checkbox is never showing a state the file does not already have.
 *
 * The box moves immediately and reverts if the request fails, which keeps the
 * click feeling instant without ever lying about what was stored. Each row owns
 * its own pending state, so saving one category does not freeze the others.
 */
function VisibilityToggle({
  category,
  objectCount,
  onChanged,
}: {
  category: AdminCategory
  objectCount: number
  onChanged: () => void
}) {
  const [checked, setChecked] = useState(category.showOnHome)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle(next: boolean) {
    setChecked(next)
    setBusy(true)
    setError(null)
    try {
      await setCategoryVisibility(category.key, next)
      onChanged()
    } catch (cause) {
      setChecked(!next)
      setError(cause instanceof ApiError ? cause.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-toggle">
      <label className="admin-check">
        <input
          type="checkbox"
          checked={checked}
          disabled={busy}
          onChange={(event) => void toggle(event.target.checked)}
        />
        <span className="admin-visually-hidden">Show {category.names.eng ?? category.key} on the homepage</span>
      </label>

      {checked && objectCount < 2 && !error && (
        <span className="admin-field__hint">
          {objectCount === 0 ? 'No objects yet' : 'Needs 2 objects'} — the card will show an empty
          balance.
        </span>
      )}

      {error && (
        <span className="admin-toggle__error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
