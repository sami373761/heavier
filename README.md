# Heavier

Two objects, one question: **which one is heavier?** Eight rounds, then a score.

```bash
npm install
npm run dev               # http://localhost:5173 — the whole site, no server needed
npm run build             # type-check + production build into dist/
npm start                 # the production server (site + admin writes, one port)
npm run verify:admin      # 72 end-to-end checks against a throwaway dataset
npm run admin:credentials # new admin username + password, printed once
```

React + TypeScript on Vite. No state-management library, no i18n library, no CSS
framework, and a server with no dependencies either: plain `node:http` and
`node:crypto`. The app is small enough that none of them earn their weight.

**Everything the browser loads is a local file.** The dataset, the artwork, both
fonts and the social-card image are bundled by Vite at build time; the running
page makes no request to anywhere for any of it, third-party or otherwise. The
server exists for one reason — so the admin panel can write to disk — and the
game never calls it.

---

## The two supplied inputs

`items.json` and `svg_files/` are the project's source material. **The game only
ever reads them**; the only thing that writes is the admin panel, through
`server/store.mjs`.

- **`items.json`** — 67 objects to begin with, each with an `id`, a `weight` in
  grams, a `path` into `svg_files/`, a `category` (`animal`, `food`, `vehicle`,
  `stuff`, or one created in the panel), an `include_random` flag, and names in
  five languages. Loaded and validated by `src/data/objects.ts`, which renames
  `weight` to `weightGrams` (so the canonical unit is explicit at every call
  site) and `include_random` to `includeRandom`, and resolves the category. `category` is the source of truth; the asset folder an object lives
  in carries the same information and is used as a fallback, so an entry written
  before the field existed still loads — and so an object the panel moved
  between categories can keep its original SVG where it is. One malformed entry
  is skipped with a console warning rather than breaking the game.

  The file is a **bundled import**: Vite reads it at build time and the dataset
  is in the JavaScript before a line of app code runs. Nothing is fetched and
  nothing is awaited, which is what keeps every reader of `GAME_OBJECTS`
  synchronous — and what makes `npm run dev` the whole game with no server
  running. The cost is the other side of the same coin: an object added in the
  panel is on disk at once but reaches players on the next `npm run build`.

  `include_random` decides whether an object may be drawn by the two modes that
  pick from the whole dataset — heavier/lighter and Guess the Weight. `false`
  keeps it to its own category: it stays in `GAME_OBJECTS` and on its category
  card, and only `randomPoolObjects()` leaves it out. **An absent field means
  true**, in the game, in the server and in the panel alike, so an entry written
  before the flag existed is in. Every supplied object is `true`; the flag is
  set when an object is added or edited in the panel.
- **`svg_files/`** — the object artwork, all solid `#000000` / `#231F20`
  silhouettes. `src/data/assets.ts` globs the whole folder
  (`import.meta.glob('../../svg_files/**/*.svg', { query: '?url' })`), so Vite
  copies every file into the build with a fingerprinted name and
  `objectAssetUrl` turns a dataset `path` into that name with a map lookup. The
  artwork is an ordinary bundled asset — there is no middleware serving the
  folder and no `/objects/` route — and **adding an object is still data plus a
  file, nothing else**. The silhouettes are recoloured to white in CSS
  (`brightness(0) invert(1)`), never by editing the files. A dataset path with
  no file behind it resolves to an empty string, and `ObjectImage` renders its
  labelled placeholder rather than a broken image. The loose marks at the top of
  `svg_files/` are not objects: the tab icon in `index.html` reaches
  `weight-star-red.svg` by a *relative* href, which hands it to the same asset
  pipeline, and the marks that need a gradient or `currentColor` are inlined in
  `src/components/icons.tsx`.

## Canonical weight

There is exactly one weight per object, in **grams**. All gameplay — pair
validation, the heavier/lighter comparison, scoring — runs on that number.

