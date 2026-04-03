import { useState, lazy, Suspense } from 'react'
import { CommandPalette } from './tooling/CommandPalette'
import { PolicyModal } from './shared/PolicyModal'
import './AppShell.css'

/** Lazy-loaded views for bundle size optimization (Story 7.6). */
const ScheduleManager = lazy(() =>
  import('./schedule/ScheduleManager').then((m) => ({ default: m.ScheduleManager })),
)
const EmployeeManager = lazy(() =>
  import('./employees/EmployeeManager').then((m) => ({ default: m.EmployeeManager })),
)
const CoverageManager = lazy(() =>
  import('./coverage/CoverageManager').then((m) => ({ default: m.CoverageManager })),
)
const TemplatesView = lazy(() =>
  import('./templates/TemplatesView').then((m) => ({ default: m.TemplatesView })),
)

/** Navigation items for the sidebar. */
const NAV_ITEMS = [
  {
    id: 'employees',
    label: 'Employees',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    id: 'coverage',
    label: 'Coverage',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 010 2H5a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 010 2H5a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 010 2H5a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 010 2H5a1 1 0 01-1-1z',
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 010 2H5a1 1 0 01-1-1zm2 4a1 1 0 011-1h10a1 1 0 010 2H7a1 1 0 01-1-1zm4 4a1 1 0 011-1h2a1 1 0 010 2h-2a1 1 0 01-1-1z',
  },
] as const

/** Detect if the user is on macOS for keyboard shortcut display. */
const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent)

/**
 * AppShell — Main application layout.
 *
 * Provides the sidebar navigation, header bar with command palette trigger,
 * and the main content area. Supports collapsible sidebar.
 */
export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState('schedule')
  const [policyModal, setPolicyModal] = useState<'privacy' | 'accessibility' | null>(null)
  const [cmdOpen, setCmdOpen] = useState(false)

  const renderContent = () => {
    switch (activeNav) {
      case 'schedule':
        return <ScheduleManager />
      case 'employees':
        return <EmployeeManager />
      case 'coverage':
        return <CoverageManager />
      case 'templates':
        return <TemplatesView onNavigate={setActiveNav} />
      default:
        return (
          <div className="shell__placeholder">
            <p className="shell__placeholder-text">
              Select a section from the sidebar to get started.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="shell">
      {/* Sidebar */}
      <nav
        className={`shell__sidebar ${collapsed ? 'shell__sidebar--collapsed' : ''}`}
        aria-label="Sidebar"
      >
        <div className="shell__sidebar-header">
          <div className="shell__brand" style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="/favicon.png"
              alt="Covrd"
              style={{
                height: '64px' /* Larger height to fill the new 72px header */,
                width: 'auto',
                objectFit: 'contain',
                transform:
                  'translateY(-2px)' /* Minor optical adjustment for built-in PNG whitespace */,
              }}
            />
          </div>
          <button
            className="shell__sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {collapsed ? (
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
              ) : (
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
              )}
            </svg>
          </button>
        </div>

        <div className="shell__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`shell__nav-item ${activeNav === item.id ? 'shell__nav-item--active' : ''}`}
              onClick={() => setActiveNav(item.id)}
              aria-current={activeNav === item.id ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
            >
              <svg
                className="shell__nav-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.icon} />
              </svg>
              <span className="shell__nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="shell__sidebar-footer">
          <div className="shell__privacy-badge">
            <span className="shell__privacy-dot" aria-hidden="true" />
            <span className="shell__privacy-label">Client-side only</span>
          </div>
          <div className="shell__policy-links" aria-hidden={collapsed ? 'true' : 'false'}>
            <button className="shell__policy-link" onClick={() => setPolicyModal('privacy')}>
              Privacy
            </button>
            <span className="shell__policy-dot">•</span>
            <button className="shell__policy-link" onClick={() => setPolicyModal('accessibility')}>
              Accessibility
            </button>
          </div>
        </div>
      </nav>

      {/* Main area */}
      <div className="shell__main-area">
        {/* Header */}
        <header className="shell__header" role="banner">
          <div className="shell__header-left">
            <h1 className="shell__page-title">
              {NAV_ITEMS.find((n) => n.id === activeNav)?.label ?? 'Covrd'}
            </h1>
          </div>
          <div className="shell__header-right">
            <button
              className="shell__cmd-trigger"
              aria-label="Open command palette"
              onClick={() => setCmdOpen(true)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <span className="shell__cmd-hint">{isMac ? '⌘' : 'Ctrl'}+K</span>
            </button>
          </div>
        </header>

        {/* Content — Suspense boundary for lazy-loaded views */}
        <main className="shell__content" id="main-content">
          <Suspense
            fallback={
              <div className="shell__placeholder">
                <p className="shell__placeholder-text">Loading…</p>
              </div>
            }
          >
            {renderContent()}
          </Suspense>
        </main>
      </div>

      <CommandPalette onNavigate={setActiveNav} open={cmdOpen} setOpen={setCmdOpen} />
      <PolicyModal type={policyModal} onClose={() => setPolicyModal(null)} />
    </div>
  )
}
