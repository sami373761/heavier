import { useMemo, type CSSProperties } from 'react'
import { BalanceScale } from '../BalanceScale'
import { BentoGrid } from '../BentoGrid'
import { CategoryCard } from '../CategoryCard'
import { FaqSection } from '../FaqSection'
import { ScaleIcon } from '../icons'
import { homepageCategories } from '../../data/categories'
import { randomPoolObjects } from '../../data/objects'
import { buildPairIndex, drawPair } from '../../domain/pairing'
import { useI18n } from '../../i18n/I18nContext'
import type { CategoryId } from '../../domain/types'

/**
 * How many columns the category grid uses, given how many cards it has.
 *
 * The grid used to be a hard-coded four, which was also exactly how many
 * categories existed. Now the admin panel decides, so the count has to keep the
 * last row from looking accidental: five cards read better as 3 + 2 than as
 * 4 + 1, and six as 3 + 3 rather than 4 + 2.
 *
 * Four is the widest row the container fits, so the choice is between three and
 * four, and it goes to whichever leaves the fullest last row — ties to the
 * wider one, which is also the one with fewer rows. Fewer than three cards
 * simply get a column each.
 *
 * A count of 13 (and 25, 37, …) strands one card whichever is picked: it leaves
 * a remainder of one against both three and four. Nothing to be done about that
 * from here, and it is a long way from the four categories that exist.
 */
export function categoryColumns(count: number): number {
  if (count <= 3) return Math.max(count, 1)
  const remainder = (columns: number) => (count % columns === 0 ? columns : count % columns)
  return remainder(4) >= remainder(3) ? 4 : 3
}

export function HomeScreen({
  onStart,
  onStartGuess,
  onOpenCategory,
}: {
  onStart: () => void
  onStartGuess: () => void
  onOpenCategory: (id: CategoryId) => void
}) {
  const { t } = useI18n()

  // A real, valid pair from the dataset so the hero scale tips honestly.
  // Drawn from the random pool, like a real question: the hero is the
  // heavier/lighter mode's shop window, so it shows objects that mode can use.
  const heroPair = useMemo(() => drawPair(buildPairIndex(randomPoolObjects()), Math.random), [])

  // Which categories get a card is data now, not a constant: the admin panel
  // owns the flag and it arrives with the dataset at boot.
  const categories = homepageCategories()

  return (
    <>
      <div className="home-layout">
        <section className="home">
          {heroPair && <BalanceScale left={heroPair[0]} right={heroPair[1]} />}

          <p className="home__lead">{t('home.lead')}</p>
          <h1 className="home__headline">{t('home.headline')}</h1>
          <p className="home__rule">{t('home.rule')}</p>

          <div className="home__modes">
            <button type="button" className="button button--primary button--large" onClick={onStart}>
              {t('home.start')}
            </button>
            <button type="button" className="button button--ghost button--large" onClick={onStartGuess}>
              <ScaleIcon />
              {t('home.guessStart')}
            </button>
          </div>
        </section>

        {categories.length > 0 && (
          <section className="categories" aria-labelledby="categories-title">
            <h2 className="categories__title" id="categories-title">
              {t('home.categories')}
            </h2>
            <ul
              className="categories__grid"
              style={{ '--category-columns': categoryColumns(categories.length) } as CSSProperties}
            >
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onOpen={() => onOpenCategory(category.id)}
                />
              ))}
            </ul>
          </section>
        )}
      </div>

      <BentoGrid />
      <FaqSection />
    </>
  )
}