`src/domain/units.ts` is the only module allowed to convert or format it.
Conversion uses the game's deliberately clean `1 kg = 2.2 lbs` (not 2.20462) and
does not round: 7 kg reads as `15.4 lbs`, 7.3 kg as `16.06 lbs`. Values are
snapped at six decimals purely to remove binary floating-point noise — since
canonical weights are whole grams, a pound value has at most four real decimals,
so nothing a conversion actually produces is ever lost. Below 1 kg, kilogram mode
falls back to grams so a cherry reads `10 g` rather than `0.01 kg`.

## Question generation

The rule: the two objects must be close in weight, `max/min <= 1.54`, with an
exact 1.54× difference still valid — the heavier object is at most ~54% heavier
than the lighter one. Because the ratio is always taken heavier/lighter, that
single bound also expresses the mirrored lower bound of ~0.65×. Categories are
ignored — animal vs. vehicle is a perfectly good question if the weights are
close.

The pool is `randomPoolObjects()`, not the whole dataset: an object with
`include_random: false` is skipped here and in Guess the Weight. Every supplied
object is in, so the counts below are the counts for the full 67. The flag is
not a category filter — generation still never looks at a category.

`src/domain/pairing.ts` sorts objects by weight, which turns "every valid partner
of object *i*" into a contiguous window of strictly heavier objects. Each
unordered pair is owned by exactly one index (its lighter member), and a running
count of window sizes lets `drawPair` pick a **uniformly random valid pair
without ever materialising the pair list** — O(n log n) to build, O(n) memory,
O(log n) per draw. Generation draws valid pairs by construction rather than
guessing and re-testing, so a sparse dataset can't degrade into endless retries;
every search is bounded and falls back to a deterministic scan.

Two notes about the current dataset, both handled rather than patched:

- **Equal weights are excluded.** Four pairs in the dataset weigh exactly the
  same (bandicoot/turtle, gazelle/lamb, sea-lion/tapir, squid/cooking-pot).
  "Which is heavier" has no correct answer for them, so `isValidPair` rejects
  ratio 1. 153 valid pairs remain — far more than the 8 a game needs.
- **Two objects have no valid partner.** `sperm-whale` (40,000 kg) is too far
  from the next heaviest object, the zeppelin at 8,000 kg; `cherry` (10 g) is
  exactly 2× from the seahorse at 20 g, outside the 1.54 bound. They simply
  never appear in a question; nothing searches for them.

If a dataset ever can't produce eight unique questions, the game shows an error
screen instead of an invalid game (`ErrorScreen`).

## A second mode: Guess the Weight

A completely independent mode, picked from a second button on the home screen —
the ghost CTA carrying the scale icon (`ScaleIcon` in `src/components/icons.tsx`,
the supplied `svg_files/tartı.svg` inlined so it takes the label's own
`currentColor`, hover included).
It shares the dataset, the unit system and the i18n system with heavier/lighter
but has its own reducer, its own question generator and its own screens — the
two modes never touch each other's state, and nothing about the original game
changed to make room for this one.

`src/domain/guessQuestions.ts` has no pairing rule to satisfy: any object can be
guessed on its own, so it just shuffles the pool — the same `randomPoolObjects()`
the other mode draws from — and takes eight.
`src/domain/guessAccuracy.ts` is the scoring rule, independent of React or i18n:
`computeAccuracy(guess, actual)` returns the absolute percentage difference and
buckets it into one of five tiers, boundaries upper-inclusive —

| Tier | Percentage difference |
|---|---|
| Perfect | ≤ 5% |
| Very Good | ≤ 10% |
| Good | ≤ 20% |
| Close | ≤ 30% |
| Far | > 30% |

