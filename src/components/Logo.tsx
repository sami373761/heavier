import { useI18n } from '../i18n/I18nContext'

/**
 * The wordmark. The product name is intentionally the same in every language,
 * so splitting it in two lets the second half carry the accent colour. A
 * one-word name — which is what “Heavier” is — has no second half to colour,
 * so the whole name takes the accent instead of rendering flat.
 */
export function Logo({ onClick }: { onClick?: () => void }) {
  const { t } = useI18n()
  const [first, ...rest] = t('app.name').split(' ')
  const second = rest.join(' ')

  const content = (
    <>
      <svg
        className="logo__mark"
        aria-hidden="true"
        viewBox="0 0 100 115"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="logo-mark-cutout">
            <rect width="100" height="115" fill="white" />
            <circle cx="50" cy="74" r="24" fill="black" />
            <polygon
              points="50,57.5 54,67.5 65,68 56.5,75 59.5,85.5 50,79.5 40.5,85.5 43.5,75 35,68 46,67.5"
              fill="white"
            />
          </mask>
        </defs>
        <path
          d="M 50 0 C 41 0 33 8 33 18 C 33 24 36 29 40 32 L 60 32 C 64 29 67 24 67 18 C 67 8 59 0 50 0 Z M 50 8 C 55.5 8 60 12.5 60 18 C 60 23.5 55.5 28 50 28 C 44.5 28 40 23.5 40 18 C 40 12.5 44.5 8 50 8 Z"
          fill="currentColor"
        />
        <path
          d="M 28 32 C 16 32 12 36 10 48 L 0 105 C 0 111 5 115 12 115 L 88 115 C 95 115 100 111 100 105 L 90 48 C 88 36 84 32 72 32 Z"
          fill="currentColor"
          mask="url(#logo-mark-cutout)"
        />
      </svg>
      <span className="logo__text">
        {second ? (
          <>
            {first}
            <span className="logo__accent">{second}</span>
          </>
        ) : (
          <span className="logo__accent">{first}</span>
        )}
      </span>
    </>
  )

  if (!onClick) return <span className="logo">{content}</span>

  return (
    <button type="button" className="logo logo--button" onClick={onClick}>
      {content}
    </button>
  )
}
