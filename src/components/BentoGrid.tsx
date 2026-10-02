import type { CSSProperties, ReactNode } from 'react'
import { CupIcon, FaqIcon, MailIcon, WeightStarMark } from './icons'
import { useReveal } from './useReveal'
import { useI18n } from '../i18n/I18nContext'
import featurePhoto from '../../photos/panda4k.jpeg'

/** Where the coffee card goes. The only place this address appears. */
const COFFEE_URL = 'https://buymeacoffee.com/sam10'

/** The id the FAQ card jumps to — `FaqSection` puts it on its own `<section>`. */
const FAQ_ANCHOR = 'faq'

/**
 * The four-card bento, rebuilt from the Apple reference screenshot.
 *
 * Layout is the reference's exactly: two columns and three rows, with the
 * feature card spanning rows 1-2 on the left and the FAQ card spanning rows
 * 2-3 on the right, so the two tall cards interlock around the two short ones.
 *
 * Everything inside is sized in `--px`, a unit defined in the CSS as one
 * reference pixel at the grid's 1240px reference width (see `.bento__grid`).
 * At that width every number here lands on the measured value from the
 * screenshot; narrower, the whole thing scales as one picture rather than
 * reflowing piecemeal.
 *
 * Two of the four cards are whole-card links (`<a>` carrying the card class),
 * which is why the headings inside them are plain `<p>`/`<span>` where they
 * would otherwise be interactive — an anchor may not contain a control, but it
 * may contain flow content.
 *
 * The grid reveals on scroll (`useReveal`): `data-reveal` goes on `.bento`
 * and the CSS staggers the four cards along the grid's own diagonal.
 */
export function BentoGrid({ featureIcon }: { featureIcon?: ReactNode }) {
  const { t } = useI18n()
  const reveal = useReveal()

  return (
    <div className="bento" {...reveal}>
      <div className="bento__grid">
        {/* 1 — feature. Photo card, text and icon bottom-left over a scrim. */}
        <section
          className="bento-card bento-card--feature"
          aria-labelledby="bento-feature-title"
          style={{ '--bento-photo': `url(${featurePhoto})` } as CSSProperties}
        >
          <span className="bento-card__icon bento-card__icon--mark" aria-hidden="true">
            {featureIcon ?? <WeightStarMark />}
          </span>
          <h2 className="bento-card__headline" id="bento-feature-title">
            <span className="bento-card__line">{t('bento.feature.line1')}</span>
            <span className="bento-card__line">{t('bento.feature.line2')}</span>
          </h2>
        </section>

        {/* 2 — contact. The one card with the gradient ring. */}
        <section className="bento-card bento-card--contact" aria-labelledby="bento-contact-title">
          <span className="bento-card__icon bento-card__icon--mail" aria-hidden="true">
            <MailIcon />
          </span>
          <h2 className="bento-card__headline" id="bento-contact-title">
            <span className="bento-card__line">{t('bento.contact.line1')}</span>
            <span className="bento-card__line bento-card__line--gradient">
              {t('bento.contact.line2')}
            </span>
          </h2>
        </section>

        {/* 3 — coffee. Replaces the deleted `CoffeeSection`; leaves the site. */}
        <a
          className="bento-card bento-card--coffee bento-card--link"
          href={COFFEE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="bento-card__icon bento-card__icon--cup" aria-hidden="true">
            <CupIcon />
          </span>
          <span className="bento-card__body">
            <span className="bento-card__headline">{t('bento.coffee.title')}</span>
            <span className="bento-card__sub">{t('bento.coffee.body')}</span>
          </span>
        </a>

        {/* 4 — FAQ. Jumps to the questions further down the same page. */}
        <a className="bento-card bento-card--faq bento-card--link" href={`#${FAQ_ANCHOR}`}>
          <span className="bento-card__icon bento-card__icon--faq" aria-hidden="true">
            <FaqIcon />
          </span>
          <span className="bento-card__headline">
            {t('bento.faq.before')}
            <span className="bento-card__line--gradient bento-card__line--green">
              {t('bento.faq.accent')}
            </span>
            {t('bento.faq.after')}
          </span>
        </a>
      </div>
    </div>
  )
}
