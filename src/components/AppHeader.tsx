import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiBarChart2, FiGrid, FiMapPin, FiShield, FiUser, FiUserPlus } from 'react-icons/fi'
import { confirmLeaveFromBulkUploadIfNeeded } from '../lib/bulkUploadNavigation'
import { useACL } from '../acl/useACL'
import { defaultAuthedPath } from '../acl/hasAccess'
import { useAppSelector } from '../store/hooks'
import type { AclModuleDTO } from '../acl/types'

type NavIcon = 'grid' | 'user' | 'userPlus' | 'pin' | 'chart' | 'shield'

type NavMenuItem = { id: string; label: string; link: string; icon: NavIcon }

const APP_LOGO = { textMain: 'PropCRM', textSecondary: 'Real Estate Lead Management' }

/** Fallback navbar for legacy JWT sessions with module_key `*` (no RBAC module list). */
const LEGACY_NAV_MENU_ITEMS: NavMenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', link: '#dashboard', icon: 'grid' },
  { id: 'leads', label: 'Leads', link: '#leads', icon: 'user' },
  { id: 'capture', label: 'Capture Lead', link: '#capture-lead', icon: 'userPlus' },
  { id: 'visits', label: 'Site Visits', link: '#site-visits', icon: 'pin' },
  { id: 'campaign', label: 'Projects', link: '#campaign', icon: 'chart' },
]

function NavIconGlyph({ name }: { name: NavIcon }) {
  switch (name) {
    case 'grid':
      return <FiGrid className="app-header__nav-icon" aria-hidden />
    case 'user':
      return <FiUser className="app-header__nav-icon" aria-hidden />
    case 'userPlus':
      return <FiUserPlus className="app-header__nav-icon" aria-hidden />
    case 'pin':
      return <FiMapPin className="app-header__nav-icon" aria-hidden />
    case 'chart':
      return <FiBarChart2 className="app-header__nav-icon" aria-hidden />
    case 'shield':
      return <FiShield className="app-header__nav-icon" aria-hidden />
    default:
      return <FiGrid className="app-header__nav-icon" aria-hidden />
  }
}

function mapModuleIcon(icon?: string | null): NavIcon {
  const i = (icon || 'grid').toLowerCase()
  if (i === 'user') return 'user'
  if (i === 'userplus' || i === 'user_plus') return 'userPlus'
  if (i === 'pin') return 'pin'
  if (i === 'chart') return 'chart'
  if (i === 'shield') return 'shield'
  return 'grid'
}

/** UI display names — module_key stays `campaign` for ACL/API compatibility. */
function navModuleLabel(moduleKey: string, name: string): string {
  if (moduleKey === 'campaign') return 'Projects'
  return name
}

function modulesToMenuItems(modules: AclModuleDTO[]): NavMenuItem[] {
  const seen = new Set<string>()
  return modules
    .filter((m) => {
      // Reports tab hidden from navbar for now
      if (m.module_key === 'profile' || m.module_key === 'projects' || m.module_key === 'reports' || m.parent_id) return false
      const link = m.route.startsWith('/') ? m.route : `/${m.route}`
      if (seen.has(link)) return false
      seen.add(link)
      return true
    })
    .map((m) => ({
      id: m.module_key,
      label: navModuleLabel(m.module_key, m.name),
      link: m.route.startsWith('/') ? m.route : `/${m.route}`,
      icon: mapModuleIcon(m.icon),
    }))
}

