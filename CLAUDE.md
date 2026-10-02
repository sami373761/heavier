# HEAVIER — working notes

Vite + React 19 + TypeScript. A "which object is heavier?" game, 8 rounds.
Renamed from **Weight Game** to **Heavier** on 2026-09-29.

**`README.md` is the real architecture document and is kept current — read it
before changing anything structural.** This file holds only what the README
does not: working agreements, environment limits, and open decisions.

Two operator documents sit beside it and are also kept current: `MANUAL.md` is
the owner's reference — deployment, passwords, using the panel, troubleshooting
— and `DEPLOY.md` is the terse config reference it points at. If you change a
limit, an endpoint or an environment variable, those two are part of the
change.

## Commands

```bash
npm run dev               # Vite dev server → http://localhost:5173/ (no API)
npm run build             # tsc -b && vite build (one entry; admin is a lazy chunk)
npm start                 # production server → site + admin writes, one port
npm run typecheck         # tsc -b --noEmit (covers src/, server/ and scripts/)
npm run verify:admin      # 72 end-to-end checks; needs a build first
npm run admin:credentials # new admin username + password, printed once
```

There is still no test runner and no linter. The full automated gate is
`npm run typecheck` + `npm run build` + `npm run verify:admin`. The server is
plain `.mjs` typed with JSDoc and is inside the typecheck via `checkJs` in
`tsconfig.node.json` — keep it that way; it is the only thing standing behind
code that overwrites `items.json`.

**`npm run dev` has no API.** The Vite plugin that used to mount one is gone, so
the panel loads at its route but cannot save. Use `npm run build && npm start`
to work on the panel.

## Environment limits (important)

- **This directory is not a git repository.** There is no history, no diff, and
  no undo. Read a file before overwriting it, and prefer narrow edits over
  rewrites — a mistake cannot be reverted. The admin panel's writes are the one
  exception: `server/store.mjs` copies every file into `data/backups/` before
  changing it, which is the only rollback the project has.
- **Never point a running server at the real dataset while testing.**
  `scripts/verify-admin.mjs` sets `DATA_ROOT` to a temp directory for exactly
  this reason. Do the same for any manual experiment.
- **The UI can be seen, via Chrome.** The owner connected the Claude in Chrome
  extension on 2026-10-01 (`list_connected_browsers` → "Browser 1", macOS,
  local). Start the dev server, then navigate that tab to
  `http://localhost:5173/` and screenshot — or, for anything involving the
  panel's saves, `npm run build && npm start` on a temp `DATA_ROOT`, since the
  dev server has no API. **Use it** for anything visual: the
  checks below pass on UI that does not render at all, which is exactly how a
  cup that was never on screen got shipped. If it is not connected in a given
  session, ask — do not install a headless browser instead. The static checks
  remain useful as the first pass and as the only check in a cold session:
  1. `renderToStaticMarkup` on the real component tree via
     `npx vite-node` (handles the TSX/JSON/CSS imports) — this catches wrong
     markup, wrong data, missing assets, untranslated keys;
  2. computing the CSS box math across viewport widths for layout/overflow.
  Say plainly that this is what was checked; it is not a screenshot.
  One repeat of a trap already in here: a backgrounded tab runs no rendering
  steps, so a screenshot taken straight after a scroll can show an empty
  reveal-animated section that the DOM reports as fully visible. Take a second
  screenshot before believing the first.

## Invariants — do not break

- **One canonical weight**: `weightGrams`, always grams. Only
  `src/domain/units.ts` converts or formats it. The kg/lbs toggle is
  display-only and never reaches game logic.
- **Weight-ratio rule**: `MAX_WEIGHT_RATIO = 1.54` in `src/domain/pairing.ts`
  (set 2026-09-29, tightened from 2). The ratio is always computed
  heavier/lighter, so this single upper bound also expresses the mirrored
  ~0.65× lower bound — do not add a second constant for the lower bound.
  Changing it invalidates the pair counts quoted in the README.
- **`items.json` and `svg_files/` are never rewritten by the game.** The admin
  panel is the only writer, and only through `server/store.mjs` — which
  validates first, backs up, then writes atomically. Nothing in `src/` outside
  `src/admin/` may write to them. Adding an object is still a data entry plus an
  SVG; the panel just does both for you.
- **Nothing is fetched at runtime. Everything the browser loads is bundled.**
  `items.json` and `data/categories.json` are static imports, the object
  artwork is an `import.meta.glob` in `src/data/assets.ts`, and both fonts are
  `@font-face` URLs in `global.css` pointing at `src/assets/fonts/`. There is no
  boot request, which is what keeps every reader of `GAME_OBJECTS` synchronous
  without anything to await. Do not reintroduce a fetch for data or assets — not
  a CDN font, not a dataset endpoint, not a folder served by middleware. The
  known cost is that a panel edit reaches players only after `npm run build`,
  and that is accepted.
- **Object categories come from the `category` field in `items.json`.** The
  asset folder is only a fallback, and that gap is load-bearing now: an object
  the panel moved to another category keeps its original SVG path, so the two
  deliberately disagree and the field wins. Never hard-code object lists in
  components.
- **`CategoryId` is `string`, not a union.** Categories can be created at
  runtime, so a literal type cannot describe them. `src/data/categories.ts` is
  the registry: `CATEGORIES` is everything, and `homepageCategories()` is the
  subset with `showOnHome`. It is a **function**, not a constant — the flag
  arrives with the dataset at boot, so anything computed at import time is
  stale. Never reintroduce a hard-coded list of homepage categories.
- **`showOnHome` is presentation only.** It decides whether a category gets a
  homepage card and nothing else. Hiding one must never remove its objects from
  the question pool; `generateQuestions` does not look at categories at all, and
  it must stay that way.
- **`include_random` absent means true** — in `src/data/objects.ts`, in
  `server/store.mjs` and in the panel alike. The flag can only ever *remove* an
  object from the two whole-dataset modes, so a missing or unreadable value has
  to resolve to the inclusive reading or an older entry silently disappears from
  the game. Do not invert that default, and do not make the field required.
  `randomPoolObjects()` is the only filter: `GAME_OBJECTS` and
  `objectsInCategory` still contain the object, which is what keeps it on its
  category card. The flag is **not** a category filter — the invariant above
  still holds, and `generateQuestions` still never sees a category.
- **Player reports live 30 days and are then deleted.**
  `DISPUTE_RETENTION_DAYS` in `server/store.mjs` is the enforcing copy;
  `src/services/disputes.ts` holds a second one purely so the panel can print
  the number, because the browser cannot import a `.mjs` server module. There is
  no archive and no running total that survives a record — a rolled-up counter
  that outlived the rows it came from would quietly defeat the whole point, so
  do not add one. `readDisputes` filters and never writes; `pruneDisputes` is
  the only thing that deletes, and it must stay outside `serialize`'s nested
  reach (`appendDispute` already runs inside it and prunes for free by writing
  the filtered list back).

- **The admin panel is a route of the main app**, at the exact path in
  `src/admin/route.ts`. `src/main.tsx` matches the pathname and renders
  `AdminApp` instead of the game. It is behind a dynamic `import` so it is its
  own chunk — keep it that way, and keep the verification check that
  `X-Admin-Key` is absent from the entry chunk, which is what proves a player
  does not download the panel.
- **The panel's URL is not a secret and must not be treated as one.** The
  browser is what matches it, so it is in every player's bundle. The login is
  the entire control. Do not add anything that leans on the address being
  unknown, and do not write "secret path" back into the docs.
- **The login is `sha256(sha256(user:pass))` and nothing else.**
  `admin-credentials.json` holds that verifier; `src/admin/credentials.ts`
  derives the key in the browser and checks it; the server hashes the
  `X-Admin-Key` header and compares with `timingSafeEqual`. The double hash is
  load-bearing — the published value must stay one hash *past* the credential so
  it cannot be replayed as one. Never store, log or print a plaintext password,
  and never ship a single-hash verifier.
- **English (`src/i18n/locales/eng.ts`) is the reference locale**; its keys
  define the `Translation` type, so adding a key means adding it to all five
  locales or the build fails. No user-facing string may be hard-coded in a
  component — the FAQ is 101 keys for exactly this reason.
- **The product name lives in `app.name`** (identical in all five locales, by
  design) plus `<title>` in `index.html`. It is *one word*, and `Logo.tsx`
  branches on that: a one-word name takes the accent gradient whole, a
  two-word name colours only its second half.
- **`weight-game:` prefixes are not the product name.** They are the
  localStorage keys for language, unit and disputes
  (`PreferencesContext.tsx`, `services/disputes.ts`) and the console prefix.
  Renaming them silently discards every existing player's saved preferences
  and dispute reports. They survived the rename deliberately; leave them.
- **Secrets never enter the repo.** There is no `.env` any more — the only
  credential material anywhere is the one-line verifier in
  `admin-credentials.json`, which is a hash of a hash and is tracked on purpose
  (the app imports it). `npm run admin:credentials` prints the username and
  password once, to stdout, and writes neither to disk.
