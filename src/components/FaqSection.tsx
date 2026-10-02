import type { CSSProperties } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { ChevronDownIcon } from './icons'
import { useReveal } from './useReveal'
import type { TranslationKey } from '../i18n'

/**
 * The ten questions, in display order. Keys only — the text itself lives in the
 * locale files like every other string, and a key that does not exist in the
 * reference locale is a compile error rather than a blank answer.
 */
const FAQ_ITEMS: readonly { question: TranslationKey; answer: TranslationKey }[] = [
  { question: 'faq.q1', answer: 'faq.a1' },
  { question: 'faq.q2', answer: 'faq.a2' },
  { question: 'faq.q3', answer: 'faq.a3' },
  { question: 'faq.q4', answer: 'faq.a4' },
  { question: 'faq.q5', answer: 'faq.a5' },
  { question: 'faq.q6', answer: 'faq.a6' },
  { question: 'faq.q7', answer: 'faq.a7' },
  { question: 'faq.q8', answer: 'faq.a8' },
  { question: 'faq.q9', answer: 'faq.a9' },
  { question: 'faq.q10', answer: 'faq.a10' },
]

/**
 * Native `<details>` rather than a disclosure built out of state: the open
 * state, the keyboard handling and the screen-reader semantics all come for
 * free, the answers stay in the document for find-in-page, and nothing here
 * needs to know about the game.
 *
 * The section reveals on scroll (`useReveal`), and each question carries its
 * own index as `--reveal-i` so the CSS can stagger them without counting rows
 * in a selector.
 */
export function FaqSection() {
  const { t } = useI18n()
  const reveal = useReveal()

  return (
    <section className="faq" id="faq" aria-labelledby="faq-title" {...reveal}>
      <h2 className="faq__title" id="faq-title">
        {t('faq.title')}
      </h2>
      <ul className="faq__list">
        {FAQ_ITEMS.map((item, index) => (
          <li key={item.question} style={{ '--reveal-i': index } as CSSProperties}>
            <details className="faq__item">
              <summary className="faq__question">
                {/* Classed so the open state can paint the question text with
                    the section's gradient without catching the chevron. */}
                <span className="faq__question-text">{t(item.question)}</span>
                <span className="faq__chevron" aria-hidden="true">
                  <ChevronDownIcon />
                </span>
              </summary>
              <p className="faq__answer">{t(item.answer)}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}
