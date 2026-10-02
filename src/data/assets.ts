/**
 * Object artwork, resolved from the files in `svg_files/` at build time.
 *
 * The dataset stores a relative path (`animals_svg/bear.svg`) rather than a
 * URL, and this module is the one place that turns one into the other.
 *
 * `import.meta.glob` is what makes the artwork a *bundled asset*: Vite reads
 * `svg_files/` during the build, copies every SVG into the output with a
 * fingerprinted name and gives us its final URL here. There is no custom
 * middleware serving the folder, no `/objects/` route and nothing fetched from
 * anywhere else — an object's image is a local file the bundler knows about,
 * exactly like the fonts and the favicon.
 *
 * The trade-off is deliberate: artwork is fixed at build time, so an SVG added
 * through the admin panel appears after the next `npm run build`. That is the
 * cost of having no runtime asset server, and it is the architecture this
 * project asked for. (Vite re-globs in dev, so a file dropped into
 * `svg_files/` while `npm run dev` is running should show up without a
 * restart — documented Vite behaviour, not something measured here.)
 */
const ASSET_URLS = import.meta.glob<string>('../../svg_files/**/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
})

/**
 * Keyed by the dataset's own `path` value, so the lookup is a plain map hit
 * rather than a search. Glob keys are relative to this file
 * (`../../svg_files/animals_svg/bear.svg`); the prefix is stripped so the key
 * is what items.json actually stores.
 */
const PREFIX = '../../svg_files/'

const BY_ASSET_PATH = new Map<string, string>(
  Object.entries(ASSET_URLS).map(([key, url]) => [
    key.startsWith(PREFIX) ? key.slice(PREFIX.length) : key,
    url,
  ]),
)

/**
 * The bundled URL for an object's artwork, or an empty string if the dataset
 * points at a file that is not in `svg_files/`. `ObjectImage` renders its
 * labelled placeholder for the empty case, which is the same thing it already
 * did for a file that failed to load.
 */
export function objectAssetUrl(assetPath: string): string {
  return BY_ASSET_PATH.get(assetPath) ?? ''
}
