import { useState, type FormEvent } from 'react'
import { ADMIN_LOGIN_CONFIGURED, deriveAdminKey, isAdminKeyValid } from '../credentials'
import { Wordmark } from '../Wordmark'

/**
 * The only thing standing between the internet and the dataset.
 *
 * The check happens here, in the page: what you type is hashed into a key and
 * the key is hashed again and compared with the verifier that ships in the
 * bundle (`src/admin/credentials.ts` explains the two rounds). No request is
 * made, so there is nothing to rate-limit and nothing to enumerate — and the
 * key the server will actually demand is handed back to the caller, which
 * keeps it out of this component's state once the form is gone.
 *
 * The form deliberately says nothing a visitor could learn from: one message
 * covers a wrong username and a wrong password alike.
 */
export function LoginScreen({ onAuthenticated }: { onAuthenticated: (key: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const key = await deriveAdminKey(username.trim(), password)
      if (!(await isAdminKeyValid(key))) throw new Error('rejected')
      setPassword('')
      onAuthenticated(key)
    } catch {
      setError('That username and password do not match.')
      setPassword('')
      setBusy(false)
    }
  }

  return (
    <main className="admin-login">
      {!ADMIN_LOGIN_CONFIGURED && (
        <p className="admin-banner" role="alert">
          No credential verifier is set. <code>admin-credentials.json</code> must hold a 64-character
          SHA-256 digest; the panel cannot be signed into until it does.
        </p>
      )}

      <form className="admin-login__card" onSubmit={(event) => void submit(event)}>
        <Wordmark />
        <h1 className="admin-login__title">Admin</h1>

        <label className="admin-field">
          <span className="admin-field__label">Username</span>
          <input
            className="admin-field__input"
            type="text"
            name="username"
            autoComplete="username"
            autoFocus
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        <label className="admin-field">
          <span className="admin-field__label">Password</span>
          <input
            className="admin-field__input"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}

        <button className="admin-button admin-button--primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
