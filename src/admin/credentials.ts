import credentials from '../../admin-credentials.json'

/**
 * The admin login, with no plaintext anywhere.
 *
 * `admin-credentials.json` holds exactly one value and no secret: the
 * **verifier**, which is
 *
 *     verifier = sha256(key)       where   key = sha256(`${username}:${password}`)
 *
 * Hashing twice is the point. The panel derives `key` from what you type and
 * checks `sha256(key)` against the verifier, so it can say yes or no without
 * ever holding the password. The server stores the same verifier and accepts a
 * write whose `X-Admin-Key` header hashes to it — so `key` is the credential on
 * the wire, and the value published in the bundle (the verifier) is one hash
 * *past* it and cannot be replayed as one.
 *
 * What this does and does not buy, plainly: an attacker who reads the bundle
 * gets the verifier and must brute-force a 24-character password to turn it
 * into a usable key, which is not feasible. What it is not is a defence against
 * someone sitting on the connection — run this behind HTTPS, where the header
 * is encrypted like any other. There are no sessions and no cookies: the key
 * lives in the panel's React state and is gone the moment the tab closes.
 */
const VERIFIER: string = credentials.verifier

const encoder = new TextEncoder()

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** The credential the server checks. Derived from input, never stored. */
export function deriveAdminKey(username: string, password: string): Promise<string> {
  return sha256Hex(`${username}:${password}`)
}

/** Whether a derived key is the right one. */
export async function isAdminKeyValid(key: string): Promise<boolean> {
  return (await sha256Hex(key)) === VERIFIER
}

/**
 * Whether a login is even possible. False only if the verifier file was
 * emptied, which would otherwise look like a password that is simply wrong.
 */
export const ADMIN_LOGIN_CONFIGURED: boolean = /^[0-9a-f]{64}$/.test(VERIFIER)
