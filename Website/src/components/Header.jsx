import { useEffect, useRef, useState } from 'react'

function SunIcon({ className }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8">
        <path d="M12 2.8v2.4" />
        <path d="M12 18.8v2.4" />
        <path d="M21.2 12h-2.4" />
        <path d="M5.2 12H2.8" />
        <path d="m18.5 5.5-1.7 1.7" />
        <path d="m7.2 16.8-1.7 1.7" />
        <path d="m18.5 18.5-1.7-1.7" />
        <path d="m7.2 7.2-1.7-1.7" />
      </g>
    </svg>
  )
}

function MoonIcon({ className }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path
        d="M16.8 15.9A7.8 7.8 0 0 1 8.1 5.7a8.5 8.5 0 1 0 10.2 10.2 7.5 7.5 0 0 1-1.5 0Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ThemeControl({ activeTheme, setThemePreference }) {
  const nextTheme = activeTheme === 'dark' ? 'light' : 'dark'

  return (
    <button
      aria-checked={activeTheme === 'dark'}
      aria-label={activeTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="theme-toggle"
      data-theme={activeTheme}
      onClick={() => setThemePreference(nextTheme)}
      role="switch"
      type="button"
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-halo"></span>
        <span className="theme-toggle-slot theme-toggle-slot-light" aria-hidden="true">
          <SunIcon className="theme-toggle-slot-icon" />
        </span>
        <span className="theme-toggle-slot theme-toggle-slot-dark" aria-hidden="true">
          <MoonIcon className="theme-toggle-slot-icon" />
        </span>
        <span className="theme-toggle-thumb" aria-hidden="true">
          <span className="theme-toggle-thumb-surface">
            <SunIcon className="theme-toggle-thumb-icon theme-toggle-thumb-icon-light" />
            <MoonIcon className="theme-toggle-thumb-icon theme-toggle-thumb-icon-dark" />
          </span>
        </span>
      </span>
      <span className="sr-only">Active color mode: {activeTheme}</span>
    </button>
  )
}

function Header({
  activeSection,
  activeTheme,
  navigationItems,
  projectTitle,
  setThemePreference,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const navRef = useRef(null)
  const navItemRefs = useRef({})
  const [activePillStyle, setActivePillStyle] = useState({
    opacity: 0,
    width: 0,
    x: 0,
  })

  useEffect(() => {
    const closeMenu = () => setIsOpen(false)
    window.addEventListener('resize', closeMenu)
    return () => window.removeEventListener('resize', closeMenu)
  }, [])

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 18)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const updateActivePill = () => {
      const navElement = navRef.current
      const activeLink = navItemRefs.current[activeSection]

      if (!navElement || !activeLink) {
        setActivePillStyle((current) =>
          current.opacity === 0 ? current : { ...current, opacity: 0 },
        )
        return
      }

      const navRect = navElement.getBoundingClientRect()
      const linkRect = activeLink.getBoundingClientRect()

      setActivePillStyle({
        opacity: 1,
        width: linkRect.width,
        x: linkRect.left - navRect.left,
      })
    }

    updateActivePill()
    window.addEventListener('resize', updateActivePill)
    return () => window.removeEventListener('resize', updateActivePill)
  }, [activeSection, navigationItems])

  return (
    <>
      <header className="sticky top-0 z-50 pt-4 md:pt-5">
        <div className="shell">
          <div className="mobile-header-wrapper">
            <div className="mobile-header-shell">
              <a className="min-w-0" href="#home">
                <p className="truncate font-display text-lg font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
                  {projectTitle}
                </p>
                <p className="mt-0.5 text-xs font-medium tracking-[0.02em] text-[var(--muted)]">
                  Research project website
                </p>
              </a>

              <button
                aria-controls="mobile-nav"
                aria-expanded={isOpen}
                className="mobile-menu-toggle"
                data-open={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                type="button"
              >
                <span className="sr-only">{isOpen ? 'Close navigation' : 'Open navigation'}</span>
                <span className="mobile-menu-toggle-line"></span>
                <span className="mobile-menu-toggle-line"></span>
                <span className="mobile-menu-toggle-line"></span>
              </button>
            </div>
          </div>

          <div className="desktop-header-wrapper">
            <div className="header-shell" data-scrolled={isScrolled}>
              <a className="header-brand-shell" href="#home">
                <span className="header-brand-mark">FA</span>
                <div className="min-w-0">
                  <p className="truncate font-display text-[1.05rem] font-semibold tracking-[-0.045em] text-[var(--ink-strong)]">
                    {projectTitle}
                  </p>
                  <p className="header-brand-meta">Final-year research showcase</p>
                </div>
              </a>

              <nav aria-label="Primary" className="header-nav-shell">
                <div
                  className="header-nav"
                  ref={navRef}
                  style={{ '--nav-count': navigationItems.length }}
                >
                  <span
                    aria-hidden="true"
                    className="header-nav-pill"
                    style={{
                      opacity: activePillStyle.opacity,
                      transform: `translateX(${activePillStyle.x}px)`,
                      width: `${activePillStyle.width}px`,
                    }}
                  ></span>
                  {navigationItems.map((item) => (
                    <a
                      className="nav-link"
                      data-active={activeSection === item.href.slice(1)}
                      href={item.href}
                      key={item.href}
                      ref={(element) => {
                        const key = item.href.slice(1)
                        if (element) {
                          navItemRefs.current[key] = element
                        } else {
                          delete navItemRefs.current[key]
                        }
                      }}
                    >
                      <span>{item.label}</span>
                    </a>
                  ))}
                </div>
              </nav>
              <div className="header-theme-shell">
                <ThemeControl
                  activeTheme={activeTheme}
                  setThemePreference={setThemePreference}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        aria-hidden={!isOpen}
        className="mobile-nav-overlay"
        data-state={isOpen ? 'open' : 'closed'}
        id="mobile-nav"
      >
        <div className="mobile-nav-backdrop" onClick={() => setIsOpen(false)}></div>
        <div className="mobile-nav-panel">
          <div className="shell mobile-nav-sheet">
            <div className="mobile-nav-top">
              <div className="min-w-0">
                <p className="font-display text-2xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">
                  {projectTitle}
                </p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--muted)]">
                  Academic project showcase with an immersive section navigator.
                </p>
              </div>
              <button
                className="mobile-menu-toggle"
                data-open="true"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <span className="sr-only">Close navigation</span>
                <span className="mobile-menu-toggle-line"></span>
                <span className="mobile-menu-toggle-line"></span>
                <span className="mobile-menu-toggle-line"></span>
              </button>
            </div>

            <div className="mobile-nav-middle">
              <nav aria-label="Mobile" className="mobile-nav-links">
                {navigationItems.map((item, index) => (
                  <a
                    className="mobile-nav-link"
                    data-active={activeSection === item.href.slice(1)}
                    href={item.href}
                    key={item.href}
                    onClick={() => setIsOpen(false)}
                    style={{ transitionDelay: isOpen ? `${120 + index * 24}ms` : '0ms' }}
                  >
                    <span className="mobile-nav-link-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="mobile-nav-link-label">{item.label}</span>
                  </a>
                ))}
              </nav>
            </div>

            <div className="mobile-nav-footer">
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                  Theme mode
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Mirrors the FindAssure app color system across light and dark modes.
                </p>
              </div>
              <ThemeControl
                activeTheme={activeTheme}
                setThemePreference={setThemePreference}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Header
