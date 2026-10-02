import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

/**
 * Every filesystem read and write the admin panel performs.
 *
 * Two rules govern this file, both because the project has no version control
 * and therefore no undo:
 *
 *  1. **Nothing is written in place.** A mutation copies the current file into
 *     `data/backups/` first, then writes a temp file, fsyncs it, and renames it
 *     over the target — so a crash mid-write leaves the old file intact rather
 *     than a truncated one.
 *  2. **Writes are serialized.** Every mutation goes through one promise chain,
 *     so two admin tabs saving at the same moment cannot read-modify-write over
 *     each other.
 *
 * `items.json` keeps the exact shape it was supplied in; new objects are
 * appended and existing entries are never reordered.
 */

export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Where the writable data lives. Defaults to the project itself, which is what
 * a normal deployment wants.
 *
 * `DATA_ROOT` is the one knob here, and it exists for a reason this project
 * cannot do without: it is what lets the verification script exercise the real
 * write paths against a throwaway copy instead of the live dataset. Never run a
 * test server without it.
 */
const DATA_ROOT = path.resolve(PROJECT_ROOT, process.env.DATA_ROOT?.trim() || PROJECT_ROOT)

/** Every path this server reads or writes. */
export const PATHS = {
  items: path.join(DATA_ROOT, 'items.json'),
  categories: path.join(DATA_ROOT, 'data', 'categories.json'),
  disputes: path.join(DATA_ROOT, 'data', 'disputes.json'),
  backups: path.join(DATA_ROOT, 'data', 'backups'),
  svgRoot: path.join(DATA_ROOT, 'svg_files'),
  // The build output is code, not data, so it always comes from the project.
  dist: path.join(PROJECT_ROOT, 'dist'),
}

export const LANGUAGE_CODES = ['eng', 'esp', 'tur', 'fra', 'deu']

/** Lowercase, digits and dashes — also what makes an id safe as a filename. */
const SAFE_KEY = /^[a-z0-9][a-z0-9-]*$/

const MAX_BACKUPS = 50

/** The four categories the supplied dataset already uses, with their folders.
 *
 * This mapping has to be data rather than a rule: the folder names are
 * irregular (`animal` → `animals_svg` and `food` → `foods_svg` are pluralised,
 * but `vehicle` → `vehicle_svg` is not), so no `${key}_svg` convention can
 * reproduce them. Categories created later do follow that convention.
 * Names are seeded from the locale files so the panel reads the same words the
 * game does; the homepage keeps using its translation keys either way.
 *
 * All four are `showOnHome: true` — they are the cards the homepage has always
 * had, and the toggle must not change what a first run looks like.
 */
const SEED_CATEGORIES = [
  {
    key: 'animal',
    folder: 'animals_svg',
    names: { eng: 'Animals', esp: 'Animales', tur: 'Hayvanlar', fra: 'Animaux', deu: 'Tiere' },
    builtIn: true,
    showOnHome: true,
  },
  {
    key: 'food',
    folder: 'foods_svg',
    names: { eng: 'Foods', esp: 'Alimentos', tur: 'Yiyecekler', fra: 'Aliments', deu: 'Lebensmittel' },
    builtIn: true,
    showOnHome: true,
  },
  {
    key: 'stuff',
    folder: 'stuff_svg',
    names: { eng: 'Objects', esp: 'Objetos', tur: 'Eşyalar', fra: 'Objets', deu: 'Gegenstände' },
    builtIn: true,
    showOnHome: true,
  },
  {
    key: 'vehicle',
    folder: 'vehicle_svg',
    names: { eng: 'Vehicles', esp: 'Vehículos', tur: 'Araçlar', fra: 'Véhicules', deu: 'Fahrzeuge' },
    builtIn: true,
    showOnHome: true,
  },
]

/** Thrown for anything the caller did wrong; the API turns it into a 400. */
export class ValidationError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

// ---------------------------------------------------------------- primitives

