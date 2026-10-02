import { useMemo } from 'react'
import { BalanceScale } from './BalanceScale'
import { categoryLabel } from '../data/categories'
import { objectsInCategory } from '../data/objects'
import { pickPreviewPair } from '../domain/categoryPreview'
import { useI18n } from '../i18n/I18nContext'
import type { Category } from '../data/categories'

/**
 * One category, shown as a miniature of the game itself: two of its own objects
 * on a small balance. The card says what the category holds and opens that
 * category's own page, which is empty until a category mode is specified.
 *
 * Only the name is a button — the scale is decorative markup a button may not
 * contain — and it stretches over the whole card, so the card is one click
 * target named after its category.
 */
export function CategoryCard({ category, onOpen }: { category: Category; onOpen: () => void }) {
  const { t, language } = useI18n()

  const objects = useMemo(() => objectsInCategory(category.id), [category.id])
  // Drawn once per mount, exactly like the hero scale: the cards differ between
  // visits without reshuffling under the player on every render.
  const pair = useMemo(() => pickPreviewPair(objects), [objects])

  return (
    <li className="category-card">
      <div className="category-card__stage">
        {pair && <BalanceScale left={pair[0]} right={pair[1]} variant="mini" />}
      </div>
      <h3 className="category-card__name">
        <button type="button" className="category-card__open" onClick={onOpen}>
          {categoryLabel(category, t, language)}
        </button>
      </h3>
    </li>
  )
}
