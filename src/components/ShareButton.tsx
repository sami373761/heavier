import { useEffect, useRef, useState } from 'react'
import { ShareIcon } from './icons'
import { useI18n } from '../i18n/I18nContext'

/**
 * Hands a finished result to whatever the device has.
 *
 * Three routes, in descending order of how good the result feels: the Web
 * Share API where it exists (a phone's own share sheet, with the message
 * already written), the async clipboard where it does not, and a hidden
 * textarea with `execCommand` for the browsers that have neither — which is
 * also the path an insecure origin falls down, since `navigator.clipboard` is
 * undefined outside a secure context and would otherwise throw on a plain-HTTP
 * deployment.
 *
 * Nothing here can fail loudly. A share the visitor cancels and a copy that is
 * refused both end the same way: the button goes back to how it was.
 */

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Permission refused or no secure context — fall through to the old way.
  }

  try {
    const field = document.createElement('textarea')
    field.value = text
    // Off-screen rather than hidden: a `display: none` field cannot be selected.
    field.setAttribute('readonly', '')
    field.style.position = 'fixed'
    field.style.top = '-1000px'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(field)
    return copied
  } catch {
    return false
  }
}

export function ShareButton({ text }: { text: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {
        // Cancelled, or the sheet refused the payload: try the clipboard instead.
      }
    }

    if (!(await copyToClipboard(text))) return
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2600)
  }

  return (
    <>
      <button type="button" className="button button--ghost" onClick={share}>
        <ShareIcon />
        <span>{t('score.share')}</span>
      </button>

      {/* A sibling of the button, not a child of it: inside, the confirmation
          made the button grow mid-click and shoved the one beside it sideways.
          It is also always rendered — a live region that only appears when it
          has something to say is announced less reliably. The stylesheet takes
          it out of flow and hangs it under the whole actions block, so it costs
          no layout whether it is empty or full. */}
      <span className="share__status" role="status">
        {copied ? t('score.shareCopied') : ''}
      </span>
    </>
  )
}