— each tier with its own colour, specified exactly rather than derived from the
brand palette: `--tier-perfect` / `--tier-very-good` / `--tier-good` /
`--tier-close` / `--tier-far` in the same `:root` token block as everything
else, so the "all colour comes from tokens" rule still holds even though these
five didn't come from the logo. Each base colour carries two companions: a
`-lift`, the readable end of the same hue, for type and edges on the dark card
(the base green `#077b39` all but vanishes as text on `#1c1c1e`); a `-grad`,
lift-to-base on the diagonal, which is the wash the result card and the score
screen's result rows wear instead of a flat tint; and an `-ink` for the one
place the base is used as a solid fill, the percentage pill. Every stop of a
tier's gradient is that tier's own hue — the "Far" card is red at both ends,
lighter at the top-left and nearly gone at the bottom-right — so the wash adds
depth without ever shifting what the colour means.

`src/state/useGuessGame.ts` mirrors `useGame`'s shape (phase, questions, answers,
error, `start`/`answer`/`advance`/`goHome`) but answers carry a guess in grams,
the actual weight, the percentage difference and the tier — there is no
correct/wrong to track. `overallAccuracy` is a separate number from any one
round's percentage difference: it is the average of each round's closeness
(`100 - percentDiff`, floored at 0), rounded, and is what the score screen's
headline reads — reusing the exact `score.headline.*` bands the heavier mode
uses, just applied to a percentage instead of a fraction.

A guess is typed in whichever unit the header toggle is set to and converted
back to grams by `unitToGrams` in `src/domain/units.ts` (the reverse of
`formatWeight`), so it is compared against the canonical weight like everything
else. `App.tsx` holds a small `mode` value (`'none' | 'heavier' | 'guess'`,
local to the `Game` component, not part of either reducer) that decides which
mode's screens are on screen; picking one calls that mode's own `start()`, and
the header wordmark calls whichever mode's own `goHome()` is active.

On a viewport wider than 900px the guess screen is **two columns**: the object
panel and its name on the left, the prompt, the guess field and the result card
on the right, on `.game`'s own 900px measure so both modes sit on the same
width. This is layout, not decoration — stacked in one column the revealed
state came to 886px against a 788px viewport and put the Next button below the
fold, because the result card is about 130px taller than the form it replaces.
Six `grid-template-areas` slots do it; the form and the result card share the
`entry` slot, so the swap on reveal happens inside one cell rather than
reshaping the column. `.guess__object` keeps the panel and its label together
and is pinned with `align-self: start` so the object does not slide when the
taller card arrives. Below 900px it returns to the original single column on
its 560px measure.

## Layout

```
src/
  domain/      Rules, independent of React: types, units, pairing, question generation
  data/        Loading and validating items.json; category registry; asset URLs
  i18n/        Language codes, five locale files, translator + provider,
               the per-language URL map and the head tags that follow it
  state/       Preferences (language, unit), the game reducer, and the current page
  services/    Dispute store + preference persistence
  components/  UI, with one screen per game phase
  admin/       The admin panel — its own Vite entry, not a route in the game
server/        The HTTP server: routing, auth, filesystem writes, SVG checks
scripts/       admin-hash (password digests) and verify-admin (the test suite)
data/          Written at runtime: categories, disputes, backups. Not in the repo.
```

**i18n.** Every user-facing string comes from `src/i18n/locales/`. English is the
reference locale and its keys define the `Translation` type, so a locale missing
a key is a compile error. That is what keeps the homepage FAQ honest: its ten
questions and answers are 101 ordinary keys in all five locales, and
`FaqSection` holds only the key order. At runtime a missing string still falls back to English
and then to the key itself. Object names come from the dataset, falling back
English → any language → id, so a gap never renders as `undefined`.

**Preferences.** Language and unit live in one context, persist to
`localStorage`, and language is seeded from the browser on a first visit. The
unit is display-only and never reaches game logic.

