import http from 'node:http'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import {
  PATHS,
  PROJECT_ROOT,
  ValidationError,
  appendDispute,
  createCategory,
  createObject,
  pruneDisputes,
  readAdminData,
  sanitizeSvg,
  updateCategory,
  updateObject,
} from './store.mjs'

/**
 * The whole server: the built site and the five endpoints the admin panel
 * writes through, on one port.
 *
 * What it deliberately does not have:
 *
 *  - **No asset routes.** Object artwork, both fonts and the favicon are
 *    bundled into `dist/` by Vite, so they are ordinary static files here.
 *  - **No public API.** The game reads items.json at build time; there is
 *    nothing for it to ask the server for.
 *  - **No sessions.** A write carries `X-Admin-Key`, the server hashes it and
 *    compares it with the stored verifier. No cookie, no CSRF token, no login
 *    endpoint, no session store to expire.
 *
 * Plain `node:http` with no dependencies, as before. Run it behind nginx or
 * Caddy for TLS — see DEPLOY.md, and note that the panel's login needs
 * `crypto.subtle`, which browsers only expose on HTTPS or localhost.
 */

const PORT = Number(process.env.PORT?.trim() || '8080')
const HOST = process.env.HOST?.trim() || '0.0.0.0'

/** Request bodies are small: the largest is one SVG at 256 KB plus its JSON. */
const MAX_BODY_BYTES = 512 * 1024

/**
 * `sha256(sha256(`${username}:${password}`))`, the only credential material on
 * disk. The panel ships the same value and explains the two rounds in
 * `src/admin/credentials.ts`.
 *
 * `ADMIN_VERIFIER` overrides the file. That is how the verification script
 * exercises these endpoints without touching the real credentials, and it also
 * lets a deployment keep the value in systemd rather than on disk.
 */
const VERIFIER = (() => {
  const fromEnv = process.env.ADMIN_VERIFIER?.trim()
  if (fromEnv && /^[0-9a-f]{64}$/.test(fromEnv)) return fromEnv
  try {
    const raw = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'admin-credentials.json'), 'utf8'),
    )
    return typeof raw?.verifier === 'string' && /^[0-9a-f]{64}$/.test(raw.verifier)
      ? raw.verifier
      : ''
  } catch {
    return ''
  }
})()

/**
 * Whether a request carries the right key. Compared as fixed-length digests
 * through `timingSafeEqual`, so a wrong key reveals nothing by how long the
 * comparison took.
 * @param {import('node:http').IncomingMessage} req
 */
function isAuthorized(req) {
  if (!VERIFIER) return false
  const header = req.headers['x-admin-key']
  if (typeof header !== 'string' || !header) return false
  const offered = crypto.createHash('sha256').update(header, 'utf8').digest()
  return crypto.timingSafeEqual(offered, Buffer.from(VERIFIER, 'hex'))
}

/** @type {Record<string, string>} */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 */
function sendJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  })
  res.end(payload)
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {string} body
 */
function sendText(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(body)
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {string} file
 * @param {Record<string, string>} [headers]
 */
async function sendFile(res, file, headers = {}) {
  try {
    const body = await fsp.readFile(file)
    const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length, ...headers })
    res.end(body)
    return true
  } catch {
    return false
  }
}

/**
 * Reads and parses a JSON body, refusing anything oversized.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<Record<string, unknown>>}
 */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    /** @type {Buffer[]} */
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new ValidationError('That request is too large.'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (chunks.length === 0) return resolve({})
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          return reject(new ValidationError('Expected a JSON object.'))
        }
        resolve(parsed)
      } catch {
        reject(new ValidationError('That request body is not valid JSON.'))
      }
    })
    req.on('error', reject)
  })
}

/**
 * Resolves a URL path inside a root directory, refusing anything that climbs
 * out of it.
 * @param {string} root
 * @param {string} pathname
 */
function resolveInside(root, pathname) {
  const file = path.resolve(root, pathname.replace(/^\/+/, ''))
  if (file !== root && !file.startsWith(root + path.sep)) return null
  return file
}

/**
 * The built site.
 * @param {string} pathname
 * @param {import('node:http').ServerResponse} res
 */
