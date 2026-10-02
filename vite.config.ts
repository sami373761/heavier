import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * One entry, one bundle, no custom plugins.
 *
 * Everything this app needs is a local file Vite already knows how to handle:
 * `items.json` and `data/categories.json` are imported, the object artwork is
 * globbed out of `svg_files/` by `src/data/assets.ts`, and both fonts are
 * `@font-face` URLs in `src/styles/global.css`. Nothing is fetched at runtime
 * and nothing is served by middleware, so there is no asset plugin here and no
 * API mounted into the dev server.
 *
 * The admin panel is a route inside this same app (`src/admin/route.ts`), not a
 * second HTML entry — `src/main.tsx` renders it when the pathname matches, and
 * loads it as its own chunk so a player never downloads it.
 *
 * `npm run dev` is therefore the whole game with no server running. The one
 * thing it cannot do is *save* from the panel, which needs `npm start`.
 */
export default defineConfig({
  plugins: [react()],
})