- **All colour resolves from the token block** at the top of
  `src/styles/global.css`. Since 2026-10-01 the palette is a pitch-black page
  (`--ink-900: #000000`, no texture on it), an Apple-dark neutral grey ladder
  for every surface (`--ink-850: #1c1c1e` through `--ink-600: #48484a`), and
  one brand ramp — `--spectrum`, blue `#3f8ff5` → violet → magenta → orange
  `#da7a30` — which is the ramp the bento's contact card was already wearing.
  The eight stops are tokens of their own because single-colour uses (a focus
  ring, a glow, one card's band) need a hue, not a gradient.
  Division of labour, and the reason for it: **type never sits on the ramp in
  white.** Every stop gives white 3.3:1 at best and `--accent-ink` (`#0b0b0d`)
  at least 5.4:1, so anything gradient-filled that carries a label carries dark
  ink. Beside the ramp sit **two gradients that are not cut out of it**, both
  arrived with the bento's icons and both since given jobs across the site:
  `--grad-warm` (the Buy Me a Coffee cup's, `#ef8441 → #f5a341 → #fbc247`)
  carries the wordmark, the primary CTA, the active unit pill, the categories
  eyebrow, the language ring and the default button's hover edge;
  `--grad-green` (the FAQ card's, `#5fc78a → #7ccb62 → #9cdc4a`) carries the
  whole questions section. Each must stay equal to the stops in its own icon —
  `CupIcon` and `FaqIcon` — because an SVG gradient cannot read a CSS one,
  which is the only reason there are two copies. The eight-stop ramp keeps the
  category bands and their balance pivots, **the contact card** (its ring, its
  "Star Games" text and `MailIcon`, which must stay one unit — the owner asked
  for the three-colour card and turning the ring warm on its own was rejected
  on 2026-10-01), and the page's focus colour. Check contrast before
  introducing a colour.
- **The gradient edge is one block, shared.** `.select::after`,
  `.button--ghost::after`, `.category-card::before` and `.faq__item::after` are
  declared together in the "Gradient edge" section and differ only in what
  triggers them. It is a masked pseudo-element rather than a real border
  because lighting up a gradient border must not move the box. Anything new
  that needs the same treatment joins that selector list; do not write a fifth
  copy of the mask.
- **The bento does not own any of its colours any more.** `--bento-grad-ai`,
  `--bento-grad-green`, `--bento-surface`, `--bento-ink` and friends are all
  aliases of the global tokens. `AiGradientStops` in `icons.tsx` still repeats
  the ramp's stops a third time, because an SVG gradient cannot read a CSS one
  — if the ramp ever changes, that is the copy that will be missed.
- **A section may re-point `--accent` on itself.** `.faq` does it (to the
  green) and `.category-card` does it (to its own band of the ramp). That is
  the whole mechanism behind both: everything inside already reads the token,
  so the keyboard focus ring and the balance pivot follow without their
  components knowing anything about sections or categories. Prefer this to
  adding a parallel token.

## Scope discipline

The owner asks for the smallest clean change that does the job and has
explicitly ruled out rewriting unrelated parts. Unless asked, leave alone:
the 8-question gameplay, question generation, the ratio logic, the language
system, the kg/lbs system, the dispute system, and the homepage hero scale.

Features deliberately **not** built (do not invent them): category quiz modes,
category scoring/progress/stats, daily questions, leaderboards, accounts, ads,
XP, streaks.

## Current state (as of 2026-10-01)

Twenty-seven changes landed, each verified with typecheck + build and, where it
was UI, with `renderToStaticMarkup` and — since the extension was connected — in
the browser. Game mechanics were not touched by any of them.

**Entry 26 reverted a lot of the architecture entries 8–17 built.** Several
entries below therefore describe how something *was* and no longer is: the
runtime dataset fetch (8, 17), the `/objects/` asset route (4, 13), the separate
admin entry and its session login (8), and the Google-hosted body font. The
entries are left as written — they are the record of why each decision was made,
and the reasoning is still worth having — but **entry 26 is what is true now**.
Read it before trusting any sentence above it about fetching, entries or auth.

1. **Ratio tightened to 1.54.** Dataset now yields 131 valid pairs (was 199).
2. **Homepage category cards.** Four cards below the hero, each rendering
   `BalanceScale` with `variant="mini"` and two objects drawn from its own
   category by `pickPreviewPair` (`src/domain/categoryPreview.ts`). Every
   scale dimension is a CSS custom property, so the mini variant is value
   overrides, not a second implementation. Now clickable (see 3).
3. **Page routing.** `src/state/useRoute.ts` (separate from the game reducer)
   switches between the game and a set of deliberately blank placeholder pages:
   Buy Me a Coffee — the footer area is now a button into the app, not an
   outbound link — and one per category, opened by the homepage cards. Since
   categories became data (8, 9) that is no longer a fixed five: every featured
   category has one. They all render `BlankScreen`; the header wordmark is the
   way back, and returning from a placeholder leaves a game in progress intact.
   No URL scheme: a page is a value, like the game phase beside it.
   On a card, only the name is a `<button>` — a balance is not phrasing
   content and cannot live inside one — stretched over the whole card by a
   `::after`.
4. **Favicon.** `index.html` points at `svg_files/weight-star-red.svg` by a
   *relative* href, which hands it to Vite's asset pipeline. It cannot use
   `/objects/...`: the `objectAssets` plugin only mirrors `*_svg` folders into
   `dist/`, so a loose file at the top of `svg_files/` would resolve in dev
   and 404 in production.
5. **Red palette.** Token-only recolour from the logo's three reds; the stage
   is now near-black mixed at the logo's hue (~347°) rather than blue-grey.
   Results kept their meaning but changed hue to stay distinct from a brand
   that is now red: `--wrong` moved towards orange (#ff7043), `--correct`
   cooled to #3ddc97. Every foreground/background pair clears WCAG AA (lowest
   4.54:1). Markup was not touched.
6. **Homepage FAQ.** Ten questions in `src/components/FaqSection.tsx`, which
   holds *only* the key order; all 101 strings live in the five locale files.
   Native `<details>`/`<summary>` so open state, keyboard and screen-reader
   semantics come free. Answers state the real mechanics (the ~54% bound,
   1 kg = 2.2 lbs with a gram fallback, 1 point × 8 plus a percentage) and
   quote each locale's own dispute label — if any of those change, the FAQ
   copy in five languages changes with them.
7. **Renamed to Heavier.** `app.name` × 5, `<title>`, README, this file, the
   CSS header comment, and the Buy Me a Coffee FAQ answer in all five
   languages. Internal `weight-game:` identifiers deliberately unchanged
   (see Invariants).
8. **Admin panel (2026-09-30).** A VPS-backed panel at a secret path, inside
   this project and on the same port. Adds `server/` (plain `node:http`, no
   dependencies), `src/admin/` as a second Vite entry, `scripts/admin-hash.mjs`
   and `scripts/verify-admin.mjs`, plus `DEPLOY.md` and `.env.example`. Objects
   and categories are created and edited on disk; analytics reads the dispute
   log through the game's own `aggregateDisputes`. Six files in `src/` changed:
   `data/objects.ts`, `data/categories.ts`, `domain/types.ts`, `main.tsx`,
   `services/disputes.ts`, and one import each in `screens/HomeScreen.tsx` and
   `CategoryCard.tsx`. Verified: 71 end-to-end checks, 131 valid pairs still,
   8 questions still, four homepage cards still.
9. **Category homepage toggle (2026-09-30).** `showOnHome` on every category in
   `data/categories.json`, a checkbox per row in the panel that saves on change
   (`PATCH /api/admin/categories/:key`), and a homepage grid that filters on it
   instead of using a fixed list. `categoryColumns` in `HomeScreen.tsx` picks
   the column count so the last row is not a single stranded card. Verified:
   71 server checks, static renders at 0/3/4/5 visible categories, and CSS box
   math confirming four cards land on the same pixels as the old
   `repeat(4, …)` grid.
10. **Guess the Weight mode (2026-09-30).** A second, fully independent game
    mode reachable from a second button on the home screen: one object shown at
    a time, a numeric guess in the current unit, then a tiered feedback card
    (Perfect/Very Good/Good/Close/Far, five exact colours as new `--tier-*`
    tokens). Adds `src/domain/guessQuestions.ts`, `src/domain/guessAccuracy.ts`,
    `src/state/useGuessGame.ts`, `src/components/GuessFeedbackCard.tsx`,
    `src/components/GuessProgressPips.tsx`, and three screens
    (`GuessGameScreen`, `GuessScoreScreen`, `GuessErrorScreen`). Extends (does
    not modify the logic of) `src/domain/units.ts` (`unitToGrams`, the reverse
    conversion), `App.tsx` (a `mode` switch alongside the untouched `useGame`
    phase machine), `HomeScreen.tsx` (a second CTA), and all five locale files
    (21 new keys each). The original heavier/lighter mode's reducer, question
    generation, ratio rule and screens were not touched. Verified: typecheck +
    build + 71/71 admin checks unchanged; `renderToStaticMarkup` across all
    five languages, both units, all five accuracy tiers, and every phase of
    both new screens (question/revealed/score/error), plus a cold-boot render
    of the untouched heavier mode to confirm it still comes up first.
11. **Exact-match celebration in Guess the Weight (2026-09-30).** A guess that
    lands on the exact gram now shows "Bullseye!" or "Spot On!" (random per
    round) on `GuessFeedbackCard`, with an animated multi-colour gradient
    background and a small sparkle flourish (`SparkleIcon` in `icons.tsx`) —
    `data-exact` on the card, checked as `percentDiff === 0`. It is still the
    `perfect` tier everywhere else (pips, the score screen's results list, the
    headline bands): only this one card's label and styling change for the
    instant it happens. No tier boundary, scoring formula, or other screen
    changed. Verified: typecheck + build + 71/71 admin checks unchanged;
    `renderToStaticMarkup` across 60 repeated exact-match renders (both labels
    appear), confirming non-zero "Perfect" and the other four tiers never
    carry `data-exact`, across all five languages.
12. **Four objects added to Stuff (2026-09-30).** `umbrella` (450 g),
    `bowling-ball` (5,400 g), `fire-extinguisher` (9,500 g) and `anvil`
    (50,000 g), supplied as SVGs plus JSON by the owner. Data only — no code
    changed. The supplied JSON was in the panel's input shape, not the file's,
    so it was converted: kg → grams, `svg` → `path`, `en/tr/es/de/fr` →
    `eng/esp/tur/fra/deu`, and the two underscored ids to dashes (`SAFE_KEY` in
    `server/store.mjs` forbids underscores). The four SVGs were renamed to match
    their ids (`stuff_svg/<id>.svg`, the convention `addObject` enforces), which
    also got the Turkish characters out of `yangın-söndürme-tüpü.svg`. Artwork
    needed no editing: `ObjectImage`'s `brightness(0) invert(1)` flattens the
    umbrella's four-colour art to the same white silhouette as everything else.
    Dataset is now 67 objects and **153 valid pairs** (was 63 / 131); README and
    MANUAL counts updated with it. Verified: typecheck + build + 71/71 admin
    checks; `renderToStaticMarkup` of each new object in all five languages
    (white-filter `<img>` class, correct `/objects/` src, real name per locale),
    partner lists per object (umbrella 2, bowling-ball 8, fire-extinguisher 7,
    anvil 5), and 400 Stuff-card renders in which all six objects appear.
13. **Scale icon on the Guess the Weight CTA (2026-09-30).** The supplied
    `svg_files/tartı.svg` now sits before the label on the home screen's second
    CTA. It is **inlined** as `ScaleIcon` in `src/components/icons.tsx` (the
    file's own viewBox, group transform and three paths, verbatim) rather than
    loaded as an image, for two reasons: `fill="currentColor"` is the only way
    the artwork can match the label's colour *and* follow `.button--ghost`'s
    hover from `--text-dim` to `--text`, and a loose file at the top of
    `svg_files/` is not served in production anyway — `objectAssets` only mirrors
    `*_svg` folders (same trap as the favicon, see 4). One new CSS rule,
    `.button svg { width: 1.1em; flex: none }`: `.button` was already
    `inline-flex` with `align-items: center` and `gap: 8px`, so alignment came
    free, and 1.1em (17.6px) is deliberately just under the tightest line box any
    font in the stack gives the label at `button--large` (18.4px), so the icon
    cannot make this CTA taller than the primary one beside it. No existing
    `.button` contains an `svg`, so that rule reaches only this icon. The source
    file is left in place, untouched and now unreferenced. Verified: typecheck +
    build + 71/71 admin checks; `renderToStaticMarkup` of `HomeScreen` in all
    five languages — exactly one icon, before the label, `currentColor` and
    `aria-hidden`, never leaking into the other CTA — plus the icon's path data
    confirmed present in `dist/assets/main-*.js`.
14. **Footer removed; coffee moved beside the questions (2026-09-30).** The
    home screen's lower half is now one row, `.home-support`, split 50/50 on the
    same 1240px measure as `.home-layout`: `FaqSection` left, the new
    `src/components/CoffeeSection.tsx` right. `src/components/SiteFooter.tsx` is
    **deleted** (a copy is in this session's scratchpad, since there is no git),
    along with `.site-footer` and `.coffee-link` in the CSS, and `.app` dropped
    to `grid-template-rows: auto 1fr`. `App.tsx` no longer renders a footer and
    passes `openCoffee` down to `HomeScreen` as a new `onOpenCoffee` prop — the
    route itself is untouched, so the panel still opens the same blank coffee
    page. `CoffeeSection` reuses the one existing string (`footer.coffee`) and
    copies the category card's pattern: only the heading is a `<button>`,
    stretched over the panel by a `::after`, with the coffee mark beside it
    decorative. `align-items: stretch` makes it a true half instead of a small
    card at the top of a tall column. Verified: typecheck + build + 71/71 admin
    checks; `renderToStaticMarkup` of the whole `App` (no `<footer>`, no
    `.site-footer`, no `.coffee-link` anywhere) and of `HomeScreen` in all five
    languages (questions before coffee, ten questions intact, one button, the
    section still labelled by its heading); the built CSS confirmed to have
    dropped both old selectors; and CSS box math at eight viewport widths —
    591.2 / 574.4 / 478.9px per column down to the 1080px breakpoint, exactly
    half each, then stacked with the questions back on their 760px measure.
    Consequences, both inherent to the request: **coffee is now reachable from
    the home screen only**, not from a game in progress or a placeholder page;
    and the key is still called `footer.coffee` — renaming it would touch five
    locale files for no user-visible gain, the same reasoning as the
    `weight-game:` prefixes.

15. **Coffee panel links out (2026-10-01).** `.coffee__open` is now an
    `<a href="https://buymeacoffee.com/sam10" target="_blank"
    rel="noopener noreferrer">` instead of a `<button>`, with the same stretched
    `::after`, so a click anywhere on the half — mark included — opens Buy Me a
    Coffee in a new tab and a game in progress survives. It gets a link's
    affordance (underline on panel hover) but no permanent underline, which
    would fight the heading it sits in. The mark beside it is the original flat
    `CoffeeIcon` in its circular `.coffee__mark`, unchanged.
    Consequences: `onOpenCoffee` is gone from `App.tsx` and `HomeScreen.tsx` and
    **the app's own blank coffee page is unreachable** — `openCoffee` and its
    `BlankScreen` branch are left in place rather than ripped out, there being
    no git. The address lives in `CoffeeSection.tsx` and nowhere else.
    Verified: typecheck + build + 71/71 admin checks; `renderToStaticMarkup` of
    `HomeScreen` and `CoffeeSection` across all five languages (one anchor, the
    right href/target/rel, each locale's own label, no `<button>` left in the
    panel, FAQ and cards untouched); and in the browser — the icon rendering at
    78px in its ring, no console errors, `elementFromPoint` at the panel's
    centre returning the `<a>`.

    **A turning 3D cup was built here and then cancelled by the owner**, so the
    panel keeps the flat icon "for now". Both attempts are fully reverted: no
    `CoffeeCup3D.tsx`, no `.cup` rules, no `--cup-*` tokens, and `three` and
    `@types/three` uninstalled (game bundle back to 81.5 kB, no second chunk).
    Three things learned there are worth keeping:
    - **CSS 3D on a `<span>` renders nothing.** Inline boxes ignore `width`,
      `height` *and* `transform`. The first cup collapsed to zero and shipped
      that way because `renderToStaticMarkup` sees markup, never layout.
    - **Static renders are not a substitute for looking.** One screenshot found
      three bugs at once, including a CSS block replacement that had silently
      swallowed `.coffee__title` and `.coffee__open`.
    - **The extension's tab is backgrounded** (`visibilityState: 'hidden'`), so
      it runs no rendering steps: `requestAnimationFrame` never ticks and
      `ResizeObserver` never delivers, while screenshots force a frame — which
      makes measurements lag behind a picture that looks right. Reload at the
      size you want to test rather than resizing a live page.

16. **Apple bento grid; coffee section replaced (2026-10-01).** The home
    screen's lower half is now `src/components/BentoGrid.tsx`, a rebuild of an
    Apple MacBook-Pro bento the owner supplied as a screenshot. Four cards on
    two columns and three rows, the two tall ones interlocking around the two
    short ones exactly as the reference does: a feature card (the supplied
    `photos/panda4k.jpeg` under a scrim, spanning rows 1-2 left), a contact card
    inside the gradient ring (row 1 right), Buy Me a Coffee (row 3 left) and an
    FAQ link (rows 2-3 right). `FaqSection` moves below it, full width, and
    **`src/components/CoffeeSection.tsx` is deleted** along with `.coffee*` and
    `.home-support` in the CSS (copies of all three in this session's
    scratchpad; there is no git).

    Geometry was **measured out of the screenshot**, not guessed — a PNG decoder
    in the scratchpad (`png.mjs`, `scan.mjs`, `arc.mjs`, `ramp2.mjs`, `box.mjs`,
    `runs.mjs`) sampling edges, corner arcs, colour ramps and type metrics. The
    corner arc fits a 39.4px radius in a 1747px-wide frame; taking that as
    Apple's standard 28px fixes the frame's scale at 1.407, and 1747/1.407 =
    1242 — i.e. the reference layout is 1240px wide, the measure this project
    already uses. Everything else falls out of that scale: 22px gutters, 227px
    rows, 48px padding, 28px radius, a 4px ring drawn *outside* the card box,
    surface `#1c1c1e` on a black page, `#f5f5f7` ink, `#86868b` secondary.
    Headlines are 42px/48px on the tall cards and 35px/43px on the short ones,
    derived from cap heights (43px and 36px in frame coords).

    That is what `--px` is for: `calc(100cqw / 1240)` on `.bento__grid`, one
    *reference* pixel, so every length is `calc(n * var(--px))` and the grid is
    pixel-exact at 1240px and a proportional scale of itself at any other width.
    It needs a container rather than the viewport because `.site-main` has
    padding — hence `container-type: inline-size` on `.bento` and the unit on
    its child, since **an element is never its own query container**. Below a
    900px container the grid stacks and `--px` switches to
    `clamp(0.56px, 100cqw/700, 1px)` so type stops shrinking with the column.

    The three gradients are sampled values, not invented: the Apple Intelligence
    ramp runs purely left-to-right (the ring's left edge is a constant
    `#4190f4` and its right a constant `#da7a30`, which is how the direction was
    established), and the gradient text repaints that whole ramp across its own
    width. It lives twice on purpose — `--bento-grad-ai` in CSS for the ring and
    the text, `AiGradientStops` in `icons.tsx` for the SVG, because an SVG
    gradient cannot read a CSS one.

    The three supplied SVGs (`mail.svg`, `cup-svgrepo-com.svg`, `FAQ.svg`) are
    **inlined** in `icons.tsx` with their own geometry verbatim, for the two
    reasons entry 13 already gives: a loose file at the top of `svg_files/` is
    not served in production, and an `<img>` cannot take a gradient fill. The
    feature card's icon was `BentoIconSlot`, a white outline at the reference
    glyph's proportions, replaced by passing `featureIcon` to `BentoGrid`.
    (It is `WeightStarMark` now — see entry 21.)

    **The font is the site's own, by the owner's instruction mid-build** — the
    first pass used `-apple-system`/SF Pro to match the reference literally and
    that was rejected. `.bento-card__headline` now joins the shared
    display-face selector list and everything else inherits the body face. The
    measured sizes carried over unchanged: Audex's cap height is 0.732em against
    the reference face's 0.714em, a 3% difference.

    Two cards are whole-card `<a>` elements, which is why the headings inside
    them are `<span>` rather than buttons. The FAQ card is `href="#faq"`, and
    `FaqSection`'s `<section>` gained `id="faq"` as its target. Eight new keys
    per locale; `bento.faq.*` is **before/accent/after** rather than one
    sentence, so Turkish can lead with the highlighted phrase while the other
    four lead into it.

    Verified: typecheck + build + 71/71 admin checks; `renderToStaticMarkup` of
    `BentoGrid` in all five languages (four cards, the right grid classes, the
    coffee href/target/rel, the `#faq` anchor, the photo URL, exactly one of
    each of the three gradient ids and three references to them, no
    untranslated keys, the accent phrase really inside the gradient span, no
    control inside either link card) and of the whole `App` (no `.home-support`,
    no `coffee__`, no `<footer>`, and categories → bento → questions in that
    order with exactly one `#faq` and one link to it); the built CSS confirmed
    to have dropped every `.coffee*` and `.home-support` selector and to carry
    `.bento-card__headline` in the display-face list; and CSS box math at 19
    viewport widths — exact reference values (1240/22/48/28/4/227/42/35) at any
    viewport ≥ 1320px, the aspect and the radius:card ratio preserved to 2e-4
    across every two-column width, and nothing below 13px or 120px of text
    column down to 360px.

    **Not verified in a browser — the Chrome extension was not connected this
    session** (`list_connected_browsers` → `[]`). Everything above is static
    analysis, which entry 15 is explicit about not being a substitute for
    looking. The things to look at first, in the order they are most likely to
    be wrong: whether Audex at 42px reads like the reference's semibold or needs
    its `letter-spacing: -0.012em` revisited, whether the photo scrim
    (`52% → 76% → 92%`) sits right under *this* photo rather than Apple's,
    whether the sampled ramps look as saturated on screen as they do in the
    screenshot (video compression dulls them, so they may want lifting), and
    whether the 900px container breakpoint is where two columns actually stop
    working.

    Consequences, both deliberate: the contact card is **not a link** — no
    address was given, and inventing one is not a layout decision; and the
    feature card ships the placeholder glyph until a real mark is passed in.

17. **`include_random` on every object (2026-10-01).** A new boolean in
    `items.json`, `true` on all 67 entries — nothing is switched off, so the
    game plays exactly as it did. It decides whether an object may be drawn by
    the two modes that pick from the whole dataset; `false` keeps it to its own
    category. The field was inserted by line, not by a JSON round-trip: the diff
    is exactly 67 added lines and no existing byte moved.

    The filter is one accessor. `src/data/objects.ts` parses `include_random`
    into `includeRandom` (absent means true, see the invariant) and `regroup`
    now fills a second in-place array beside `OBJECTS_BY_CATEGORY`, exposed as
    `randomPoolObjects()`. Three call sites switched from `GAME_OBJECTS` to it:
    `useGame.ts`, `useGuessGame.ts` and the homepage hero pair in
    `HomeScreen.tsx`. The hero is in because it is the heavier/lighter mode's
    shop window and draws across categories; `pickPreviewPair` and the category
    cards are deliberately **not** — a `false` object is still its category's,
    which is the whole point of the flag. `pairing.ts`, `questions.ts`,
    `guessQuestions.ts` and the ratio rule were not touched: they take the list
    as an argument, so this was a different call, not a different generator.

    Server side, `server/store.mjs` takes `include_random` as an **optional**
    field on both object endpoints: strict about the wire (anything that is not
    a boolean is a 400, like `showOnHome`), inclusive when absent, and an edit
    that omits it keeps what the entry had. `createObject` writes it in the key
    position the file uses (`id, weight, path, category, include_random,
    names`); `updateObject` normalises it onto an entry that lacked it.
    `server/api.mjs` passes the field through on POST and PUT.

    In the panel it is an **Include in the random modes** checkbox, using the
    existing `.admin-check` pattern rather than a new control — no CSS changed.
    It is on both forms: `NewObjectScreen` (ticked by default, reset after a
    save, and the success line says so when it is off) and `ObjectsScreen`'s
    edit form, which also marks a switched-off row as `category only` in its
    meta line. Unlike the category toggle this one saves with the form, not on
    click, because it sits in a form that already has a Save button.

    Verified: typecheck + build + **82/82** admin checks (71 + 11 new: the
    default on create, a non-boolean refused, an edit that omits the flag
    keeping it, an edit that sets it, the flag in the public boot payload, and
    an object created with it off); `vite-node` on the real modules — 67
    objects and 153 pairs unchanged, then `hydrateDataset` with one object
    flipped off, confirming the pool drops exactly that one, the object stays in
    `GAME_OBJECTS` and in `objectsInCategory`, an entry with the field deleted
    stays in, and it never appears across 400 games of each mode;
    `renderToStaticMarkup` of both panel screens (one checkbox, ticked by
    default, an excluded row marked once, an open row's box matching
    true/false/absent).

    **Not looked at in a browser — the Chrome extension was not connected this
    session** (`list_connected_browsers` → `[]`), so the panel's new checkbox
    has not been seen. A throwaway server was left ready for it (see the open
    decision below). The game's markup did not change at all, which is the one
    reason that gap is smaller than entry 16's.

18. **`showOnHome` on category create was being dropped (2026-10-01).** The
    panel's "Show on homepage straight away" checkbox had never worked:
    `server/api.mjs` called `createCategory({ key, names })` and left
    `body.showOnHome` behind, so a category created with the box ticked still
    started hidden. `createCategory` in `store.mjs` already handled the field —
    only the call site was short. One-line fix, found while adding the object
    flag in entry 17.

    Verified: 85/85 (82 + 3: created featured is accepted, the response says so,
    and `data/categories.json` stored it). One existing check had to change with
    it — "the other categories were not disturbed" counted featured categories
    and expected exactly 5; it now names the keys it expects, so adding a
    category to the fixture cannot break it again.

19. **Dark-theme overhaul, spectrum palette and scroll reveals
    (2026-10-01).** A styling pass over the whole site, asked for as a list.
    Three files changed and one was added; no game logic, no markup structure,
    and — explicitly ruled out by the owner — **no typography**. Not one
    font-family, size, weight or tracking value moved. Every colour below is a
    token edit.

    **The palette.** The page is pure `#000000` with nothing on it: the crimson
    wash and the dot grid are gone, because on a page whose surfaces are
    `#1c1c1e` an unbroken black ground is what makes them read as panels. The
    `--ink-*` ladder is now Apple's dark greys (`#1c1c1e` / `#2c2c2e` /
    `#3a3a3c` / `#48484a`) instead of red-tinted near-blacks, `--line` is a
    neutral white hairline instead of a pink one, and `--text` / `--text-dim` /
    `--text-faint` are `#f5f5f7` / `#a1a1a6` / `#86868b` — the bento's own two
    greys, extended into a three-step ramp. The three logo reds are **gone from
    the token block**; `--spectrum` and its eight stops replace them (see the
    invariant above). `--accent` is the violet stop, `--accent-ink` went from
    `#2a0409` to a neutral `#0b0b0d`, and `--shadow-accent` is now an indigo
    glow. `--correct`, `--wrong` and the five `--tier-*` colours were **not**
    touched: they carry meaning, not brand.

    **What the ramp now reaches.** The wordmark (`--accent-gradient`, which
    `.logo__accent` already read). The primary CTA, which is the one place the
    whole ramp is used as a *fill* — dark ink on it, per the contrast rule. The
    balance's pivot, with a glow of its own hue. Both section eyebrows, as
    gradient text (`width: fit-content` + auto margins, or a short centred
    label clipped out of a full-width box would only ever show the middle of
    the ramp). The active unit pill and the open FAQ chevron take a three-stop
    gradient instead, because a 30px pill cannot show eight stops without
    smearing. (Entry 20 reassigned several of these; see it for what each one
    wears now.)

    **The four category cards** each own one band: `--card-a`/`--card-b` set by
    `nth-child(4n + …)` on `.categories__grid > .category-card`, fed back into
    `--accent-gradient` and `--accent` *on the card*. That is the whole
    mechanism — `BalanceScale` already reads both tokens, so the pivot dot
    recolours per card without the scale knowing categories exist, and the
    hover edge, the drop glow and the focus ring follow for free. Blue, violet,
    rose, orange in reading order, which is also the order of a 2x2 block.
    No component changed.

    **The language select's ring** is the item the owner called out by name: it
    used to show the global pink `:focus-visible` outline the moment you clicked
    it, and now shows a masked gradient ring in the coffee cup's own ramp
    (`--grad-warm`, equal to `CupIcon`'s stops), with the chevron warming to
    `#f5a341`. It is driven by `.select:has(.select__input:focus)` — `:focus`
    rather than `:focus-visible`, since a `<select>` takes focus on click and
    that click is exactly the moment being restyled.

    **Scroll reveal** on the bento and the questions, the two sections named.
    `src/components/useReveal.ts` is a hook returning `{ ref, data-reveal }` to
    spread on an element — deliberately not a wrapper component, because
    `.bento` is a container-query container and `.faq` is sized by the grid
    above it, so an inserted div would change what they measure. One
    IntersectionObserver per section, disconnected on first intersection:
    scrolling back up does not replay it. The CSS uses an `@keyframes`
    animation, not a transition, because `.bento-card--link` and `.faq__item`
    already transition their own hover properties and a second `transition` on
    the same element replaces rather than adds. The bento staggers along its
    own diagonal (feature → contact → faq → coffee, 80ms apart); the questions
    stagger on `--reveal-i`, the index `FaqSection` sets inline, capped at
    eight so a long list still finishes in about half a second.
    `prefers-reduced-motion` gets the content with no travel and no delay.

    Two consequences worth knowing. **A static render now shows
    `data-reveal="out"`**, which with no JS means the bento and the questions
    are `opacity: 0` — `renderToStaticMarkup` still sees the markup, but
    anything judging visibility from a static render will be wrong about those
    two sections. And **the `:focus` ring cannot be exercised from the
    extension's tab**: `document.hasFocus()` is `false` there, so Chrome does
    not match `:focus` at all. It was confirmed by forcing the rule on with an
    injected stylesheet, then removing it.

    Verified: typecheck + build + 85/85 admin checks, and **in the browser** —
    home at 1440px and at 430px, the whole stagger caught mid-flight and
    settled, an open FAQ item (gradient edge, violet question, gradient
    chevron), a hovered category card (its own orange band and glow, the
    neighbour's rose pivot beside it), both CTAs hovered, the forced language
    ring, a round of the heavier mode through to its result, and a clean
    console on reload.

20. **Warm and green reassigned over the spectrum (2026-10-01).** A
    refinement pass on entry 19's palette, asked for as two lists. CSS plus one
    `className` in `FaqSection`; no other markup, no logic, no typography. The
    owner's first instruction was **do not touch the scales**, so the hero
    pivot, the four category bands and every `--card-a`/`--card-b` value are
    exactly as entry 19 left them.

    **The two gradients stopped being decoration and became the palette's main
    voices.** Both came in with the bento's icons; both are now root tokens
    with the ramp relegated to structure. `--grad-warm` — the coffee cup's
    `#ef8441 → #f5a341 → #fbc247` — took the wordmark, the "what you'll be
    weighing" eyebrow, the active kg/lbs pill, the primary CTA (fill, plus a
    warm `--shadow-accent` to replace the indigo glow) and the default button's
    hover edge, joining the language ring it already had. `--grad-green` was
    promoted out of `.bento__grid` into the token block as the FAQ card's
    `#5fc78a → #7ccb62 → #9cdc4a`, and `--bento-grad-green` is now an alias of
    it.

    All of it survives the contrast rule the same way: warm at its darkest stop
    gives `--accent-ink` 8.6:1, green more, so both can carry a label — which
    is what made the unit pill and the CTA possible as *fills* rather than
    edges. `--grad-cool` had nothing left to do and was deleted.

    **The questions section is green end to end.** `.faq` re-points `--accent`
    and `--accent-hot` on itself, which is what carries the colour into the
    keyboard focus ring without naming it there; the eyebrow, the open item's
    gradient edge, its question text and its chevron all take `--grad-green`.
    The open question's text is the one place that needed markup: the gradient
    goes on a new `.faq__question-text` span rather than on `.faq__question`,
    because the chevron lives in that summary too and `background-clip: text`
    on the parent would have taken the chevron's filled circle with it.

    The two eyebrows no longer share a ramp, so the merged rule now carries
    only the shared box mechanics (`width: fit-content` and the clip) with one
    `background-image` each.

    **The contact card was tried in warm too, and rejected.** I suggested it
    on the grounds that its ring was the last place the eight-stop ramp was
    visible and might read as a leftover; the owner looked at it and said no,
    the "Bize Ulaşın" card is to stay three-colour. Fully reverted — ring,
    "Star Games" text and `MailIcon` are on the ramp exactly as entry 16 built
    them, `--spectrum` and both `--bento-grad-*` aliases are back, and
    `icons.tsx` has `AiGradientStops` again with `CupIcon` keeping its own
    three stops. **Do not revisit this**: the ramp on that one card is a
    decision, not an oversight.

    Verified: typecheck + build + 85/85, and in the browser at 1440px — the
    four warm targets together in one frame with the scales visibly unchanged
    beside them, the ghost CTA hovered next to the filled primary, an open FAQ
    item showing the green edge, green gradient question text and green
    chevron under a green eyebrow, and the contact card back on its ramp.

21. **The weight-star mark on the feature card (2026-10-01).**
    `svg_files/weight-star.svg` replaces the placeholder outline the bento
    shipped with. `BentoIconSlot` became `WeightStarMark` in `icons.tsx`,
    **inlined** rather than loaded as an image for the two reasons entries 4
    and 13 already give — a loose file at the top of `svg_files/` is not
    served in production, and `fill="currentColor"` is the only way the mark
    takes the card's own ink. It is literally the same white as the headline
    under it: both compute to `rgb(245, 245, 247)`, since the mark inherits
    `--bento-ink` through `.bento-card__icon--mark`'s `color`.

    Two things to get right, both checked in the browser:
    - **The mask id.** These paths are now the second copy — `Logo.tsx`
      inlines the same artwork — and SVG `url(#…)` is document-scoped, so two
      `#cutout` masks on one page would collide and the second would win for
      both. The ids are `feature-mark-cutout` and `logo-mark-cutout`.
      Confirmed distinct in the DOM, and the wordmark still renders.
      Sharing one component would need a unique id per instance, which is why
      the duplication is deliberate rather than an oversight.
    - **The box ratio.** The mark is portrait (100 x 115) where the
      reference's glyph was landscape (123 x 72), so a 123 x 72 box would have
      letterboxed it into dead space. `.bento-card__icon--mark` is 67.8 x 78
      — the FAQ card's glyph height, so the two tall cards line up, with the
      width falling out of 100:115. Measured at 0.8692 against the artwork's
      0.8696, so no distortion and no letterboxing.

    `margin-bottom` is unchanged at 36px, and the card's headline, scrim,
    photo and copy were not touched. Verified: typecheck + build + 85/85.

22. **Game-flow restyle: tier gradients and a warm game flow (2026-10-01).**
    Asked for as three things — the purple border in Guess the Weight does not
    fit, the result cards should be a light gradient of their *own* colour
    rather than flat (a red one stays red), and free rein on the rest of the
    game pages. CSS only: `src/styles/global.css` is the single file that
    changed. No markup, no component, no logic, no typography, and none of the
    home screen.

    **Each tier gained a `-lift` and a `-grad`.** The lift is the readable end
    of the same hue, the gradient is lift-to-base on the diagonal, and the five
    `--tier-*-soft` flat fills they replace are **deleted** (nothing in `src/`
    read them any more — checked before removing). The feedback card and the
    score screen's result rows now share one tier block — a `[data-tier]` sets
    four values and both read them, instead of two parallel ladders. Same for
    results: `--correct-grad` and `--wrong-grad` wash the heavier mode's
    revealed cards in green and orange, with a glow of the same hue under each.
    Every stop of every one of these is the hue it already was; the point was
    depth, not a recolour.

    The lift also fixed a real legibility bug that predates this pass: the
    feedback card's big label and the results row's tag were painted in
    `--tier-color`, so a "Very Good" round printed `#077b39` on `#1c1c1e` and
    was close to invisible. Both take the lift now. The percentage pill still
    takes the base with its contrast-checked `--tier-*-ink`, which is the only
    place a tier colour is a solid fill.

    **The game flow re-points `--accent` on itself** — `.game, .guess, .score,
    .notice` → `--warm-lift` / `#fbc247` / `--grad-warm`, the same mechanism
    `.faq` uses for the green. That is what removed the purple: the guess
    field's ring, the dispute chips' hover, the keyboard focus ring and the
    score's big number were all reading the global violet while sitting next to
    a warm CTA. `--warm-lift: #f5a341` is new beside `--green-lift`, for the
    same reason that one exists. Nothing re-points `--correct`, `--wrong` or
    any `--tier-*`.

    The guess field's ring is now the shared **gradient edge** rather than a
    flat border colour, and `.card` (the heavier mode's two choices) joined the
    same block for its hover — so that selector list is six now, not four, and
    still one copy of the mask. Both needed `position: relative` added.

    Free-rein changes, all small: the guess mode's object got the same panel
    the heavier mode's choices stand on (`--ink-850`, hairline, `--radius-lg`)
    with a low warm radial behind it — it used to float in the middle of a
    black page with no sense of scale; the field grew 320px → 360px; the score
    screen's big number is painted in `--grad-warm` through
    `background-clip: text` (`width: fit-content`, or a full-width box shows
    only the middle of the ramp — same trap as the eyebrows in entry 19), its
    percentage pill is a warm fill with dark ink, and `.score__fraction` carries
    a warm radial as its own background so the result does not float either.

    Verified: typecheck + build + 85/85, and **in the browser** at 1440px and
    430px — a full heavier round through to the score screen (hover edge,
    correct and wrong washes, the dispute chips warm), the guess mode's field
    ring, all five tier cards side by side as clones of the real card (every
    label legible, every card its own hue), and a whole guess game through to
    the results list with a `perfect` row among seven `far` ones.

23. **Guess the Weight goes two columns; the Next button was below the fold
    (2026-10-01).** Asked for as "upgrade the game flow UI, using Chrome", and
    the browser is what found it: played through both modes in the extension and
    measured every phase. The heavier mode fit at every step (0 overflow); the
    guess mode's **revealed** phase did not. Stacked in one column it came to
    886px against a 788px viewport — **98px of overflow, with "Next round" off
    screen** — because the result card is ~130px taller than the form it
    replaces, which is why the question phase fit and only the reveal broke.

    The fix is layout, not shrinkage: on a viewport over 900px the screen is two
    columns, the object panel and its name on the left, prompt + field + result
    on the right, on `.game`'s own 900px measure so both modes share a width.
    Six `grid-template-areas` slots; the form and the result card **share the
    `entry` slot**, so the reveal swaps inside one cell instead of reshaping the
    column. Revealed height is now 434px and the page does not scroll.

    One markup change, `src/components/screens/GuessGameScreen.tsx`: the stage
    and the name are wrapped in `.guess__object`. They had to travel together —
    with the name as a direct child it landed in the row the Next button sets
    and floated 42px off the panel it labels, and no amount of `align-self`
    fixes that across two different rows. The wrapper is `align-self: start`
    rather than centred, so the object keeps its place when the taller card
    arrives instead of sliding down half the difference. `.guess__name`'s
    negative `margin-top` went with it: it existed only to cancel the section's
    24px gap, and the wrapper's own `--gap-sm` governs now. Below 900px the
    original single column returns on its 560px measure, wrapper included — the
    stack order is unchanged.

    Nothing else moved. The diff is `.guess*` selectors only (checked against a
    copy of the file), so the heavier mode, both score screens and the tier
    colours from entry 22 are untouched.

    Verified: typecheck + build + 85/85, and **in the browser** — both modes
    played end to end at 1440x788, the guess mode at 0 overflow with the panel
    measured in the same place before and after reveal, the one-column fallback
    at 500x723 (reveal fits, name hugs the panel), the heavier mode's revealed
    card confirmed pixel-identical to before, the guess score screen's results
    list intact, and a clean console.

    **Known limit:** below roughly a 600px-tall viewport the revealed guess
    screen still needs a small scroll (67px at 1280x543). That is the general
    short-viewport condition, not something this introduced — the heavier mode
    overflows by 132px at the same size and always has. Fixing it properly means
    making `.site-main`'s block padding height-aware, which touches every screen
    and was not asked for.

24. **Category cards stack on a phone again (2026-10-01).** A specificity bug
    found while checking narrow viewports for entry 23, fixed on the owner's
    say-so. CSS only, three selectors.

    `.home-layout .categories__grid` is re-declared inside the 1080px block, and
    at two classes it outranked the bare `.categories__grid` rules in the 960px
    and 520px blocks that were supposed to take over below it — so those two
    blocks had never once applied. The comment above `.home-layout` stated the
    opposite in so many words ("take over exactly as before"), which is probably
    why it went unnoticed. The cards stayed four-across all the way down:
    measured at a 500px viewport, four columns of **103.75px** each.

    The fix is the `.home-layout` prefix on all three rules in those two blocks,
    which makes them equal in specificity to the 1080px rule and lets source
    order decide — and they sit at the foot of the file, so the narrower rule
    wins. Note the other obvious-looking fix, dropping `grid-template-columns`
    from the 1080px block, does **not** work: the base `.home-layout` rule is
    `min(columns, 2)`, so a phone would get two columns rather than one. Both
    comments were corrected to say what actually governs.

    `.categories__grid` only ever renders inside `.home-layout` (one place,
    `HomeScreen.tsx`), so nothing else could have been reading the unprefixed
    rules.

    Verified: typecheck + build + 85/85, and in the browser at four widths —
    500px gives one column of 380px with the section capped at 380 (was 4 x
    103.75), 614px gives two columns of 270px, 1024px is unchanged at four
    columns of 128px, and 1440px is unchanged at the 2x2 of 288px cards beside
    the hero.

    **Not changed, and worth knowing:** between 960px and 1080px the grid is
    four columns of ~128px, which is cramped. That band predates this fix and is
    unaffected by it — neither narrow block matches there. Widening the
    two-column rule from 960px to 1080px would fix it, but that is a look
    decision on a width nobody asked about.

25. **Shareability, language URLs and keyboard play (2026-10-01).** Asked for as
    a list of five, after an analysis pass: social tags, language routing with
    hreflang, a Wordle-style share button, the category centring bug, and
    in-game keyboard shortcuts. No gameplay changed — the reducers, question
    generation, the ratio rule and both scoring formulas were not touched.

    **Language URLs.** `src/i18n/languageRoute.ts` is new and is the whole
    scheme: English at `/`, every other locale under its own `LOCALE_TAGS`
    segment (`/es/`, `/tr/`, `/fr/`, `/de/`), built from that one table so a
    sixth language needs no second list. Precedence at boot is **URL → storage →
    browser**: a link to `/tr/` opens Turkish for everyone, while a bare `/`
    still honours a returning visitor's stored choice and then *rewrites the
    address to match it* (`normaliseLanguagePath`, a `replaceState`, so the Back
    button is not spent on a URL nobody chose). `/en/` is accepted and
    normalised to `/`. `setLanguage` pushes a real history entry and a
    `popstate` listener reads the language back out of the path — on that path
    only, a bare `/` means English, because once you have navigated the address
    is authoritative. The server needed **no change at all**: the SPA fallback
    already answers any unknown path with `index.html` (verified by curl against
    a real `npm start` on a temp `DATA_ROOT`).

    `src/i18n/documentHead.ts` keeps the language-dependent half of `<head>` in
    step — `lang`, description, `og:locale`, `og:url`, canonical — and pins the
    last two to `window.location.origin`, which is what lets the placeholder
    domain in `index.html` be wrong without the canonical tag or the share link
    ever being wrong. The static half (card type, image, the six hreflang links)
    stays in `index.html` because **a scraper does not run JavaScript**; that is
    also why the placeholder `https://heavier.example.com` has to be replaced at
    deploy time, and DEPLOY.md and MANUAL.md both now say so.

    **The social card.** `public/og-image.jpg` is the first thing this project
    has ever put in `public/` — deliberately, because a fingerprinted asset URL
    would break every previously posted link on the next build. It was composed
    in a throwaway `og-card.html` at the project root (the real Audex wordmark
    on the warm ramp, elephant vs car on a tilted beam) and shot in Chrome; the
    file is deleted and a copy, with the exact regeneration recipe in its head
    comment, is in this session's scratchpad. Two traps if it is ever redone:
    `rsvg-convert` cannot see Audex (its fontconfig ignores `FONTCONFIG_FILE`,
    so it silently renders Helvetica), and `sips -c` crops **centred only** —
    `--cropOffset` is accepted and ignored, which is why the card is centred in
    the viewport before the screenshot rather than pinned to the corner.

    **Sharing.** `src/domain/shareResult.ts` builds the text and nothing else:
    score, one mark per round, link. Spoiler-free by rule — no object and no
    weight — so posting a result cannot ruin a round. Circles for the
    heavier/lighter mode (🟢/🔴), squares for Guess the Weight
    (🟩🟨🟧🟥⬛, `ACCURACY_TIERS` in order), which also tells the two modes
    apart in a feed. `ShareButton` tries the Web Share API, then the async
    clipboard, then a hidden-textarea `execCommand` — the last is not
    superstition, it is the path an insecure origin takes, since
    `navigator.clipboard` is undefined outside a secure context. The link is
    `urlForLanguage(language, currentOrigin())`: the language root, not the
    current path, because whoever opens it should get the game in the language
    it was played in.

    The confirmation line took **three attempts**, and the two failures are the
    reason it is where it is. Under the button: as soon as the actions row
    wrapped (it does at 500px) it landed on top of "Back to start". As a
    `flex-basis: 100%` row between the buttons: it broke the line, so "Back to
    start" sat alone on its own row *at every width* — a layout change to the
    score screen nobody asked for, and only visible once the window finally
    resized past 500px. It is now `position: absolute` on `.score__actions`
    itself: out of flow, below the whole block however many rows that block
    has, and nothing follows it to collide with. Measured at 1366px and 500px:
    the actions block is the same height before and after a copy (54 → 54), and
    the status overlaps no button in either layout.

    **Keyboard.** `src/state/useGameKeys.ts`, bound to the window rather than to
    the cards so it works before anything has been tabbed to, handlers in a ref
    so the listener attaches once. Two different guards, and the difference is
    the point: arrows stand down inside `INPUT`/`TEXTAREA`/`SELECT`, Enter
    stands down on those **plus** `BUTTON`/`A`/`SUMMARY`, so tabbing to "Next
    round" and pressing Enter fires the button once instead of twice. Guess the
    Weight gets the advance key only — there are no sides — and its guess field
    keeps Enter because the target is an input.

    **The centring fix** is one declaration: `margin-inline: auto` on
    `.home-layout .categories` inside the 520px block. The 380px cap there is
    narrower than the column between roughly 440px and 520px of viewport, so the
    whole section hung off the left edge while everything above and below it
    stayed full width. Measured at a 500px viewport: cards ended at 400px
    against a 465px content edge, now 53–433 against a page centre of 242.5.

    **Two small things had to change for the project's own test method.**
    `currentOrigin()` and `currentPathname()` in `languageRoute.ts` return
    `''`/`'/'` when there is no `window` — not defensive programming, but what
    keeps the score screens and `PreferencesProvider` renderable by
    `renderToStaticMarkup`, which is how this project checks UI without a
    browser. Reading `window.location` directly in those two places broke it.

    Verified: typecheck + build + 85/85 admin checks; `renderToStaticMarkup` of
    both score screens in all five languages (one live region each, three
    buttons, no untranslated keys, renders with no `window`) plus the share text
    for both modes; curl against a real production server for `/`, `/tr/`,
    `/de/`, `/en/`, `/og-image.jpg` and `/api/objects`; and **in the browser** —
    `/tr/` and `/fr/` opening in their own language with assets intact, `/en/`
    normalising to `/`, a stored German preference rewriting `/` to `/de/`, the
    language select pushing `/de/` with German head tags and Back returning to
    `/` in English, a whole heavier game played end to end on ← → and Enter
    (including Enter doing nothing while a question is open), Guess the Weight
    advancing on a real Enter, the share text matching the pips exactly, and the
    categories section measured centred at 500px (53–433 against a page centre
    of 242.5) and unchanged at 1366px.

    **Known gap, and a warning about the tooling.** The real clipboard write
    could not be confirmed in the extension's tab: `document.hasFocus()` is
    false there, so `writeText` rejects and the code correctly falls through to
    `execCommand`, which fails for the same reason. The fallback chain, the
    confirmation line and the share text itself were exercised with a stubbed
    `writeText`; the one thing unproven is that a focused browser actually puts
    the text on the clipboard.

    The browser tooling misbehaved for most of this session in two ways worth
    recognising next time, because both look like product bugs and are not:
    **the window refused to resize** (it sat at 500px CSS for an hour, reporting
    success on every resize call, then started working again), and **real key
    events stopped being delivered** to a tab that had gone
    `visibilityState: 'hidden'` — `window.__k` recorded no `keydown` at all. The
    second was worked around with a dispatched `KeyboardEvent`, and both the
    guess mode's Enter and the whole heavier-mode game were re-confirmed with
    real keypresses once the tab recovered.

26. **Architecture reverted: bundled assets, panel folded into the app
    (2026-10-01).** Asked for as two strict rules — remove every external or
    secondary fetch for SVGs, fonts and assets, and stop running the admin panel
    as a separate entry/API, putting it at one exact route inside the app with a
    hashed credential. No gameplay changed: both reducers, question generation,
    the ratio rule and both scoring formulas were not touched, and no locale
    file changed.

    **Rule 1 — everything the browser loads is now a local bundled file.**
    - *Fonts.* `index.html` was loading Space Grotesk from `fonts.googleapis.com`
      — the only third-party request the site made. The two subsets it actually
      needs (`latin`, `latin-ext`; Vietnamese dropped, no locale uses it) are now
      `src/assets/fonts/SpaceGrotesk-*.woff2` with the original `unicode-range`
      declarations kept, so Latin-only pages still skip the extended file. The
      `<link>`s and both `preconnect`s are gone.
    - *Artwork.* `src/data/assets.ts` is now an `import.meta.glob` of
      `svg_files/**/*.svg` with `query: '?url'`, keyed by the dataset's own
      `path`. Vite emits each SVG as a fingerprinted asset. The
      `objectAssets` plugin in `vite.config.ts` and the server's `/objects/`
      route are **deleted** — the `*_svg`-only mirroring trap that entries 4 and
      13 describe is gone with them, since the glob takes whatever is there.
      A path with no file resolves to `''` and `ObjectImage` shows its existing
      placeholder.
    - *Data.* `src/data/dataset.ts` is **deleted** along with `loadLiveDataset`
      and `hydrateDataset`; `main.tsx` no longer awaits anything.
      `data/categories.json` became a static import in `src/data/categories.ts`,
      hydrated at module load, so `hydrateCategories` is internal now. Module
      order does the sequencing that the old boot fetch did by hand:
      `objects.ts` imports `categories.ts`, so the registry is full before the
      first object is parsed.

      **The cost, accepted explicitly:** a panel edit is on disk at once but
      reaches players only after `npm run build`. The panel says so on every
      screen; README, MANUAL and DEPLOY all say so.

    **Rule 2 — one app, one bundle, one server.**
    - `admin.html` and `src/admin/main.tsx` are **deleted**. `main.tsx` renders
      `AdminApp` when `isAdminRoute(location.pathname)` matches the exact 95-char
      route in `src/admin/route.ts`, behind `React.lazy` so the panel is its own
      chunk (19 kB + 6 kB CSS) that players never fetch — confirmed in the
      browser. `AdminApp` imports `global.css` and `admin.css` itself, since it
      is the entry now.
    - **The server lost three files.** `api.mjs`, `auth.mjs` and `config.mjs`
      are deleted and `svg.mjs` was folded into `store.mjs`; what is left is
      `index.mjs` (serving + routing + the key check) and `store.mjs` (disk).
      `store.mjs` was **ported, not rewritten** — the backup/atomic-write/
      serialize machinery and every validator are byte-for-byte what they were,
      with `PATHS` inlined off `DATA_ROOT` and `readDataset` swapped for
      `readAdminData`. That was deliberate: it is the code that overwrites
      `items.json` and there is no git.
    - **Ten endpoints became five** (plus the public dispute write). The three
      read endpoints collapsed into `GET /api/admin/data`, and `session`,
      `login` and `logout` are gone entirely. `AnalyticsScreen` is a pure
      function of its props now rather than fetching its own records.
    - **Auth.** `admin-credentials.json` holds `sha256(sha256(user:pass))` and
      nothing else. The panel derives the key from the form and verifies
      locally, so a wrong password costs no request; the key then rides every
      write in `X-Admin-Key`. No cookie, no CSRF header, no rate limiter, no
      session store, no `.env`. `ADMIN_VERIFIER` overrides the file, which is
      how `verify-admin.mjs` runs against a throwaway credential.
      `scripts/admin-hash.mjs` → `scripts/admin-credentials.mjs`, which prints a
      generated username and a 24-character password **once** and stores only
      the verifier.

      Two things to say out loud about this, both inherent to what was asked and
      both now in the docs: the panel's URL is in every player's bundle and is
      **not a secret**, and the login needs `crypto.subtle`, which browsers only
      expose on HTTPS or localhost — over plain HTTP to an IP it cannot run at
      all.

    **Fallout handled.** `.gitignore` stopped ignoring `data/` wholesale, since
    the app now imports `data/categories.json` and a checkout without it cannot
    build (only `data/disputes.json` and `data/backups/` are ignored).
    `.env.example` deleted. `tsconfig.app.json` names the two new JSON imports.
    `vite.config.ts` is four lines of config and no plugins. The entry chunk is
    `index-*.js` now, not `main-*.js` — anything grepping the build output has
    to know that.

    `scripts/verify-admin.mjs` was rewritten for the new surface: **67 checks**
    (was 85), dropping the ones for endpoints that no longer exist and adding a
    group that checks the *build output*, which is where this architecture can
    regress silently — artwork and both fonts emitted as bundled files, nothing
    in `index.html` loading from another origin, and `X-Admin-Key` absent from
    the entry chunk.

    Verified: typecheck + build + 67/67, and **in the browser**, against the
    real built site on a throwaway `DATA_ROOT` — the homepage in Turkish with
    every silhouette and both fonts rendering and `performance.getEntriesByType`
    showing **zero** cross-origin requests; a heavier/lighter round played to its
    reveal; a dispute filed with the flag button and traced to the temp
    `disputes.json`; the panel's login at the exact route, signed into with the
    generated credentials; an object's weight edited and confirmed in the temp
    `items.json` with a backup written beside it; all four tabs, including the
    random-modes checkbox that entry 17 had never had a browser for; that
    dispute showing up in Analytics; and the game page loading one JS file and
    never the admin chunk.

    **Not checked:** uploading a real SVG through the panel's file picker (the
    server-side rules are covered automatically, the browser half of that form
    is not), and the panel at phone width.

27. **Bento 10% shorter; the reveal now waits for a scroll (2026-10-01).**
    Two things, the second found by the owner looking at the first. CSS plus
    one hook; no markup, no logic, no typography, no locale file.

    **The two tall cards are 10% shorter.** The feature card spans grid rows
    1-2 and the FAQ card rows 2-3, so they **share row 2** — shortening that
    one row alone takes the height off both and leaves the two short cards, in
    rows 1 and 3, at the reference's 227px. 476 (two rows + a gutter) less 10%
    is 428.4, so row 2 is 227 - 47.6 = **179.4**. `grid-template-rows` is
    therefore a three-value list rather than a `repeat(3, …)`. Both tall cards
    bottom-align their content, so the 47.6px that went was exactly the empty
    space above it, which is what the owner asked to remove. The stacked
    variant below the 900px container took the same 10% (472 → 424.8,
    330 → 297).

    Row 3 resolves to 245.3, not 227 — the coffee card's own content asks for
    it, and it did before this change too. So the FAQ card lands at 446.7
    (-9.6%) rather than a flat -10%; the feature card is 428.4 exactly.

    **The reveal.** The owner reported the bento already visible on page open.
    It was not this change: the reveal fires on the section's **top** edge,
    which is 734px down the page and did not move — measured at 734 in both
    versions — and the trigger threshold is unchanged at a viewport over about
    **816px tall**, above which the bento is simply on screen at load. The
    stagger then played to an empty room and was long finished by the time
    anyone scrolled down, which reads as "it was always there". A tall enough
    window had always done this.

    `useReveal` now passes the reveal through `afterFirstScroll`: crossing into
    view is necessary but no longer sufficient, so a section a tall window
    already shows waits for the reader to move before it plays. A page that
    opens already scrolled (a reload part-way down, an anchor) runs at once.
    `UNSCROLLED_FALLBACK_MS` is 2000 — a reader who never scrolls is not left
    looking at a gap where a section in plain sight should be. The hook returns
    its own teardown, so a section unmounted before it fires leaves no listener
    and no timer. `REVEAL_ROOT_MARGIN` was **not** touched.

    Verified: typecheck + build + 67/67, and **in the browser** against the
    real built site on a throwaway `DATA_ROOT` — the rows measured at
    `227 / 179.4 / 245.3`; no content spill and no card overlap at eleven
    container widths from 360 to 1240px; six consecutive loads all opening
    `data-reveal="out"`; the gate exercised by hiding `.home-layout` to put the
    bento on screen at `scrollY: 0`, where it held `out` through 1005ms and
    flipped `in` 250ms after a real scroll, and on a second load held `out` at
    1802ms and came `in` by 2503ms on the fallback alone; and the untouched
    normal path — bento below the fold — still opening `out` and staggering in
    on a real scroll, caught mid-flight and settled.

    **A trap worth keeping.** The first `in` I saw was on the dev server's
    first cold load and never reproduced — not in dev, not in production, not
    with the web font forced off (the bento's top is 734 either way). A single
    observation on a cold `npm run dev` is not a bug; reload before believing
    it. The window also refused to resize for most of the session and then
    applied a resize several calls late, which is entry 25's warning again.

28. **More air between the home screen's three sections (2026-10-01).** The
    bento and the questions sat too close to what was above them. Both are
    separated by their own `margin-top`, and both carried the same
    `clamp(48px, 8vw, 80px)`; it is now `clamp(88px, 12vw, 144px)` on each.
    One value edited twice in `global.css` — no markup, no logic, no
    typography, and nothing inside either section moved.

    Measured in the browser at 1440px: both gaps are 144px (were 80).
    Verified: typecheck + build. `verify:admin` was **not** run — the owner
    asked that no new server be started this session, and nothing outside the
    stylesheet changed.

29. **Player votes get a 30-day life, and the panel says so (2026-10-01).**
    Asked for as: keep the up/down votes in a file inside the project, with a
    counter, visible for 30 days, then deleted outright to free the space —
    and keep it simple. Most of it already existed: votes have gone to
    `data/disputes.json` since entry 8 and are counted per object on the
    panel's Analytics tab. What was missing was the window and the purge, so
    that is all this adds. No gameplay changed and the flag button players use
    was not touched.

    **The server.** `DISPUTE_RETENTION_DAYS = 30` in `server/store.mjs`.
    `readDisputes` now filters expired records out of what it returns and still
    never writes; a new `pruneDisputes` is the only thing that deletes them from
    disk, and it is a no-op when nothing has expired. A record whose
    `createdAt` is missing or unparseable counts as expired — the alternative is
    a row nothing can ever clean up. The write half of `appendDispute` became
    `writeDisputes`, so a new vote prunes for free: it writes `readDisputes()`
    back out with the new record on the end.

    **Three sweep points, which is what makes the promise real:** every new
    vote (free, above), `GET /api/admin/data` (so what the panel shows and what
    is on disk are the same set), and once at server start — the case where
    nobody is voting any more and nobody opens the panel. `pruneDisputes` must
    stay out of anything already inside `serialize`, or it deadlocks on its own
    queue; that is why `readDisputes` stayed a pure read.

    **The panel.** `AnalyticsScreen` gained a "Last report" column, a totals
    line above the table (*N reports on M objects — x heavier, y lighter*, plus
    the oldest record still kept, i.e. the next one to go), and a sentence
    saying reports are kept 30 days and then deleted, so a count that falls
    does not read as a bug. `aggregateDisputes` was **not** touched — it is
    still the one definition of what a vote counts as — and the two new numbers
    are computed locally from the same records. No CSS changed; the new column
    and the totals line use the existing `admin-table` / `admin-note` classes.

    Verified: typecheck + build + **72/72** admin checks (67 + 5 new, all
    against the real server on a throwaway `DATA_ROOT`: a 31-day-old report and
    an undated one are absent from the panel *and* gone from the file after the
    sweep, while a 29-day-old one and the fresh one survive);
    `renderToStaticMarkup` of `AnalyticsScreen` with a four-report fixture
    (totals line, per-row last-report dates, an object no longer in the dataset
    still counted) and of its empty state.

    **Not looked at in a browser.** The owner asked that no new server be
    started this session, and the one already running is from an older build,
    so the panel's new column was checked statically only. The server half is
    covered by the 72 checks, which do start their own throwaway server.

### Dataset gotchas

- Category sizes are lopsided: animal 48, food 7, stuff 6, vehicle 6. The Stuff
  card draws freely from all six since 2026-09-30 (it used to be stuck on
  bed-lamp + cooking-pot); under the 1.54 rule, though, stuff and vehicle still
  have exactly one *in-category* valid pair each, which is why the category
  cards deliberately ignore that rule.
- Two objects can never appear in a question under the 1.54 rule:
  `sperm-whale` (40,000 kg, nearest is the zeppelin at 8,000 kg) and `cherry`
  (10 g, nearest is the seahorse at 20 g — exactly 2×). This is handled, not a
  bug; nothing searches for them.
- Four pairs weigh exactly the same and are excluded as unanswerable:
  bandicoot/turtle, squid-animal/cooking-pot, gazelle/lamb, sea-lion/tapir.

### Picking this back up

The owner stepped away on 2026-09-30 with everything green. Before touching
anything:

1. `npm ci && npm run typecheck && npm run build && npm run verify:admin` —
   expect 72/72. (Build before verifying; the last checks read `dist/`.) If it
   is not green, that is the first thing to fix, not a reason to start the
   requested work.
2. Read `MANUAL.md` for what the owner has in their hands, then the README for
   the architecture. The open decisions below are the backlog; none of them is
   started.
3. The deployed VPS (if there is one) has its own `items.json`, `svg_files/` and
   `data/` that this repo does not. Objects the owner added through the panel
   live only there. Never assume the local `items.json` is what production has.

### Open decisions awaiting the owner

- The Stuff card renders as **"Objects"** in English — the pre-existing
  `category.stuff` translation — though the owner's spec called the card
  "Stuff". Left as-is rather than rewriting translations; offered to change it.
- `cherry` became unreachable as a side effect of the 1.54 rule. Adding an
  object around 13–15 g would bring it back into play.
- **The placeholder pages are identical and empty**, so a category page gives
  no sign of which category you opened. Blank was the instruction; a heading per
  page is a one-line change if that reads as broken. See also the entry on
  category pages below, which is the same gap seen from the panel's side.
- **No URLs *for pages*.** Languages have addresses now (entry 25), but the
  placeholder category pages still do not: they are not linkable or bookmarkable
  and the browser Back button does not leave them. `languageRoute.ts`
  deliberately carries whatever follows the language prefix through untouched,
  so a real page router can be added on top of it without revisiting any of
  that — but it is still a router decision, not a patch.
- **`package.json` still says `"name": "weight-game"`.** Left alone because
  `package-lock.json` carries the same name in two places and there is no git
  to undo a mismatch; it is not user-facing.
- The tagline key `app.tagline` exists in all five locales and is rendered
  nowhere. **`footer.coffee` is now in the same position** — the bento's coffee
  card uses `bento.coffee.title` instead. Both were left in place rather than
  deleted from five locale files for no user-visible gain.
- **The bento's contact card goes nowhere.** It says "Contact Us / Star Games"
  beside a mail icon and is not a link, because no address was given. A
  `mailto:` or a form is a one-line change once there is somewhere to point it.
- **The feature card now wears the project's own mark** (`WeightStarMark`,
  `svg_files/weight-star.svg` inlined), in the card's own white. Its headline
  is still placeholder copy ("Under Construction / Coming Soon") and the card
  is still not a link; `featureIcon` on `BentoGrid` still overrides the mark.
  Note the mark's paths exist **twice** — here and in `Logo.tsx` — on purpose:
  SVG `url(#…)` is document-scoped and both render on the home screen, so the
  masks are `feature-mark-cutout` and `logo-mark-cutout`. Redrawing the
  artwork means redrawing both.
- **The panel has now been used in a browser** (entry 26): the login, all four
  tabs, a real save, and the random-modes checkbox entry 17 had never seen. The
  recipe, since it is still the only safe way to do it: copy `items.json`,
  `data/categories.json` and `svg_files/` into a temp directory, then
  `DATA_ROOT=<temp> PORT=8123 HOST=127.0.0.1 node server/index.mjs` and browse
  `http://127.0.0.1:8123`. `localhost` is a secure context, so the login works
  without TLS. **Never point it at the real dataset.**
- **The bento has now been looked at in a browser** (entry 19, 2026-10-01), at
  1440px and at 430px: the layout, the ring, the photo scrim and the one-column
  stack all hold up, and the ramp reads as saturated on screen as it does in
  the screenshot, so the "may want lifting" worry at the end of entry 16 is
  settled. Still unchecked from that list: whether Audex at 42px reads like the
  reference's semibold, and whether 900px is where two columns actually stop
  working — both were looked *past* rather than at.
- **The panel is English-only.** The game speaks five languages; its admin tool
  speaks one, on the grounds that it has exactly one user. Translating it would
  mean 60-odd new keys in five locale files.
- **A featured category with fewer than two objects shows an empty balance.**
  `pickPreviewPair` needs a pair. The stage reserves the mini scale's height so
  the card still lines up with its neighbours, and the panel warns before you
  switch such a category on, but the card itself is blank. A placeholder mark
  would be a small addition if that reads as broken.
- **Category pages are still the shared blank `BlankScreen`**, including for
  categories created in the panel. A `guns` card opens a page that says nothing
  about guns.
- **Objects cannot be deleted** and categories cannot be renamed or removed.
  Both would have to rewrite entries that point at them, with no git to undo it.
  `data/backups/` makes it recoverable but not safe.
- **A restart signs the owner out.** Sessions are in memory on purpose. If that
  becomes annoying on a box that restarts often, the fix is a signed
  long-lived cookie, not a session file.
- **The panel's route is a constant in `src/admin/route.ts`** and is matched in
  the browser, so it ships in every player's bundle. It is not configurable and
  not a secret; changing it means editing that file and rebuilding. If the
  address ever needs to be genuinely unguessable, the only thing that would
  work is matching it on the *server* and serving a different HTML entry —
  which is the arrangement entry 26 deliberately removed.
