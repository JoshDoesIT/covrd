import {
  Shield,
  LayoutDashboard,
  Calendar,
  BookOpen,
  ServerOff,
  MonitorSmartphone,
} from 'lucide-react'
import './LandingPage.css'

interface LandingPageProps {
  onLaunch: () => void
  onShowPrivacy: () => void
  onShowAccessibility: () => void
}

const MOCK_CALENDAR_DATA = Array.from({ length: 21 }).map((_, i) => ({
  isFixed: Math.random() > 0.7,
  delay: (i % 7) * 0.15 + Math.random() * 0.5,
}))

export function LandingPage({ onLaunch, onShowPrivacy, onShowAccessibility }: LandingPageProps) {
  return (
    <div className="landing">
      {/* Ambient backgrounds */}
      <div className="landing__bg-mesh" />
      <div className="landing__glow-orb" />

      <header className="landing__header">
        <div className="landing__logo" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/logo-dark.png"
            alt="Covrd Logo"
            style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
          />
        </div>
      </header>

      <main className="landing__main">
        <section className="landing__hero">
          <div className="landing__hero-pill">Privacy-first. Client-side only.</div>
          <h1 className="landing__hero-title">
            Every Shift.
            <br />
            <span className="landing__hero-title-accent">Covrd.</span>
          </h1>
          <p className="landing__hero-subtitle">
            Auto staff scheduling that respects your privacy. Your data never leaves your browser.
            No accounts, no servers, no tracking.
          </p>
          <div className="landing__hero-actions">
            <button className="landing__btn-primary" onClick={onLaunch}>
              Launch App
            </button>
            <a
              href="https://github.com/JoshDoesIT/Covrd"
              target="_blank"
              rel="noreferrer"
              className="landing__btn-secondary"
            >
              View on GitHub
            </a>
          </div>
        </section>

        {/* Bento Grid */}
        <section className="landing__bento-grid">
          {/* Card 1: Spans 2 Columns */}
          <div className="landing__bento-card landing__bento-span-2">
            <div className="landing__bento-icon">
              <LayoutDashboard size={24} />
            </div>
            <h3 className="landing__bento-title">Smart Auto-Scheduling</h3>
            <p className="landing__bento-desc">
              Our embedded CSP solver uses fairness balancing to seamlessly create optimized
              schedules in milliseconds. It learns your coverage requirements and instantly builds
              perfect shifts.
            </p>
            <div className="landing__mock-scheduler">
              <div className="landing__mock-calendar-header">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>
              <div className="landing__mock-calendar-grid">
                {MOCK_CALENDAR_DATA.map(({ isFixed, delay }, i) => (
                  <div
                    key={i}
                    className={`landing__mock-cell ${isFixed ? 'fixed' : ''}`}
                    style={!isFixed ? { animationDelay: `${delay}s` } : {}}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: 1 Column */}
          <div className="landing__bento-card landing__bento-span-1">
            <div className="landing__bento-icon">
              <Calendar size={24} />
            </div>
            <h3 className="landing__bento-title">Template Engines</h3>
            <p className="landing__bento-desc">
              Generate rotating bi-weekly, monthly, or seasonal schedules instantly based on
              predefined templates.
            </p>
          </div>

          {/* Card 3: 1 Column */}
          <div className="landing__bento-card landing__bento-span-1">
            <div className="landing__bento-icon">
              <BookOpen size={24} />
            </div>
            <h3 className="landing__bento-title">Knowledgebase Built-in</h3>
            <p className="landing__bento-desc">
              Access comprehensive guides, labor compliance tips, and fair scheduling principles
              directly in the app.
            </p>
          </div>

          {/* Card 4: 2 Columns */}
          <div className="landing__bento-card landing__bento-span-2">
            <div className="landing__bento-icon">
              <Shield size={24} />
            </div>
            <h3 className="landing__bento-title">Zero Trust Architecture</h3>
            <p className="landing__bento-desc">
              Covrd operates entirely within your browser's local sandbox. There is absolutely no
              server telemetry, no user accounts, and no backend database holding your employee
              data.
            </p>
            <div className="landing__mock-security">
              <div className="landing__security-node landing__security-node--browser">
                <MonitorSmartphone size={24} />
                <span>Local Sandbox</span>
              </div>
              <div className="landing__security-flow" />
              <div className="landing__security-node landing__security-node--cloud">
                <ServerOff size={24} />
                <span>Blocked</span>
              </div>
            </div>
          </div>
        </section>

        {/* Horizontal Privacy Pledge */}
        <section className="landing__privacy-banner">
          <div className="landing__privacy-capsules">
            <div className="landing__privacy-capsule">
              <Shield size={16} color="var(--color-accent)" /> 0% Server Tracking
            </div>
            <div className="landing__privacy-capsule">
              <Shield size={16} color="var(--color-accent)" /> Free Open Source
            </div>
            <div className="landing__privacy-capsule">
              <Shield size={16} color="var(--color-accent)" /> Local Export
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="landing__link-btn" onClick={onShowPrivacy}>
              Privacy
            </button>
            <span style={{ color: 'var(--color-text-disabled)' }}>•</span>
            <button className="landing__link-btn" onClick={onShowAccessibility}>
              Accessibility
            </button>
          </div>
        </section>
      </main>

      <footer className="landing__footer">
        <p>
          © 2026 Covrd. Built by{' '}
          <a
            href="https://www.joshdoes.it"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            JoshDoesIT
          </a>
          .
        </p>
      </footer>
    </div>
  )
}
