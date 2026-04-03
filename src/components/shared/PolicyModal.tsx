import { Modal } from './Modal'

interface PolicyModalProps {
  type: 'privacy' | 'accessibility' | null
  onClose: () => void
}

export function PolicyModal({ type, onClose }: PolicyModalProps) {
  const isOpen = type !== null

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'privacy' ? 'Privacy Policy' : 'Accessibility Statement'}
    >
      <div className="policy-content" style={{ paddingRight: '1rem', lineHeight: '1.6' }}>
        {type === 'privacy' ? (
          <>
            <p>
              <strong>Last Updated: April 3, 2026</strong>
            </p>
            <p>
              Covrd is built with a fundamental principle: <strong>your data is yours.</strong> This
              policy explains how we achieve that.
            </p>

            <h3>1. Zero Server-Side Data Handling</h3>
            <p>
              Covrd is a 100% client-side application. We do not have servers, databases, or any
              backend infrastructure that processes or stores your schedules, templates, or employee
              data. Everything stays on your device.
            </p>

            <h3>2. No Accounts or Authentication</h3>
            <p>
              Because your data never leaves your device, we do not require you to create an
              account, provide an email address, or log in to use Covrd.
            </p>

            <h3>3. Local Data Storage</h3>
            <p>All information entered into Covrd is stored entirely locally on your device:</p>
            <ul>
              <li>
                <strong>IndexedDB:</strong> Saves employees, schedules, and templates.
              </li>
              <li>
                <strong>LocalStorage:</strong> Saves UI preferences (like tracking onboarding).
              </li>
              <li>
                <strong>URL Hash Fragments:</strong> When sharing, data is compressed into the URL
                hash (`#`), which is never sent to a server.
              </li>
            </ul>

            <h3>4. No Tracking or Analytics</h3>
            <p>
              We do not use tracking pixels, analytics scripts (like Google Analytics), or any
              telemetry to monitor how you use the app.
            </p>

            <h3>5. No Cookies</h3>
            <p>
              Covrd uses zero cookies. We do not track you or process data on a server, so there is
              no cookie banner.
            </p>

            <h3>6. External Requests</h3>
            <p>
              To ensure design consistency, Covrd loads web fonts from Google Fonts CDN. This is the
              only external network request the app makes.
            </p>

            <h3>7. Your Control</h3>
            <p>
              You have full control over your data. You can export it anytime, or delete it by
              resetting the app or clearing your browser data.
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>Last Updated: April 3, 2026</strong>
            </p>
            <p>
              Covrd is committed to ensuring digital accessibility for people with disabilities. We
              strive to conform to <strong>WCAG 2.1 Level AA</strong>.
            </p>

            <h3>Features</h3>
            <p>We maintain accessibility across Covrd through the following features:</p>
            <ul>
              <li>
                <strong>High Contrast Mode:</strong> Default dark mode meets or exceeds AA text
                contrast requirements.
              </li>
              <li>
                <strong>Keyboard Navigation:</strong> Features like the Command Palette (Cmd/Ctrl+K)
                ensure you can navigate efficiently entirely by keyboard.
              </li>
              <li>
                <strong>Screen Reader Support:</strong> ARIA landmarks are implemented throughout
                critical areas.
              </li>
              <li>
                <strong>Reduced Motion Support:</strong> The application respects the
                `@prefers-reduced-motion` CSS media query, eliminating unnecessary animations.
              </li>
              <li>
                <strong>Responsive Design:</strong> Covrd scales appropriately from mobile screens
                up to ultra-wide monitors.
              </li>
            </ul>

            <h3>Continuous Assessment</h3>
            <p>
              Covrd components are regularly assessed structurally using <strong>axe-core</strong>{' '}
              development tools. Known limitations typically revolve around complex drag-and-drop
              operations, for which keyboard-navigable alternatives are actively explored.
            </p>

            <h3>Feedback</h3>
            <p>
              We welcome your feedback on the accessibility of Covrd. Please let us know if you
              encounter accessibility barriers by opening an issue on our GitHub repository.
            </p>
          </>
        )}
      </div>
    </Modal>
  )
}
