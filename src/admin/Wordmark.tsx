/**
 * The site wordmark, rendered without the i18n context.
 *
 * `components/Logo` reads the product name from the active locale, which would
 * mean wrapping the whole admin panel in an `I18nProvider` for one word. The
 * panel is the owner's own tool and is English-only, so it borrows the logo's
 * existing classes and skips the provider instead.
 */
export function Wordmark() {
  return (
    <span className="logo">
      <span className="logo__mark" aria-hidden="true" />
      <span className="logo__text">
        <span className="logo__accent">Heavier</span>
      </span>
    </span>
  )
}
