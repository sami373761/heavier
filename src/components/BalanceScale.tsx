import { ObjectImage } from './ObjectImage'
import type { GameObject } from '../domain/types'

/**
 * Decorative balance holding two real objects from the dataset, tipped toward
 * the heavier one. The beam rotates; each pan counter-rotates by the same angle
 * so it keeps hanging straight down, the way a real scale behaves.
 *
 * `variant` only picks a size: every dimension is a custom property on `.scale`,
 * so `mini` (the homepage category cards) reuses this exact markup and geometry
 * at card scale.
 */
export function BalanceScale({
  left,
  right,
  variant = 'hero',
}: {
  left: GameObject
  right: GameObject
  variant?: 'hero' | 'mini'
}) {
  const tilt = right.weightGrams > left.weightGrams ? 7 : -7

  return (
    <div
      className={variant === 'mini' ? 'scale scale--mini' : 'scale'}
      style={{ '--tilt': `${tilt}deg` } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="scale__beam">
        <div className="scale__pan scale__pan--left">
          <div className="scale__pan-inner">
            <span className="scale__cord" />
            <span className="scale__load">
              <ObjectImage object={left} />
            </span>
            <span className="scale__dish" />
          </div>
        </div>
        <div className="scale__pan scale__pan--right">
          <div className="scale__pan-inner">
            <span className="scale__cord" />
            <span className="scale__load">
              <ObjectImage object={right} />
            </span>
            <span className="scale__dish" />
          </div>
        </div>
      </div>
      <span className="scale__pivot" />
      <span className="scale__column" />
      <span className="scale__base" />
    </div>
  )
}
