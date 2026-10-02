import { LanguageSelect } from './LanguageSelect'
import { Logo } from './Logo'
import { UnitToggle } from './UnitToggle'

export function SiteHeader({ onLogoClick }: { onLogoClick?: () => void }) {
  return (
    <header className="site-header">
      <Logo {...(onLogoClick ? { onClick: onLogoClick } : {})} />
      <div className="site-header__controls">
        <UnitToggle />
        <LanguageSelect />
      </div>
    </header>
  )
}
