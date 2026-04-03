import { Shield, LayoutDashboard, Calendar, Share2, Download, Terminal } from 'lucide-react'
import './LandingPage.css'

interface LandingPageProps {
  onLaunch: () => void
  onShowPrivacy: () => void
}

export function LandingPage({ onLaunch, onShowPrivacy }: LandingPageProps) {
  return (
    <div className="landing">
      <header className="landing__header">
        <div className="landing__logo" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/favicon.png" alt="Covrd Logo" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
        </div>
      </header>

      <main className="landing__main">
        <section className="landing__hero">
          <div className="landing__hero-pill">Privacy-first. Client-side only.</div>
          <h1 className="landing__hero-title">
            Every Shift.
            <br />
            <span className="landing__hero-title-accent">Coverd.</span>
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

        <section className="landing__features">
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <LayoutDashboard size={24} />
            </div>
            <h3 className="landing__feature-title">Smart Auto-Scheduling</h3>
            <p className="landing__feature-desc">
              CSP solver with fairness balancing seamlessly creates optimized schedules in
              milliseconds.
            </p>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <Calendar size={24} />
            </div>
            <h3 className="landing__feature-title">Templates & Heatmaps</h3>
            <p className="landing__feature-desc">
              Support for Week A/B rotations, shift patterns, and instant visual staffing density.
            </p>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <Terminal size={24} />
            </div>
            <h3 className="landing__feature-title">Power-user Workflow</h3>
            <p className="landing__feature-desc">
              Command Palette (Cmd/Ctrl+K) and snappy keyboard shortcuts for maximum efficiency.
            </p>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <Share2 size={24} />
            </div>
            <h3 className="landing__feature-title">Share securely</h3>
            <p className="landing__feature-desc">
              Share schedules securely via compressed URL links that never touch a server.
            </p>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <Download size={24} />
            </div>
            <h3 className="landing__feature-title">Offline PWA</h3>
            <p className="landing__feature-desc">
              Works completely offline after the very first load. Export to JSON, CSV, or Print.
            </p>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <Shield size={24} />
            </div>
            <h3 className="landing__feature-title">Zero Trust</h3>
            <p className="landing__feature-desc">
              All data stored locally in your browser automatically using IndexedDB.
            </p>
          </div>
        </section>

        <section className="landing__privacy">
          <h2>Our Privacy Pledge</h2>
          <div className="landing__privacy-grid">
            <div className="landing__privacy-item">
              <strong>Zero server-side data handling.</strong> All data stays in your browser.
            </div>
            <div className="landing__privacy-item">
              <strong>Zero analytics or tracking.</strong> No telemetry, no cookies.
            </div>
            <div className="landing__privacy-item">
              <strong>Zero accounts required.</strong> No sign-up, no login.
            </div>
            <div className="landing__privacy-item">
              <strong>Full data ownership.</strong> Export, share, or delete your data anytime.
            </div>
          </div>
          <button className="landing__link-btn" onClick={onShowPrivacy}>
            Read the full Privacy Policy
          </button>
        </section>
      </main>

      <footer className="landing__footer">
        <p>© 2026 Covrd. Built with ♥ by JoshDoesIT.</p>
      </footer>
    </div>
  )
}
