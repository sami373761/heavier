import { useCallback, useEffect, useState } from 'react'
import {
  ApiError,
  getAdminData,
  setAdminKey,
  type AdminCategory,
  type AdminItem,
} from './api'
import type { DisputeRecord } from '../services/disputes'
import { Wordmark } from './Wordmark'
import { LoginScreen } from './screens/LoginScreen'
import { ObjectsScreen } from './screens/ObjectsScreen'
import { NewObjectScreen } from './screens/NewObjectScreen'
import { CategoriesScreen } from './screens/CategoriesScreen'
import { AnalyticsScreen } from './screens/AnalyticsScreen'
// The panel's own stylesheet, plus the site's tokens it builds on. Both are
// imported here rather than from a second HTML entry, because this component
// *is* the entry now — and because `main.tsx` loads it lazily, the panel's CSS
// is a chunk of its own that a player never downloads.
import '../styles/global.css'
import './admin.css'

/**
 * The admin panel: a page of this app, rendered by `src/main.tsx` when the
 * browser is at `ADMIN_ROUTE`. Not a second entry, not a second bundle to
 * deploy, not a second port.
 *
 * Signing in is local (`LoginScreen` checks what you type against the stored
 * verifier) and the key it produces is what every later request carries. There
 * is no session to expire, so the only way back to the login screen is a key
 * the server rejects — which is still handled, because an outdated bundle open
 * in a tab after the credentials were rotated is exactly that case.
 *
 * One load fills the whole panel: `getAdminData` returns the objects, the
 * categories and the dispute log, and the screens below are given data rather
 * than fetching their own.
 *
 * Tabs are values, not URLs — the same choice the game makes in
 * `src/state/useRoute.ts`.
 */
type Tab = 'objects' | 'new' | 'categories' | 'analytics'

const TABS: { id: Tab; label: string }[] = [
  { id: 'objects', label: 'Objects' },
  { id: 'new', label: 'Add object' },
  { id: 'categories', label: 'Categories' },
  { id: 'analytics', label: 'Analytics' },
]

export function AdminApp() {
  const [signedIn, setSignedIn] = useState(false)
  const [tab, setTab] = useState<Tab>('objects')
  const [items, setItems] = useState<AdminItem[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [disputes, setDisputes] = useState<DisputeRecord[]>([])
  const [dataError, setDataError] = useState<string | null>(null)
  /** Which object the editor should open with, when Analytics sends you here. */
  const [focusId, setFocusId] = useState<string | undefined>(undefined)

  const signOut = useCallback(() => {
    setAdminKey('')
    setSignedIn(false)
    setItems([])
    setCategories([])
    setDisputes([])
  }, [])

  const refresh = useCallback(async () => {
    try {
      const payload = await getAdminData()
      setItems(payload.items)
      setCategories(payload.categories)
      setDisputes(payload.disputes)
      setDataError(null)
    } catch (cause) {
      if (cause instanceof ApiError && cause.isUnauthenticated) {
        signOut()
        return
      }
      setDataError(cause instanceof ApiError ? cause.message : 'Could not load the dataset.')
    }
  }, [signOut])

  useEffect(() => {
    if (signedIn) void refresh()
  }, [signedIn, refresh])

  if (!signedIn) {
    return (
      <LoginScreen
        onAuthenticated={(key) => {
          setAdminKey(key)
          setSignedIn(true)
        }}
      />
    )
  }

  function openEditor(id: string) {
    setFocusId(id)
    setTab('objects')
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <Wordmark />
        <nav className="admin-nav" aria-label="Admin sections">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="admin-nav__tab"
              aria-current={tab === entry.id ? 'page' : undefined}
              onClick={() => {
                setFocusId(undefined)
                setTab(entry.id)
              }}
            >
              {entry.label}
            </button>
          ))}
        </nav>
        <button className="admin-button" type="button" onClick={signOut}>
          Sign out
        </button>
      </header>

      <main className="admin-main">
        <p className="admin-note">
          Saves land in <code>items.json</code>, <code>data/categories.json</code> and{' '}
          <code>svg_files/</code> straight away. The game reads those files at build time, so run{' '}
          <code>npm run build</code> to publish a change to players.
        </p>

        {dataError && (
          <p className="admin-error" role="alert">
            {dataError}
          </p>
        )}

        {tab === 'objects' && (
          <ObjectsScreen
            items={items}
            categories={categories}
            onSaved={() => void refresh()}
            focusId={focusId}
          />
        )}

        {tab === 'new' && (
          <NewObjectScreen categories={categories} onCreated={() => void refresh()} />
        )}

        {tab === 'categories' && (
          <CategoriesScreen
            categories={categories}
            items={items}
            onCreated={() => void refresh()}
            onChanged={() => void refresh()}
          />
        )}

        {tab === 'analytics' && (
          <AnalyticsScreen items={items} disputes={disputes} onEditObject={openEditor} />
        )}
      </main>
    </div>
  )
}
