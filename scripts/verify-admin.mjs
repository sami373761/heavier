import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * End-to-end check of the server, which is the only code in this project that
 * can overwrite `items.json`. There is no test runner here, so this script plus
 * `npm run typecheck` and `npm run build` is the automated gate.
 *
 * It runs against a **throwaway copy** of the dataset (`DATA_ROOT` in a temp
 * directory) and a throwaway credential (`ADMIN_VERIFIER`), never the real
 * ones — the point is to exercise destructive write paths in a project with no
 * version control to undo them.
 *
 *   npm run build && npm run verify:admin
 */

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const USERNAME = 'verifier'
const PASSWORD = 'a-long-enough-password'
/** @param {string} value */
const sha256 = (value) => crypto.createHash('sha256').update(value, 'utf8').digest('hex')
/** What the panel derives from the form and sends on every request. */
const KEY = sha256(`${USERNAME}:${PASSWORD}`)
const VERIFIER = sha256(KEY)

const CLEAN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>'
const NAMES = { eng: 'Derringer', esp: 'Derringer', tur: 'Derringer', fra: 'Derringer', deu: 'Derringer' }

let failures = 0
let checks = 0

/**
 * @param {string} label
 * @param {boolean} condition
 * @param {string} [detail]
 */
function check(label, condition, detail = '') {
  checks += 1
  if (condition) console.log(`  ok   ${label}`)
  else {
    failures += 1
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

/** @param {string} title */
function section(title) {
  console.log(`\n${title}`)
}

async function main() {
  const dataRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'heavier-verify-'))
  await fsp.copyFile(path.join(PROJECT_ROOT, 'items.json'), path.join(dataRoot, 'items.json'))
  await fsp.mkdir(path.join(dataRoot, 'data'), { recursive: true })
  await fsp.copyFile(
    path.join(PROJECT_ROOT, 'data', 'categories.json'),
    path.join(dataRoot, 'data', 'categories.json'),
  )
  await fsp.cp(path.join(PROJECT_ROOT, 'svg_files'), path.join(dataRoot, 'svg_files'), {
    recursive: true,
  })

  const itemsFile = path.join(dataRoot, 'items.json')
  const categoriesFile = path.join(dataRoot, 'data', 'categories.json')
  const originalItems = JSON.parse(await fsp.readFile(itemsFile, 'utf8'))

  const port = 8000 + Math.floor(Math.random() * 1000)
  const base = `http://127.0.0.1:${port}`

  const server = spawn(process.execPath, [path.join(PROJECT_ROOT, 'server', 'index.mjs')], {
    env: {
      ...process.env,
      DATA_ROOT: dataRoot,
      PORT: String(port),
      HOST: '127.0.0.1',
      ADMIN_VERIFIER: VERIFIER,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  server.stderr.on('data', (chunk) => process.stderr.write(`    [server] ${chunk}`))

  /**
   * @param {string} pathname
   * @param {{ method?: string, body?: unknown, key?: string | null }} [init]
   */
  const call = (pathname, init = {}) => {
    /** @type {Record<string, string>} */
    const headers = {}
    if (init.key !== null) headers['X-Admin-Key'] = init.key ?? KEY
    if (init.body !== undefined) headers['Content-Type'] = 'application/json'
    return fetch(`${base}${pathname}`, {
      method: init.method ?? 'GET',
      headers,
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      redirect: 'manual',
    })
  }

  /** @param {Response} response @returns {Promise<any>} */
  const body = (response) => response.json().catch(() => null)
  const readItems = async () => JSON.parse(await fsp.readFile(itemsFile, 'utf8'))

  try {
    await waitForServer(base)

    // ---------------------------------------------------------------- the gate
    section('The key is the only way in')
    for (const [pathname, method] of [
      ['/api/admin/data', 'GET'],
      ['/api/admin/objects', 'POST'],
      ['/api/admin/objects/bear', 'PUT'],
      ['/api/admin/categories', 'POST'],
      ['/api/admin/categories/animal', 'PATCH'],
    ]) {
      const response = await call(pathname, {
        method,
        key: null,
        // A GET cannot carry a body; the others are sent an empty one so the
        // 401 is proved to come from the key and not from a parse failure.
        ...(method === 'GET' ? {} : { body: {} }),
      })
      check(`${method} ${pathname} without a key is 401`, response.status === 401)
    }
    check(
      'a wrong key is 401',
      (await call('/api/admin/data', { key: sha256('wrong:wrong') })).status === 401,
    )
    check(
      'a key that is not hex is 401',
      (await call('/api/admin/data', { key: 'not-a-digest' })).status === 401,
    )
    check('the right key is 200', (await call('/api/admin/data')).status === 200)

    // ------------------------------------------------------------- reading
    section('Reading the dataset')
    const data = await body(await call('/api/admin/data'))
    check('items come back', Array.isArray(data.items) && data.items.length === originalItems.length)
    check('categories come back', Array.isArray(data.categories) && data.categories.length >= 4)
    check('disputes come back', Array.isArray(data.disputes))
    check(
      'every category has a showOnHome boolean',
      data.categories.every((/** @type {any} */ c) => typeof c.showOnHome === 'boolean'),
    )
    check(
      'the supplied four are featured',
      ['animal', 'food', 'stuff', 'vehicle'].every(
        (key) => data.categories.find((/** @type {any} */ c) => c.key === key)?.showOnHome === true,
      ),
    )

    // ------------------------------------------------------- creating objects
    section('Creating an object')
    const created = await call('/api/admin/objects', {
      method: 'POST',
      body: { id: 'derringer', weight: 400, category: 'stuff', names: NAMES, svg: CLEAN_SVG },
    })
    check('a valid object is created', created.status === 201)
    const createdBody = await body(created)
    check('the response carries the stored entry', createdBody?.object?.id === 'derringer')
    check('include_random defaults to true', createdBody?.object?.include_random === true)
    check(
      'the path is the category folder plus the id',
      createdBody?.object?.path === 'stuff_svg/derringer.svg',
    )
    check(
      'the SVG is on disk',
      fs.existsSync(path.join(dataRoot, 'svg_files', 'stuff_svg', 'derringer.svg')),
    )
    check('items.json grew by exactly one', (await readItems()).length === originalItems.length + 1)
    check(
      'the previous items.json was backed up first',
      fs.existsSync(path.join(dataRoot, 'data', 'backups')) &&
        fs.readdirSync(path.join(dataRoot, 'data', 'backups')).some((n) => n.startsWith('items-')),
    )

    section('Refusals')
    /**
     * @param {string} label
     * @param {Record<string, unknown>} patch
     */
    const refuses = async (label, patch) => {
      const base = { id: 'anvil-two', weight: 1, category: 'stuff', names: NAMES, svg: CLEAN_SVG }
      const response = await call('/api/admin/objects', { method: 'POST', body: { ...base, ...patch } })
      check(label, response.status === 400, `got ${response.status}`)
    }
    await refuses('a duplicate id is refused', { id: 'derringer' })
    await refuses('an id with an underscore is refused', { id: 'fire_extinguisher_two' })
    await refuses('an uppercase id is refused', { id: 'Anvil' })
    await refuses('a zero weight is refused', { weight: 0 })
    await refuses('a non-numeric weight is refused', { weight: 'heavy' })
    await refuses('an unknown category is refused', { category: 'spaceships' })
    await refuses('a missing locale name is refused', { names: { ...NAMES, tur: '' } })
    await refuses('a non-boolean include_random is refused', { include_random: 'false' })
    await refuses('an SVG with a script element is refused', {
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    })
    await refuses('an SVG with an inline event handler is refused', {
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><rect onload="x()"/></svg>',
    })
    await refuses('an SVG with an ENTITY declaration is refused', {
      svg: '<!DOCTYPE s [<!ENTITY a SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg"/>',
    })
    await refuses('a file that is not an SVG is refused', { svg: 'just text' })
    check(
      'no refusal left a partial entry behind',
      (await readItems()).length === originalItems.length + 1,
    )
    check(
      'no refusal left an orphan SVG behind',
      !fs.existsSync(path.join(dataRoot, 'svg_files', 'stuff_svg', 'anvil-two.svg')),
    )

    // -------------------------------------------------------- editing objects
    section('Editing an object')
    const edited = await call('/api/admin/objects/derringer', {
      method: 'PUT',
      body: {
        weight: 450,
        category: 'vehicle',
        include_random: false,
        names: { ...NAMES, eng: 'Derringer II' },
      },
    })
    check('an edit is accepted', edited.status === 200)
    const after = (await readItems()).find((/** @type {any} */ i) => i.id === 'derringer')
    check('the weight changed', after.weight === 450)
    check('the category changed', after.category === 'vehicle')
    check('include_random was stored as false', after.include_random === false)
    check('the asset path did NOT move with the category', after.path === 'stuff_svg/derringer.svg')
    check(
      'an edit that omits include_random keeps it',
      (await call('/api/admin/objects/derringer', {
        method: 'PUT',
        body: { weight: 450, category: 'vehicle', names: NAMES },
      }).then(() => readItems())).find((/** @type {any} */ i) => i.id === 'derringer')
        .include_random === false,
    )
    check(
      'editing an unknown id is refused',
      (await call('/api/admin/objects/no-such-thing', {
        method: 'PUT',
        body: { weight: 1, category: 'stuff', names: NAMES },
      })).status === 400,
    )

    // ------------------------------------------------------------ categories
    section('Categories')
    const newCategory = await call('/api/admin/categories', {
      method: 'POST',
      body: { key: 'guns', names: { ...NAMES, eng: 'Guns' }, showOnHome: true },
    })
    check('a category is created', newCategory.status === 201)
    check(
      'created featured when asked',
      (await body(newCategory))?.category?.showOnHome === true,
    )
    check(
      'the registry on disk stored showOnHome',
      JSON.parse(await fsp.readFile(categoriesFile, 'utf8')).find(
        (/** @type {any} */ c) => c.key === 'guns',
      )?.showOnHome === true,
    )
    check('its SVG folder was created', fs.existsSync(path.join(dataRoot, 'svg_files', 'guns_svg')))
    check(
      'a duplicate key is refused',
      (await call('/api/admin/categories', {
        method: 'POST',
        body: { key: 'guns', names: NAMES },
      })).status === 400,
    )
    check(
      'a new category is hidden unless asked for',
      (await body(
        await call('/api/admin/categories', {
          method: 'POST',
          body: { key: 'tools', names: NAMES },
        }),
      ))?.category?.showOnHome === false,
    )
    check(
      'homepage visibility can be flipped',
      (await body(
        await call('/api/admin/categories/guns', { method: 'PATCH', body: { showOnHome: false } }),
      ))?.category?.showOnHome === false,
    )
    check(
      'a non-boolean showOnHome is refused',
      (await call('/api/admin/categories/animal', { method: 'PATCH', body: { showOnHome: 'no' } }))
        .status === 400,
    )
    check(
      'patching an unknown category is refused',
      (await call('/api/admin/categories/nope', { method: 'PATCH', body: { showOnHome: true } }))
        .status === 400,
    )
    check(
      'the supplied four were not disturbed',
      ['animal', 'food', 'stuff', 'vehicle'].every((key) =>
        JSON.parse(fs.readFileSync(categoriesFile, 'utf8')).some(
          (/** @type {any} */ c) => c.key === key && c.showOnHome === true,
        ),
      ),
    )

    // -------------------------------------------------------------- disputes
    section('Disputes')
    check(
      'a player can report without a key',
      (await call('/api/disputes', {
        method: 'POST',
        key: null,
        body: { objectId: 'bear', direction: 'heavier' },
      })).status === 200,
    )
    check(
      'a report with no direction is refused',
      (await call('/api/disputes', { method: 'POST', key: null, body: { objectId: 'bear' } }))
        .status === 400,
    )
    const withDisputes = await body(await call('/api/admin/data'))
    check(
      'the report reaches the panel',
      withDisputes.disputes.some((/** @type {any} */ d) => d.objectId === 'bear'),
    )

    // Retention: a report older than 30 days must be gone from the panel *and*
    // from the file. The sweep runs when the panel loads its data, so reading
    // `/api/admin/data` is what triggers it.
    const disputesFile = path.join(dataRoot, 'data', 'disputes.json')
    const daysAgo = (/** @type {number} */ n) =>
      new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
    const stored = JSON.parse(await fsp.readFile(disputesFile, 'utf8'))
    await fsp.writeFile(
      disputesFile,
      JSON.stringify([
        { id: 'expired', objectId: 'bear', direction: 'lighter', createdAt: daysAgo(31) },
        { id: 'undated', objectId: 'bear', direction: 'lighter' },
        { id: 'kept', objectId: 'bear', direction: 'heavier', createdAt: daysAgo(29) },
        ...stored,
      ]),
      'utf8',
    )
    const swept = await body(await call('/api/admin/data'))
    /** @param {string} id */
    const inPanel = (id) => swept.disputes.some((/** @type {any} */ d) => d.id === id)
    check('a report older than 30 days is not shown', !inPanel('expired'))
    check('a report with no date is not shown', !inPanel('undated'))
    check('a report inside the 30 days is still shown', inPanel('kept'))
    const onDisk = JSON.parse(await fsp.readFile(disputesFile, 'utf8'))
    check(
      'the expired report is deleted from the file',
      !onDisk.some((/** @type {any} */ d) => d.id === 'expired' || d.id === 'undated'),
    )
    check(
      'the fresh reports survive the sweep',
      onDisk.some((/** @type {any} */ d) => d.id === 'kept') &&
        onDisk.some((/** @type {any} */ d) => d.objectId === 'bear' && d.direction === 'heavier'),
    )

    // ---------------------------------------------------------------- serving
    section('Serving the site')
    const built = fs.existsSync(path.join(PROJECT_ROOT, 'dist', 'index.html'))
    check('dist/index.html exists (run npm run build first)', built)
    if (built) {
      const root = await call('/')
      check('/ serves the app', root.status === 200 && (await root.text()).includes('<div id="root">'))
      const adminRoute = await call(
        '/4095824095823fs9a04fd823hb9d05s7d340g5b8f23s9df4s845g9h2sd8d37sdf484h039h8sd52e0sd8ff3g94h5823',
      )
      check(
        'the admin route serves the same app',
        adminRoute.status === 200 && (await adminRoute.text()).includes('<div id="root">'),
      )
      check('an unknown path falls back to the app', (await call('/nonsense')).status === 200)
      check(
        'there is no public dataset endpoint any more',
        (await call('/api/objects', { key: null })).status === 404,
      )
      check(
        'there is no object-asset route any more',
        (await call('/objects/animals_svg/bear.svg', { key: null })).status === 200 &&
          (await (await call('/objects/animals_svg/bear.svg', { key: null })).text()).includes(
            '<div id="root">',
          ),
      )
      check(
        'a traversal attempt does not escape dist/',
        (await (await call('/assets/../../items.json', { key: null })).text()).includes(
          '<div id="root">',
        ),
      )

      // The panel must not be in the bundle every player downloads.
      const assets = path.join(PROJECT_ROOT, 'dist', 'assets')
      const entry = fs
        .readdirSync(assets)
        .filter((name) => name.startsWith('index-') && name.endsWith('.js'))
        .map((name) => fs.readFileSync(path.join(assets, name), 'utf8'))
        .join('')
      check('the player bundle exists', entry.length > 0)
      check('the player bundle does not contain the panel', !entry.includes('X-Admin-Key'))
      check(
        'object artwork is bundled as assets',
        fs.readdirSync(assets).some((name) => name.startsWith('bear-') && name.endsWith('.svg')),
      )
      check(
        'both fonts are bundled',
        fs.readdirSync(assets).some((name) => name.includes('SpaceGrotesk')) &&
          fs.readdirSync(assets).some((name) => name.includes('Audex')),
      )
      const html = fs.readFileSync(path.join(PROJECT_ROOT, 'dist', 'index.html'), 'utf8')
      check(
        'nothing is loaded from a third-party origin',
        !html.includes('googleapis') && !html.includes('gstatic'),
      )
      // The canonical and hreflang links are absolute by necessity and are
      // metadata, not resources. What must not be remote is anything the page
      // *loads*: a script, a stylesheet, a font or an image.
      check(
        'nothing the page loads is remote',
        [
          ...html.matchAll(/<script[^>]+src="(https?:[^"]+)"/g),
          ...html.matchAll(/<link[^>]+rel="(?:stylesheet|preload|preconnect)"[^>]*>/g),
          ...html.matchAll(/<img[^>]+src="(https?:[^"]+)"/g),
        ].filter((match) => match[0].includes('http')).length === 0,
      )
    }
  } finally {
    server.kill()
    await new Promise((resolve) => server.once('exit', resolve))
    await fsp.rm(dataRoot, { recursive: true, force: true })
  }

  console.log(`\n${checks - failures}/${checks} checks passed`)
  if (failures > 0) process.exitCode = 1
}

/** @param {string} base */
async function waitForServer(base) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      await fetch(`${base}/api/admin/data`)
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
  throw new Error('the server did not start')
}

await main()
