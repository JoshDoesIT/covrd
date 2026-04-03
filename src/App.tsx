import './App.css'

/**
 * Root application component for Covrd.
 *
 * Renders the initial "coming soon" splash screen.
 * Will be replaced with the full AppShell layout in Epic 4.
 */
export function App() {
  return (
    <main className="app" id="app-root">
      <h1 className="app__logo">
        Covr<span className="app__logo-accent">d</span>
      </h1>
      <p className="app__tagline">Every shift. Covered.</p>
      <div className="app__badge">
        <span className="app__badge-dot" aria-hidden="true" />
        Privacy-first scheduling
      </div>
    </main>
  )
}
