import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Generates a new admin username and password and stores only their verifier.
 *
 * Run it to rotate the credentials:
 *
 *     npm run admin:credentials
 *
 * It writes `admin-credentials.json` — one SHA-256 digest, no plaintext — and
 * prints the username and password **once**, to the terminal and nowhere else.
 * Write them down before closing the window; nothing in this project can
 * recover them, by design.
 *
 * The stored value is `sha256(sha256(`${username}:${password}`))`. The inner
 * hash is the key the panel derives from what you type and sends on each write;
 * the outer one is what ships in the bundle and sits on the server, so the
 * published value cannot be replayed as a credential.
 * `src/admin/credentials.ts` is the other half of this.
 *
 * Rebuild (`npm run build`) after rotating: the verifier is bundled into the
 * panel, so until then the page in a browser still checks the old one.
 */

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** @param {string} value */
const sha256 = (value) => crypto.createHash('sha256').update(value, 'utf8').digest('hex')

/**
 * Rejection sampling, so every character is equally likely — `% set.length`
 * on a raw byte is not, and a password generator is the wrong place to be
 * sloppy about it.
 * @param {string} set
 * @param {number} length
 */
function pick(set, length) {
  const limit = Math.floor(256 / set.length) * set.length
  let out = ''
  while (out.length < length) {
    for (const byte of crypto.randomBytes(length * 2)) {
      if (byte >= limit) continue
      out += set[byte % set.length]
      if (out.length === length) break
    }
  }
  return out
}

// No look-alike characters (no O/0, I/l/1), because these get read off a screen
// and typed by hand.
const LOWER = 'abcdefghijkmnpqrstuvwxyz'
const FULL = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789-_'

const username = `heavier-${pick(LOWER, 10)}`
const password = pick(FULL, 24)
const verifier = sha256(sha256(`${username}:${password}`))

const file = path.join(PROJECT_ROOT, 'admin-credentials.json')
fs.writeFileSync(file, `${JSON.stringify({ verifier }, null, 2)}\n`, 'utf8')

console.log('')
console.log('  New admin credentials — shown once, stored nowhere:')
console.log('')
console.log(`    Username:  ${username}`)
console.log(`    Password:  ${password}`)
console.log('')
console.log(`  Verifier written to ${path.relative(PROJECT_ROOT, file)}.`)
console.log('  Run `npm run build` so the panel checks the new one.')
console.log('')