export function AppHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAppSelector((s) => s.auth)
  const { navModules, isLegacyFullAccess, hasAccess: can } = useACL()
  const [menuOpen, setMenuOpen] = useState(false)

  const aclMenuItems = modulesToMenuItems(navModules)
  const visibleMenuItems = isLegacyFullAccess ? LEGACY_NAV_MENU_ITEMS : aclMenuItems

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

  const onNavClick = () => setMenuOpen(false)

  const toPath = (link: string) => {
    if (link === '#home') return '/'
    if (!link.startsWith('#')) return link
    return `/${link.slice(1)}`
  }

  const isNavLinkActive = (link: string, itemId?: string) => {
    const path = toPath(link)
    const { pathname } = location

    if (itemId === 'profile' || path === '/profile') {
      return pathname === '/profile' || pathname.startsWith('/profile/')
    }

    if (path === '/') return pathname === '/'

    if (path === '/capture-lead') {
      return pathname === '/capture-lead' || pathname.startsWith('/capture-lead/')
    }

    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const navLinkClass = (link: string, itemId?: string) => {
    const active = isNavLinkActive(link, itemId)
    return ['app-header__link', active ? 'app-header__link--active' : ''].filter(Boolean).join(' ')
  }

  const homeForUser = defaultAuthedPath(navModules)

  return (
    <header className={`app-header${menuOpen ? ' app-header--menu-open' : ''}`}>
      {menuOpen ? (
        <button type="button" className="app-header__scrim" aria-label="Close menu" tabIndex={-1} onClick={() => setMenuOpen(false)} />
      ) : null}

      <div className="app-header__bar">
        <a
          href="/"
          className="app-header__brand"
          onClick={(e) => {
            e.preventDefault()
            navigate(user ? homeForUser : '/')
          }}
        >
          <span className="app-header__logo-mark" aria-hidden>
            <FiGrid size={18} />
          </span>
          <div className="app-header__titles">
            <span className="app-header__name">{APP_LOGO.textMain}</span>
            <span className="app-header__tagline">{APP_LOGO.textSecondary}</span>
          </div>
        </a>

        <nav className="app-header__nav app-header__nav--desktop" aria-label="Main">
          <ul className="app-header__menu">
            {visibleMenuItems.map((item) => {
              const active = isNavLinkActive(item.link, item.id)
              return (
                <li key={item.id}>
                  <a
                    href={toPath(item.link)}
                    className={navLinkClass(item.link, item.id)}
                    aria-current={active ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault()
                      if (!confirmLeaveFromBulkUploadIfNeeded(location.pathname)) return
                      navigate(toPath(item.link))
                      onNavClick()
                    }}
                  >
                    <NavIconGlyph name={item.icon} />
                    <span>{item.label}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="app-header__user-desktop ml-auto hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              {can('profile') || isLegacyFullAccess ? (
                <button
                  type="button"
                  className={[
                    'app-header__profile-btn',
                    location.pathname === '/profile' || location.pathname.startsWith('/profile/')
                      ? 'app-header__profile-btn--active'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={location.pathname.startsWith('/profile') ? 'page' : undefined}
                  onClick={() => {
                    if (!confirmLeaveFromBulkUploadIfNeeded(location.pathname)) return
                    navigate('/profile')
                  }}
                >
                  Profile
                </button>
              ) : null}
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

      <div id="app-header-drawer" className="app-header__drawer" aria-hidden={!menuOpen} inert={menuOpen ? undefined : true}>
        <ul className="app-header__menu app-header__menu--mobile">
          {visibleMenuItems.map((item) => {
            const active = isNavLinkActive(item.link, item.id)
            return (
              <li key={item.id}>
                <a
                  href={toPath(item.link)}
                  className={`${navLinkClass(item.link, item.id)} app-header__link--mobile`}
                  aria-current={active ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    if (!confirmLeaveFromBulkUploadIfNeeded(location.pathname)) return
                    navigate(toPath(item.link))
                    onNavClick()
                  }}
                >
                  <NavIconGlyph name={item.icon} />
                  <span>{item.label}</span>
                </a>
              </li>
            )
          })}

          {user && (can('profile') || isLegacyFullAccess) ? (
            <li>
              <button
                type="button"
                className={`${navLinkClass('/profile', 'profile')} app-header__link--mobile`}
                aria-current={location.pathname.startsWith('/profile') ? 'page' : undefined}
                onClick={() => {
                  if (!confirmLeaveFromBulkUploadIfNeeded(location.pathname)) return
                  setMenuOpen(false)
                  navigate('/profile')
                }}
              >
                <FiUser className="app-header__nav-icon" aria-hidden />
                <span>Profile</span>
              </button>
            </li>
          ) : null}
        </ul>
      </div>
    </header>
  )
}
