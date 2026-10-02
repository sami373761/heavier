import { useState, type ChangeEvent, type FormEvent } from 'react'
import { ApiError, createObject, type AdminCategory } from '../api'
import { NameFields, emptyNames, type Names } from '../NameFields'

/**
 * Adds one object: id, weight in grams, category, artwork, five names and
 * whether the random modes may draw it.
 *
 * The SVG is read in the browser and sent as text inside the JSON body. That
 * is not a shortcut around a file upload — it is what lets the server stay
 * dependency-free, since a multipart parser is the only reason this project
 * would need one. SVGs are text; nothing is lost.
 *
 * The file the object gets is `<category folder>/<id>.svg`, so the id decides
 * both the dataset key and the filename. The server refuses to overwrite an
 * existing file.
 */
export function NewObjectScreen({
  categories,
  onCreated,
}: {
  categories: AdminCategory[]
  onCreated: () => void
}) {
  const [id, setId] = useState('')
  const [weight, setWeight] = useState('')
  const [category, setCategory] = useState(categories[0]?.key ?? '')
  const [names, setNames] = useState<Names>(emptyNames)
  const [svg, setSvg] = useState('')
  const [svgName, setSvgName] = useState('')
  // True by default: a new object joins both whole-dataset modes unless it is
  // deliberately kept out of them.
  const [includeRandom, setIncludeRandom] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const folder = categories.find((entry) => entry.key === category)?.folder ?? ''
  const normalizedId = id.trim().toLowerCase()

  async function readSvg(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setError(null)
    if (!file) {
      setSvg('')
      setSvgName('')
      return
    }
    setSvgName(file.name)
    try {
      setSvg(await file.text())
    } catch {
      setSvg('')
      setError('That file could not be read.')
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      const { object } = await createObject({
        id: normalizedId,
        weight: Number(weight),
        category,
        include_random: includeRandom,
        names,
        svg,
      })
      setDone(
        `Added "${object.id}" at ${object.path}.` +
          (object.include_random === false
            ? ' It is kept out of the random modes, so it will only appear in its category.'
            : ''),
      )
      setId('')
      setWeight('')
      setNames(emptyNames())
      setSvg('')
      setSvgName('')
      setIncludeRandom(true)
      onCreated()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not save the object.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-section">
      <h2 className="admin-section__title">Add an object</h2>

      <form className="admin-form" onSubmit={(event) => void submit(event)}>
        <div className="admin-grid">
          <label className="admin-field" htmlFor="new-id">
            <span className="admin-field__label">Id</span>
            <input
              id="new-id"
              className="admin-field__input"
              type="text"
              required
              pattern="[a-zA-Z0-9][a-zA-Z0-9-]*"
              placeholder="fire-extinguisher"
              value={id}
              onChange={(event) => setId(event.target.value)}
            />
            <span className="admin-field__hint">
              Lowercase letters, digits and dashes. Also the filename.
            </span>
          </label>

          <label className="admin-field" htmlFor="new-weight">
            <span className="admin-field__label">Weight</span>
            <input
              id="new-weight"
              className="admin-field__input"
              type="number"
              min="1"
              step="1"
              required
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
            <span className="admin-field__hint">
              In grams — the game's one canonical unit. 4 kg is 4000.
            </span>
          </label>

          <label className="admin-field" htmlFor="new-category">
            <span className="admin-field__label">Category</span>
            <select
              id="new-category"
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
            <span className="admin-field__hint">Artwork is stored in {folder || '—'}.</span>
          </label>
        </div>

        <label className="admin-field" htmlFor="new-svg">
          <span className="admin-field__label">SVG</span>
          <input
            id="new-svg"
            className="admin-field__input admin-field__input--file"
            type="file"
            accept=".svg,image/svg+xml"
            required
            onChange={(event) => void readSvg(event)}
          />
          <span className="admin-field__hint">
            {svgName ? `Will be saved as ${folder}/${normalizedId || '<id>'}.svg` : 'A plain SVG silhouette, like the existing artwork.'}
          </span>
        </label>

        <NameFields names={names} onChange={setNames} disabled={busy} idPrefix="new-name" />

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
              On: the object can come up in Heavier/Lighter and in Guess the Weight, which both
              draw from the whole dataset. Off: it stays in its own category.
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
          {busy ? 'Saving…' : 'Add object'}
        </button>
      </form>
    </section>
  )
}
