import { useState } from 'react'
import { objectAssetUrl } from '../data/assets'
import { useI18n } from '../i18n/I18nContext'
import type { GameObject } from '../domain/types'

/**
 * Renders a supplied SVG silhouette as a white game object.
 *
 * The asset files are never modified: they ship as solid `#000000` / `#231F20`
 * artwork, and `brightness(0) invert(1)` recolours them to pure white in the
 * presentation layer while keeping the anti-aliased alpha edges intact.
 *
 * A missing or broken asset degrades to a labelled placeholder instead of an
 * empty gap or a broken-image icon. Since the artwork is bundled,
 * `objectAssetUrl` answers with an empty string for a dataset path that has no
 * file in `svg_files/` — that is the same placeholder case as a load failure,
 * caught before the browser is asked to fetch the page as an image.
 */
export function ObjectImage({ object }: { object: GameObject }) {
  const { t, objectName } = useI18n()
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const src = objectAssetUrl(object.assetPath)

  if (!src || failedSrc === src) {
    return (
      <span className="object-image object-image--missing" role="img" aria-label={objectName(object)}>
        <span aria-hidden="true">?</span>
        <span className="object-image__note">{t('error.missingImage')}</span>
      </span>
    )
  }

  return (
    <img
      className="object-image"
      src={src}
      alt=""
      draggable={false}
      loading="eager"
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  )
}
