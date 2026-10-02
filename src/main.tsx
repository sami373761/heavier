import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { isAdminRoute } from './admin/route'

/**
 * One entry for the whole site.
 *
 * The dataset is a bundled import (`src/data/objects.ts`), so there is nothing
 * to fetch and nothing to await before the first render: every module that
 * reads `GAME_OBJECTS` does so synchronously because the data is already there.
 *
 * The admin panel is a page of this app, reached by being at `ADMIN_ROUTE`.
 * It is imported lazily for one reason only — so the panel's code is a separate
 * chunk that a player never downloads. The route string itself is in this
 * bundle, unavoidably, which is why the login is the control and the address is
 * not treated as a secret.
 */
const AdminApp = lazy(() =>
  import('./admin/AdminApp').then((module) => ({ default: module.AdminApp })),
)

const container = document.getElementById('root')
if (!container) throw new Error('Root container #root is missing from index.html')

createRoot(container).render(
  <StrictMode>
    {isAdminRoute(window.location.pathname) ? (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
