import { useCallback, useState } from 'react'
import type { CategoryId } from '../domain/types'

/**
 * Which page of the site is on screen, kept deliberately separate from the game
 * reducer: `useGame` owns the phases of a play-through (home → question →
 * score), this owns whether the play-through is what the visitor is looking at
 * at all. Leaving the game route and coming back does not disturb the game — a
 * placeholder page is a detour, not a reset.
 *
 * In-app routing, like the phase switch it sits beside: there is no router and
 * no URL scheme yet, so a page is a value rather than a path.
 */
export type Route = { name: 'game' } | { name: 'coffee' } | { name: 'category'; id: CategoryId }

export interface Router {
  route: Route
  openGame: () => void
  openCoffee: () => void
  openCategory: (id: CategoryId) => void
}

export function useRoute(): Router {
  const [route, setRoute] = useState<Route>({ name: 'game' })

  return {
    route,
    openGame: useCallback(() => setRoute({ name: 'game' }), []),
    openCoffee: useCallback(() => setRoute({ name: 'coffee' }), []),
    openCategory: useCallback((id: CategoryId) => setRoute({ name: 'category', id }), []),
  }
}