**Language URLs.** Each locale has an address: English at `/`, the rest under
their own BCP 47 segment (`/es/`, `/tr/`, `/fr/`, `/de/`). `src/i18n/languageRoute.ts`
builds those paths from the same `LOCALE_TAGS` table that
feeds `<html lang>` and number formatting, so there is no second list of
languages to keep in step. The order of precedence when the app boots is **URL,
then storage, then the browser**: a link to `/tr/` opens in Turkish for
everyone, and a bare `/` still honours a returning visitor's choice — and then
rewrites the address to match it, so there is always a link worth copying.
Changing the language in the header pushes a real history entry, so Back undoes
it; `/en/` is accepted and normalised to `/`. The server needs no routing table
for any of this: an unknown path already falls through to the app.

`applyDocumentHead` keeps the language-dependent half of `<head>` in step —
`lang`, the description, `og:locale`, `og:url` and the canonical link, the last
two pinned to the origin actually being served. The half that does not vary —
the card type, the image, the hreflang map — is static in `index.html`, because
a social scraper does not run JavaScript. Those static tags carry a
**placeholder domain** (`https://heavier.example.com`) that has to be replaced
at deploy time; DEPLOY.md says so too. The card image itself is
`public/og-image.jpg`, served from a stable, unfingerprinted URL because a
social card has to keep resolving across deploys.

**Pages.** `src/state/useRoute.ts` holds which page is on screen — the game or
one of the four category pages — as a value rather than a URL; there is no
router, in keeping with the rest of the app. It still carries a `coffee` route,
but nothing reaches it now that the coffee panel links out of the site. It sits beside
the game reducer instead of inside it: `useGame` owns the phases of a
play-through, `useRoute` owns whether the play-through is what you are looking
at, so leaving for a placeholder page and coming back does not disturb a game in
progress. On a placeholder page the header wordmark steps back to the game
(where it is the only way back); on the game itself it keeps its old meaning of
abandoning the current game.

**Sharing a result.** Both score screens offer the result as three lines: the
score, one mark per round, and a link to the game in the language it was played
in. It is deliberately **spoiler-free** — no object and no weight appears, so
posting it cannot ruin a round for whoever reads it. The heavier/lighter mode
uses two circles (🟢 right, 🔴 wrong) and Guess the Weight five squares
(🟩🟨🟧🟥⬛, the accuracy tiers in order), which also keeps the two modes
apart at a glance. `src/domain/shareResult.ts` builds the string and nothing
else; `ShareButton` hands it to the Web Share API, falling back to the async
clipboard and then to a hidden-textarea `execCommand` for browsers that have
neither (the confirmation line is positioned out of flow under the whole
actions block, so it costs no layout however the buttons wrap) — which is also the path an insecure origin takes, since
`navigator.clipboard` is undefined outside a secure context. Nothing is stored
and nothing is sent anywhere.

**Keyboard.** A round can be played without the mouse: ← and → pick a side,
Enter moves to the next round. `src/state/useGameKeys.ts` binds this to the
window rather than to the cards, so it works before anything has been tabbed
to, and holds its handlers in a ref so the listener is attached once. Arrow
keys stand down inside a text field or a select, and Enter additionally stands
down on anything the browser already activates with it, so tabbing to "Next
round" and pressing Enter fires the button once rather than twice.

**Disputes.** After an answer is revealed, a small control lets a player report
that a weight looks wrong: pick an object, then heavier or lighter. Each report
is stored as structured data — object, direction, timestamp, plus the game and
question it came from — behind the async `DisputeStore` interface in
`src/services/disputes.ts`. Reports now go to the server, where the admin
panel's analytics page can read them; the localStorage implementation stays as
the fallback for a failed request, because a dropped report must never interrupt
a round. That swap was a change to that one file and nothing else —
`DisputeFlow` never knew where a report went. `aggregateDisputes` rolls reports
up per object (total / heavier / lighter, sorted by total) and is what the
analytics table calls, so there is one definition of these counts rather than
two. Nothing adjusts a weight automatically.

