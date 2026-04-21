import { useEffect, useState } from 'react'
import { useSiteSection } from '../lib/siteApi'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { authActions } from '../store/authSlice'

type NavIcon = 'grid' | 'user' | 'userPlus' | 'pin' | 'chart'

type NavPayload = {
  logo: { textMain: string; textSecondary: string }
  activeItemId: string
  menuItems: { id: string; label: string; link: string; icon: NavIcon }[]
}

function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <rect x="2" y="2" width="5.5" height="5.5" rx="0.75" fill="currentColor" />
      <rect x="10.5" y="2" width="5.5" height="5.5" rx="0.75" fill="currentColor" />
      <rect x="2" y="10.5" width="5.5" height="5.5" rx="0.75" fill="currentColor" />
      <rect x="10.5" y="10.5" width="5.5" height="5.5" rx="0.75" fill="currentColor" />
    </svg>
  )
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <circle cx="9" cy="5.5" r="2.75" fill="currentColor" />
      <path
        fill="currentColor"
        d="M4 15.25c0-2.9 2.24-5.25 5-5.25s5 2.35 5 5.25V16H4v-.75z"
      />
    </svg>
  )
}

function IconUserPlus({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <circle cx="6.25" cy="5.25" r="2.25" fill="currentColor" />
      <path
        fill="currentColor"
        d="M2.5 14.5c0-2.35 1.9-4.25 4.25-4.25.35 0 .68.04 1 .12v1.38h-.25c-1.66 0-3 1.34-3 3V15h-2v-.5z"
      />
      <path
        fill="currentColor"
        d="M12.5 6v1.25H11v1.5h1.5V10h1.5V8.75H15.5v-1.5H14V6h-1.5z"
      />
    </svg>
  )
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M9 2.25a4.25 4.25 0 0 0-4.25 4.15c0 3.2 3.5 7.85 4.25 8.85.75-1 4.25-5.65 4.25-8.85A4.25 4.25 0 0 0 9 2.25zm0 5.5a1.35 1.35 0 1 1 0-2.7 1.35 1.35 0 0 1 0 2.7z"
      />
    </svg>
  )
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <rect x="3" y="10" width="3" height="5" rx="0.5" fill="currentColor" />
      <rect x="7.5" y="6" width="3" height="9" rx="0.5" fill="currentColor" />
      <rect x="12" y="3" width="3" height="12" rx="0.5" fill="currentColor" />
    </svg>
  )
}

function NavIconGlyph({ name }: { name: NavIcon }) {
  switch (name) {
    case 'grid':
      return <IconGrid className="app-header__nav-icon" />
    case 'user':
      return <IconUser className="app-header__nav-icon" />
    case 'userPlus':
      return <IconUserPlus className="app-header__nav-icon" />
    case 'pin':
      return <IconPin className="app-header__nav-icon" />
    case 'chart':
      return <IconChart className="app-header__nav-icon" />
    default:
      return <IconGrid className="app-header__nav-icon" />
  }
}

export function AppHeader() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { data, error } = useSiteSection<NavPayload>('VITE_NAV_API_URL', '/demo-api/nav.json')
  const [menuOpen, setMenuOpen] = useState(false)
  const [hash, setHash] = useState(() => window.location.hash || '#dashboard')

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)')
    const onChange = () => {
      if (mq.matches) setMenuOpen(false)
    }
    mq.addEventListener('change', onChange)
    onChange()
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#dashboard')
    window.addEventListener('hashchange', onChange)
    onChange()
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const onNavClick = () => {
    setMenuOpen(false)
  }

  const isActiveLink = (link: string) => {
    if (!link.startsWith('#')) return false
    return hash === link
  }

  const visibleMenuItems = data
    ? data.menuItems.filter((i) => {
        if (i.link === '#capture-lead') return user?.role === 'admin'
        if (i.link === '#campaign') return user?.role === 'admin'
        return true
      })
    : []

  if (error) {
    return <div className="site-api-error site-api-error--nav">Navigation: {error}</div>
  }

  if (!data) {
    return (
      <header className="app-header app-header--loading" aria-busy="true">
        <div className="app-header__bar">
          <div className="app-header__brand">
            <span className="app-header__logo-mark" aria-hidden>
              <IconGrid />
            </span>
            <div className="app-header__titles">
              <span className="app-header__name">PropCRM</span>
              <span className="app-header__tagline">Real Estate Lead Management</span>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={`app-header${menuOpen ? ' app-header--menu-open' : ''}`}>
      {menuOpen ? (
        <button
          type="button"
          className="app-header__scrim"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="app-header__bar">
        <a href="/" className="app-header__brand" onClick={(e) => e.preventDefault()}>
          <span className="app-header__logo-mark" aria-hidden>
            <IconGrid />
          </span>
          <div className="app-header__titles">
            <span className="app-header__name">{data.logo.textMain}</span>
            <span className="app-header__tagline">{data.logo.textSecondary}</span>
          </div>
        </a>

        <nav className="app-header__nav app-header__nav--desktop" aria-label="Main">
          <ul className="app-header__menu">
            {visibleMenuItems.map((item) => {
              const active = isActiveLink(item.link)
              return (
                <li key={item.id}>
                  <a
                    href={item.link}
                    className={`app-header__link${active ? ' app-header__link--active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={onNavClick}
                  >
                    <NavIconGlyph name={item.icon} />
                    <span>{item.label}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-2 min-[901px]:flex">
          {user ? (
            <>
              <span className="text-[12px] font-semibold text-gray-500">
                {user.name} · {user.role ?? 'no-role'}
              </span>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  dispatch(authActions.logout())
                  window.location.hash = '#login'
                }}
              >
                Logout
              </button>
            </>
          ) : null}
        </div>

        <div className="app-header__mobile-toggle">
          <button
            type="button"
            className="app-header__burger"
            aria-expanded={menuOpen}
            aria-controls="app-header-drawer"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="app-header__burger-lines" aria-hidden>
              <span className="app-header__burger-line" />
              <span className="app-header__burger-line" />
              <span className="app-header__burger-line" />
            </span>
          </button>
        </div>
      </div>

      <div
        id="app-header-drawer"
        className="app-header__drawer"
        aria-hidden={!menuOpen}
        inert={menuOpen ? undefined : true}
      >
        <ul className="app-header__menu app-header__menu--mobile">
          {visibleMenuItems.map((item) => {
            const active = isActiveLink(item.link)
            return (
              <li key={item.id}>
                <a
                  href={item.link}
                  className={`app-header__link app-header__link--mobile${active ? ' app-header__link--active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={onNavClick}
                >
                  <NavIconGlyph name={item.icon} />
                  <span>{item.label}</span>
                </a>
              </li>
            )
          })}

          {user ? (
            <li>
              <button
                type="button"
                className="app-header__link app-header__link--mobile"
                onClick={() => {
                  dispatch(authActions.logout())
                  setMenuOpen(false)
                  window.location.hash = '#login'
                }}
              >
                <span className="app-header__nav-icon" aria-hidden>
                  ⇥
                </span>
                <span>Logout</span>
              </button>
            </li>
          ) : null}
        </ul>
      </div>
    </header>
  )
}
