import { useEffect, useRef } from 'react'

/**
 * Plays a round from the keyboard: ← and → pick a side, Enter moves on.
 *
 * Bound to the window rather than to the cards, because the point is to be
 * able to play without aiming at anything first — a player who has not tabbed
 * to either card still gets both keys. The handlers are kept in a ref and the
 * listener is attached once, so a caller can pass inline arrow functions
 * without re-subscribing on every render.
 *
 * Pass `undefined` for whatever the current phase does not allow; a key with no
 * handler behind it is left to the browser.
 */
export interface GameKeyHandlers {
  onLeft?: (() => void) | undefined
  onRight?: (() => void) | undefined
  onAdvance?: (() => void) | undefined
}

/** Where the arrow keys already mean something, and must keep meaning it. */
function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Enter is additionally off limits on anything the browser already activates
 * with it — otherwise a player who has tabbed to "Next round" would fire both
 * the button and this handler from one keypress.
 */
function isActivatable(target: EventTarget | null): boolean {
  if (isTextEntry(target)) return true
  if (!(target instanceof HTMLElement)) return false
  return ['BUTTON', 'A', 'SUMMARY'].includes(target.tagName)
}

export function useGameKeys(handlers: GameKeyHandlers): void {
  const latest = useRef(handlers)
  latest.current = handlers

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // A modifier means the player is talking to the browser, not the game.
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return

      const { onLeft, onRight, onAdvance } = latest.current
      let handler: (() => void) | undefined

      if (event.key === 'ArrowLeft' && !isTextEntry(event.target)) handler = onLeft
      else if (event.key === 'ArrowRight' && !isTextEntry(event.target)) handler = onRight
      else if (event.key === 'Enter' && !isActivatable(event.target)) handler = onAdvance

      if (!handler) return
      event.preventDefault()
      handler()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