Reports have a **30-day life**. `DISPUTE_RETENTION_DAYS` in `server/store.mjs`
is the enforcing copy; `readDisputes` filters anything older out of what it
returns, and `pruneDisputes` deletes those records from `data/disputes.json` —
there is no archive and no rolled-up total that outlives them, so the log is
self-limiting and the panel's counts are always a trailing window. The sweep
runs on the panel's own data request and once at server start; the append path
gets it for free, since a new report is written on top of the filtered list.
`src/services/disputes.ts` carries a second copy of the number so the panel can
say it out loud — the browser cannot import a server module.

---

## The server

`server/index.mjs` serves the built site and the five endpoints the admin panel
writes through, on **one port**. Plain `node:http`, no dependencies: SVG uploads
arrive as text inside a JSON body, which is the only reason this project would
otherwise need a multipart parser.

| | |
|---|---|
| `POST /api/disputes` | A player's report. The one public endpoint, and write-only — a report goes in, nothing comes back out. |
| `GET /api/admin/data` | Objects, categories and the dispute log in one response. |
| `POST /api/admin/objects` · `PUT /api/admin/objects/:id` | Create and edit, including the SVG upload and the `include_random` flag. |
| `POST /api/admin/categories` · `PATCH /api/admin/categories/:key` | Create a category; flip its `showOnHome`. |

That is the whole API. There is no endpoint serving the dataset and none
serving artwork, because the game reads both out of its own bundle; and there is
no login, logout or session endpoint, because there is no session.

**The panel is a page of this app.** `src/main.tsx` compares the pathname with
`ADMIN_ROUTE` (`src/admin/route.ts`) and renders `AdminApp` instead of the game.
It is loaded with a dynamic `import`, so it is a chunk of its own that a player
never downloads — but the route string is in the main bundle, because the main
bundle is what matches it. **The address is therefore not a secret**, and
nothing in the code pretends it is.

**The login is the whole control.** `admin-credentials.json` holds one value:

```
verifier = sha256(key)        key = sha256(`${username}:${password}`)
```

Typing the credentials derives `key` in the browser and the panel checks
`sha256(key)` against the verifier — so a wrong password is rejected without a
request, and there is nothing to rate-limit or enumerate. `key` is then sent as
`X-Admin-Key` on every write, and the server hashes it and compares it with the
same verifier using `timingSafeEqual`. Hashing twice is the point: the value
published in the bundle is one hash *past* the credential and cannot be replayed
as one, so an attacker who reads it still has a 24-character password to
brute-force.

What this does not defend against is someone reading the header off the wire,
which is why **HTTPS is required** — and required twice over, since
`crypto.subtle` is only exposed to a browser on HTTPS or localhost, so the login
simply cannot run over plain HTTP. There are no cookies and no server-side
session: the key lives in the panel tab's memory, and closing the tab is the
logout.

Uploaded SVGs are rejected — not silently stripped — if they contain script,
event handlers, external references or entity declarations.

**Writes.** This project has no version control, so `server/store.mjs` never
writes in place: it copies the current file into `data/backups/`, writes a temp
file, fsyncs, and renames over the target, with every mutation serialized
through one promise chain. A rejected submission never reaches the disk at all.

Editing an object changes its weight, category, `include_random` flag and names;
its `path` is carried over untouched, so moving an object to a new category
leaves its artwork where it was. Deleting an object is not built — it would
orphan an SVG and silently change the pair counts.

Both object forms carry an **Include in the random modes** checkbox, which is
the only way `include_random` is ever set. It is on by default for a new object,
and reads an entry that has no flag as on. The server takes the field as
optional on both endpoints and refuses anything that is not a boolean, so an
older client that omits it writes the inclusive default rather than a surprise.

