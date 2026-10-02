import { useCallback, useRef, useState } from 'react'

/**
 * How far into the viewport a section has to come before it reveals. A
 * negative bottom margin shrinks the observer's root, so the animation starts
 * once the section is properly on screen rather than the instant its first
 * pixel clears the fold.
 */
const REVEAL_ROOT_MARGIN = '0px 0px -10% 0px'

/**
 * How long a reader who never scrolls waits before a section that is already
 * on screen reveals anyway. The gate below exists to stop the animation being
 * spent before anyone looks at it, not to let a tall window strand content
 * that is sitting in plain sight.
 */
const UNSCROLLED_FALLBACK_MS = 2000

/**
 * Holds a reveal until the page has actually been scrolled.
 *
 * On a window tall enough to show a section at load — `.bento`'s top sits
 * 734px down the home page, so anything over about an 816px viewport does —
 * the observer fires immediately, the stagger plays to an empty room, and by
 * the time the reader scrolls down it has long finished: the section reads as
 * having simply always been there. Waiting for the first scroll is what makes
 * the animation happen where it was designed to, whatever the window height.
 *
 * A page that opens already scrolled (a reload part-way down, an anchor) has
 * nothing to wait for, so it runs at once.
 *
 * Returns its own teardown, so a section unmounted before it fires leaves no
 * listener and no timer behind.
 */
function afterFirstScroll(run: () => void): () => void {
  if (window.scrollY > 0) {
    run()
    return () => {}
  }

  let fired = false
  const cleanup = () => {
    window.clearTimeout(timer)
    window.removeEventListener('scroll', fire)
  }
  const fire = () => {
    if (fired) return
    fired = true
    cleanup()
    run()
  }
  const timer = window.setTimeout(fire, UNSCROLLED_FALLBACK_MS)
  window.addEventListener('scroll', fire, { passive: true })

  return cleanup
}

/**
 * Reveals a section the first time it scrolls into view, once and for good.
 *
 * Returns props to spread onto the element itself — a callback ref and the
 * `data-reveal` attribute the CSS keys off — so nothing has to be wrapped in
 * an extra div. That matters here: both sections that use this are sized by
 * their parent grid, and `.bento` is a container query container, so an
 * inserted wrapper would change the layout it measures.
 *
 * The observer is disconnected as soon as it fires. A section that has been
 * seen stays visible; scrolling back past it does not replay the animation,
 * which is the behaviour that turns a reveal into a distraction.
 *
 * Crossing into view is necessary but not sufficient: the reveal then passes
 * through `afterFirstScroll`, so a section that a tall window already shows at
 * load still waits for the reader to move before it plays.
 */
export function useReveal() {
  const [shown, setShown] = useState(false)
  const disconnect = useRef<(() => void) | null>(null)

  const ref = useCallback((node: HTMLElement | null) => {
    disconnect.current?.()
    disconnect.current = null
    if (!node) return

    // No observer at all (an old engine, or a static render): show the section
    // rather than leave it permanently invisible. The animation is decoration;
    // the content is not.
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    let cancelPending: (() => void) | null = null

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        cancelPending = afterFirstScroll(() => setShown(true))
      },
      { rootMargin: REVEAL_ROOT_MARGIN },
    )

    observer.observe(node)
    disconnect.current = () => {
      observer.disconnect()
      cancelPending?.()
    }
  }, [])

  return { ref, 'data-reveal': shown ? 'in' : 'out' } as const
}
