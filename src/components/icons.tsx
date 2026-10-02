/** Small inline icons. Kept together so stroke weight and sizing stay consistent. */

export function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M4 6.5 8 10.5 12 6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** The score screen's share control. A box the arrow is leaving, not a platform mark. */
export function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 15V4M8 7.5 12 3.5l4 4M5 13v6.5h14V13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function FlagIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M4 14V3M4 3.5h7.5l-1.5 3 1.5 3H4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Used only for the Guess the Weight exact-match celebration. */
export function SparkleIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M10 2c.45 2.55 1.4 3.5 4 4-2.6.5-3.55 1.45-4 4-.45-2.55-1.4-3.5-4-4 2.6-.5 3.55-1.45 4-4Z" fill="currentColor" />
      <path d="M16.5 12c.2 1.15.65 1.6 1.8 1.8-1.15.2-1.6.65-1.8 1.8-.2-1.15-.65-1.6-1.8-1.8 1.15-.2 1.6-.65 1.8-1.8Z" fill="currentColor" />
    </svg>
  )
}

/**
 * The weighing scale from the supplied `svg_files/tartı.svg`, inlined rather
 * than loaded as an image so it takes the button's own `currentColor` — the
 * ghost button dims its label and brightens it on hover, and an `<img>` could
 * not follow that. Geometry is the file's own, untouched: its viewBox and the
 * group transform its paths are drawn against.
 */
export function ScaleIcon() {
  return (
    <svg viewBox="-0.77 0 50 50" aria-hidden="true" focusable="false" fill="currentColor">
      <g transform="translate(-290.767 -130.5)">
        <path d="M337.753,130.5h-45.5c-.818,0-1.483.485-1.483,1.081a1.148,1.148,0,0,0,.943,1h46.584a1.147,1.147,0,0,0,.939-1C339.233,130.985,338.57,130.5,337.753,130.5Z" />
        <path d="M335.961,177.3h-.439V162.5a20.258,20.258,0,0,0,.013-3.459,20.081,20.081,0,0,0-16.913-19.822v-2.266h15.692a1.406,1.406,0,0,0,1.446-1.364l.947-1.954H293.294l.889,1.954a1.407,1.407,0,0,0,1.448,1.364h16.3v2.32c-.092.016-.184.029-.275.046a20.087,20.087,0,0,0-16.26,18.789,1.674,1.674,0,0,0-.137.656V177.3h-1.215a1.6,1.6,0,0,0,0,3.2h41.92a1.6,1.6,0,0,0,0-3.2Zm-20.018-5.067v-2.577h-.732v2.577a13.6,13.6,0,0,1-13.163-13.662c0-.043.005-.084.005-.126h2.381v-.73H302.09a13.584,13.584,0,0,1,13.121-12.807v2.86h.732V144.9a13.587,13.587,0,0,1,13.134,12.808h-3.338v.73h3.367v-.116c0,.081.013.159.013.242A13.6,13.6,0,0,1,315.943,172.231Z" />
        <path d="M316.1,152.925l-.037-.005v-2.839c0-.172-.217-.31-.485-.31s-.485.138-.485.31v2.839l-.038.005a5.375,5.375,0,1,0,1.045,0Zm-.524,10a4.629,4.629,0,0,1-.87-9.169V156a2.367,2.367,0,0,0-1.65,2.22,2.527,2.527,0,0,0,5.044,0,2.368,2.368,0,0,0-1.65-2.22v-2.247a4.629,4.629,0,0,1-.874,9.169Z" />
      </g>
    </svg>
  )
}

export function CoffeeIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M3.5 7.5h10v4.5a3.5 3.5 0 0 1-3.5 3.5H7a3.5 3.5 0 0 1-3.5-3.5V7.5Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M13.5 8.75h1.75a1.75 1.75 0 0 1 0 3.5H13.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6.5 2.5v2M9.5 2.5v2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/* ==========================================================================
   Bento icons
   The three supplied files — `svg_files/mail.svg`, `cup-svgrepo-com.svg` and
   `FAQ.svg` — inlined rather than loaded as images, for the two reasons
   `ScaleIcon` above already documents: a loose file at the top of `svg_files/`
   is not served in production (`objectAssets` only mirrors `*_svg` folders),
   and an `<img>` cannot take a gradient fill. Each path below is the source
   file's own geometry, verbatim, against the file's own viewBox; the only
   change is `fill` pointing at a gradient defined beside it.

   The gradient ids are globally unique strings because SVG `url(#…)` is
   document-scoped — each of these renders exactly once per page.
   ========================================================================== */