**Categories are data.** `data/categories.json` maps each category key to its
folder, which has to be a table rather than a rule: the supplied folders are
irregular (`animal` → `animals_svg`, but `vehicle` → `vehicle_svg`). Creating
`guns` in the panel writes the entry and creates `svg_files/guns_svg/` in the
same step, and new categories do follow `${key}_svg`. Their objects enter the
question pool immediately, since question generation only compares weights.

Each category also carries **`showOnHome`**, which decides whether the homepage
gives it a card. The supplied four are `true` — a registry written before the
field existed defaults them to `true` and everything else to `false`, so the
homepage looks the same before and after it arrived — and a category created in
the panel starts hidden, because a card with no objects has an empty balance.
The toggle saves on change (`PATCH /api/admin/categories/:key`) rather than
behind a Save button, so the checkbox never shows a state the file does not
already have.

The flag is presentation only. Hiding a category removes its card and nothing
else: its objects stay in the question pool, because `generateQuestions` never
looks at a category.

**Publishing a change.** The panel writes `items.json`, `data/categories.json`
and `svg_files/` immediately, and the game reads all three at build time — so an
edit is on disk at once and in front of players after `npm run build`. The panel
says so on every screen. That is the trade for a site that fetches nothing at
runtime, and it is the one thing to remember about using this panel.

`MANUAL.md` is the owner-facing version of all of this — deployment step by
step, credentials, how to use the panel, troubleshooting. `DEPLOY.md` is the
terse config reference underneath it: environment variables, nginx, systemd,
what to back up.

## Room left deliberately empty

Daily questions and category quizzes aren't specified yet, so they aren't built.
What exists for them is the foundation they'd need: categories are real data
(`items.json` → `src/data/categories.ts`) rather than something inferred in a
component, and `generateQuestions` takes the object list as an argument, so a
filtered or seeded mode is a different call rather than a different
architecture. `include_random` is part of that foundation: an object can already
be marked as belonging to its category only, which is what a category quiz
would need and what the two whole-dataset modes already honour.

The homepage category cards show what each category holds, and each one opens
that category's own page. **Which categories get a card is data**, not a list in
the component: `homepageCategories()` filters the registry by `showOnHome`, and
`HomeScreen` picks the column count from how many there are, so the grid stays
balanced as cards appear and disappear — five read as 3 + 2 rather than 4 + 1.
With the supplied four shown, it renders exactly as the old hard-coded
`repeat(4, …)` grid did, to the pixel. Those pages are **empty on purpose**: the dataset is
too thin for a category game (the smallest category has six objects), so what exists is the
route and the placeholder, not a mode. Each card renders the same `BalanceScale`
component as the hero, at `variant="mini"` — every scale dimension is a CSS
custom property, so the small version is a set of value overrides rather than a
second implementation. The two objects on a card are drawn by `pickPreviewPair`
from that category alone; unlike the hero pair it ignores the weight-ratio rule,
which would otherwise leave two of the four categories with exactly one
possible pairing and a card that never varies. Only the card's name is a button
— a balance is not phrasing content and cannot live inside one — stretched over
the whole card by a `::after`, so the card is one click target named after its
category.

Below the hero row the home screen has `BentoGrid`, four cards rebuilt from an
Apple reference screenshot the owner supplied: two columns and three rows, with
a tall photo card spanning rows 1-2 on the left and a tall FAQ card spanning
rows 2-3 on the right, so the two tall cards interlock around the two short
ones. The cards are a feature placeholder (the supplied photo under a scrim, under
the project's own weight-star mark in the card's white — `BentoGrid` still
takes a `featureIcon` prop to override it), a contact card
inside a gradient ring, Buy Me a Coffee, and a link down to the questions. The
ring's ramp was sampled off that screenshot and has since become the whole
site's brand ramp (see **Look and motion**), so `--bento-grad-ai` and the
bento's surface and ink tokens are aliases of the global ones rather than a
private copy.