/** @type {Promise<unknown>} */
let writeQueue = Promise.resolve()

/**
 * Runs `task` after every previously queued write has settled.
 * @template T
 * @param {() => Promise<T>} task
 * @returns {Promise<T>}
 */
function serialize(task) {
  const result = writeQueue.then(task, task)
  // Keep the chain alive even when a task rejects, or one bad request would
  // wedge every later write.
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  )
  return result
}

/**
 * @param {string} file
 * @param {unknown} fallback
 * @returns {Promise<unknown>}
 */
async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'))
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code !== 'ENOENT') {
      console.warn(`[weight-game] ${path.basename(file)} is unreadable:`, error)
    }
    return fallback
  }
}

/**
 * Copies the current contents of `file` into `data/backups/` before it changes.
 * This is the only rollback that exists in this project — keep it.
 * @param {string} file
 */
async function backup(file) {
  if (!fsSync.existsSync(file)) return
  await fs.mkdir(PATHS.backups, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const base = path.basename(file, '.json')
  await fs.copyFile(file, path.join(PATHS.backups, `${base}-${stamp}.json`))

  const kept = (await fs.readdir(PATHS.backups))
    .filter((name) => name.startsWith(`${base}-`))
    .sort()
  for (const stale of kept.slice(0, Math.max(0, kept.length - MAX_BACKUPS))) {
    await fs.rm(path.join(PATHS.backups, stale), { force: true })
  }
}

/**
 * Backup, then temp-write, fsync and rename — so the target file is either the
 * old content or the new one, never half of either.
 * @param {string} file
 * @param {unknown} value
 */
async function writeJsonAtomic(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await backup(file)
  const temp = `${file}.${process.pid}.tmp`
  const handle = await fs.open(temp, 'w')
  try {
    await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`, 'utf8')
    await handle.sync()
  } finally {
    await handle.close()
  }
  await fs.rename(temp, file)
}

// --------------------------------------------------------------- categories

/**
 * @typedef {{ key: string, folder: string, names: Record<string, string>, builtIn?: boolean, showOnHome: boolean }} CategoryEntry
 */

/**
 * Reads the category registry, creating it from the supplied dataset's four
 * categories the first time the server runs.
 * @returns {Promise<CategoryEntry[]>}
 */
export async function readCategories() {
  const raw = await readJson(PATHS.categories, null)
  if (!Array.isArray(raw)) {
    await serialize(() => writeJsonAtomic(PATHS.categories, SEED_CATEGORIES))
    return structuredClone(SEED_CATEGORIES)
  }

  /** @type {CategoryEntry[]} */
  const categories = []
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue
    const key = typeof entry.key === 'string' ? entry.key.trim() : ''
    if (!SAFE_KEY.test(key)) continue
    const folder =
      typeof entry.folder === 'string' && entry.folder.trim() ? entry.folder.trim() : `${key}_svg`
    /** @type {Record<string, string>} */
    const names = {}
    for (const code of LANGUAGE_CODES) {
      const value = entry.names?.[code]
      if (typeof value === 'string' && value.trim()) names[code] = value.trim()
    }
    // A registry written before this flag existed has no `showOnHome`. The
    // supplied four default to true, because they are the cards the homepage
    // already showed; anything else defaults to false, so a category created
    // back when it could not appear on the homepage does not suddenly appear
    // there. The default is resolved in memory only — the file is rewritten on
    // the next actual change, not on a read.
    const seeded = SEED_CATEGORIES.some((seed) => seed.key === key)
    const showOnHome =
      typeof entry.showOnHome === 'boolean' ? entry.showOnHome : seeded

    categories.push({ key, folder, names, builtIn: entry.builtIn === true, showOnHome })
  }

  // A registry that somehow lost the supplied four would orphan every existing
  // object, so they are always present.
  for (const seed of SEED_CATEGORIES) {
    if (!categories.some((category) => category.key === seed.key)) {
      categories.push(structuredClone(seed))
    }
  }
  return categories
}

/**
 * Creates a category and its SVG folder in one step, so `guns` is immediately
 * a place an SVG can be stored.
 * @param {Record<string, unknown>} input
 * @returns {Promise<CategoryEntry>}
 */
export function createCategory(input) {
  return serialize(async () => {
    const key = typeof input.key === 'string' ? input.key.trim().toLowerCase() : ''
    if (!SAFE_KEY.test(key)) {
      throw new ValidationError('Category key must be lowercase letters, digits and dashes.')
    }

    const categories = await readCategories()
    if (categories.some((category) => category.key === key)) {
      throw new ValidationError(`Category "${key}" already exists.`)
    }

    const names = requireAllNames(input.names, 'Category')
    // Off the homepage unless asked for: a brand-new category has no objects
    // yet, and a card with an empty balance is worse than no card.
    const showOnHome = input.showOnHome === true

    /** @type {CategoryEntry} */
    const category = { key, folder: `${key}_svg`, names, showOnHome }

    await fs.mkdir(path.join(PATHS.svgRoot, category.folder), { recursive: true })
    await writeJsonAtomic(PATHS.categories, [...categories, category])
    return category
  })
}

/**
 * Flips one category's homepage visibility.
 *
 * Deliberately the only thing a category update can change. A key or a folder
 * is referenced by every object in the category and by files already on disk;
 * a name change would be harmless but was not asked for. Keeping the surface at
 * one boolean means this endpoint cannot orphan anything.
 * @param {string} key
 * @param {Record<string, unknown>} input
 * @returns {Promise<CategoryEntry>}
 */
export function updateCategory(key, input) {
  return serialize(async () => {
    if (typeof input.showOnHome !== 'boolean') {
      throw new ValidationError('showOnHome must be true or false.')
    }

    const categories = await readCategories()
    const index = categories.findIndex((category) => category.key === key)
    if (index === -1) throw new ValidationError(`No category with key "${key}".`)

    const updated = { ...categories[index], showOnHome: input.showOnHome }
    const next = [...categories]
    next[index] = updated
    await writeJsonAtomic(PATHS.categories, next)
    return updated
  })
}

// ------------------------------------------------------------------ objects

/**
 * Validates the five-language name block. Every language is required: a missing
 * name would silently fall back to English for that player, which is the kind
 * of gap that never gets noticed or fixed.
 * @param {unknown} raw
 * @param {string} subject
 * @returns {Record<string, string>}
 */
function requireAllNames(raw, subject) {
  if (typeof raw !== 'object' || raw === null) {
    throw new ValidationError(`${subject} names are missing.`)
  }
  /** @type {Record<string, string>} */
  const names = {}
  for (const code of LANGUAGE_CODES) {
    const value = /** @type {Record<string, unknown>} */ (raw)[code]
    const trimmed = typeof value === 'string' ? value.trim() : ''
    if (!trimmed) throw new ValidationError(`${subject} name for "${code}" is required.`)
    names[code] = trimmed
  }
  return names
}

/**
 * @param {unknown} raw
 * @returns {number}
 */
function requireWeight(raw) {
  const weight = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(weight) || weight <= 0) {
    throw new ValidationError('Weight must be a number of grams greater than zero.')
  }
  return Math.round(weight)
}

/**
 * Reads the `include_random` flag off a request body.
 *
 * Strict about what a caller sends — a string `"false"` is a mistake worth a
 * 400, not something to guess at — and inclusive when nothing is sent, which is
 * what makes the flag optional for an older client and for `items.json` entries
 * written before it existed. The game applies the same "absent means true" rule
 * when it reads the file (`src/data/objects.ts`).
 * @param {unknown} raw
 * @returns {boolean}
 */
function requireIncludeRandom(raw) {
  if (raw === undefined || raw === null) return true
  if (typeof raw !== 'boolean') {
    throw new ValidationError('include_random must be true or false.')
  }
  return raw
}

/** @returns {Promise<Record<string, unknown>[]>} */
export async function readItems() {
  const raw = await readJson(PATHS.items, [])
  if (!Array.isArray(raw)) {
    throw new Error('items.json is not an array; refusing to touch it.')
  }
  return raw
}

/**
 * Everything the panel reads, in one call.
 *
 * The *game* does not use this: it imports items.json and the category registry
 * at build time. This is the editor loading the files it is about to change, so
 * it has to come from disk — a bundled snapshot would not show the panel its
 * own last save.
 */
export async function readAdminData() {
  const [items, categories, disputes] = await Promise.all([
    readItems(),
    readCategories(),
    readDisputes(),
  ])
  return { items, categories, disputes }
}

/**
 * Appends one object and writes its SVG into the category's folder.
 *
 * `svg` has already been sanitized by `server/svg.mjs` when it gets here.
 * `include_random` is optional and defaults to true, so an object is in both
 * whole-dataset game modes unless it is deliberately kept out of them.
 * @param {Record<string, unknown> & { svg: string }} input
 */
export function createObject(input) {
  return serialize(async () => {
    const id = typeof input.id === 'string' ? input.id.trim().toLowerCase() : ''
    if (!SAFE_KEY.test(id)) {
      throw new ValidationError('Id must be lowercase letters, digits and dashes.')
    }

    const categoryKey = typeof input.category === 'string' ? input.category.trim() : ''
    const categories = await readCategories()
    const category = categories.find((entry) => entry.key === categoryKey)
    if (!category) throw new ValidationError(`Unknown category "${categoryKey}".`)

    const weight = requireWeight(input.weight)
    const includeRandom = requireIncludeRandom(input.include_random)
    const names = requireAllNames(input.names, 'Object')

    const items = await readItems()
    if (items.some((item) => item?.id === id)) {
      throw new ValidationError(`An object with id "${id}" already exists.`)
    }

    const assetPath = `${category.folder}/${id}.svg`
    const file = resolveInsideSvgRoot(assetPath)
    if (fsSync.existsSync(file)) {
      throw new ValidationError(`${assetPath} already exists; pick a different id.`)
    }

    // The SVG lands first: an object entry pointing at a missing file would
    // render as the broken-image placeholder, whereas an orphan SVG is inert.
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, input.svg, 'utf8')

    const entry = {
      id,
      weight,
      path: assetPath,
      category: category.key,
      include_random: includeRandom,
      names,
    }
    try {
      await writeJsonAtomic(PATHS.items, [...items, entry])
    } catch (error) {
      await fs.rm(file, { force: true })
      throw error
    }
    return entry
  })
}

/**
 * Edits weight, category, the `include_random` flag and names. The `path` is
 * carried over untouched by design, so an object that moves between categories
 * keeps its original SVG where it is — `src/data/objects.ts` reads the
 * `category` field first and only falls back to the folder, so the game still
 * resolves both correctly.
 * @param {string} id
 * @param {Record<string, unknown>} input
 */
export function updateObject(id, input) {
  return serialize(async () => {
    const items = await readItems()
    const index = items.findIndex((item) => item?.id === id)
    if (index === -1) throw new ValidationError(`No object with id "${id}".`)

    const categoryKey = typeof input.category === 'string' ? input.category.trim() : ''
    const categories = await readCategories()
    if (!categories.some((entry) => entry.key === categoryKey)) {
      throw new ValidationError(`Unknown category "${categoryKey}".`)
    }

    const existing = items[index]
    // Omitting the flag keeps whatever the entry had, read with the same
    // "absent means true" rule the game uses — so editing an object written
    // before the field existed writes the inclusive default rather than
    // rejecting whatever is on disk.
    const includeRandom =
      input.include_random === undefined
        ? existing.include_random !== false
        : requireIncludeRandom(input.include_random)
    const entry = {
      ...existing,
      weight: requireWeight(input.weight),
      category: categoryKey,
      include_random: includeRandom,
      names: requireAllNames(input.names, 'Object'),
      path: existing.path,
    }

    const next = [...items]
    next[index] = entry
    await writeJsonAtomic(PATHS.items, next)
    return entry
  })
}

/**
 * Resolves an asset path inside `svg_files/`, refusing anything that escapes it.
 * @param {string} assetPath
 * @returns {string}
 */
export function resolveInsideSvgRoot(assetPath) {
  const file = path.resolve(PATHS.svgRoot, assetPath.replace(/^\/+/, ''))
  if (!file.startsWith(PATHS.svgRoot + path.sep) || !file.endsWith('.svg')) {
    throw new ValidationError('Invalid asset path.')
  }
  return file
}

// ---------------------------------------------------------- uploaded art

/**
 * Validation for uploaded SVG artwork.
 *
 * An uploaded file is served from this site's own origin, so it is treated as
 * untrusted markup rather than as an image. The game renders objects through an
 * `<img>` tag (`src/components/ObjectImage.tsx`), which already neuters scripts
 * inside an SVG — but the same file is reachable directly at
 * `/objects/<folder>/<id>.svg`, where a browser *does* treat it as a document.
 * That is the case this guards.
 *
 * The policy is to **reject, not silently strip**: quietly removing part of a
 * drawing would hand back artwork that renders wrong for reasons nobody can
 * see. A refusal names what was found so it can be fixed in the source file.
 */

const MAX_BYTES = 256 * 1024

/** Each rule is checked in order, so the message names the first real problem.
 * @type {[RegExp, string][]} */
const FORBIDDEN = [
  [/<!ENTITY\b/i, 'an <!ENTITY> declaration (entity-expansion and file-disclosure risk)'],
  [/<\s*script\b/i, 'a <script> element'],
  [/<\s*foreignObject\b/i, 'a <foreignObject> element'],
  [/<\s*(iframe|embed|object)\b/i, 'an embedded-document element'],
  [/\son[a-z]+\s*=/i, 'an inline event handler (on… attribute)'],
  [/javascript\s*:/i, 'a javascript: URL'],
  [/(?:xlink:)?href\s*=\s*["']\s*(?:https?:)?\/\//i, 'a reference to an external URL'],
  [/<\s*(?:set|animate)\b[^>]*attributeName\s*=\s*["']\s*href/i, 'an animated href'],
]

/**
 * Checks uploaded SVG text and returns it ready to write.
 * @param {unknown} raw
 * @returns {string}
 */
export function sanitizeSvg(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new ValidationError('An SVG file is required.')
  }

  const svg = raw.replace(/^﻿/, '').trim()

  if (Buffer.byteLength(svg, 'utf8') > MAX_BYTES) {
    throw new ValidationError(`The SVG is larger than ${MAX_BYTES / 1024} KB.`)
  }

  // Dangerous content is checked before the shape of the file, so an
  // <!ENTITY> hiding inside a doctype is named for what it is rather than
  // reported as a malformed preamble.
  for (const [pattern, description] of FORBIDDEN) {
    if (pattern.test(svg)) {
      throw new ValidationError(`The SVG contains ${description}; remove it and upload again.`)
    }
  }

  // Everything before the root element may only be an XML declaration, a
  // doctype or comments — anything else means this is not an SVG file.
  const preamble = svg.slice(0, Math.max(0, svg.search(/<\s*svg\b/i)))
  if (!/<\s*svg\b/i.test(svg) || /<(?!\?xml|!DOCTYPE|!--)/i.test(preamble)) {
    throw new ValidationError('The file does not start with an <svg> root element.')
  }

  return `${svg}\n`
}

// ----------------------------------------------------------------- disputes

const MAX_DISPUTES = 20000

/**
 * How long a player report is kept, in days.
 *
 * Votes are a quality signal with a shelf life, not a ledger: after this many
 * days a record is deleted from `data/disputes.json` outright — not archived,
 * not summarised — so the file can never grow without bound. Everything the
 * panel shows is therefore "the last 30 days", and the counts shrink again as
 * old reports age out.
 */
export const DISPUTE_RETENTION_DAYS = 30

const DISPUTE_RETENTION_MS = DISPUTE_RETENTION_DAYS * 24 * 60 * 60 * 1000

/**
 * Is this record still inside the retention window?
 *
 * A record with a missing or unparseable `createdAt` is treated as expired:
 * the alternative is a row that can never be cleaned up, and a vote nobody can
 * date is worth nothing to the panel anyway.
 * @param {unknown} record
 * @param {number} now
 */
function isFreshDispute(record, now) {
  if (typeof record !== 'object' || record === null) return false
  const createdAt = /** @type {{ createdAt?: unknown }} */ (record).createdAt
  if (typeof createdAt !== 'string') return false
  const created = Date.parse(createdAt)
  return Number.isFinite(created) && now - created < DISPUTE_RETENTION_MS
}

/**
 * The reports inside the retention window. A pure read — it filters expired
 * records out of what it returns but never touches the file; `pruneDisputes`
 * is what frees the disk space.
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function readDisputes() {
  const raw = await readJson(PATHS.disputes, [])
  if (!Array.isArray(raw)) return []
  const now = Date.now()
  return raw.filter((record) => isFreshDispute(record, now))
}

/**
 * Writes the dispute log. Disputes are append-only player data and never worth
 * a backup copy of their own, so this skips the backup step every other write
 * in this file takes — but keeps the temp-file-then-rename, so a crash cannot
 * truncate the log.
 * @param {Record<string, unknown>[]} records
 */
async function writeDisputes(records) {
  await fs.mkdir(path.dirname(PATHS.disputes), { recursive: true })
  const temp = `${PATHS.disputes}.${process.pid}.tmp`
  await fs.writeFile(temp, `${JSON.stringify(records.slice(-MAX_DISPUTES), null, 0)}\n`, 'utf8')
  await fs.rename(temp, PATHS.disputes)
}

/**
 * Deletes expired reports from disk, and nothing else.
 *
 * Called when the panel loads its data and once at startup, which is what
 * makes the 30-day promise real on a site nobody is voting on any more — the
 * append path prunes for free, since it writes `readDisputes()` back out.
 * A no-op (no write at all) when nothing has expired.
 * @returns {Promise<number>} how many records were removed
 */
export function pruneDisputes() {
  return serialize(async () => {
    const raw = await readJson(PATHS.disputes, [])
    if (!Array.isArray(raw)) return 0
    const now = Date.now()
    const kept = raw.filter((record) => isFreshDispute(record, now))
    if (kept.length === raw.length) return 0
    await writeDisputes(kept)
    return raw.length - kept.length
  })
}

/**
 * Appends one player report. Kept deliberately permissive about session
 * context and strict about the two fields analytics actually counts.
 * @param {Record<string, unknown>} input
 */
export function appendDispute(input) {
  return serialize(async () => {
    const objectId = typeof input.objectId === 'string' ? input.objectId.trim() : ''
    const direction = input.direction
    if (!objectId || (direction !== 'heavier' && direction !== 'lighter')) {
      throw new ValidationError('A dispute needs an objectId and a direction.')
    }

    /** @param {unknown} value */
    const context = (value) =>
      typeof value === 'string' && value.trim() ? value.trim().slice(0, 100) : undefined

    const record = {
      id: crypto.randomUUID(),
      objectId: objectId.slice(0, 100),
      direction,
      createdAt: new Date().toISOString(),
      gameId: context(input.gameId),
      questionId: context(input.questionId),
      opponentObjectId: context(input.opponentObjectId),
    }

    // `readDisputes` already drops anything past the retention window, so
    // writing its result back is what prunes the log on every new vote.
    const records = await readDisputes()
    await writeDisputes([...records, record])
    return record
  })
}