/** The Apple-Intelligence ramp, as sampled off the reference: blue → violet →
 *  magenta → pink → orange, left to right. Shared with the ring and the
 *  gradient text in CSS (`--bento-grad-ai`); repeated here because an SVG
 *  gradient cannot read a CSS gradient token. */
function AiGradientStops() {
  return (
    <>
      <stop offset="0" stopColor="#3f8ff5" />
      <stop offset="0.25" stopColor="#6f77f4" />
      <stop offset="0.38" stopColor="#9a6bf2" />
      <stop offset="0.54" stopColor="#bb60c4" />
      <stop offset="0.66" stopColor="#cf5690" />
      <stop offset="0.78" stopColor="#dc5367" />
      <stop offset="0.89" stopColor="#dd6541" />
      <stop offset="1" stopColor="#da7a30" />
    </>
  )
}

/** `svg_files/mail.svg`, filled with the Apple Intelligence ramp. */
export function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="bento-grad-mail" x1="1" y1="0" x2="23" y2="0" gradientUnits="userSpaceOnUse">
          <AiGradientStops />
        </linearGradient>
      </defs>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 4C21.6569 4 23 5.34315 23 7V17C23 18.6569 21.6569 20 20 20H4C2.34315 20 1 18.6569 1 17V7C1 5.34315 2.34315 4 4 4H20ZM19.2529 6H4.74718L11.3804 11.2367C11.7437 11.5236 12.2563 11.5236 12.6197 11.2367L19.2529 6ZM3 7.1688V17C3 17.5523 3.44772 18 4 18H20C20.5523 18 21 17.5523 21 17V7.16882L13.8589 12.8065C12.769 13.667 11.231 13.667 10.1411 12.8065L3 7.1688Z"
        fill="url(#bento-grad-mail)"
      />
    </svg>
  )
}

/** `svg_files/cup-svgrepo-com.svg`, filled with the reference's warm
 *  orange→amber sun ramp. */
export function CupIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="bento-grad-cup" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef8441" />
          <stop offset="0.55" stopColor="#f5a341" />
          <stop offset="1" stopColor="#fbc247" />
        </linearGradient>
      </defs>
      <path
        fill="url(#bento-grad-cup)"
        d="M26.017 12.993c-0.261 0-1.1-0.005-2.010-0.011l0.003-1.999c0-1.104-0.895-2-2-2l-20.015-0.005c-1.105 0-2 0.896-2 2v15.030c0 3.314 2.687 6 6 6h12.020c3.314 0 5.969-2.686 5.969-6l0.002-1.026c0.907 0.007 1.831 0.012 2.031 0.012 3.305 0 5.986-2.657 5.986-5.971s-2.681-6.029-5.987-6.029zM21.985 26.008c0 2.206-1.762 4-3.969 4h-12.021c-2.206 0-4-1.794-4-4l-0.003-15.030 20.018 0.006zM26.017 23.023c-0.198 0-1.122-0.006-2.027-0.012l0.014-8.025c0.91 0.007 1.752 0.011 2.012 0.011 2.285 0 4.020 1.704 4.020 3.995s-1.734 4.032-4.019 4.032zM17.996 6.993c0.552 0 1-0.448 1-1v-5c0-0.552-0.448-1-1-1s-1 0.448-1 1v5c0 0.553 0.448 1 1 1zM5.996 6.993c0.552 0 1-0.448 1-1v-5c0-0.552-0.448-1-1-1s-1 0.448-1 1v5c0 0.553 0.448 1 1 1zM11.996 6.993c0.552 0 1-0.448 1-1v-5c0-0.552-0.448-1-1-1s-1 0.448-1 1v5c0 0.553 0.448 1 1 1z"
      />
    </svg>
  )
}