Its one unusual mechanic is `--px`, declared on `.bento__grid` as
`calc(100cqw / 1240)`: one *reference* pixel, because the grid was measured off
the screenshot at a 1240px width. Every length inside is `calc(n * var(--px))`,
so at 1240px each one is the literal measured value and narrower the whole
thing scales as one picture instead of reflowing a piece at a time. That needs
a container rather than the viewport, since `.site-main` carries padding —
hence `container-type: inline-size` on `.bento` and the unit on its child, an
element never being its own query container. Below a 900px *container* the grid
becomes one column and `--px` stops tracking the full width, so type does not
shrink with it. There is **no site footer**; the questions sit below the grid on
their own 760px reading measure.

The type is the site's own, not the reference's: `.bento-card__headline` joins
the shared display-face selector list and everything else inherits the body
face. The sizes still come from the screenshot, measured as cap heights and
carried across because Audex's cap ratio (0.732em) is within 3% of the face the
reference used.

There are no ads, accounts, leaderboards, XP, or streaks. The Buy Me a Coffee
card is the one thing on the site that leaves it: the whole card is a link to
`https://buymeacoffee.com/sam10`, opened in a new tab so a game in progress is
never thrown away. There is still no payment integration here.

Four pages, then, are reachable and deliberately blank: one per category. They all render `BlankScreen`, which is an empty section with a
reserved height, so a blank page is still the size of a page.

## Look and motion

Every colour in the app resolves from the `:root` token block at the top of
`src/styles/global.css`; no rule names a raw value except the handful that need
a gradient's stops. The scheme is a pitch-black page with nothing on it, an
Apple-dark grey ladder for every surface that sits on it (`--ink-850: #1c1c1e`
for cards, controls, bento tiles and the default button, up to `#48484a`),
neutral white hairlines, and `#f5f5f7` / `#a1a1a6` / `#86868b` for text.

Three gradients carry the accent, and which one an element wears says what it
belongs to.

`--spectrum` is the ramp: blue `#3f8ff5` through violet and magenta to orange
`#da7a30`, sampled off the bento's contact card. Each of its eight stops is
also a token, because a focus ring, a glow or one card's band needs a hue
rather than a gradient; `--accent-gradient` is the same run on the diagonal.
It holds the structural work — the contact card it was sampled from (ring,
text and mail icon, which stay one three-colour unit), the four category bands
and the balance pivots they colour, and the page's focus colour.

`--grad-warm` and `--grad-green` are not cut out of the ramp. Both arrived as
icon fills in the bento and have since been given the site: the coffee cup's
`#ef8441 → #f5a341 → #fbc247` carries the wordmark, the primary CTA, the
active unit pill, the categories eyebrow, the language ring and the default
button's hover edge, while the FAQ card's `#5fc78a → #7ccb62 → #9cdc4a`
carries the whole questions section. Each is kept equal to the stops in its own
icon — `CupIcon` and `FaqIcon` — because an SVG gradient cannot read a CSS
one, which is the only reason there are two copies of either.

One rule governs all three: **type never sits on a gradient in white.** The
ramp gives white 3.3:1 at best and `--accent-ink` (`#0b0b0d`) at least 5.4:1;
warm and green give that same dark ink 8.6:1 and better, which is why those
two can be used as *fills* under a label and the ramp mostly cannot. The
result colours (`--correct`, `--wrong`) and the five `--tier-*` colours are
outside all of this on purpose: they carry meaning, not brand.

The four category cards each own one band of the ramp, set by
`nth-child(4n + …)` as `--card-a`/`--card-b` and fed back into
`--accent-gradient` and `--accent` *on the card itself*. `BalanceScale` already
reads both, so a card's balance pivot takes that card's colour without the
scale component knowing categories exist — and the hover edge, the drop glow
and the focus ring follow from the same two values.

Surfaces that light up — the language select, the default button, a category
card, an open question — share one "gradient edge": a pseudo-element filled
with a gradient and masked hollow, so the hairline underneath keeps the box
exactly the size it was. They are declared together and differ only in what
turns them on and which gradient they carry.