async function serveStatic(pathname, res) {
  const file = resolveInside(PATHS.dist, pathname === '/' ? 'index.html' : pathname)
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return false

  // Vite fingerprints everything under assets/, so those can be cached forever;
  // the HTML entry must not be.
  const immutable = pathname.startsWith('/assets/')
  return sendFile(res, file, {
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  })
}

/**
 * The API. Everything under `/api/admin/` needs the key; `/api/disputes` is the
 * one public write, because it is a player reporting a weight mid-game.
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} pathname
 */
async function handleApi(req, res, pathname) {
  const method = req.method ?? 'GET'

  if (pathname === '/api/disputes' && method === 'POST') {
    const body = await readJsonBody(req)
    await appendDispute(body)
    // Write-only: a player is never told what the log now contains.
    sendJson(res, 200, { ok: true })
    return true
  }

  if (!pathname.startsWith('/api/admin/')) return false

  if (!isAuthorized(req)) {
    sendJson(res, 401, { error: 'Sign in again.' })
    return true
  }

  if (pathname === '/api/admin/data' && method === 'GET') {
    // Opening the panel is also when the 30-day log is swept: expired reports
    // leave the file before the panel reads it, so what is shown and what is
    // stored are the same set.
    await pruneDisputes()
    sendJson(res, 200, await readAdminData())
    return true
  }

  if (pathname === '/api/admin/objects' && method === 'POST') {
    const body = await readJsonBody(req)
    const svg = sanitizeSvg(body.svg)
    sendJson(res, 201, { object: await createObject({ ...body, svg }) })
    return true
  }

  const objectEdit = /^\/api\/admin\/objects\/([^/]+)$/.exec(pathname)
  if (objectEdit && method === 'PUT') {
    const body = await readJsonBody(req)
    sendJson(res, 200, { object: await updateObject(decodeURIComponent(objectEdit[1]), body) })
    return true
  }

  if (pathname === '/api/admin/categories' && method === 'POST') {
    const body = await readJsonBody(req)
    sendJson(res, 201, { category: await createCategory(body) })
    return true
  }

  const categoryEdit = /^\/api\/admin\/categories\/([^/]+)$/.exec(pathname)
  if (categoryEdit && method === 'PATCH') {
    const body = await readJsonBody(req)
    sendJson(res, 200, {
      category: await updateCategory(decodeURIComponent(categoryEdit[1]), body),
    })
    return true
  }

  return false
}

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent((req.url ?? '/').split('?')[0])

  void (async () => {
    try {
      if (pathname.startsWith('/api/')) {
        if (!(await handleApi(req, res, pathname))) sendJson(res, 404, { error: 'Not found.' })
        return
      }

      if (pathname === '/robots.txt') {
        sendText(res, 200, 'User-agent: *\nAllow: /\n')
        return
      }

      if (await serveStatic(pathname, res)) return

      // Unknown paths are the app, not a 404 — which is also how the admin
      // route is served: the panel is a page of this same bundle.
      const sent = await sendFile(res, path.join(PATHS.dist, 'index.html'), {
        'Cache-Control': 'no-cache',
      })
      if (!sent) sendText(res, 500, 'The app has not been built. Run `npm run build`.')
    } catch (error) {
      if (error instanceof ValidationError) {
        sendJson(res, 400, { error: error.message })
        return
      }
      console.error('[weight-game] unhandled request error:', error)
      if (!res.headersSent) sendJson(res, 500, { error: 'Something went wrong on the server.' })
    }
  })()
})

server.listen(PORT, HOST, () => {
  console.log(`[weight-game] Heavier is serving on http://${HOST}:${PORT}`)
  // One sweep on boot, so a restart clears reports that expired while the
  // process was down even if nobody opens the panel.
  pruneDisputes()
    .then((removed) => {
      if (removed > 0) console.log(`[weight-game] removed ${removed} expired player report(s).`)
    })
    .catch((error) => console.warn('[weight-game] could not prune the dispute log:', error))
  if (!VERIFIER) {
    console.warn(
      '[weight-game] admin-credentials.json has no usable verifier — the panel cannot save.',
    )
  }
})