/** `svg_files/FAQ.svg`, filled with the reference's battery green ramp. */
export function FaqIcon() {
  return (
    <svg viewBox="0 -0.06 33.834 33.834" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="bento-grad-faq" x1="0" y1="0" x2="33.834" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5fc78a" />
          <stop offset="0.5" stopColor="#7ccb62" />
          <stop offset="1" stopColor="#9cdc4a" />
        </linearGradient>
      </defs>
      <g transform="translate(-95.748 -577)" fill="url(#bento-grad-faq)">
        <path d="M110.965,592.309a2.38,2.38,0,0,1,.489-1.434,9.29,9.29,0,0,1,1.443-1.482,10.139,10.139,0,0,0,1.321-1.372,1.985,1.985,0,0,0,.368-1.2,1.956,1.956,0,0,0-1.983-2,2.073,2.073,0,0,0-1.419.543,3.575,3.575,0,0,0-.954,1.582l-2.152-.939a5.029,5.029,0,0,1,1.724-2.656,4.626,4.626,0,0,1,2.9-.927,4.968,4.968,0,0,1,2.287.531,4.168,4.168,0,0,1,1.651,1.495,3.974,3.974,0,0,1,.612,2.175,3.688,3.688,0,0,1-.538,1.965,8.8,8.8,0,0,1-1.639,1.865,13.862,13.862,0,0,0-1.358,1.322,1.536,1.536,0,0,0-.379,1,2.85,2.85,0,0,0,.1.667h-2.2A2.737,2.737,0,0,1,110.965,592.309Zm1.467,6.968a1.851,1.851,0,0,1-1.357-.543,1.831,1.831,0,0,1-.551-1.359,1.875,1.875,0,0,1,.551-1.372,1.835,1.835,0,0,1,1.357-.556,1.87,1.87,0,0,1,1.909,1.928,1.834,1.834,0,0,1-.55,1.359A1.857,1.857,0,0,1,112.432,599.277Z" />
        <path d="M97.222,610.717a1.475,1.475,0,0,1-.626-.14,1.459,1.459,0,0,1-.848-1.333V580.572A3.576,3.576,0,0,1,99.32,577h26.69a3.576,3.576,0,0,1,3.572,3.572v20.416a3.576,3.576,0,0,1-3.572,3.571H106.038a2.555,2.555,0,0,0-1.637.594l-6.24,5.22A1.467,1.467,0,0,1,97.222,610.717ZM99.32,579a1.574,1.574,0,0,0-1.572,1.572V608.11l5.37-4.491a4.561,4.561,0,0,1,2.92-1.06H126.01a1.573,1.573,0,0,0,1.572-1.571V580.572A1.574,1.574,0,0,0,126.01,579Z" />
      </g>
    </svg>
  )
}

/**
 * `svg_files/weight-star.svg` — the project's own mark, on the feature card
 * where the reference had a MacBook glyph. Inlined rather than loaded as an
 * image for the usual two reasons: a loose file at the top of `svg_files/` is
 * not served in production (`objectAssets` only mirrors `*_svg` folders), and
 * `fill="currentColor"` is what lets it take the card's own ink, so it is the
 * same white as the headline under it rather than a white baked into a file.
 *
 * This is the second copy of these paths — `Logo.tsx` inlines the same mark
 * for the wordmark. They are deliberately not shared: SVG `url(#…)` is
 * document-scoped and both render on the home screen, so one component would
 * need a unique mask id per instance. Hence `feature-mark-cutout` here
 * against the wordmark's `logo-mark-cutout`. If the artwork is ever redrawn,
 * it has to be redrawn in both.
 *
 * `BentoGrid`'s `featureIcon` prop still replaces it.
 */
export function WeightStarMark() {
  return (
    <svg viewBox="0 0 100 115" aria-hidden="true" focusable="false">
      <defs>
        <mask id="feature-mark-cutout">
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
        mask="url(#feature-mark-cutout)"
      />
    </svg>
  )
}