A section can also re-point `--accent` on itself, which is how a colour
reaches things that were never told about it: `.faq` sets the green, so the
keyboard focus ring inside the questions is green without any rule in the FAQ
saying so, exactly as a category card sets its own band and the balance picks
it up. The whole game flow — `.game`, `.guess`, `.score`, `.notice` — does the
same with the warm ramp, which is why the guess field's focus ring, a dispute
chip's hover and the score screen's big number are all warm without any of
those components naming a colour. The CTA on every one of those screens is
already warm; the violet the global token carries read as a third brand beside
it.

**Scroll reveal.** The bento and the questions fade and rise into view the
first time they are scrolled to. `src/components/useReveal.ts` is a hook
returning a callback ref and a `data-reveal` attribute to spread on the element
itself — not a wrapper component, because `.bento` is a container-query
container and `.faq` is sized by the grid above it, so an inserted div would
change what they measure. One `IntersectionObserver` per section, disconnected
on first intersection: scrolling back does not replay it, and a section already
on screen at load reveals immediately. The CSS is an `@keyframes` animation
rather than a transition, since the cards and questions already transition
their own hover properties and a second `transition` would replace those. The
bento staggers along its own diagonal; the questions stagger on `--reveal-i`,
the index `FaqSection` sets inline, capped so a long list still finishes
quickly. `prefers-reduced-motion` gets the content with no travel and no delay.

One consequence: a static render carries `data-reveal="out"`, and with no
JavaScript that means those two sections are `opacity: 0`. The markup is all
there — `renderToStaticMarkup` still sees it — but anything judging
*visibility* from a static render will be wrong about the bento and the
questions.

---

## How this is checked

There is no test runner and no linter. The gate is:

```bash
npm run typecheck     # includes server/ and scripts/ via JSDoc + checkJs
npm run build
npm run verify:admin  # 72 end-to-end checks against a live server
```

`scripts/verify-admin.mjs` starts the real server against a **throwaway copy**
of the dataset in `$TMPDIR` and a throwaway credential in `ADMIN_VERIFIER` —
never the live ones — and asserts the things that would be expensive to get
wrong: every write endpoint 401s without the key and with a wrong one, adding an
object appends exactly one entry, a refused SVG writes no file and leaves no
orphan, an edit that changes category leaves `path` alone, each write leaves a
restorable backup, toggling `showOnHome` reaches `categories.json` without
disturbing another category, and a player's report reaches the panel's data.

The last group checks the **build output**, which is where this architecture can
quietly regress: that the artwork and both fonts are emitted as bundled assets,
that no `<script>`, stylesheet or image in `index.html` points at another
origin, and that the string `X-Admin-Key` is absent from the entry chunk — i.e.
that the panel is still a lazy chunk players do not download. Run `npm run
build` first; those checks read `dist/`.

UI work is checked first by rendering the real component tree with
`renderToStaticMarkup` under `npx vite-node`, which catches wrong markup, wrong
data and untranslated keys, and by computing the CSS box math across viewport
widths for anything to do with layout. **Neither is a screenshot**, and neither
confirms that a page looks right — a component that renders nothing at all
passes both.

So anything visual is also **looked at in Chrome**, through the Claude in
Chrome extension: start the dev server and point the connected tab at
`http://localhost:5173/` — or `npm start` and the built site, which is the only
way to exercise the panel's saves. Two things to know about that tab. It is
backgrounded, so it runs no rendering steps of its own — `requestAnimationFrame`
never ticks and a screenshot taken straight after a scroll can be a stale
frame, so take a second one. And `document.hasFocus()` is `false` in it, which
means Chrome matches neither `:focus` nor `:focus-visible`; a focus style has
to be forced on with an injected rule to be seen, and removed again
afterwards.
